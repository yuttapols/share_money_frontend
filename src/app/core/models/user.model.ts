import { UserRole } from './auth.model';

export interface CreateCreditorRequest {
  username: string;
  password: string;
  name: string;
}

export interface Creditor {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface CreditorSummary {
  id: number;
  username: string;
  name: string;
  active: boolean;
  debtorCount: number;
}

export interface CreateDebtorRequest {
  username: string;
  password: string;
  name: string;
}

export interface UpdateDebtorRequest {
  username: string;
  name: string;
  password: string;
}

export interface Debtor {
  id: number;
  username: string;
  name: string;
  creditorUsername: string;
  active: boolean;
}

export interface DeleteDebtorResponse {
  ok: boolean;
  deletedDebtCount: number;
}

export interface UpdateDebtorResponse {
  ok: boolean;
}
