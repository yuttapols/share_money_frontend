export interface MigrationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface MigrationError {
  sheet: string;
  row: number;
  field: string;
  errorCode: string;
}

export interface MigrationValidationResult {
  batchId: string;
  status: string;
  summary: MigrationSummary;
  errors: MigrationError[];
}

export interface MigrationCommitResult {
  batchId: string;
  status: string;
  imported: {
    users: number;
    debts: number;
    payments: number;
  };
}

export interface MigrationStatus extends Partial<MigrationValidationResult>, Partial<MigrationCommitResult> {
  batchId: string;
  status: string;
}
