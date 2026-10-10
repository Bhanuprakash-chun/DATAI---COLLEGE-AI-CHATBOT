# DatAI Troubleshooting & Diagnostics

Common questions, edge cases, and resolution strategies.

---

## 1. "Gateway Offline" Indicator in Header

- **Symptom**: Top header displays `Local Only / Gateway Offline`.
- **Cause**: The Python FastAPI server is not currently running on `http://localhost:8000`.
- **Solution**:
  1. Start the server using `./.venv/bin/python3 -m uvicorn main:app --app-dir server --reload --port 8000`.
  2. Or if running on a custom port/URL, update the Gateway Endpoint URL in Settings.
  3. Note: DatAI continues to execute spreadsheet analytics, BM25 document search, and PDF previews locally even when the gateway is offline.

---

## 2. "QuotaExceededError" in Browser Storage

- **Symptom**: Large file upload displays storage quota error.
- **Cause**: Browser private browsing mode or device disk space is constrained.
- **Solution**:
  1. Open **Privacy & Storage Dashboard**.
  2. Review the storage capacity bar.
  3. Delete unnecessary or large files.
  4. Ensure you are not in an incognito session with restricted storage quotas.

---

## 3. PDF Text Not Selectable or Empty

- **Symptom**: PDF uploads but 0 chunks or text extracted.
- **Cause**: The PDF is a scanned image without an embedded digital text layer.
- **Solution**: DatAI's OCR worker (`ocr-parser.ts`) processes image scans. Alternatively, export the PDF with searchable text or convert pages to images.

---

## 4. DuckDB-WASM Fallback Mode

- **Symptom**: Console logs `DuckDB-WASM initialization failed... Using fast in-memory SQL/Aggregator fallback`.
- **Cause**: Some older browsers lack WebAssembly SIMD or `SharedArrayBuffer` support.
- **Solution**: DatAI automatically and gracefully activates its fast JavaScript Analytical Fallback Engine. Aggregations, sums, averages, and group-by queries execute seamlessly without user intervention.
