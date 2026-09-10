export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ImportRowError {
  sheet: string;
  row: number;
  field: string;
  errorCode: string;
}

export interface ImportValidationResult {
  batchId: string;
  status: string;
  summary: ImportSummary;
  errors: ImportRowError[];
}

export interface ImportCommitResult {
  batchId: string;
  status: string;
  importedCount: number;
}
