import { HttpContextToken } from '@angular/common/http';

/** Set on a request to prevent the global HTTP error toast (e.g. handled in component). */
export const SKIP_HTTP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
