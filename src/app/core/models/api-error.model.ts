export interface ApiError {
  status?: 'C' | 'E';
  errorCode?: string;
  errorDesc?: string;
  displayMessage?: string;
  data?: null;
}
