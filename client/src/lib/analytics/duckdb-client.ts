import * as duckdb from '@duckdb/duckdb-wasm';
import { AnalyticalQueryResult } from '@/types/analytics';

export class AnalyticalEngine {
  private static instance: AnalyticalEngine;
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private initialized = false;
  private isInitializing = false;
  private memoryTables: Map<string, Record<string, any>[]> = new Map();

  static getInstance(): AnalyticalEngine {
    if (!AnalyticalEngine.instance) {
      AnalyticalEngine.instance = new AnalyticalEngine();
    }
    return AnalyticalEngine.instance;
  }

  async init(): Promise<boolean> {
    if (this.initialized) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      // Select appropriate DuckDB bundle (eh or mvp)
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

      const worker = await duckdb.createWorker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      this.db = new duckdb.AsyncDuckDB(logger, worker);
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      this.conn = await this.db.connect();
      this.initialized = true;
      console.log('DuckDB-WASM successfully initialized');
      return true;
    } catch (err) {
      console.warn('DuckDB-WASM initialization failed or not supported in current environment. Using fast in-memory SQL/Aggregator fallback:', err);
      this.initialized = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  async registerTable(tableName: string, rows: Record<string, any>[]): Promise<void> {
    // Sanitize table name (replace spaces and dashes with underscore)
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    this.memoryTables.set(safeName, rows);

    if (this.initialized && this.db && this.conn) {
      try {
        const jsonString = JSON.stringify(rows);
        await this.db.registerFileText(`${safeName}.json`, jsonString);
        await this.conn.query(`CREATE OR REPLACE TABLE ${safeName} AS SELECT * FROM read_json_auto('${safeName}.json');`);
      } catch (err) {
        console.warn(`Failed to register table ${safeName} in DuckDB:`, err);
      }
    }
  }

  async query(sql: string, targetTableName?: string): Promise<AnalyticalQueryResult> {
    const startTime = performance.now();

    // If DuckDB is active, attempt direct SQL execution
    if (this.initialized && this.conn) {
      try {
        const result = await this.conn.query(sql);
        const arrowTable = result.toArray();
        const rows = arrowTable.map((row: any) => row.toJSON());
        const columns = arrowTable.length > 0 ? Object.keys(rows[0]) : [];
        const executionTimeMs = Math.round(performance.now() - startTime);

        return {
          columns,
          rows,
          rowCount: rows.length,
          executionTimeMs,
          sqlExecuted: sql,
        };
      } catch (err) {
        console.warn('DuckDB query execution error, falling back to JS analytical engine:', err);
      }
    }

    // High performance JavaScript fallback query engine
    return this.executeFallbackQuery(sql, targetTableName, startTime);
  }

  private executeFallbackQuery(
    sql: string,
    targetTableName?: string,
    startTime: number = performance.now()
  ): AnalyticalQueryResult {
    const safeName = (targetTableName || Array.from(this.memoryTables.keys())[0] || '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const rows = this.memoryTables.get(safeName) || [];

    if (rows.length === 0) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        sqlExecuted: sql,
      };
    }

    const lowerSql = sql.toLowerCase();
    let resultRows: Record<string, any>[] = [...rows];

    // Detect GROUP BY
    const groupByMatch = sql.match(/group\s+by\s+([a-zA-Z0-9_]+)/i);
    const sumMatch = sql.match(/sum\(\s*([a-zA-Z0-9_]+)\s*\)(?:\s+as\s+([a-zA-Z0-9_]+))?/i);
    const avgMatch = sql.match(/avg\(\s*([a-zA-Z0-9_]+)\s*\)(?:\s+as\s+([a-zA-Z0-9_]+))?/i);
    const countMatch = sql.match(/count\(\s*[*a-zA-Z0-9_]*\s*\)(?:\s+as\s+([a-zA-Z0-9_]+))?/i);

    if (groupByMatch) {
      const groupCol = groupByMatch[1];
      const sumCol = sumMatch ? sumMatch[1] : undefined;
      const sumAlias = sumMatch && sumMatch[2] ? sumMatch[2] : `total_${sumCol || 'value'}`;
      const avgCol = avgMatch ? avgMatch[1] : undefined;
      const avgAlias = avgMatch && avgMatch[2] ? avgMatch[2] : `avg_${avgCol || 'value'}`;

      const groups: Record<string, { sum: number; count: number; items: any[] }> = {};

      for (const r of rows) {
        const key = String(r[groupCol] ?? 'Unknown');
        if (!groups[key]) {
          groups[key] = { sum: 0, count: 0, items: [] };
        }
        groups[key].count++;
        if (sumCol && r[sumCol] !== undefined && !isNaN(Number(r[sumCol]))) {
          groups[key].sum += Number(r[sumCol]);
        }
        if (avgCol && r[avgCol] !== undefined && !isNaN(Number(r[avgCol]))) {
          groups[key].sum += Number(r[avgCol]);
        }
      }

      resultRows = Object.entries(groups).map(([grp, data]) => {
        const res: Record<string, any> = { [groupCol]: grp };
        if (sumCol) res[sumAlias] = parseFloat(data.sum.toFixed(2));
        if (avgCol) res[avgAlias] = parseFloat((data.sum / (data.count || 1)).toFixed(2));
        if (countMatch && !sumCol && !avgCol) res['count'] = data.count;
        return res;
      });

      // Handle ORDER BY
      if (lowerSql.includes('order by')) {
        const isDesc = lowerSql.includes('desc');
        const sortCol = sumCol ? sumAlias : avgCol ? avgAlias : groupCol;
        resultRows.sort((a, b) => {
          const valA = a[sortCol] ?? 0;
          const valB = b[sortCol] ?? 0;
          return isDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
      }

      // Handle LIMIT
      const limitMatch = sql.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const lim = parseInt(limitMatch[1], 10);
        resultRows = resultRows.slice(0, lim);
      }
    } else if (sumMatch || avgMatch || countMatch) {
      // Single global aggregation without GROUP BY
      const res: Record<string, any> = {};
      if (sumMatch) {
        const col = sumMatch[1];
        const alias = sumMatch[2] || `total_${col}`;
        const total = rows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
        res[alias] = parseFloat(total.toFixed(2));
      }
      if (avgMatch) {
        const col = avgMatch[1];
        const alias = avgMatch[2] || `avg_${col}`;
        const total = rows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
        res[alias] = parseFloat((total / (rows.length || 1)).toFixed(2));
      }
      if (countMatch) {
        res['total_count'] = rows.length;
      }
      resultRows = [res];
    } else {
      // Basic select slice
      resultRows = resultRows.slice(0, 50);
    }

    const columns = resultRows.length > 0 ? Object.keys(resultRows[0]) : [];
    return {
      columns,
      rows: resultRows,
      rowCount: resultRows.length,
      executionTimeMs: Math.round(performance.now() - startTime),
      sqlExecuted: sql,
    };
  }
}

export const analyticsEngine = AnalyticalEngine.getInstance();
