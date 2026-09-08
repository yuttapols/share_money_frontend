import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-dialog',
  imports: [DialogModule],
  template: `<p-dialog
    [header]="title()"
    [visible]="visible()"
    [modal]="true"
    [draggable]="false"
    [resizable]="false"
    [style]="{ width: width() }"
    [breakpoints]="{ '640px': 'calc(100vw - 2rem)' }"
    (visibleChange)="visibleChange.emit($event)"
    ><ng-content
  /></p-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppDialogComponent {
  readonly title = input('');
  readonly visible = input(false);
  readonly width = input('32rem');
  readonly visibleChange = output<boolean>();
}
