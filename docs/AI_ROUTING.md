# DatAI Query Intent & AI Routing

DatAI employs an intelligent **AI Routing Layer** (`client/src/lib/router/query-router.ts`) to ensure computational accuracy, cost efficiency, and strict privacy.

---

## 1. The Core Routing Philosophy

> **Use AI only where AI actually adds value. Use deterministic local computation for everything else.**

LLMs are prone to hallucinating mathematical sums, miscounting rows, or guessing averages. DatAI solves this by:
1. Detecting if the query is analytical or mathematical.
2. Executing the exact computation locally on the real data.
3. Using Gemini only to explain the computed evidence or answer qualitative questions.

---

## 2. Intent Classification Decision Matrix

```mermaid
flowchart TD
    Q["User Prompt"] --> Router["Query Router"]

    Router --> Intent{"Detect Query Intent"}

    Intent -->|Math / Sum / Avg / Group / Chart| AnalyticalRoute["Analytical Route\n(DuckDB-WASM / Query Planner)"]
    Intent -->|Exact Text Search / Specific Clause| RetrievalRoute["Document Retrieval Route\n(BM25 Hybrid Search)"]
    Intent -->|Qualitative / Summary / Comparison| GenerativeRoute["Generative Synthesis Route"]

    AnalyticalRoute --> ExecDuckDB["Execute SQL Aggregation Locally"]
    ExecDuckDB --> GenChart["Generate Interactive Recharts SVG"]
    GenChart --> AIExplain{"AI Explanation Needed?"}
    AIExplain -->|Yes (Online)| GeminiSummary["Call Gemini Gateway with Numbers (~100 tokens)"]
    AIExplain -->|No (Offline)| DeterministicCard["Render Evidence Card directly"]

    RetrievalRoute --> SearchChunks["Retrieve Top Chunks from IndexedDB"]
    SearchChunks --> Citations["Build Exact Citations (Page / Row / Section)"]
    Citations --> SynthesizeRoute{"Mode?"}
    SynthesizeRoute -->|Online| GeminiStream["Stream from FastAPI Gateway"]
    SynthesizeRoute -->|Offline| LocalEngine["Deterministic Browser Synthesizer"]
```

---

## 3. Supported Analytical Operations

The Query Planner (`client/src/lib/analytics/query-planner.ts`) converts natural language directly into schema-aware SQL executed by `analyticsEngine`:
- **Aggregations**: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`
- **Groupings**: `GROUP BY region`, `GROUP BY category`, `GROUP BY department`
- **Rankings**: `ORDER BY total_sales DESC LIMIT 10`
- **Visualizations**: Auto-selects between `bar` (categorical), `line` (date/time), and `pie` (share/percentage).
