import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';

export interface AppTableColumn {
  field: string;
  header: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [TableModule],
  template: `
    <p-table
      [value]="rows()"
      [columns]="columns()"
      [paginator]="paginator()"
      [rows]="pageSize()"
      [rowHover]="true"
      responsiveLayout="scroll"
    >
      <ng-template pTemplate="header" let-columns
        ><tr>
          @for (column of columns; track column.field) {
            <th [pSortableColumn]="column.field">{{ column.header }}<p-sortIcon [field]="column.field" /></th>
          }</tr
      ></ng-template>
      <ng-template pTemplate="body" let-row let-columns="columns"
        ><tr>
          @for (column of columns; track column.field) {
            <td>{{ row[column.field] }}</td>
          }
        </tr></ng-template
      >
      <ng-template pTemplate="emptymessage"
        ><tr>
          <td [attr.colspan]="columns().length">{{ emptyMessage() }}</td>
        </tr></ng-template
      >
    </p-table>
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      border: var(--border-width) solid var(--border-color);
      border-radius: 0.85rem;
    }
    :host ::ng-deep .p-datatable-thead > tr > th {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      font-size: 0.8rem;
    }
    :host ::ng-deep .p-datatable-tbody > tr > td {
      color: var(--color-text-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppTableComponent {
  readonly columns = input.required<AppTableColumn[]>();
  readonly rows = input.required<Record<string, unknown>[]>();
  readonly paginator = input(true);
  readonly pageSize = input(10);
  readonly emptyMessage = input('');
}
