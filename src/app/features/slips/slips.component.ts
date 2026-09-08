import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { Slip } from '../../core/models/phase-three.model';
import { Debtor } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { SlipApiService } from '../../core/services/slip-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FileDownloadService } from '../../shared/services/file-download.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { IMAGE_FILE_ACCEPT, isAllowedImageFile } from '../../shared/utils/image-file.util';

@Component({
  selector: 'app-slips',
  imports: [FormsModule, DatePipe, TranslatePipe, AppButtonComponent, EmptyStateComponent, ErrorStateComponent],
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

      @if (slipViews().length === 0) {
        <section class="state-card">
          <app-empty-state
            icon="pi-image"
            [title]="'slips.empty' | translate"
            [message]="'slips.emptyDescription' | translate"
          />
        </section>
      } @else {
        <section class="slip-grid">
          @for (item of slipViews(); track item.slip.id) {
            <article class="slip-card">
              <div class="preview">
                @if (item.previewUrl) {
                  <img [src]="item.previewUrl" [alt]="'slips.title' | translate" />
                } @else {
                  <span class="pi pi-spin pi-spinner"></span>
                }
              </div>
              <div class="details">
                <h2>{{ item.slip.filename }}</h2>
                <p>{{ item.slip.uploadedAt | date: 'd MMM y, HH:mm' }}</p>
                <p>{{ formatSize(item.slip.sizeBytes) }}</p>
                <div class="actions">
                  <app-button
                    icon="pi-download"
                    [loading]="downloadingId() === item.slip.id"
                    (pressed)="download(item.slip)"
                    >{{ 'slips.download' | translate }}</app-button
                  >
                  @if (canDelete()) {
                    <button
                      type="button"
                      class="delete-button"
                      [disabled]="deletingId() === item.slip.id"
                      (click)="deleteSlip(item.slip)"
                    >
                      <span [class]="deletingId() === item.slip.id ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></span
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
      background: var(--color-surface-muted);
      color: var(--color-text-muted);
      font-size: 1.5rem;
    }
    .preview img {
      width: 100%;
      height: 100%;
      max-height: 16rem;
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
export class SlipsComponent implements OnInit, OnDestroy {
  private readonly maxFileSize = 1024 * 1024;
  private readonly api = inject(SlipApiService);
  private readonly userApi = inject(UserApiService);
  private readonly auth = inject(AuthService);
  private readonly downloads = inject(FileDownloadService);
  private readonly alerts = inject(SweetAlertService);
  readonly fileAccept = IMAGE_FILE_ACCEPT;
  readonly debtors = signal<Debtor[]>([]);
  readonly slips = signal<Slip[]>([]);
  readonly previewUrls = signal<Record<number, string>>({});
  readonly slipViews = computed(() =>
    this.slips().map((slip) => ({ slip, previewUrl: slip.id ? (this.previewUrls()[slip.id] ?? '') : '' }))
  );
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
    this.clearPreviews();
    const debtorUsername = this.canUpload() ? this.auth.currentUser()?.username : this.selectedDebtor;
    const creditorUsername = this.resolveCreditorUsername();
    this.api
      .getAll(debtorUsername, creditorUsername)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (slips) => {
          this.slips.set(slips);
          for (const slip of slips) if (slip.id) this.loadPreview(slip.id);
        },
        error: () => this.loadError.set(true)
      });
  }

  private resolveCreditorUsername(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    if (user.role === 'CREDITOR') return user.username;
    if (user.role === 'DEBTOR') return user.creditorUsername ?? '';
    return '';
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
    const creditorUsername = this.auth.currentUser()?.creditorUsername;
    if (!file || !creditorUsername || this.uploading()) {
      if (!creditorUsername) this.fileError.set('slips.creditorMissing');
      return;
    }
    this.uploading.set(true);
    this.api
      .upload(creditorUsername, file)
      .pipe(finalize(() => this.uploading.set(false)))
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

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  private loadPreview(id: number): void {
    this.api.getThumbnail(id).subscribe((blob) => {
      this.previewUrls.update((urls) => ({ ...urls, [id]: URL.createObjectURL(blob) }));
    });
  }

  private clearPreviews(): void {
    for (const url of Object.values(this.previewUrls())) URL.revokeObjectURL(url);
    this.previewUrls.set({});
  }
}
