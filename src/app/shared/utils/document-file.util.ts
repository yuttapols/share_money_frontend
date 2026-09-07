export const DOCUMENT_FILE_ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export function isAllowedDocumentFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return DOCUMENT_EXTENSIONS.includes(extension) && DOCUMENT_MIME_TYPES.includes(file.type.toLowerCase());
}
