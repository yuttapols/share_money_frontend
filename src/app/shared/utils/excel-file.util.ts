export const EXCEL_FILE_ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function isAllowedExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx');
}
