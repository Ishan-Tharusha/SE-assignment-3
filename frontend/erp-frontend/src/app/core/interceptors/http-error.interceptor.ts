import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SKIP_HTTP_ERROR_TOAST } from '../http/skip-http-error-toast.context';
import { ApiNotificationService } from '../services/api-notification.service';

function extractApiMessage(err: HttpErrorResponse): string {
  const body = err.error;

  if (typeof body === 'string' && body.trim()) {
    return body.length > 240 ? `${body.slice(0, 240)}…` : body;
  }

  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o['detail'] === 'string') return o['detail'] as string;
    if (typeof o['title'] === 'string' && typeof o['detail'] === 'string')
      return `${o['title']}: ${o['detail']}`;
    if (typeof o['title'] === 'string') return o['title'] as string;
    if (typeof o['message'] === 'string') return o['message'] as string;

    const errors = o['errors'];
    if (errors && typeof errors === 'object') {
      const parts: string[] = [];
      for (const [key, val] of Object.entries(errors as Record<string, unknown>)) {
        if (Array.isArray(val)) parts.push(`${key}: ${val.join(', ')}`);
        else if (typeof val === 'string') parts.push(`${key}: ${val}`);
      }
      if (parts.length) return parts.join(' · ');
    }
  }

  if (err.status === 404) return 'Resource was not found (404).';
  if (err.status === 401) return 'Unauthorized (401).';
  if (err.status === 403) return 'Forbidden (403).';
  if (err.status >= 500) return `Server error (${err.status}). Try again later.`;

  return err.message || `Request failed (${err.status}).`;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(ApiNotificationService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (req.context.get(SKIP_HTTP_ERROR_TOAST)) {
        return throwError(() => err);
      }

      // Status 0: browser offline / CORS / unreachable — handled in features (e.g. offline queue).
      if (err.status === 0) {
        return throwError(() => err);
      }

      notifications.showError(extractApiMessage(err));
      return throwError(() => err);
    }),
  );
};
