import { Component, HostListener, input, output } from '@angular/core';

let confirmTitleSeq = 0;

@Component({
  selector: 'app-erp-confirm-dialog',
  template: `
    <div class="erp-confirm__backdrop" (click)="onBackdrop()" role="presentation">
      <div
        class="erp-confirm__panel"
        (click)="$event.stopPropagation()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <h2 class="erp-confirm__title" [id]="titleId">{{ title() }}</h2>
        <p class="erp-confirm__msg">{{ message() }}</p>
        <div class="erp-confirm__actions">
          <button type="button" class="btn" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button type="button" class="btn btn--primary" (click)="confirm.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './erp-confirm-dialog.component.scss',
})
export class ErpConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly closeOnBackdrop = input<boolean>(true);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  readonly titleId = `erp-confirm-title-${++confirmTitleSeq}`;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }

  onBackdrop(): void {
    if (this.closeOnBackdrop()) {
      this.cancel.emit();
    }
  }
}
