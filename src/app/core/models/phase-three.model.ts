export interface Slip {
  id?: number;
  debtorUsername: string;
  creditorUsername: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface SlipDebtorsResponse {
  debtorUsernames: string[];
}

export type DocumentScope = 'TEMPLATE' | 'DEBTOR';

export interface DocumentItem {
  id: number;
  title: string;
  scope: DocumentScope;
  debtorUsername: string | null;
  url: string;
}

export interface DueReportLine {
  title: string;
  what: string;
  due: number;
  paid: boolean;
}

export interface DueReport {
  issuedAt: string;
  lines: DueReportLine[];
  dueCount: number;
  total: number;
}

export interface Bank {
  code: string;
  name: string;
}

export interface BankAccount {
  id: number;
  bankName: string;
  accountNo: string;
  accountName: string;
  paymentNote: string | null;
}

export interface BankAccountRequest {
  bankName: string;
  accountNo: string;
  accountName: string;
  paymentNote: string | null;
}
