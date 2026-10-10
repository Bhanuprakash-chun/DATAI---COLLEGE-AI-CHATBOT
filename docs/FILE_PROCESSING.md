# DatAI File Ingestion & Parsing Pipelines

DatAI parses and indexes a wide variety of formats directly inside client-side Web Workers without sending raw files to external servers.

---

## 1. Supported File Formats

| Format | Extensions | Parser Engine | Output Extracted |
| :--- | :--- | :--- | :--- |
| **Excel** | `.xlsx`, `.xls` | `xlsx` (SheetJS) | Multi-sheet schemas, typed columns, sample row chunks |
| **CSV / TSV** | `.csv`, `.tsv` | `papaparse` | Tabular row records, column statistics, summary chunks |
| **PDF** | `.pdf` | `pdfjs-dist` | Page segmentation, coordinate bounds, text chunks |
| **DOCX** | `.docx` | `mammoth` | Structured headings (H1/H2), paragraphs, tables |
| **Markdown** | `.md` | Semantic Chunker | Header hierarchy, code blocks, lists |
| **Text** | `.txt` | Sliding Window Chunker | Paragraph chunks with token overlap |
| **JSON** | `.json` | JSON Parser | Key-value tree structure, line chunks |
| **Images** | `.png`, `.jpg`, `.jpeg` | `tesseract.js` | Optical Character Recognition (OCR) text layer |

---

## 2. Ingestion Stages & Progress Tracking

When a file is uploaded, the unified ingestion pipeline (`client/src/lib/parsers/index.ts`) emits progress stages:
```
Reading (15%) -> Analyzing (40-70%) -> Indexing (80%) -> Ready (100%)
```

1. **Reading**: File binary is read into an `ArrayBuffer` and persisted to OPFS/IndexedDB.
2. **Analyzing**: Format-specific parser extracts text, tables, columns, and structural boundaries.
3. **Indexing**: Chunks are generated with precise metadata coordinates (`fileId`, `fileName`, `pageNumber`, `sheetName`, `rowRange`, `sectionTitle`) and stored in the IndexedDB `chunks` table.
4. **Ready**: File metadata is saved to IndexedDB; tabular rows are registered in `AnalyticalEngine`.

---

## 3. Chunking Strategy & Citation Preservation

Chunks are generated with an optimal reading window of ~180 words with a 30-word overlap. Every single chunk preserves:
```typescript
interface DocumentChunk {
  id: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
  pageNumber?: number;      // Exact PDF page
  sectionTitle?: string;    // DOCX / Markdown heading
  sheetName?: string;       // Excel sheet name
  rowRange?: [number, number]; // Spreadsheet row range
  metadata?: Record<string, any>;
}
```
This enables the citation badge system to navigate directly to the exact page or row.
