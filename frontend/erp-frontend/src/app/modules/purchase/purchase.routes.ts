import { Routes } from '@angular/router';

export const PURCHASE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./purchase-bill/purchase-bill.component').then((m) => m.PurchaseBillComponent),
  },
];
