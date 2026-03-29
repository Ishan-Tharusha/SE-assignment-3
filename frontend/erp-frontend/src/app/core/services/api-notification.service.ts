import { Injectable, signal } from '@angular/core';

export type ToastKind = 'error' | 'success' | 'info';

export interface ToastItem {
  readonly id: string;
  readonly kind: ToastKind;
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiNotificationService {
  private readonly _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();

  showError(message: string, durationMs = 8000): void {
    this.pushToast('error', message, durationMs);
  }

  showSuccess(message: string, durationMs = 6000): void {
    this.pushToast('success', message, durationMs);
  }

  showInfo(message: string, durationMs = 5000): void {
    this.pushToast('info', message, durationMs);
  }

  dismiss(id: string): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private pushToast(kind: ToastKind, message: string, durationMs: number): void {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = { id, kind, message };
    this._toasts.update((list) => [...list, item]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
