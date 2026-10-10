# ==============================================================================
# Multi-stage Dockerfile for DatAI (React Vite + FastAPI Backend)
# Optimized for 1-click single-service deployment on Render
# ==============================================================================

# ----------------- Stage 1: Frontend Build -----------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm install

# Build production Vite bundle
COPY client/ ./
RUN npm run build

# ----------------- Stage 2: Backend & Runtime Runner -----------------
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    STATIC_DIR=/app/client/dist

# Install lightweight runtime utilities (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy backend source
COPY server/ ./server/

# Copy compiled frontend from frontend-builder stage
COPY --from=frontend-builder /app/client/dist /app/client/dist

WORKDIR /app/server

EXPOSE 8000

# Health check against FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start uvicorn bound to Render's dynamic PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
