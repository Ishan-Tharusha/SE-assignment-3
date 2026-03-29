import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PendingPurchaseBill, PurchaseBillCreateRequest } from '../../../models/purchase-bill.model';
import { PurchaseBillApiService } from './purchase-bill-api.service';

const DB_NAME = 'erp-purchase-offline';
const STORE = 'pendingBills';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class PurchaseOfflineStorageService {
  private readonly api = inject(PurchaseBillApiService);

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
    });
  }

  async listPending(): Promise<PendingPurchaseBill[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const r = store.getAll();
      r.onerror = () => reject(r.error);
      r.onsuccess = () => resolve((r.result as PendingPurchaseBill[]) ?? []);
    });
  }

  async savePending(payload: PurchaseBillCreateRequest): Promise<string> {
    const clientSyncId = payload.clientSyncId?.trim() || crypto.randomUUID();
    const db = await this.openDb();
    const record: PendingPurchaseBill = {
      key: crypto.randomUUID(),
      clientSyncId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      payload: { ...payload, clientSyncId },
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve(record.key);
      tx.onerror = () => reject(tx.error);
    });
  }

  async deletePending(key: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async updateStatus(key: string, status: PendingPurchaseBill['status']): Promise<void> {
    const db = await this.openDb();
    const list = await this.listPending();
    const rec = list.find((x) => x.key === key);
    if (!rec) return;
    rec.status = status;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** On success, removes row from IndexedDB (treat as Synced). */
  async syncPending(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) return { synced: 0, failed: 0 };
    const pending = (await this.listPending()).filter((p) => p.status === 'Pending');
    let synced = 0;
    let failed = 0;
    for (const p of pending) {
      try {
        await this.updateStatus(p.key, 'Syncing');
        const body: PurchaseBillCreateRequest = {
          ...p.payload,
          clientSyncId: p.clientSyncId,
        };
        await firstValueFrom(this.api.createBill(body));
        await this.deletePending(p.key);
        synced++;
      } catch {
        await this.updateStatus(p.key, 'Pending');
        failed++;
      }
    }
    return { synced, failed };
  }
}
