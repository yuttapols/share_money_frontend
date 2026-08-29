export type ApiStatus = 'C' | 'E';

export interface ApiResponse<T> {
  status: ApiStatus;
  errorCode: string;
  errorDesc: string;
  displayMessage: string;
  data: T;
}

export interface ApiErrorResponse extends Omit<ApiResponse<null>, 'status'> {
  status: 'E';
}
