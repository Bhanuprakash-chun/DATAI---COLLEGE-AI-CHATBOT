import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { DocumentChunk, TabularSheetSchema, TabularColumnProfile } from '@/types/file';
import { generateId } from '@/lib/utils';

export interface ParsedSpreadsheetResult {
  sheets: TabularSheetSchema[];
  sheetData: Record<string, Record<string, any>[]>;
  chunks: DocumentChunk[];
  totalRowCount: number;
}

export function profileColumnData(name: string, values: any[]): TabularColumnProfile {
  let nullCount = 0;
  const nonNullValues: any[] = [];
  const uniqueSet = new Set<string>();

  for (const val of values) {
    if (val === null || val === undefined || val === '' || val === 'NaN') {
      nullCount++;
    } else {
      nonNullValues.push(val);
      uniqueSet.add(String(val));
    }
  }

  let type: 'INTEGER' | 'DECIMAL' | 'TEXT' | 'DATE' | 'BOOLEAN' = 'TEXT';
  let numericValues: number[] = [];

  if (nonNullValues.length > 0) {
    const isBool = nonNullValues.every(
      (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE'
    );
    if (isBool) {
      type = 'BOOLEAN';
    } else {
      const numbers = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v));
      if (numbers.length === nonNullValues.length) {
        const isAllInt = numbers.every((n) => Number.isInteger(n));
        type = isAllInt ? 'INTEGER' : 'DECIMAL';
        numericValues = numbers;
      } else {
        const isDate = nonNullValues.every((v) => !isNaN(Date.parse(String(v))));
        if (isDate) {
          type = 'DATE';
        } else {
          type = 'TEXT';
        }
      }
    }
  }

  let min: number | string | undefined;
  let max: number | string | undefined;
  let mean: number | undefined;
  let sum: number | undefined;

  if (numericValues.length > 0) {
    min = Math.min(...numericValues);
    max = Math.max(...numericValues);
    sum = numericValues.reduce((a, b) => a + b, 0);
    mean = sum / numericValues.length;
  } else if (nonNullValues.length > 0 && type === 'TEXT') {
    const sorted = [...nonNullValues.map(String)].sort();
    min = sorted[0];
    max = sorted[sorted.length - 1];
  }

  return {
    name,
    type,
    nullCount,
    uniqueCount: uniqueSet.size,
    min,
    max,
    mean: mean !== undefined ? parseFloat(mean.toFixed(2)) : undefined,
    sum: sum !== undefined ? parseFloat(sum.toFixed(2)) : undefined,
    sampleValues: nonNullValues.slice(0, 5),
  };
}

