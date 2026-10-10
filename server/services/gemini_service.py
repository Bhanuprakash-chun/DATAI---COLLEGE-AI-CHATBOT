import os
import logging
from typing import AsyncGenerator
from google import genai
from config import settings
from services.prompt_guard import assemble_grounded_prompt

logger = logging.getLogger(__name__)

# Preferred fallback order — models confirmed active and working on Google GenAI
FALLBACK_MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
]


def normalize_model_name(model: str) -> str:
    """Map any user-supplied model string to an active, supported model name."""
    if not model:
        return "gemini-flash-latest"
    m = model.strip().lower()
    if "flash-latest" in m:
        return "gemini-flash-latest"
    if "3.5" in m and "lite" in m:
        return "gemini-3.5-flash-lite"
    if "3.8" in m:
        return "gemini-3.8-flash"
    if "3.5" in m:
        return "gemini-3.5-flash"
    if "3-" in m or "3." in m:
        return "gemini-3-flash-preview"
    # Legacy / deprecated models (1.0, 1.5, 2.0, 2.5) → automatically upgrade to gemini-flash-latest
    return "gemini-flash-latest"


def _discover_available_models(client: genai.Client) -> set[str]:
    """Query the API for models that support generateContent."""
    available: set[str] = set()
    try:
        for model_info in client.models.list():
            name = getattr(model_info, "name", "") or ""
            # name comes back as "models/gemini-flash-latest" — strip prefix
            short = name.removeprefix("models/")
            # Skip models Google has retired or deprecated
            if any(dep in short for dep in ["1.5", "1.0", "2.0-flash", "2.5-flash-lite"]):
                continue
            actions = getattr(model_info, "supported_actions", None) or []
            if actions and "generateContent" not in actions:
                continue
            if short:
                available.add(short)
    except Exception as exc:
        logger.warning("Could not list available models: %s", exc)
    return available


def _build_model_chain(target: str, available: set[str]) -> list[str]:
    """Return an ordered list of models to try, filtered to only those
    confirmed available. If discovery returned nothing, fall back to static list."""
    ordered = [target]
    for fb in FALLBACK_MODELS:
        if fb not in ordered:
            ordered.append(fb)

    if available:
        filtered = [m for m in ordered if m in available]
        if not filtered:
            # Try any available gemini model
            gemini_models = [m for m in available if "gemini" in m]
            filtered = gemini_models[:3] if gemini_models else list(available)[:3]
        return filtered

    return ordered


