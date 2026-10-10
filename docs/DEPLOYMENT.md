# DatAI Deployment & Production Setup

DatAI is designed as a modern web application with a client static bundle and an optional Python FastAPI gateway.

---

## 1. Local Development Run

Run client and server concurrently:

### Terminal 1 (FastAPI Gateway):
```bash
./.venv/bin/python3 -m uvicorn main:app --app-dir server --reload --port 8000
```

### Terminal 2 (Vite Client):
```bash
cd client && npm run dev
```
Open browser at `http://localhost:5173`.

---

## 2. Production Static Build (Client)

```bash
cd client && npm run build
```
This produces an optimized, production-ready static bundle in `client/dist/`.
The static bundle can be hosted on:
- Cloudflare Pages
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

---

## 3. Production Gateway Deployment (Server)

The Python FastAPI gateway can be deployed using standard WSGI/ASGI servers or containerized:

```bash
uvicorn main:app --app-dir server --host 0.0.0.0 --port 8000 --workers 4
```

Set environment variables on your server or container:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_MODEL=gemini-2.0-flash
PORT=8000
```
