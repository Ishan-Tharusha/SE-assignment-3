import { Component, input, output } from '@angular/core';

export interface ErpTabItem {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'app-erp-tab-strip',
  template: `
    <div class="tabs" role="tablist">
      @for (t of tabs(); track t.id) {
        <button
          type="button"
          class="tabs__btn"
          role="tab"
          [attr.aria-selected]="activeId() === t.id"
          [class.tabs__btn--active]="activeId() === t.id"
          (click)="tabSelected.emit(t.id)"
        >
          {{ t.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './erp-tab-strip.component.scss',
})
export class ErpTabStripComponent {
  readonly tabs = input.required<readonly ErpTabItem[]>();
  readonly activeId = input.required<string>();
  readonly tabSelected = output<string>();
}
