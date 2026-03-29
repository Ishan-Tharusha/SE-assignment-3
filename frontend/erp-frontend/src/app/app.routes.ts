import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'purchase' },
  {
    path: 'purchase',
    loadChildren: () => import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./modules/audit/audit-logs-page.component').then((c) => c.AuditLogsPageComponent),
  },
  { path: '**', redirectTo: 'purchase' },
];
