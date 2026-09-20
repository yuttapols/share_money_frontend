import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ImportApiService } from '../../../core/services/import-api.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { EXCEL_FILE_ACCEPT, isAllowedExcelFile } from '../../../shared/utils/excel-file.util';

@Component({
  selector: 'app-import',
  imports: [TranslatePipe, AppButtonComponent],
  template: `
    <header class="page-header">
      <div>
        <h1>{{ 'import.title' | translate }}</h1>
        <p>{{ 'import.description' | translate }}</p>
      </div>
    </header>

    <section class="card import">
      <input #importInput type="file" [accept]="excelAccept" (change)="selectFile($event)" /><button
        type="button"
        class="file-picker"
        (click)="importInput.click()"
      >
        <i class="pi pi-file-excel"></i>{{ selectedFile()?.name || ('admin.chooseExcel' | translate) }} <b>*</b></button
      ><small>{{ 'admin.excelHint' | translate }}</small
      ><app-button icon="pi-upload" [loading]="importing()" [disabled]="!selectedFile()" (pressed)="submit()">{{
        'import.submit' | translate
      }}</app-button>

      @if (imported()) {
        <div class="completed">
          <i class="pi pi-check-circle"></i><strong>{{ 'import.completed' | translate }}</strong>
        </div>
      }
    </section>
  `,
  styles: `
    .page-header h1,
    .page-header p {
      margin: 0;
    }
    .page-header h1 {
      color: var(--color-text-primary);
      font-size: var(--font-size-heading);
    }
    .page-header p {
      margin-top: 0.3rem;
      color: var(--color-text-secondary);
      font-size: 0.82rem;
    }
    .card {
      margin-top: 1.25rem;
      overflow: hidden;
      border: var(--border-width) solid var(--border-color);
      border-top: 4px solid #818cf8;
      border-radius: 1rem;
      background: var(--color-surface);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }
    .import {
      display: grid;
      justify-items: start;
      gap: 0.75rem;
      padding: 1.25rem;
    }
    .import > input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    .file-picker {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px dashed #94a3b8;
      border-radius: 0.75rem;
      padding: 0.8rem 1rem;
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      font: inherit;
      cursor: pointer;
    }
    .file-picker b {
      color: #dc2626;
    }
    .import small {
      color: var(--color-text-secondary);
    }
    .completed {
      display: grid;
      justify-items: center;
      width: 100%;
      gap: 0.4rem;
      border-radius: 0.8rem;
      padding: 1.25rem;
      background: #ecfdf5;
      color: #047857;
    }
    .completed i {
      font-size: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportComponent {
  private readonly importApi = inject(ImportApiService);
  private readonly alerts = inject(SweetAlertService);
  readonly excelAccept = EXCEL_FILE_ACCEPT;
  readonly selectedFile = signal<File | null>(null);
  readonly importing = signal(false);
  readonly imported = signal(false);

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.selectedFile.set(file && isAllowedExcelFile(file) ? file : null);
    this.imported.set(false);
    if (file && !this.selectedFile()) this.alerts.error('validation.excelType');
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || this.importing()) return;
    this.importing.set(true);
    this.importApi
      .importLegacyData(file)
      .pipe(finalize(() => this.importing.set(false)))
      .subscribe(() => {
        this.imported.set(true);
        this.selectedFile.set(null);
        this.alerts.success('toast.importCommitted');
      });
  }
}
