# DatAI Secure Gateway API Reference

The DatAI backend is a lightweight, secure Python FastAPI service designed to orchestrate Google Gemini streaming without exposing API keys to the browser.

---

## 1. Endpoints

### `GET /api/health`
Checks backend status and verifies if Google Gemini is configured.

**Response**:
```json
{
  "status": "ok",
  "service": "DatAI FastAPI Gateway",
  "gemini_configured": true,
  "default_model": "gemini-2.0-flash",
  "version": "1.0.0"
}
```

---

### `POST /api/chat/stream`
Streams Server-Sent Events (SSE) from Google Gemini using minimal extracted context.

**Headers**:
- `Content-Type: application/json`
- `X-Gemini-Key: <string>` *(Optional client override key)*

**Request Payload**:
```json
{
  "prompt": "What is the total revenue in Q3 according to the sales spreadsheet?",
  "context": "[Source 1: sales.csv | Sheet: Sheet1]\nTotal rows: 14\nSUM(revenue): 4055000",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "How can I assist with your files?" }
  ],
  "model": "gemini-2.0-flash"
}
```

**Response Format**: `text/event-stream` (Server-Sent Events)
```
data: {"text": "According"}
data: {"text": " to the"}
data: {"text": " sales spreadsheet,"}
...
data: [DONE]
```

**Error Response**:
If the prompt is empty or exceeds length limits, returns HTTP 400:
```json
{
  "detail": "Prompt cannot be empty"
}
```
