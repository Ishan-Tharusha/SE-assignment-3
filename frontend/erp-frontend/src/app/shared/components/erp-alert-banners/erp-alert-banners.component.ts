import { Component, input } from '@angular/core';

@Component({
  selector: 'app-erp-alert-banners',
  template: `
    @if (error()) {
      <div class="banner banner--error" role="alert">{{ error() }}</div>
    }
    @if (success()) {
      <div class="banner banner--ok">{{ success() }}</div>
    }
  `,
  styleUrl: './erp-alert-banners.component.scss',
})
export class ErpAlertBannersComponent {
  readonly error = input<string | null>(null);
  readonly success = input<string | null>(null);
}
