import { Component, input } from '@angular/core';

@Component({
  selector: 'app-erp-loading-inline',
  template: `
    @if (show()) {
      <p class="erp-loading-inline" role="status" aria-live="polite">{{ message() }}</p>
    }
  `,
  styleUrl: './erp-loading-inline.component.scss',
})
export class ErpLoadingInlineComponent {
  readonly show = input(false);
  readonly message = input('Loading…');
}
