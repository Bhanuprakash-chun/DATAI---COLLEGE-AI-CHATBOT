import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config import settings
from routers import health, chat, auth

app = FastAPI(
    title="DatAI Secure Gateway",
    description="Privacy-Preserving Gateway for Google Gemini Orchestration",
    version="1.0.0"
)

# Cross-Origin Isolation Middleware (required for DuckDB-WASM & Web Workers)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Embedder-Policy"] = "credentialless"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS cleanly
# Starlette/FastAPI CORS requires allow_credentials=False when allow_origins includes wildcard "*"
allow_wildcard = "*" in settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_wildcard else settings.cors_origins,
    allow_credentials=not allow_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(auth.router)

# Mount Frontend Static Files if built (Fullstack unified service deployment)
static_dir = os.path.abspath(settings.static_dir)

if os.path.isdir(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not catch unmatched API calls
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API route not found"})

        target_file = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)

        index_file = os.path.join(static_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        return JSONResponse(status_code=404, content={"detail": "Frontend assets not found"})
else:
    @app.get("/")
    async def root():
        return {
            "service": "DatAI Secure Gateway",
            "status": "online",
            "mode": "api-gateway",
            "docs": "/docs",
            "health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=False)
