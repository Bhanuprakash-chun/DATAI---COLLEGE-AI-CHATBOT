# DatAI Database & Storage Architecture

DatAI operates without requiring a centralized cloud database (such as PostgreSQL, Firebase, or Supabase). All relational and blob storage is maintained locally in the browser.

---

## 1. Storage Architecture Overview

DatAI uses a hybrid local storage model managed by `BrowserStorageProvider`:
1. **IndexedDB (`datai_workspace_db`, version 1)**: Structured storage for metadata, document chunks, messages, conversations, and audit records.
2. **OPFS (Origin Private File System)**: High-performance virtual file system for raw binary files (PDFs, Excel files, large CSVs).
3. **In-Memory Worker Cache**: Active tabular rows for instant DuckDB-WASM query execution.

---

## 2. IndexedDB Object Stores & Schema

### `workspaces`
- **Key**: `id: string`
- **Fields**: `name`, `description`, `fileIds`, `createdAt`, `updatedAt`
- **Indexes**: `by-updated` (`updatedAt`)

### `files`
- **Key**: `id: string`
- **Fields**: `workspaceId`, `name`, `size`, `type`, `mimeType`, `status`, `progress`, `pageCount`, `rowCount`, `chunkCount`, `sheets`, `storageKey`
- **Indexes**: `by-workspace` (`workspaceId`), `by-type` (`type`)

### `chunks`
- **Key**: `id: string`
- **Fields**: `fileId`, `fileName`, `chunkIndex`, `text`, `pageNumber`, `sectionTitle`, `sheetName`, `rowRange`, `metadata`
- **Indexes**: `by-file` (`fileId`)

### `conversations`
- **Key**: `id: string`
- **Fields**: `workspaceId`, `title`, `fileIds`, `createdAt`, `updatedAt`
- **Indexes**: `by-workspace` (`workspaceId`), `by-updated` (`updatedAt`)

### `messages`
- **Key**: `id: string`
- **Fields**: `conversationId`, `workspaceId`, `role`, `content`, `citations`, `calculationEvidence`, `chart`, `modeUsed`, `createdAt`
- **Indexes**: `by-conversation` (`conversationId`), `by-created` (`createdAt`)

### `charts`
- **Key**: `id: string`
- **Fields**: `workspaceId`, `title`, `description`, `type`, `xAxisKey`, `series`, `data`

### `audit_logs`
- **Key**: `id: string`
- **Fields**: `timestamp`, `userPrompt`, `minimalContextSnippet`, `tokensEstimated`, `latencyMs`, `status`, `model`
- **Indexes**: `by-timestamp` (`timestamp`)

### `settings`
- **Key**: `key: string`
- **Fields**: `value: any`

---

## 3. Storage Quota & Capacity Management

Browsers allocate local storage based on free disk space (often 60% of available disk space, up to hundreds of gigabytes).
- `storage.getStorageEstimate()` tracks real-time usage and quota via `navigator.storage.estimate()`.
- The UI exposes a storage meter in the sidebar and an in-depth breakdown in the Privacy Dashboard.
- When storage exceeds quota thresholds, the user is notified and can selectively remove large files or clear audit history.
