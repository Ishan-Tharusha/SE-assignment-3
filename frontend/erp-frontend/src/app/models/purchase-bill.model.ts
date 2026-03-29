export interface PurchaseBillLineInput {
  itemId: number;
  locationId: number;
  cost: number;
  price: number;
  quantity: number;
  discountPercent: number;
}

export interface PurchaseBillLineResponse extends PurchaseBillLineInput {
  id: number;
  itemName: string;
  locationName: string;
  totalCost: number;
  totalSelling: number;
}

export interface PurchaseBillCreateRequest {
  billDate: string;
  clientSyncId?: string | null;
  lines: PurchaseBillLineInput[];
}

export interface PurchaseBillUpdateRequest {
  billDate: string;
  lines: PurchaseBillLineInput[];
}

export interface PurchaseBillSaveResponse {
  id: number;
  billNo: string;
  message: string;
}

export interface PurchaseBillSummary {
  id: number;
  billNo: string;
  billDate: string;
  updatedAt: string;
}

export interface PurchaseBillDetail {
  id: number;
  billNo: string;
  billDate: string;
  clientSyncId: string | null;
  lines: PurchaseBillLineResponse[];
  totalLineCount: number;
  totalQuantity: number;
  totalAmount: number;
}

export interface AuditLogDto {
  id: number;
  entity: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface PendingPurchaseBill {
  key: string;
  clientSyncId: string;
  status: 'Pending' | 'Synced' | 'Syncing';
  createdAt: string;
  payload: PurchaseBillCreateRequest;
}

/** Last successful offline → server sync batches (for demo / UX). */
export interface OfflineSyncHistoryEntry {
  syncedAt: string;
  billCount: number;
}
