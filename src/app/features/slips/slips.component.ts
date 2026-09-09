import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, map, Observable, of, switchMap } from 'rxjs';
import { Slip } from '../../core/models/phase-three.model';
import { Debtor } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { DebtApiService } from '../../core/services/debt-api.service';
import { SlipApiService } from '../../core/services/slip-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FileDownloadService } from '../../shared/services/file-download.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { IMAGE_FILE_ACCEPT, isAllowedImageFile } from '../../shared/utils/image-file.util';

@Component({
  selector: 'app-slips',
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <header>
      <h1>{{ 'slips.title' | translate }}</h1>
      <p>{{ 'slips.description' | translate }}</p>
    </header>

    @if (canSelectDebtor()) {
      <section class="filter-card">
        <label>{{ 'slips.selectDebtor' | translate }}</label>
        <select maxlength="50" [(ngModel)]="selectedDebtor" (ngModelChange)="loadSlips()">
          <option value="">{{ 'slips.chooseDebtor' | translate }}</option>
          @for (debtor of debtors(); track debtor.id) {
            <option [value]="debtor.username">{{ debtor.name }} ({{ debtor.username }})</option>
          }
        </select>
      </section>
    }

    @if (loading()) {
      <div class="loading-card"><span class="pi pi-spin pi-spinner"></span></div>
    } @else if (loadError()) {
      <section class="state-card">
        <app-error-state
          [title]="'errors.unexpected' | translate"
          [retryLabel]="'common.retry' | translate"
          (retry)="loadSlips()"
        />
      </section>
    } @else if (canSelectDebtor() && !selectedDebtor) {
      <section class="state-card">
        <app-empty-state
          icon="pi-user"
          [title]="'slips.chooseDebtor' | translate"
          [message]="'slips.chooseDebtorDescription' | translate"
        />
      </section>
    } @else {
      @if (canUpload()) {
        <section class="upload-card">
          <input #fileInput type="file" [accept]="fileAccept" (change)="selectFile($event)" />
          <button type="button" class="file-button" (click)="fileInput.click()">
            <span class="pi pi-image"></span>{{ 'slips.chooseImage' | translate }}
          </button>
          <small>{{ 'slips.fileHint' | translate }}</small>
          <small>{{ 'slips.limitHint' | translate }}</small>
          @if (fileError()) {
            <small class="error">{{ fileError() | translate }}</small>
          }
          @if (selectedFile()) {
            <app-button icon="pi-upload" [loading]="uploading()" (pressed)="upload()">{{
              'slips.upload' | translate
            }}</app-button>
          }
        </section>
      }

      @if (slips().length === 0) {
        <section class="state-card">
          <app-empty-state
            icon="pi-image"
            [title]="'slips.empty' | translate"
            [message]="'slips.emptyDescription' | translate"
          />
        </section>
      } @else {
        <section class="slip-grid">
          @for (slip of slips(); track slip.id) {
            <article class="slip-card">
              <button type="button" class="preview" (click)="openPreview(slip)">
                <img [src]="slip.thumbnailUrl || slip.url" [alt]="slip.filename" />
              </button>
              <div class="details">
                <h2>{{ slip.filename }}</h2>
                <p>{{ slip.uploadedAt | date: 'd MMM y, HH:mm' }}</p>
                <p>{{ formatSize(slip.sizeBytes) }}</p>
                <div class="actions">
                  <app-button icon="pi-download" [loading]="downloadingId() === slip.id" (pressed)="download(slip)">{{
                    'slips.download' | translate
                  }}</app-button>
                  @if (canDelete()) {
                    <button
                      type="button"
                      class="delete-button"
                      [disabled]="deletingId() === slip.id"
                      (click)="deleteSlip(slip)"
                    >
                      <span [class]="deletingId() === slip.id ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></span
                      >{{ 'common.delete' | translate }}
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </section>
      }
    }

    <app-dialog
      [title]="previewSlip()?.filename ?? ''"
      [visible]="!!previewSlip()"
      width="min(90vw, 48rem)"
      (visibleChange)="closePreview()"
    >
      @if (previewSlip(); as slip) {
        <img class="preview-image" [src]="slip.url" [alt]="slip.filename" />
      }
    </app-dialog>
  `,
  styles: `
    header h1,
    header p,
    .details h2,
    .details p {
      margin: 0;
    }
    header h1 {
      color: var(--color-text-primary);
      font-size: var(--font-size-heading);
    }
    header p {
      margin-top: 0.35rem;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }
    .filter-card,
    .upload-card,
    .state-card,
    .loading-card {
      margin-top: 1.25rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: 1rem;
      background: var(--color-surface);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }
    .filter-card,
    .upload-card {
      display: grid;
      gap: 0.45rem;
      padding: 1.15rem;
    }
    .filter-card label {
      color: var(--color-text-secondary);
      font-size: 0.78rem;
      font-weight: 700;
    }
    select {
      min-height: 2.75rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0 0.8rem;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font: inherit;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    select:focus {
      border-color: var(--input-focus-border);
      box-shadow: var(--input-focus-ring);
    }
    .loading-card {
      display: grid;
      min-height: 18rem;
      place-items: center;
      color: #2563eb;
    }
    .upload-card input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    .file-button {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      width: fit-content;
      border: 1px solid #ddd6fe;
      border-radius: 0.7rem;
      padding: 0.65rem 0.85rem;
      background: #faf5ff;
      color: #6d28d9;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 650;
      cursor: pointer;
    }
    .upload-card small {
      color: var(--color-text-secondary);
      font-size: 0.72rem;
    }
    .upload-card small.error {
      color: #dc2626;
    }
    .slip-grid {
      margin-top: 1.25rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: 1rem;
    }
    .slip-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: var(--border-width) solid var(--border-color);
      border-top: 4px solid #8b5cf6;
      border-radius: 1rem;
      background: var(--color-surface);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }
    .preview {
      min-height: 14rem;
      display: grid;
      place-items: center;
      overflow: hidden;
      border: 0;
      padding: 0;
      background: var(--color-surface-muted);
      color: var(--color-text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .preview img {
      width: 100%;
      height: 100%;
      max-height: 16rem;
      object-fit: contain;
    }
    .preview-image {
      display: block;
      width: 100%;
      max-height: 75vh;
      object-fit: contain;
    }
    .details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 1.15rem;
    }
    .details h2 {
      max-width: 100%;
      overflow-wrap: anywhere;
      color: var(--color-text-primary);
      font-size: 0.88rem;
    }
    .details p {
      color: var(--color-text-secondary);
      font-size: 0.72rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }
    .delete-button {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 1px solid #fecaca;
      border-radius: 0.7rem;
      padding: 0.65rem 0.85rem;
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
      color: #dc2626;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 650;
      cursor: pointer;
    }
    .delete-button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlipsComponent implements OnInit {
  private readonly maxFileSize = 1024 * 1024;
  private readonly api = inject(SlipApiService);
  private readonly userApi = inject(UserApiService);
  private readonly debtApi = inject(DebtApiService);
  private readonly auth = inject(AuthService);
  private readonly downloads = inject(FileDownloadService);
  private readonly alerts = inject(SweetAlertService);
  readonly fileAccept = IMAGE_FILE_ACCEPT;
  readonly debtors = signal<Debtor[]>([]);
  readonly slips = signal<Slip[]>([]);
  readonly previewSlip = signal<Slip | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal('');
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly uploading = signal(false);
  readonly downloadingId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly canUpload = computed(() => this.auth.currentUser()?.role === 'DEBTOR');
  readonly canSelectDebtor = computed(() => ['ADMIN', 'CREDITOR'].includes(this.auth.currentUser()?.role ?? ''));
  readonly canDelete = computed(() => ['ADMIN', 'CREDITOR'].includes(this.auth.currentUser()?.role ?? ''));
  selectedDebtor = '';

  ngOnInit(): void {
    if (this.canSelectDebtor()) {
      this.userApi.getDebtors().subscribe((rows) => this.debtors.set(rows));
      return;
    }
    this.loadSlips();
  }

  loadSlips(): void {
    if (this.canSelectDebtor() && !this.selectedDebtor) return;
    this.loading.set(true);
    this.loadError.set(false);
    const debtorUsername = this.canUpload() ? this.auth.currentUser()?.username : this.selectedDebtor;
    this.resolveCreditorUsername()
      .pipe(
        switchMap((creditorUsername) => this.api.getAll(debtorUsername, creditorUsername)),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (slips) => this.slips.set(slips),
        error: () => this.loadError.set(true)
      });
  }

  openPreview(slip: Slip): void {
    this.previewSlip.set(slip);
  }

  closePreview(): void {
    this.previewSlip.set(null);
  }

  private resolveCreditorUsername(): Observable<string> {
    const user = this.auth.currentUser();
    if (!user) return of('');
    if (user.role === 'CREDITOR') return of(user.username);
    if (user.role === 'DEBTOR') {
      if (user.creditorUsername) return of(user.creditorUsername);
      return this.debtApi.getAll().pipe(map((rows) => rows[0]?.creditorUsername ?? ''));
    }
    return of('');
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.selectedFile.set(null);
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      this.fileError.set('validation.imageOnly');
      return;
    }
    if (file.size > this.maxFileSize) {
      this.fileError.set('validation.slipMaxSize');
      return;
    }
    this.fileError.set('');
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;
    this.uploading.set(true);
    this.resolveCreditorUsername()
      .pipe(
        switchMap((creditorUsername) => {
          if (!creditorUsername) {
            this.fileError.set('slips.creditorMissing');
            return EMPTY;
          }
          return this.api.upload(creditorUsername, file);
        }),
        finalize(() => this.uploading.set(false))
      )
      .subscribe(() => {
        this.selectedFile.set(null);
        this.alerts.success('toast.slipUploaded');
        this.loadSlips();
      });
  }

  download(slip: Slip): void {
    if (!slip.id || this.downloadingId()) return;
    this.downloadingId.set(slip.id);
    this.api
      .getFile(slip.id)
      .pipe(finalize(() => this.downloadingId.set(null)))
      .subscribe((blob) => this.downloads.save(blob, slip.filename));
  }

  async deleteSlip(slip: Slip): Promise<void> {
    if (!slip.id || this.deletingId()) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'slips.deleteTitle',
      textKey: 'slips.deleteDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deletingId.set(slip.id);
    this.api
      .delete(slip.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe(() => {
        this.slips.update((rows) => rows.filter((row) => row.id !== slip.id));
        this.alerts.success('toast.slipDeleted');
      });
  }

  formatSize(size: number): string {
    return `${(size / 1024).toFixed(1)} KB`;
  }
}