class GeminiService:
    @staticmethod
    def get_client(api_key_override: str | None = None) -> genai.Client:
        clean_override = ""
        if api_key_override:
            clean_override = (
                api_key_override.strip()
                .strip("'\"`")
                .removeprefix("Bearer ").removeprefix("bearer ")
                .removeprefix("GEMINI_API_KEY=").removeprefix("gemini_api_key=")
                .strip()
            )

        raw_key = (
            clean_override
            or (settings.gemini_api_key and settings.gemini_api_key.strip())
            or os.getenv("GEMINI_API_KEY", "").strip()
        )
        key = (
            raw_key.strip()
            .strip("'\"`")
            .removeprefix("Bearer ").removeprefix("bearer ")
            .removeprefix("GEMINI_API_KEY=").removeprefix("gemini_api_key=")
            .strip()
            if raw_key else ""
        )

        source = "override" if clean_override else ("settings" if settings.gemini_api_key else "env")
        logger.info("get_client: source=%s, key_present=%s, key_len=%d",
                     source, bool(key), len(key) if key else 0)

        if not key:
            raise ValueError(
                "Gemini API key is not configured. Please enter your Google Gemini API key in Settings (gear icon) or the API Key button in the top bar."
            )
        return genai.Client(api_key=key)

    @staticmethod
    def validate_key_detailed(api_key: str, model: str = "gemini-flash-latest") -> tuple[bool, str, list[str]]:
        raw_key = (api_key or "").strip()
        key = (
            raw_key
            .strip("'\"`")
            .removeprefix("Bearer ").removeprefix("bearer ")
            .removeprefix("GEMINI_API_KEY=").removeprefix("gemini_api_key=")
            .strip()
        )
        if not key:
            return False, "No API key provided. Please enter your Gemini API key.", []


        normalized_model = normalize_model_name(model)
        try:
            client = genai.Client(api_key=key)
            # Try to query the models list first - confirming valid auth
            available = _discover_available_models(client)
            if available:
                active_model = normalized_model if normalized_model in available else next(
                    (m for m in FALLBACK_MODELS if m in available),
                    next(iter(available))
                )
                return True, f"Key verified with Google GenAI! Active model: {active_model}", sorted(list(available))

            # Fallback to direct get
            try:
                client.models.get(model=normalized_model)
                return True, f"Key verified with Google GenAI! Active model: {normalized_model}", [normalized_model]
            except Exception as get_err:
                get_str = str(get_err).lower()
                if "404" in get_str or "not_found" in get_str or "notfound" in get_str or "not found" in get_str:
                    for fb in FALLBACK_MODELS:
                        try:
                            client.models.get(model=fb)
                            return True, f"Key verified with Google GenAI! Active model: {fb}", [fb]
                        except Exception:
                            continue
                raise get_err
        except Exception as e:
            err = str(e)
            if "API_KEY_INVALID" in err or "400" in err:
                return False, "Google rejected key: Invalid API key. Please check your key at aistudio.google.com.", []
            if any(ind in err for ind in ["401", "UNAUTHENTICATED", "ACCESSTOKENTYPE_UNSUPPORTED", "ACCESS_TOKEN_TYPE_UNSUPPORTED"]):
                return False, "Google rejected key: 401 UNAUTHENTICATED. Ensure your API key is active at aistudio.google.com", []
            return False, f"Verification failed: {err}", []

    @staticmethod
    def validate_key(api_key: str, model: str = "gemini-flash-latest") -> tuple[bool, str]:
        valid, msg, _ = GeminiService.validate_key_detailed(api_key, model)
        return valid, msg

    @staticmethod
    async def stream_chat(
        prompt: str,
        context: str,
        history: list[dict],
        model: str = "gemini-flash-latest",
        api_key_override: str | None = None
    ) -> AsyncGenerator[str, None]:
        full_prompt = assemble_grounded_prompt(user_prompt=prompt, context=context, history=history)

        try:
            client = GeminiService.get_client(api_key_override)
        except Exception as e:
            yield f"### API Key Configuration Needed\n\n{str(e)}\n\n*Get a free API key at https://aistudio.google.com/app/apikey and save it in DatAI Settings.*"
            return

        target_model = normalize_model_name(model)

        # --- Discover available models so we never 404 ---
        available = _discover_available_models(client)
        models_to_try = _build_model_chain(target_model, available)

        logger.info(
            "stream_chat: target=%s, available=%s, chain=%s",
            target_model, available or "(discovery failed)", models_to_try,
        )

        last_error = None
        has_yielded = False

        for candidate_model in models_to_try:
            try:
                response = client.models.generate_content_stream(
                    model=candidate_model,
                    contents=full_prompt,
                )

                for chunk in response:
                    if chunk.text:
                        has_yielded = True
                        yield chunk.text

                if has_yielded:
                    return
            except Exception as e:
                err_str = str(e)
                lower_err = err_str.lower()
                is_not_found = (
                    "404" in err_str
                    or "not_found" in lower_err
                    or "notfound" in lower_err
                    or "not found" in lower_err
                    or "not supported" in lower_err
                )
                is_capacity_error = (
                    "503" in err_str
                    or "no capacity" in lower_err
                    or "unavailable" in lower_err
                    or "overloaded" in lower_err
                )
                if is_not_found or is_capacity_error:
                    logger.info("Model '%s' unavailable (%s), trying next fallback.",
                               candidate_model, "not found" if is_not_found else "capacity/503")
                    last_error = e
                    continue
                # Other errors (rate-limit, auth) — stop immediately
                last_error = e
                break

        if not has_yielded and last_error:
            error_str = str(last_error)
            lower_err = error_str.lower()
            if "resource_exhausted" in lower_err or "429" in error_str:
                yield "\n\n> **Notice**: Gemini rate limit reached. Please wait a moment or try again."
            elif any(indicator in lower_err for indicator in [
                "api_key_invalid",
                "401",
                "unauthenticated",
                "accesstokentype_unsupported",
                "access_token_type_unsupported",
                "invalid authentication credentials"
            ]):
                yield (
                    "\n\n> **Authentication Error**: Google rejected the API key (401 UNAUTHENTICATED).\n"
                    "> Please enter a valid Google Gemini API key using the **API Key** button in the header or via **Settings (gear icon)**.\n"
                    "> You can get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)."
                )
            else:
                yield (
                    "\n\n> **Notice**: Could not generate a response with Google Gemini.\n"
                    "> Please verify your API key in **Settings (gear icon)** or the **API Key** button.\n"
                    "> You can get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)."
                )

