import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ImportCommitResult, ImportValidationResult } from '../../../core/models/import.model';
import { ImportApiService } from '../../../core/services/import-api.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { FileDownloadService } from '../../../shared/services/file-download.service';
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
      ><app-button
        icon="pi-check-circle"
        [loading]="validating()"
        [disabled]="!selectedFile()"
        (pressed)="validate()"
        >{{ 'import.validate' | translate }}</app-button
      >

      @if (result(); as result) {
        <div class="summary">
          <article>
            <span>{{ 'admin.totalRows' | translate }}</span
            ><strong>{{ result.summary.totalRows }}</strong>
          </article>
          <article>
            <span>{{ 'admin.validRows' | translate }}</span
            ><strong>{{ result.summary.validRows }}</strong>
          </article>
          <article>
            <span>{{ 'admin.invalidRows' | translate }}</span
            ><strong>{{ result.summary.invalidRows }}</strong>
          </article>
        </div>
        <div class="import-actions">
          <app-button
            icon="pi-save"
            [loading]="committing()"
            [disabled]="result.summary.invalidRows > 0"
            (pressed)="commit()"
            >{{ 'import.commit' | translate }}</app-button
          >
          @if (result.errors.length > 0) {
            <app-button variant="secondary" icon="pi-download" [loading]="downloading()" (pressed)="downloadErrors()">{{
              'admin.downloadErrors' | translate
            }}</app-button>
          }
        </div>
        @if (result.errors.length > 0) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sheet</th>
                  <th>Row</th>
                  <th>Field</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                @for (error of result.errors; track error.sheet + error.row + error.field) {
                  <tr>
                    <td>{{ error.sheet }}</td>
                    <td>{{ error.row }}</td>
                    <td>{{ error.field }}</td>
                    <td class="error-code">{{ error.errorCode }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      @if (commitResult(); as committed) {
        <div class="completed">
          <i class="pi pi-check-circle"></i><strong>{{ 'import.completed' | translate }}</strong
          ><span>{{ 'import.importedCount' | translate: { count: committed.importedCount } }}</span>
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
    .summary {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .summary article {
      display: grid;
      gap: 0.25rem;
      border-radius: 0.75rem;
      padding: 1rem;
      background: var(--color-surface-muted);
    }
    .summary span {
      color: var(--color-text-secondary);
      font-size: 0.7rem;
    }
    .summary strong {
      color: var(--color-text-primary);
      font-size: 1.3rem;
    }
    .import-actions {
      display: flex;
      gap: 0.5rem;
    }
    .table-wrap {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      min-width: 42rem;
      border-collapse: collapse;
    }
    th,
    td {
      border-top: 1px solid var(--border-color);
      padding: 0.8rem 1rem;
      text-align: left;
      font-size: 0.76rem;
      color: var(--color-text-secondary);
    }
    th {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      font-weight: 700;
    }
    .error-code {
      color: #dc2626;
      font-weight: 650;
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
    @media (max-width: 600px) {
      .summary {
        grid-template-columns: 1fr;
      }
      .import-actions {
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportComponent {
  private readonly importApi = inject(ImportApiService);
  private readonly alerts = inject(SweetAlertService);
  private readonly downloads = inject(FileDownloadService);
  readonly excelAccept = EXCEL_FILE_ACCEPT;
  readonly selectedFile = signal<File | null>(null);
  readonly result = signal<ImportValidationResult | null>(null);
  readonly commitResult = signal<ImportCommitResult | null>(null);
  readonly validating = signal(false);
  readonly committing = signal(false);
  readonly downloading = signal(false);

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.selectedFile.set(file && isAllowedExcelFile(file) ? file : null);
    this.result.set(null);
    this.commitResult.set(null);
    if (file && !this.selectedFile()) this.alerts.error('validation.excelType');
  }

  validate(): void {
    const file = this.selectedFile();
    if (!file || this.validating()) return;
    this.validating.set(true);
    this.importApi
      .validate(file)
      .pipe(finalize(() => this.validating.set(false)))
      .subscribe((result) => {
        this.result.set(result);
        this.alerts.success('toast.importValidated');
      });
  }

  commit(): void {
    const result = this.result();
    if (!result || result.summary.invalidRows > 0 || this.committing()) return;
    this.committing.set(true);
    this.importApi
      .commit(result.batchId)
      .pipe(finalize(() => this.committing.set(false)))
      .subscribe((committed) => {
        this.commitResult.set(committed);
        this.alerts.success('toast.importCommitted');
      });
  }

  downloadErrors(): void {
    const result = this.result();
    if (!result || this.downloading()) return;
    this.downloading.set(true);
    this.importApi
      .downloadErrors(result.batchId)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe((blob) => this.downloads.save(blob, `import-errors-${result.batchId}.xlsx`));
  }
}
