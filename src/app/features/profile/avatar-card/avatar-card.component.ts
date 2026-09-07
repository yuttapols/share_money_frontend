import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileApiService } from '../../../core/services/profile-api.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { IMAGE_FILE_ACCEPT, isAllowedImageFile } from '../../../shared/utils/image-file.util';

@Component({
  selector: 'app-avatar-card',
  standalone: true,
  imports: [TranslatePipe, AppButtonComponent],
  template: `
    <section class="avatar-card">
      <header>
        <h2>{{ 'profile.avatarTitle' | translate }}</h2>
        <p>{{ 'profile.avatarDescription' | translate }}</p>
      </header>
      <div class="avatar-content">
        <div class="avatar-preview">
          @if (displayUrl()) {
            <img [src]="displayUrl()" [alt]="'profile.avatarTitle' | translate" />
          } @else {
            <span>{{ initials() }}</span>
          }
        </div>
        <div class="avatar-actions">
          <input #fileInput type="file" [accept]="imageFileAccept" (change)="selectFile($event)" />
          <button type="button" class="select-button" (click)="fileInput.click()">
            <span class="pi pi-image"></span>{{ 'profile.chooseImage' | translate }}
            <b class="required-mark">*</b>
          </button>
          <small>{{ 'profile.avatarHint' | translate }}</small>
          @if (errorKey()) {
            <small class="file-error" role="alert">{{ errorKey() | translate }}</small>
          }
        </div>
      </div>
      @if (selectedFile()) {
        <footer>
          <app-button [loading]="uploading()" (pressed)="upload()">{{ 'profile.uploadImage' | translate }}</app-button
          ><button type="button" class="cancel-button" (click)="clearSelection()">
            {{ 'common.cancel' | translate }}
          </button>
        </footer>
      } @else if (avatarUrl()) {
        <footer>
          <button type="button" class="remove-button" [disabled]="deleting()" (click)="deleteAvatar()">
            <span [class]="deleting() ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></span>
            {{ 'profile.deleteImage' | translate }}
          </button>
        </footer>
      }
    </section>
  `,
  styles: `
    .avatar-card {
      border: 1px solid #e8edf3;
      border-top: 4px solid #8b5cf6;
      border-radius: 1rem;
      background: #fff;
      overflow: hidden;
    }
    .avatar-card > header {
      padding: 1.2rem 1.35rem;
      border-bottom: 1px solid #eef2f6;
    }
    .avatar-card h2 {
      margin: 0;
      color: #1e293b;
      font-size: 1rem;
    }
    .avatar-card header p {
      margin: 0.3rem 0 0;
      color: #64748b;
      font-size: 0.78rem;
    }
    .avatar-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.35rem;
    }
    .avatar-preview {
      width: 4.5rem;
      height: 4.5rem;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: 50%;
      background: #ede9fe;
      color: #6d28d9;
      font-size: 1.1rem;
      font-weight: 800;
    }
    .avatar-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-actions {
      display: grid;
      justify-items: start;
      gap: 0.4rem;
    }
    .avatar-actions input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    .select-button,
    .cancel-button {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      border: 1px solid #d9e0e9;
      border-radius: 0.65rem;
      padding: 0.55rem 0.75rem;
      background: #fff;
      color: #334155;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 650;
      cursor: pointer;
    }
    .remove-button {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 0;
      border-radius: 0.6rem;
      padding: 0.55rem 0.75rem;
      background: #fef2f2;
      color: #dc2626;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 650;
      cursor: pointer;
    }
    .select-button:hover:not(:disabled) {
      border-color: #7c3aed;
      color: #6d28d9;
      background: #faf5ff;
    }
    .select-button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .avatar-actions small {
      color: #64748b;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .avatar-actions .file-error {
      color: #dc2626;
    }
    .select-button .required-mark {
      color: #dc2626;
    }
    .avatar-card footer {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0 1.35rem 1.35rem;
    }
    .cancel-button {
      border: 0;
      background: transparent;
    }
    @media (max-width: 420px) {
      .avatar-content {
        align-items: flex-start;
      }
      .avatar-preview {
        width: 3.75rem;
        height: 3.75rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarCardComponent implements OnInit, OnDestroy {
  private readonly maxFileSize = 2 * 1024 * 1024;
  readonly imageFileAccept = IMAGE_FILE_ACCEPT;
  private readonly auth = inject(AuthService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly toast = inject(SweetAlertService);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal('');
  readonly avatarUrl = signal('');
  readonly errorKey = signal('');
  readonly uploading = signal(false);
  readonly deleting = signal(false);
  readonly displayUrl = computed(() => this.previewUrl() || this.avatarUrl());
  readonly initials = computed(() => this.auth.currentUser()?.name.slice(0, 2).toUpperCase() ?? 'SM');

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      this.errorKey.set('validation.imageOnly');
      return;
    }
    if (file.size > this.maxFileSize) {
      this.errorKey.set('validation.imageMaxSize');
      return;
    }
    this.clearPreview();
    this.errorKey.set('');
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;
    this.uploading.set(true);
    this.profileApi
      .uploadAvatar(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe((response) => {
        this.avatarUrl.set(response.avatarUrl);
        this.toast.success('toast.avatarUpdated');
        this.clearSelection();
      });
  }

  deleteAvatar(): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.profileApi
      .deleteAvatar()
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe(() => {
        this.avatarUrl.set('');
        this.toast.success('toast.avatarDeleted');
      });
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.errorKey.set('');
    this.clearPreview();
  }

  ngOnInit(): void {
    this.profileApi.getMine().subscribe((profile) => this.avatarUrl.set(profile.avatarUrl ?? ''));
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  private clearPreview(): void {
    if (this.previewUrl()) URL.revokeObjectURL(this.previewUrl());
    this.previewUrl.set('');
  }
}
