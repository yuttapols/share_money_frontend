import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  save(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = this.sanitizeFilename(filename);
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 150);
  }
}
