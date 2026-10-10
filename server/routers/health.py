from fastapi import APIRouter
from config import settings

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "DatAI FastAPI Gateway",
        "gemini_configured": bool(settings.gemini_api_key and len(settings.gemini_api_key) > 5),
        "default_model": settings.default_model,
        "version": "1.0.0"
    }
