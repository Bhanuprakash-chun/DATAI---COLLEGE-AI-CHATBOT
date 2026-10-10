import json
import logging
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatStreamRequest(BaseModel):
    prompt: str = Field(..., max_length=15000)
    context: str = Field(default="", max_length=50000)
    history: list[dict] = Field(default_factory=list)
    model: str = Field(default="gemini-flash-latest")

class ValidateKeyRequest(BaseModel):
    api_key: str = Field(default="")
    model: str = Field(default="gemini-flash-latest")

class SystemApiKeyRequest(BaseModel):
    api_key: str = Field(default="")
    model: str = Field(default="gemini-flash-latest")

@router.get("/system-api-key")
async def get_system_api_key_status():
    from config import settings
    key = (settings.gemini_api_key or "").strip()
    configured = bool(key and len(key) > 5)
    masked = f"{key[:6]}...{key[-4:]}" if configured and len(key) >= 12 else ("Configured in .env" if configured else "Not configured")
    return {
        "configured": configured,
        "masked_key": masked,
        "default_model": settings.default_model or "gemini-flash-latest",
    }

@router.post("/validate-key")
async def validate_api_key(
    request: ValidateKeyRequest,
    x_gemini_key: str | None = Header(default=None, alias="X-Gemini-Key")
):
    raw_key = (request.api_key and request.api_key.strip()) or (x_gemini_key and x_gemini_key.strip()) or ""
    key = (
        raw_key
        .strip("'\"`")
        .removeprefix("Bearer ").removeprefix("bearer ")
        .removeprefix("GEMINI_API_KEY=").removeprefix("gemini_api_key=")
        .strip()
    )
    if not key:
        return {"valid": False, "message": "No API key provided. Please enter your Gemini API key.", "available_models": []}
    
    is_valid, msg, available = GeminiService.validate_key_detailed(key, model=request.model)
    return {"valid": is_valid, "message": msg, "available_models": available}

@router.post("/system-api-key")
async def update_system_api_key(request: SystemApiKeyRequest):
    raw_key = (request.api_key or "").strip()
    key = (
        raw_key
        .strip("'\"`")
        .removeprefix("Bearer ").removeprefix("bearer ")
        .removeprefix("GEMINI_API_KEY=").removeprefix("gemini_api_key=")
        .strip()
    )
    from services.gemini_service import normalize_model_name
    from config import update_api_config

    target_model = normalize_model_name(request.model)

    # Empty key clears configuration
    if not key:
        update_api_config("", target_model)
        return {
            "status": "ok",
            "saved": True,
            "valid": False,
            "message": "Gemini API key cleared from server .env and runtime memory.",
            "default_model": target_model,
            "available_models": []
        }



    # 1. ALWAYS persist to .env and server memory first
    saved = update_api_config(key, target_model)
    logger.info("system-api-key: Saved to .env (saved=%s, key_len=%d, model=%s)", saved, len(key), target_model)

    # 2. Validate with Google GenAI
    is_valid, msg, available_models = GeminiService.validate_key_detailed(key, model=target_model)

    if not is_valid:
        return {
            "status": "warning",
            "saved": True,
            "valid": False,
            "message": f"API key saved to server .env file, but Google verification warning: {msg}",
            "default_model": target_model,
            "available_models": available_models
        }

    return {
        "status": "ok",
        "saved": True,
        "valid": True,
        "message": f"Global Gemini API key saved to .env and verified with Google GenAI! Active model: {target_model}",
        "default_model": target_model,
        "available_models": available_models
    }


@router.post("/stream")
async def chat_stream(
    request: ChatStreamRequest,
    x_gemini_key: str | None = Header(default=None, alias="X-Gemini-Key")
):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Log whether we received a key header
    logger.info(
        "stream: model=%s, has_header_key=%s, header_key_len=%d",
        request.model,
        bool(x_gemini_key),
        len(x_gemini_key) if x_gemini_key else 0,
    )

    async def event_generator():
        try:
            async for token in GeminiService.stream_chat(
                prompt=request.prompt,
                context=request.context,
                history=request.history,
                model=request.model,
                api_key_override=x_gemini_key,
            ):
                payload = json.dumps({"text": token})
                yield {"data": payload}
            
            yield {"data": "[DONE]"}
        except Exception as e:
            err_msg = str(e)
            logger.error("stream event_generator error: %s", err_msg)
            err_payload = json.dumps({"text": f"\n\n> **Notice**: {err_msg}", "error": err_msg})
            yield {"data": err_payload}
            yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())
