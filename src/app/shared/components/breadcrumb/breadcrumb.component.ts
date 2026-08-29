import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface BreadcrumbItem {
  labelKey?: string;
  route?: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <nav aria-label="Breadcrumb" class="flex w-full items-center rounded-xl border border-slate-200 bg-white p-1">
      @for (item of items(); track $index; let last = $last) {
        @if (item.route && !last) {
          <a
            [routerLink]="item.route"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-400"
          >
            @if (item.icon) {
              <span class="pi text-sm" [class]="'pi ' + item.icon"></span>
            }
            @if (item.labelKey) {
              <span>{{ item.labelKey | translate }}</span>
            }
          </a>
        } @else {
          <span
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800"
            aria-current="page"
          >
            @if (item.icon) {
              <span class="pi text-sm" [class]="'pi ' + item.icon"></span>
            }
            @if (item.labelKey) {
              <span>{{ item.labelKey | translate }}</span>
            }
          </span>
        }
        @if (!last) {
          <span class="pi pi-angle-right px-0.5 text-xs text-slate-300" aria-hidden="true"></span>
        }
      }
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
