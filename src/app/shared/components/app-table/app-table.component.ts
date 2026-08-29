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
      border: 1px solid #e8edf3;
      border-radius: 0.85rem;
    }
    :host ::ng-deep .p-datatable-thead > tr > th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
    }
    :host ::ng-deep .p-datatable-tbody > tr > td {
      color: #334155;
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
