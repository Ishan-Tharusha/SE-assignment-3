import { ErpTabItem } from '../../shared/components/erp-tab-strip/erp-tab-strip.component';

export type PurchaseBillTabId = 'header' | 'details' | 'summary';

export const PURCHASE_BILL_TABS: readonly ErpTabItem[] = [
  { id: 'header', label: 'Header' },
  { id: 'details', label: 'Details' },
  { id: 'summary', label: 'Summary' },
] as const;
