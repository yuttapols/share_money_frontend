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
  standalone: true,
  imports: [FormsModule, DatePipe, TranslatePipe, AppButtonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
    <header>
      <h1>{{ 'slips.title' | translate }}</h1>
      <p>{{ 'slips.description' | translate }}</p>
    </header>

    @if (canSelectDebtor()) {
      <section class="filter-card">
        <label>{{ 'slips.selectDebtor' | translate }}</label>
        <select maxlength="50" [(ngModel)]="selectedDebtor" (ngModelChange)="loadSlip()">
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
          (retry)="loadSlip()"
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
      <section class="slip-card">
        <div class="preview">
          @if (previewUrl()) {
            <img [src]="previewUrl()" [alt]="'slips.title' | translate" />
          } @else {
            <span class="pi pi-image"></span>
          }
        </div>
        <div class="details">
          @if (slip(); as currentSlip) {
            <span class="status"><i class="pi pi-check-circle"></i>{{ 'slips.submitted' | translate }}</span>
            <h2>{{ currentSlip.filename }}</h2>
            <p>{{ currentSlip.uploadedAt | date: 'd MMM y, HH:mm' }}</p>
            <p>{{ formatSize(currentSlip.sizeBytes) }}</p>
            <div class="actions">
              @if (currentSlip.id) {
                <app-button icon="pi-download" [loading]="downloading()" (pressed)="download()">{{
                  'slips.download' | translate
                }}</app-button>
              }
              @if (canDelete() && currentSlip.id) {
                <button type="button" class="delete-button" [disabled]="deleting()" (click)="deleteSlip()">
                  <span [class]="deleting() ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></span
                  >{{ 'common.delete' | translate }}
                </button>
              }
            </div>
          } @else {
            <h2>{{ 'slips.empty' | translate }}</h2>
            <p>{{ 'slips.emptyDescription' | translate }}</p>
          }

          @if (canUpload()) {
            <input #fileInput type="file" [accept]="fileAccept" (change)="selectFile($event)" />
            <button type="button" class="file-button" (click)="fileInput.click()">
              <span class="pi pi-image"></span>{{ 'slips.chooseImage' | translate }} <b>*</b>
            </button>
            <small>{{ 'slips.fileHint' | translate }}</small>
            @if (fileError()) {
              <small class="error">{{ fileError() | translate }}</small>
            }
            @if (selectedFile()) {
              <app-button icon="pi-upload" [loading]="uploading()" (pressed)="upload()">{{
                'slips.upload' | translate
              }}</app-button>
            }
          }
        </div>
      </section>
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
      color: #1e293b;
      font-size: 1.6rem;
    }
    header p {
      margin-top: 0.35rem;
      color: #64748b;
      font-size: 0.85rem;
    }
    .filter-card,
    .slip-card,
    .state-card,
    .loading-card {
      margin-top: 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }
    .filter-card {
      display: grid;
      gap: 0.45rem;
      padding: 1.15rem;
    }
    .filter-card label {
      color: #475569;
      font-size: 0.78rem;
      font-weight: 700;
    }
    select {
      min-height: 2.75rem;
      border: 1px solid #d9e0e9;
      border-radius: 0.7rem;
      padding: 0 0.8rem;
      background: #fff;
      color: #1e293b;
      font: inherit;
    }
    .loading-card {
      display: grid;
      min-height: 18rem;
      place-items: center;
      color: #2563eb;
    }
    .slip-card {
      display: grid;
      grid-template-columns: minmax(16rem, 0.9fr) minmax(18rem, 1.1fr);
      overflow: hidden;
      border-top: 4px solid #8b5cf6;
    }
    .preview {
      min-height: 26rem;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: #f1f5f9;
      color: #94a3b8;
      font-size: 4rem;
    }
    .preview img {
      width: 100%;
      height: 100%;
      max-height: 34rem;
      object-fit: contain;
    }
    .details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 2rem;
    }
    .details h2 {
      max-width: 100%;
      overflow-wrap: anywhere;
      color: #1e293b;
      font-size: 1rem;
    }
    .details p,
    .details small {
      color: #64748b;
      font-size: 0.75rem;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border-radius: 999px;
      padding: 0.35rem 0.65rem;
      background: #ecfdf5;
      color: #059669;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .details input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    .file-button,
    .delete-button {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
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
    .file-button b,
    .details .error {
      color: #dc2626;
    }
    .actions {
      display: flex;
      gap: 0.65rem;
      margin: 0.4rem 0;
    }
    .delete-button {
      border-color: #fecaca;
      background: #fef2f2;
      color: #dc2626;
    }
    @media (max-width: 720px) {
      .slip-card {
        grid-template-columns: 1fr;
      }
      .preview {
        min-height: 18rem;
      }
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
  readonly slip = signal<Slip | null>(null);
  readonly previewUrl = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal('');
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly uploading = signal(false);
  readonly downloading = signal(false);
  readonly deleting = signal(false);
  readonly canUpload = computed(() => this.auth.currentUser()?.role === 'DEBTOR');
  readonly canSelectDebtor = computed(() => ['ADMIN', 'CREDITOR'].includes(this.auth.currentUser()?.role ?? ''));
  readonly canDelete = computed(() => ['ADMIN', 'CREDITOR'].includes(this.auth.currentUser()?.role ?? ''));
  selectedDebtor = '';

  ngOnInit(): void {
    if (this.canSelectDebtor()) {
      this.userApi.getDebtors().subscribe((rows) => this.debtors.set(rows));
      return;
    }
    this.loadSlip();
  }

  loadSlip(): void {
    if (this.canSelectDebtor() && !this.selectedDebtor) return;
    this.loading.set(true);
    this.loadError.set(false);
    this.clearPreview();
    this.api
      .get(this.canUpload() ? this.auth.currentUser()?.username : this.selectedDebtor)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (slip) => {
          this.slip.set(slip);
          if (slip?.id) this.loadPreview(slip.id);
        },
        error: () => this.loadError.set(true)
      });
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
    this.clearPreview();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  upload(): void {
    const file = this.selectedFile();
    const creditorUsername = this.auth.currentUser()?.creditorUsername || this.slip()?.creditorUsername;
    if (!file || !creditorUsername || this.uploading()) {
      if (!creditorUsername) this.fileError.set('slips.creditorMissing');
      return;
    }
    this.uploading.set(true);
    this.api
      .upload(creditorUsername, file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe((slip) => {
        this.slip.set(slip);
        this.selectedFile.set(null);
        this.alerts.success('toast.slipUploaded');
        if (slip.id) this.loadPreview(slip.id);
      });
  }

  download(): void {
    const slip = this.slip();
    if (!slip?.id || this.downloading()) return;
    this.downloading.set(true);
    this.api
      .getFile(slip.id)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe((blob) => this.downloads.save(blob, slip.filename));
  }

  async deleteSlip(): Promise<void> {
    const slip = this.slip();
    if (!slip?.id || this.deleting()) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'slips.deleteTitle',
      textKey: 'slips.deleteDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deleting.set(true);
    this.api
      .delete(slip.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe(() => {
        this.slip.set(null);
        this.clearPreview();
        this.alerts.success('toast.slipDeleted');
      });
  }

  formatSize(size: number): string {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  private loadPreview(id: number): void {
    this.api.getThumbnail(id).subscribe((blob) => {
      this.clearPreview();
      this.previewUrl.set(URL.createObjectURL(blob));
    });
  }

  private clearPreview(): void {
    if (this.previewUrl()) URL.revokeObjectURL(this.previewUrl());
    this.previewUrl.set('');
  }
}
