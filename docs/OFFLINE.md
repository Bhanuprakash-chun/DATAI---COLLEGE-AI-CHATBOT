# DatAI Offline Capabilities & PWA Architecture

DatAI is engineered to be fully usable offline without an active internet connection.

---

## 1. PWA & Service Worker Caching

DatAI implements a Progressive Web App (PWA) architecture:
- **`manifest.webmanifest`**: Defines app metadata, background color (`#0B0D0F`), theme color (`#14171A`), and application icons.
- **Service Worker (`public/sw.js`)**: Implements a stale-while-revalidate caching strategy for application assets (`index.html`, JavaScript, CSS, icons, fonts).
- **Offline Navigation**: When internet connectivity drops, navigating to the app serves the pre-cached application shell from CacheStorage.

---

## 2. What Works 100% Offline

Unlike conventional cloud-only AI products, DatAI does not break when internet drops:

1. **Spreadsheet Analytics**: DuckDB-WASM runs on WebAssembly inside the browser sandbox. Filtering, grouping, sums, averages, and statistics do not require internet.
2. **Interactive Charting**: Dynamic Recharts SVG graphs render locally on calculated datasets.
3. **Document Keyword Search**: BM25 inverted indices are stored in IndexedDB and search thousands of chunks in under 5 milliseconds offline.
4. **PDF & Document Viewing**: The built-in PDF viewer (canvas renderer) and Document viewer load blobs directly from OPFS/IndexedDB.
5. **Data Inspection**: Virtualized data grid with sorting, column statistics, and null counts runs completely on device.
6. **Local Answer Synthesis**: The `LocalBrowserModelProvider` synthesizes evidence-based summaries, risk factor extractions, and point-by-point answers directly from the retrieved context.

---

## 3. Offline Mode vs Online Mode

When the user selects **OFFLINE** mode in the top bar:
- The network status indicator displays `⚪ OFFLINE (Device Only)`.
- The application guarantees that zero fetch calls are made to external endpoints.
- All intelligence features continue operating reliably on local device storage.
