import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

export interface ConfirmDialogOptions {
  titleKey: string;
  textKey?: string;
  icon?: SweetAlertIcon;
  confirmButtonKey: string;
  cancelButtonKey: string;
}

@Injectable({ providedIn: 'root' })
export class SweetAlertService {
  private readonly translate = inject(TranslateService);

  async confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const result = await Swal.fire({
      title: this.translate.instant(options.titleKey),
      text: options.textKey ? this.translate.instant(options.textKey) : undefined,
      icon: options.icon ?? 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant(options.confirmButtonKey),
      cancelButtonText: this.translate.instant(options.cancelButtonKey),
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      reverseButtons: true
    });
    return result.isConfirmed;
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
