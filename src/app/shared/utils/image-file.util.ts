export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const IMAGE_FILE_ACCEPT = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_IMAGE_MIME_TYPES].join(',');

export function isAllowedImageFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const hasAllowedExtension = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
  const hasAllowedMimeType = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
  return hasAllowedExtension && hasAllowedMimeType;
}
