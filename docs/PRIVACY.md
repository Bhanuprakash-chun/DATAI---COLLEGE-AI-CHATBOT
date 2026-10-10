# DatAI Privacy Model & Data Handling

DatAI is built on a **Local-First Privacy Architecture**. Privacy is not an afterthought; it is visible, inspectable, and controllable.

---

## 1. Operating Modes

DatAI provides three clearly distinguishable operating modes displayed in the top bar:

| Mode | Visual Indicator | Cloud Behavior | Local Behavior |
| :--- | :--- | :--- | :--- |
| **AUTO** | 🟡 Saffron Dot | Smart Routing. Only queries requiring generative reasoning contact Gemini with minimal extracted context. | Tabular calculations and exact document lookups run 100% on-device. |
| **ONLINE** | 🟢 Emerald Dot | Gemini enabled. Employs strict **Minimum-Data Cloud Processing**. | File ingestion, parsing, chunking, and indexing remain 100% local. |
| **OFFLINE** | ⚪ Gray Dot | **Zero external network requests**. Cloud calls are completely disabled. | All analytical queries, DuckDB-WASM, PDF viewing, and local synthesis remain fully functional. |

---

## 2. Minimum-Data Cloud Processing

When querying Gemini in ONLINE or AUTO mode:
- **We NEVER upload entire raw files.**
- If you have 20 PDF and Excel files totaling 500 MB, the client's local hybrid retriever searches your IndexedDB index locally and extracts only the **2 to 5 most relevant paragraphs or calculated aggregates** (~1-3 KB).
- *Only* these extracted text snippets are sent to Gemini to synthesize the final answer.
- Raw file bytes never leave your browser sandbox.

---

## 3. Cloud Request Audit Log

DatAI features an integrated **Audit Log** accessible in the Privacy Dashboard:
- Every single payload sent to the Gemini gateway is recorded in local browser storage (`audit_logs`).
- Users can view:
  - Exact timestamp
  - User prompt asked
  - The precise minimal context snippet transmitted
  - Token count estimate
  - Latency in milliseconds
  - Response status

---

## 4. Granular Data Deletion (Data Sanitizer)

The user maintains full ownership of their data:
- **Clear Audit Logs**: Empties transmission records.
- **Delete File**: Removes file blob from OPFS and clears associated chunks from IndexedDB.
- **Delete Workspace**: Cascades deletion of all workspace files, chats, charts, and metadata.
- **Factory Reset (Erase All Browser Data)**: Completely wipes all IndexedDB databases and clears the OPFS sandbox.