export async function parseSpreadsheet(
  fileId: string,
  fileName: string,
  bufferOrText: ArrayBuffer | string,
  isCsv: boolean
): Promise<ParsedSpreadsheetResult> {
  const sheets: TabularSheetSchema[] = [];
  const sheetData: Record<string, Record<string, any>[]> = {};
  const chunks: DocumentChunk[] = [];
  let totalRowCount = 0;

  if (isCsv) {
    const text = typeof bufferOrText === 'string'
      ? bufferOrText
      : new TextDecoder('utf-8').decode(bufferOrText as ArrayBuffer);

    const parsed = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    const rows = (parsed.data as Record<string, any>[]).filter(
      (r) => Object.keys(r).length > 0
    );
    const headers = parsed.meta.fields || (rows[0] ? Object.keys(rows[0]) : []);

    const columns: TabularColumnProfile[] = headers.map((col) => {
      const values = rows.map((r) => r[col]);
      return profileColumnData(col, values);
    });

    const sheetName = 'Sheet1';
    sheets.push({
      sheetName,
      rowCount: rows.length,
      columnCount: headers.length,
      columns,
    });
    sheetData[sheetName] = rows;
    totalRowCount += rows.length;

    // Generate table summary chunk for retrieval
    const schemaSummary = `Table: ${fileName}\nColumns: ${headers.join(', ')}\nTotal Rows: ${rows.length}\nColumn Profiles:\n` +
      columns.map((c) => `- ${c.name} (${c.type}): ${c.nullCount} nulls, unique: ${c.uniqueCount}${c.min !== undefined ? `, min: ${c.min}, max: ${c.max}` : ''}${c.sum !== undefined ? `, sum: ${c.sum}` : ''}`).join('\n');

    chunks.push({
      id: generateId(),
      fileId,
      fileName,
      chunkIndex: 0,
      text: schemaSummary,
      sheetName,
      rowRange: [1, rows.length],
      metadata: { isSchemaSummary: true },
    });

    // Chunk sample rows in groups of 25 for semantic retrieval
    const CHUNK_ROW_SIZE = 25;
    for (let i = 0; i < rows.length; i += CHUNK_ROW_SIZE) {
      const rowSlice = rows.slice(i, i + CHUNK_ROW_SIZE);
      const rowText = rowSlice
        .map((r, idx) => `[Row ${i + idx + 1}] ` + Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | '))
        .join('\n');

      chunks.push({
        id: generateId(),
        fileId,
        fileName,
        chunkIndex: chunks.length,
        text: `Data Rows ${i + 1} to ${Math.min(i + CHUNK_ROW_SIZE, rows.length)} from ${fileName}:\n${rowText}`,
        sheetName,
        rowRange: [i + 1, Math.min(i + CHUNK_ROW_SIZE, rows.length)],
      });
    }
  } else {
    // Excel workbook (.xlsx, .xls)
    const workbook = XLSX.read(bufferOrText, { type: 'array' });

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: false,
        defval: null,
      });

      if (rows.length === 0) continue;

      const headers = Object.keys(rows[0] || {});
      const columns: TabularColumnProfile[] = headers.map((col) => {
        const values = rows.map((r) => r[col]);
        return profileColumnData(col, values);
      });

      sheets.push({
        sheetName,
        rowCount: rows.length,
        columnCount: headers.length,
        columns,
      });
      sheetData[sheetName] = rows;
      totalRowCount += rows.length;

      // Schema summary chunk
      const schemaSummary = `Excel Sheet: ${sheetName} (File: ${fileName})\nColumns: ${headers.join(', ')}\nTotal Rows: ${rows.length}\nColumn Profiles:\n` +
        columns.map((c) => `- ${c.name} (${c.type}): ${c.nullCount} nulls, unique: ${c.uniqueCount}${c.min !== undefined ? `, min: ${c.min}, max: ${c.max}` : ''}${c.sum !== undefined ? `, sum: ${c.sum}` : ''}`).join('\n');

      chunks.push({
        id: generateId(),
        fileId,
        fileName,
        chunkIndex: chunks.length,
        text: schemaSummary,
        sheetName,
        rowRange: [1, rows.length],
        metadata: { isSchemaSummary: true },
      });

      // Sample data chunks
      const CHUNK_ROW_SIZE = 25;
      for (let i = 0; i < Math.min(rows.length, 250); i += CHUNK_ROW_SIZE) {
        const rowSlice = rows.slice(i, i + CHUNK_ROW_SIZE);
        const rowText = rowSlice
          .map((r, idx) => `[Row ${i + idx + 1}] ` + Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | '))
          .join('\n');

        chunks.push({
          id: generateId(),
          fileId,
          fileName,
          chunkIndex: chunks.length,
          text: `Data Rows ${i + 1} to ${Math.min(i + CHUNK_ROW_SIZE, rows.length)} from ${sheetName}:\n${rowText}`,
          sheetName,
          rowRange: [i + 1, Math.min(i + CHUNK_ROW_SIZE, rows.length)],
        });
      }
    }
  }

  return {
    sheets,
    sheetData,
    chunks,
    totalRowCount,
  };
}
