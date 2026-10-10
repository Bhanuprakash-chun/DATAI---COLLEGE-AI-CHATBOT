import os
import logging
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

def parse_cors_origins() -> list[str]:
    origins_env = os.getenv("CORS_ORIGINS", "")
    if origins_env.strip():
        # Support comma-delimited strings in environment variables
        return [origin.strip() for origin in origins_env.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://localhost:8000",
        "*",
    ]

class Settings(BaseModel):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    default_model: str = os.getenv("DEFAULT_MODEL", "gemini-flash-latest")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list[str] = parse_cors_origins()
    static_dir: str = os.getenv(
        "STATIC_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "dist"))
    )

settings = Settings()

logger = logging.getLogger(__name__)

def update_api_config(api_key: str, model: str | None = None) -> bool:
    clean_key = (
        (api_key or "").strip()
        .strip("'\"`")
        .removeprefix("Bearer ").removeprefix("bearer ")
        .removeprefix("GEMINI_API_KEY=").removeprefix("gemini_api_key=")
        .strip()
    )
    settings.gemini_api_key = clean_key
    os.environ["GEMINI_API_KEY"] = clean_key

    clean_model = None
    if model and model.strip():
        clean_model = model.strip()
        settings.default_model = clean_model
        os.environ["DEFAULT_MODEL"] = clean_model

    written = False
    server_env = os.path.join(os.path.dirname(__file__), ".env")
    root_env = os.path.join(os.path.dirname(__file__), "..", ".env")
    targets = [server_env]
    if os.path.exists(root_env):
        targets.append(root_env)

    for env_path in targets:
        try:
            lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()

            has_key = False
            has_model = False
            new_lines = []
            for line in lines:
                if line.startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={clean_key}\n")
                    has_key = True
                elif clean_model and line.startswith("DEFAULT_MODEL="):
                    new_lines.append(f"DEFAULT_MODEL={clean_model}\n")
                    has_model = True
                else:
                    new_lines.append(line)

            if not has_key:
                new_lines.append(f"GEMINI_API_KEY={clean_key}\n")
            if not has_model and clean_model:
                new_lines.append(f"DEFAULT_MODEL={clean_model}\n")

            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
            written = True
            logger.info("Successfully updated GEMINI_API_KEY in %s", env_path)
        except Exception as exc:
            logger.error("Failed to write env file at %s: %s", env_path, exc)

    return written

