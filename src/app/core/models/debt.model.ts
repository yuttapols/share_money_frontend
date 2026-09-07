export type DebtMethod = 'INSTALLMENT' | 'OPEN' | 'FULL';
export type DebtStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentStatus = 'UNPAID' | 'PAID';
export type InstallmentKind = 'PRINCIPAL' | 'INTEREST';

export interface DebtSummary {
  id: number;
  creditorUsername: string;
  debtorUsername: string;
  title: string;
  description?: string;
  method: DebtMethod;
  amount: number;
  installmentCount?: number;
  installmentPaidCount?: number;
  interest?: number;
  paidAmount: number;
  lastPayDate?: string | null;
  status: DebtStatus;
  dueAmount: number;
  dueLabel: string;
  sortOrder: number;
  createdAt: string;
}

export interface Installment {
  no: number;
  amount: number;
  kind: InstallmentKind;
  status: PaymentStatus;
  dueDate: string;
  payDate: string | null;
  paidAt: string | null;
}

export interface OpenLoanRecord {
  no: number;
  payDate: string;
  totalPaid: number;
  interest: number;
  remainingPrincipal: number;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface DebtDetail extends DebtSummary {
  startDate: string;
  installmentAmount?: number;
  installments?: Installment[];
  openRecords?: OpenLoanRecord[];
}

export interface CreateInstallmentDebtRequest {
  debtorUsername: string;
  title: string;
  description: string;
  method: 'INSTALLMENT';
  startDate: string;
  installmentCount: number;
  installmentAmount: number;
}

export interface CreateOpenDebtRequest {
  debtorUsername: string;
  title: string;
  method: 'OPEN';
  startDate: string;
  principal: number;
  installmentAmount: number;
}

export type CreateDebtRequest = CreateInstallmentDebtRequest | CreateOpenDebtRequest;

export interface PayInstallmentRequest {
  paid: boolean;
  payDate?: string;
}

export interface PayInterestRequest {
  payDate: string;
}

export interface CreateOpenRecordRequest {
  payDate: string;
  interest: number;
  remainingPrincipal: number;
  paid: boolean;
}

export interface UpdateOpenRecordRequest {
  totalPaid: number;
  status: PaymentStatus;
}
