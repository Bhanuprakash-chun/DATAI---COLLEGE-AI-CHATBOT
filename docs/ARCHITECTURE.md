# DatAI System Architecture

DatAI is a production-grade, local-first **AI File Intelligence Workspace** web application built with React 18/19, TypeScript, Tailwind CSS, DuckDB-WASM, and a secure Python FastAPI Gemini gateway.

---

## 1. Core Architectural Principles

1. **Browser-First Privacy**: Files uploaded by the user are parsed, indexed, and stored inside the browser sandbox using **IndexedDB** and **OPFS (Origin Private File System)**. Files are never automatically transmitted to external cloud databases.
2. **Minimum-Data Cloud Processing**: When Online Gemini reasoning is requested, the client extracts only the top-K relevant chunks or analytical metrics (~few KB) and passes *only* this extracted context to Gemini. Raw files are never dumped to the cloud.
3. **Spreadsheet Intelligence First**: Mathematical calculations (SUM, AVG, GROUP BY, TOP N, TRENDS) are executed locally via DuckDB-WASM or browser analytical engines. Gemini is used to provide narrative explanations rather than hallucinating math.
4. **Grounded Citations**: Answers preserve precise source coordinates (File name, Sheet name, Row numbers, PDF page numbers, DOCX sections). Clicking citations immediately jumps to the source with visual highlights.
5. **Zero-Trust Security Hierarchy**: File content is untrusted data. Prompt injections embedded within documents cannot override system instructions:
   ```
   SYSTEM DIRECTIVE > APPLICATION > USER QUERY > RETRIEVED CONTEXT (UNTRUSTED)
   ```

---

## 2. High-Level Component Topology

```mermaid
graph TD
    User["User Browser Session"]

    subgraph Client ["Client-Side Web Application (Vite + React + TS)"]
        UI["Modern Workspace UI\n(Sidebar, Composer, Chat, Context Panel, Command Palette)"]
        State["Zustand State Stores\n(Workspace, Files, Chat, Settings, UI)"]
        
        subgraph LocalStorage ["Local Storage Layer"]
            IDB[("IndexedDB (datai_workspace_db)\nWorkspaces, Metadata, Chunks, Messages, Audit Logs")]
            OPFS[("OPFS File System\nRaw File Blobs, Large Datasets")]
        end

        subgraph Engines ["Local Compute & Workers"]
            Parser["File Ingestion Engine\n(pdfjs, mammoth, SheetJS, PapaParse, Tesseract)"]
            DuckDB["Analytics Engine\n(DuckDB-WASM & SQL Fallback)"]
            Retriever["Hybrid Retriever\n(BM25 Okapi + RRF Ranking)"]
            Router["Smart Query Router\n(Intent Classifier)"]
        end
    end

    subgraph Backend ["Python FastAPI Gateway"]
        Gateway["FastAPI Gateway (/api/chat/stream, /api/health)"]
        PromptGuard["Prompt Guard & Injection Filter"]
        GenAIClient["Google GenAI SDK (gemini-2.0-flash)"]
    end

    User --> UI
    UI --> State
    State --> Engines
    Engines --> LocalStorage

    Router -->|Analytical Query| DuckDB
    Router -->|Document Query| Retriever
    Router -->|Qualitative Synthesis (Online)| Gateway

    Gateway --> PromptGuard
    PromptGuard --> GenAIClient
    GenAIClient -->|HTTPS SSE Stream| Gateway
    Gateway -->|Server-Sent Events| UI
```

---

## 3. Technology Stack Breakdown

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite | Core application shell, reactive component tree |
| **Styling & Theme** | Tailwind CSS | Bespoke Silver (`#C7CBD1`), Saffron (`#F4B942`), and Dark Surface (`#14171A`) tokens |
| **State Management** | Zustand | Atomic, unopinionated reactive stores with IndexedDB sync |
| **Local Storage** | `idb` + OPFS | High capacity browser-local persistence for files, metadata, and chats |
| **Data Engine** | `@duckdb/duckdb-wasm` | In-browser analytical SQL engine for instant aggregations |
| **PDF Processing** | `pdfjs-dist` | Page segmentation, text layer extraction, and canvas rendering |
| **DOCX Processing** | `mammoth` | Structured document paragraph, heading, and table extraction |
| **Spreadsheet Processing**| `xlsx` (SheetJS) + `papaparse` | Schema profiling, typed column extraction, and row chunking |
| **OCR** | `tesseract.js` | Client-side OCR extraction for images |
| **Search Engine** | BM25 Okapi | Inverted index for sub-millisecond keyword retrieval |
| **Visualizations** | Recharts | Responsive SVG charts (Bar, Line, Area, Pie) |
| **Table Virtualization** | `@tanstack/react-virtual` | 60fps rendering of 50,000+ spreadsheet rows |
| **Backend Gateway** | Python 3.14 + FastAPI + Uvicorn | Secure proxy holding `GEMINI_API_KEY`, streaming SSE responses |
| **AI SDK** | `google-genai` | Official Google GenAI Python client |
