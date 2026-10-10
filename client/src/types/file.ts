export type SupportedFileType =
  | 'xlsx'
  | 'xls'
  | 'csv'
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'md'
  | 'json'
  | 'image';

export type FileProcessingStatus =
  | 'pending'
  | 'reading'
  | 'analyzing'
  | 'indexing'
  | 'ready'
  | 'error';

export interface DocumentChunk {
  id: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
  sheetName?: string;
  rowRange?: [number, number];
  characterRange?: [number, number];
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface TabularColumnProfile {
  name: string;
  type: 'INTEGER' | 'DECIMAL' | 'TEXT' | 'DATE' | 'BOOLEAN';
  nullCount: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  sum?: number;
  sampleValues: (string | number | boolean | null)[];
}

export interface TabularSheetSchema {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  columns: TabularColumnProfile[];
}

export interface FileMetadata {
  id: string;
  workspaceId: string;
  name: string;
  size: number;
  type: SupportedFileType;
  mimeType: string;
  createdAt: number;
  updatedAt: number;
  status: FileProcessingStatus;
  statusMessage?: string;
  progress: number; // 0 to 100
  
  // Specific intelligence metadata
  pageCount?: number;
  rowCount?: number;
  chunkCount: number;
  sheets?: TabularSheetSchema[];
  ocrApplied?: boolean;
  
  // Storage handle / key in OPFS or IndexedDB
  storageKey: string;
  previewUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  fileIds: string[];
}
