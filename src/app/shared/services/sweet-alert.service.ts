import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

export interface ConfirmDialogOptions {
  titleKey: string;
  titleParams?: Record<string, unknown>;
  textKey?: string;
  textParams?: Record<string, unknown>;
  icon?: SweetAlertIcon;
  emoji?: string;
  imageUrl?: string;
  confirmButtonKey: string;
  cancelButtonKey: string;
}

export interface ConfirmWithChoiceOptions extends ConfirmDialogOptions {
  rememberLabelKey: string;
}

export interface ConfirmWithChoiceResult {
  accepted: boolean;
  remember: boolean;
}

const CONFIRM_CLASSES = {
  popup: 'app-confirm-popup',
  icon: 'app-confirm-popup__icon',
  title: 'app-confirm-popup__title',
  htmlContainer: 'app-confirm-popup__text',
  actions: 'app-confirm-popup__actions',
  confirmButton: 'app-confirm-popup__btn app-confirm-popup__btn--confirm',
  cancelButton: 'app-confirm-popup__btn app-confirm-popup__btn--cancel',
  closeButton: 'app-confirm-popup__close',
  input: 'app-confirm-popup__checkbox'
};

@Injectable({ providedIn: 'root' })
export class SweetAlertService {
  private readonly translate = inject(TranslateService);

  async confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const result = await Swal.fire(this.buildConfirmConfig(options));
    return result.isConfirmed;
  }

  async confirmWithChoice(options: ConfirmWithChoiceOptions): Promise<ConfirmWithChoiceResult> {
    const result = await Swal.fire({
      ...this.buildConfirmConfig(options),
      input: 'checkbox',
      inputValue: 0,
      inputPlaceholder: this.translate.instant(options.rememberLabelKey)
    });
    return { accepted: result.isConfirmed, remember: result.isConfirmed && Boolean(result.value) };
  }

  success(messageKey: string): void {
    this.toast('success', this.translate.instant(messageKey));
  }

  info(messageKey: string): void {
    this.toast('info', this.translate.instant(messageKey));
  }

  warning(messageKey: string): void {
    this.toast('warning', this.translate.instant(messageKey));
  }

  error(messageKey: string): void {
    this.toast('error', this.translate.instant(messageKey));
  }

  errorMessage(message: string): void {
    this.toast('error', message);
  }

  private buildConfirmConfig(options: ConfirmDialogOptions) {
    return {
      title: this.translate.instant(options.titleKey, options.titleParams),
      text: options.textKey ? this.translate.instant(options.textKey, options.textParams) : undefined,
      imageUrl: options.imageUrl,
      imageHeight: options.imageUrl ? 140 : undefined,
      iconHtml: !options.imageUrl && options.emoji ? options.emoji : undefined,
      icon: options.imageUrl ? undefined : (options.icon ?? (options.emoji ? 'question' : undefined)),
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant(options.confirmButtonKey),
      cancelButtonText: this.translate.instant(options.cancelButtonKey),
      buttonsStyling: false,
      reverseButtons: true,
      customClass: CONFIRM_CLASSES
    };
  }

  private toast(icon: SweetAlertIcon, title: string): void {
    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      showCloseButton: true,
      timer: 4000,
      timerProgressBar: true
    });
  }
}
