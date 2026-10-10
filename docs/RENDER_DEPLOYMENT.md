# Deploying DatAI on Render

This guide provides step-by-step instructions for deploying **DatAI** to [Render](https://render.com).

DatAI consists of:
1. **React Vite Frontend**: In-browser document processor, DuckDB-WASM engine, and UI.
2. **FastAPI Backend Gateway**: Privacy-preserving streaming gateway to Google Gemini.

---

## Deployment Options at a Glance

| Method | Type | Advantages | Ideal For |
| :--- | :--- | :--- | :--- |
| **Method 1: Render Blueprint (`render.yaml`)** | Static Site + Web Service | 1-click automated setup, free static site with 0 cold-starts, separate scaling | **Recommended default** |
| **Method 2: Unified Container (`Dockerfile`)** | Single Web Service | 1 URL, 0 CORS configuration, single service to manage | Users wanting everything on 1 domain |
| **Method 3: Manual Dashboard Setup** | Static Site + Web Service | Complete manual control via Render UI | Custom enterprise configurations |

---

## Method 1: Automated Deployment with Render Blueprint (Recommended)

Render Blueprints let you deploy multi-service architectures automatically using [`render.yaml`](../render.yaml).

### Step 1: Push Code to GitHub / GitLab
Make sure your project repository is pushed to your GitHub or GitLab account.

### Step 2: Create a Blueprint in Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your Git repository containing DatAI.
4. Render will detect [`render.yaml`](../render.yaml) and display the two configured services:
   - `datai-backend` (Python Web Service)
   - `datai-frontend` (React Static Site)

### Step 3: Enter Your Gemini API Key
Render will prompt you for the `GEMINI_API_KEY` parameter:
- Enter your Google AI Studio Gemini API Key (`AIzaSy...`).
- *(Optional)* You can leave it blank if you prefer users to enter their own API keys via the DatAI Settings modal.

### Step 4: Click Apply
Render will build both services automatically:
- The backend will deploy at `https://datai-backend.onrender.com`.
- The frontend will deploy at `https://datai-frontend.onrender.com`.
- The frontend is automatically configured to talk to the backend.

---

## Method 2: Single Fullstack Service with Docker

If you prefer a single service running on one URL without CORS:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Choose **Docker** as the runtime environment.
4. Set the following details:
   - **Name**: `datai-app`
   - **Region**: Choose the closest region (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key (`AIzaSy...`)
   - `DEFAULT_MODEL`: `gemini-2.0-flash`
6. Click **Create Web Service**.

Render will automatically build the multi-stage Docker container (compiling React with Node 20 and packaging it into the Python 3.11 runner). The FastAPI app will serve the frontend at `/` and the API at `/api/*`.

---

## Method 3: Manual Dashboard Setup

If you prefer to configure each service manually in the Render UI:

### Step 1: Deploy Backend Web Service
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `datai-backend`
   - **Language**: `Python`
   - **Root Directory**: `server`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
4. In **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
   - `GEMINI_API_KEY`: `AIzaSy...` (your key)
   - `DEFAULT_MODEL`: `gemini-2.0-flash`
   - `CORS_ORIGINS`: `*`
5. Click **Create Web Service**. Note the deployed URL (e.g., `https://datai-backend.onrender.com`).

### Step 2: Deploy Frontend Static Site
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the same Git repository.
3. Configure the static site:
   - **Name**: `datai-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**:
   - `VITE_BACKEND_URL`: `https://datai-backend.onrender.com` (use the backend URL from Step 1)
5. In **Redirects / Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Click **Create Static Site**.

---

## Environment Variables Reference

| Variable | Service | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Backend | Recommended | Google Gemini API key from AI Studio | `""` |
| `DEFAULT_MODEL` | Backend | No | Gemini model identifier | `gemini-2.0-flash` |
| `CORS_ORIGINS` | Backend | No | Comma-separated allowed origins or `*` | `*` |
| `PORT` | Backend | Auto | Port injected automatically by Render | `8000` |
| `STATIC_DIR` | Backend | No | Path to compiled React dist (for unified mode) | `../client/dist` |
| `VITE_BACKEND_URL` | Frontend | No | Public URL of backend (for separate static site) | Same origin or auto-detect |

---

## Security & Isolation Headers (DuckDB-WASM)

DatAI utilizes **DuckDB-WASM** for client-side analytical queries. High-performance WASM and Web Workers require Cross-Origin Isolation headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

These headers are pre-configured:
- In `client/public/_headers` (applied automatically by Render Static Sites)
- In `server/main.py` (via `SecurityHeadersMiddleware` when served via FastAPI)

---

## Verification & Health Check

After deployment completes:

1. **Verify Backend**:
   Visit `https://<your-backend>.onrender.com/api/health`
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "DatAI FastAPI Gateway",
     "gemini_configured": true,
     "default_model": "gemini-2.0-flash",
     "version": "1.0.0"
   }
   ```

2. **Verify Frontend**:
   - Visit `https://<your-frontend>.onrender.com`
   - Navigate to **Settings** (`/settings` or Settings tab in navigation).
   - Check the **Backend Connection Status** badge. It should show a green **"Connected"** indicator.
   - Upload a test PDF, CSV, or spreadsheet and query DatAI in the Chat stage!

> [!NOTE]
> On Render's Free tier, Web Services enter sleep mode after 15 minutes of inactivity. When a new request arrives, it may take 30–50 seconds to wake up (cold start). DatAI's frontend remains instantly active because static sites have zero cold starts.
