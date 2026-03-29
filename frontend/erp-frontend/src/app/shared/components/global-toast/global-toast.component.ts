import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ApiNotificationService } from '../../../core/services/api-notification.service';

@Component({
  selector: 'app-global-toast',
  imports: [NgClass],
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (t of notifications.toasts(); track t.id) {
        <div
          class="toast"
          [ngClass]="{
            'toast--error': t.kind === 'error',
            'toast--success': t.kind === 'success',
            'toast--info': t.kind === 'info',
          }"
          role="status"
        >
          <div class="toast__head">
            <span class="toast__label">
              {{ t.kind === 'success' ? 'Synced' : t.kind === 'error' ? 'Error' : 'Info' }}
            </span>
            <button type="button" class="toast__close" (click)="notifications.dismiss(t.id)" aria-label="Dismiss">
              ×
            </button>
          </div>
          <p class="toast__msg">{{ t.message }}</p>
        </div>
      }
    </div>
  `,
  styleUrl: './global-toast.component.scss',
})
export class GlobalToastComponent {
  readonly notifications = inject(ApiNotificationService);
}
