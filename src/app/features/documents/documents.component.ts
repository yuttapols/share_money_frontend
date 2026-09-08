import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DocumentItem } from '../../core/models/phase-three.model';
import { Debtor } from '../../core/models/user.model';
import { DocumentApiService } from '../../core/services/document-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FileDownloadService } from '../../shared/services/file-download.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { DOCUMENT_FILE_ACCEPT, isAllowedDocumentFile, MAX_DOCUMENT_SIZE } from '../../shared/utils/document-file.util';
import { resolveValidationError } from '../../shared/utils/validators.util';

@Component({
  selector: 'app-documents',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="m-0 text-base font-bold text-slate-800 dark:text-slate-100">{{ 'documents.title' | translate }}</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500 dark:text-slate-400">{{ 'documents.description' | translate }}</p>
      </div>
      <app-button icon="pi-upload" (pressed)="openUpload()">{{ 'documents.upload' | translate }}</app-button>
    </header>

    <div class="mt-5 flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1 sm:max-w-sm">
        <span class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></span>
        <input
          type="search"
          maxlength="50"
          class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800"
          [placeholder]="'documents.search' | translate"
          (input)="setSearch($event)"
        />
      </div>
    </div>

    @if (loading()) {
      <section class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (row of [1, 2, 3, 4, 5, 6]; track row) {
          <div class="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
        }
      </section>
    } @else if (loadError()) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-error-state
          [title]="'errors.unexpected' | translate"
          [retryLabel]="'common.retry' | translate"
          (retry)="load()"
        />
      </div>
    } @else if (filteredDocuments().length === 0) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-empty-state
          icon="pi-file"
          [title]="(search() ? 'documents.notFound' : 'documents.empty') | translate"
          [message]="(search() ? 'documents.notFoundDescription' : 'documents.emptyDescription') | translate"
          [actionLabel]="search() ? '' : ('documents.upload' | translate)"
          (action)="openUpload()"
        />
      </div>
    } @else {
      <section class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (document of filteredDocuments(); track document.id) {
          <article
            class="rounded-2xl border border-slate-200 border-t-blue-400 bg-white p-5 shadow-sm [border-top-width:4px] dark:border-slate-700 dark:bg-slate-800"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl text-blue-600">
                <span class="pi pi-file-pdf"></span>
              </span>
              <span
                class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {{ (document.scope === 'TEMPLATE' ? 'documents.template' : 'documents.debtorDocument') | translate }}
              </span>
            </div>
            <h2 class="mb-0 mt-4 line-clamp-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              {{ document.title }}
            </h2>
            <p class="mb-0 mt-1 h-5 text-xs text-slate-500 dark:text-slate-400">
              {{ document.debtorUsername || ('documents.allDebtors' | translate) }}
            </p>
            <div class="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
              <button
                type="button"
                class="document-action download"
                [disabled]="downloadingId() === document.id"
                (click)="download(document)"
              >
                <span [class]="downloadingId() === document.id ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></span>
                {{ 'documents.download' | translate }}
              </button>
              <button
                type="button"
                class="document-action delete"
                [disabled]="deletingId() === document.id"
                (click)="deleteDocument(document)"
              >
                <span [class]="deletingId() === document.id ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></span>
              </button>
            </div>
          </article>
        }
      </section>
    }

    <app-dialog [title]="'documents.upload' | translate" [visible]="dialogOpen()" (visibleChange)="closeDialog($event)">
      <form class="grid gap-4 pt-2" [formGroup]="form" (ngSubmit)="upload()">
        <div class="field">
          <label>{{ 'documents.documentTitle' | translate }} <b>*</b></label>
          <input type="text" formControlName="title" maxlength="255" [class.invalid]="showTitleError()" />
          @if (showTitleError()) {
            <small>{{ titleError()?.key | translate: titleError()?.params }}</small>
          }
        </div>
        <div class="field">
          <label>{{ 'documents.debtor' | translate }}</label>
          <select formControlName="debtorUsername">
            <option value="">{{ 'documents.allDebtors' | translate }}</option>
            @for (debtor of debtors(); track debtor.id) {
              <option [value]="debtor.username">{{ debtor.name }} ({{ debtor.username }})</option>
            }
          </select>
        </div>
        <div class="field">
          <label>{{ 'documents.file' | translate }} <b>*</b></label>
          <input #fileInput type="file" class="sr-only" [accept]="fileAccept" (change)="selectFile($event)" />
          <button type="button" class="file-picker" (click)="fileInput.click()">
            <span class="pi pi-paperclip"></span>{{ selectedFile()?.name || ('documents.chooseFile' | translate) }}
          </button>
          <span>{{ 'documents.fileHint' | translate }}</span>
          @if (fileError()) {
            <small>{{ fileError() | translate }}</small>
          }
        </div>
        <div class="mt-2 flex justify-end gap-2">
          <app-button variant="secondary" (pressed)="closeDialog(false)">{{ 'common.cancel' | translate }}</app-button>
          <app-button type="submit" [loading]="uploading()" [disabled]="form.invalid || !selectedFile()">{{
            'documents.upload' | translate
          }}</app-button>
        </div>
      </form>
    </app-dialog>
  `,
  styles: `
    .document-action {
      min-height: 2.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      border: 0;
      border-radius: 0.6rem;
      padding: 0 0.7rem;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 650;
      cursor: pointer;
    }
    .document-action.download {
      flex: 1;
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
      color: #2563eb;
    }
    .document-action.delete {
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
      color: #dc2626;
    }
    .document-action:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .field {
      display: grid;
      gap: 0.4rem;
    }
    .field label {
      color: var(--color-text-primary);
      font-size: 0.82rem;
      font-weight: 650;
    }
    .field b,
    .field small {
      color: #dc2626;
    }
    .field span {
      color: var(--color-text-secondary);
      font-size: 0.72rem;
    }
    .field input,
    .field select,
    .file-picker {
      min-height: 2.75rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0 0.8rem;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font: inherit;
      outline: 0;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    .file-picker {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .field input:focus,
    .field select:focus,
    .file-picker:focus {
      border-color: var(--input-focus-border);
      box-shadow: var(--input-focus-ring);
    }
    .field input.invalid {
      border-color: #dc2626;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly documentApi = inject(DocumentApiService);
  private readonly userApi = inject(UserApiService);
  private readonly downloads = inject(FileDownloadService);
  private readonly alerts = inject(SweetAlertService);
  private readonly translate = inject(TranslateService);
  readonly fileAccept = DOCUMENT_FILE_ACCEPT;
  readonly documents = signal<DocumentItem[]>([]);
  readonly debtors = signal<Debtor[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly search = signal('');
  readonly dialogOpen = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal('');
  readonly uploading = signal(false);
  readonly downloadingId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    debtorUsername: ['']
  });
  readonly filteredDocuments = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return this.documents().filter(
      (item) =>
        !term || item.title.toLocaleLowerCase().includes(term) || item.debtorUsername?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.load();
    this.userApi.getDebtors().subscribe({ next: (rows) => this.debtors.set(rows), error: () => this.debtors.set([]) });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.documentApi
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (rows) => this.documents.set(rows), error: () => this.loadError.set(true) });
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value.slice(0, 50));
  }

  openUpload(): void {
    this.form.reset();
    this.selectedFile.set(null);
    this.fileError.set('');
    this.dialogOpen.set(true);
  }

  closeDialog(visible: boolean): void {
    if (this.uploading()) return;
    this.dialogOpen.set(visible);
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.selectedFile.set(null);
    if (!file) return;
    if (!isAllowedDocumentFile(file)) {
      this.fileError.set('validation.documentType');
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      this.fileError.set('validation.documentMaxSize');
      return;
    }
    this.fileError.set('');
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (this.form.invalid || !file || this.uploading()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.uploading.set(true);
    this.documentApi
      .upload(value.title.trim(), file, value.debtorUsername)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe(() => {
        this.alerts.success('toast.documentUploaded');
        this.dialogOpen.set(false);
        this.load();
      });
  }

  download(document: DocumentItem): void {
    if (this.downloadingId() !== null) return;
    this.downloadingId.set(document.id);
    this.documentApi
      .download(document.id)
      .pipe(finalize(() => this.downloadingId.set(null)))
      .subscribe((blob) => this.downloads.save(blob, document.title));
  }

  async deleteDocument(document: DocumentItem): Promise<void> {
    if (this.deletingId() !== null) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'documents.deleteTitle',
      textKey: 'documents.deleteDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deletingId.set(document.id);
    this.documentApi
      .delete(document.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe(() => {
        this.alerts.success('toast.documentDeleted');
        this.load();
      });
  }

  showTitleError(): boolean {
    const control = this.form.controls.title;
    return control.invalid && (control.dirty || control.touched);
  }

  titleError() {
    return resolveValidationError(this.form.controls.title.errors);
  }
}
