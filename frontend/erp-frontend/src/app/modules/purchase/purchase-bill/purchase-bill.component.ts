import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, take } from 'rxjs';
import { ApiNotificationService } from '../../../core/services/api-notification.service';
import { ErpAlertBannersComponent } from '../../../shared/components/erp-alert-banners/erp-alert-banners.component';
import { ErpConfirmDialogComponent } from '../../../shared/components/erp-confirm-dialog/erp-confirm-dialog.component';
import { ErpLoadingInlineComponent } from '../../../shared/components/erp-loading-inline/erp-loading-inline.component';
import { ErpTabStripComponent } from '../../../shared/components/erp-tab-strip/erp-tab-strip.component';
import { ItemDto } from '../../../models/item.model';
import { LocationDto } from '../../../models/location.model';
import {
  OfflineSyncHistoryEntry,
  PendingPurchaseBill,
  PurchaseBillUpdateRequest,
} from '../../../models/purchase-bill.model';
import { MasterDataService } from '../../../services/master-data.service';
import { PURCHASE_BILL_TABS, type PurchaseBillTabId } from '../purchase-tabs';
import { PurchaseBillApiService } from '../services/purchase-bill-api.service';
import { PurchaseOfflineStorageService } from '../services/purchase-offline-storage.service';
import { filterItemsForAutocomplete } from '../utils/item-autocomplete-filter';
import {
  type LineLike,
  lineTotalCost as calcLineTotalCost,
  lineTotalSelling as calcLineTotalSelling,
  summarizeLines,
} from '../utils/purchase-bill-calculator';

@Component({
  selector: 'app-purchase-bill',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    DatePipe,
    ErpAlertBannersComponent,
    ErpTabStripComponent,
    ErpLoadingInlineComponent,
    ErpConfirmDialogComponent,
  ],
  templateUrl: './purchase-bill.component.html',
  styleUrl: './purchase-bill.component.scss',
})
export class PurchaseBillComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly master = inject(MasterDataService);
  private readonly api = inject(PurchaseBillApiService);
  private readonly offline = inject(PurchaseOfflineStorageService);
  private readonly notify = inject(ApiNotificationService);

  /** Full catalog from API — used to resolve typed names on save and offline fallback. */
  readonly itemCatalog = signal<ItemDto[]>([]);
  /** Server-driven autocomplete list for the open row. */
  readonly itemSuggestions = signal<ItemDto[]>([]);
  /** Same signal as `itemSuggestions` — use if any template still calls `filteredItems()`. */
  readonly filteredItems = this.itemSuggestions;
  /** Viewport-fixed panel position so the list is not clipped by the scrollable table. */
  readonly itemDropdownLayout = signal<{ top: number; left: number; width: number; maxHeight: number } | null>(
    null,
  );
  readonly locations = signal<LocationDto[]>([]);
  readonly bills = signal<{ id: number; billNo: string }[]>([]);
  readonly pending = signal<PendingPurchaseBill[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly online = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly activeTab = signal<PurchaseBillTabId>('details');
  readonly tabDefs = PURCHASE_BILL_TABS;
  readonly editingId = signal<number | null>(null);
  readonly editingBillNo = signal<string | null>(null);
  readonly autocompleteRow = signal<number | null>(null);
  /** Keyboard highlight index within `itemSuggestions()` for the open row. */
  readonly autocompleteHighlight = signal(0);
  /** Recent successful syncs after the offline queue drained (demo: Pending → Synced). */
  readonly syncHistory = signal<OfflineSyncHistoryEntry[]>([]);
  private readonly summaryRev = signal(0);

  readonly form = this.fb.group({
    billDate: [this.todayIso(), Validators.required],
    lines: this.fb.array<FormGroup>([]),
  });

  readonly summary = computed(() => {
    this.summaryRev();
    const raw = this.form.getRawValue();
    const lines = (raw.lines ?? []) as LineLike[];
    return summarizeLines(lines);
  });

  private readonly itemSuggest$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  private activeItemInput: HTMLInputElement | null = null;
  /** Set when user submits an update; confirmed via {@link ErpConfirmDialogComponent}. */
  private pendingUpdatePayload: PurchaseBillUpdateRequest | null = null;
  readonly showUpdateConfirm = signal(false);

  constructor() {
    this.form.valueChanges.subscribe(() => this.summaryRev.update((n) => n + 1));

    this.itemSuggest$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.runItemSearchRequest(q)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => this.itemSuggestions.set(list));
  }

  get lines(): FormArray<FormGroup> {
    return this.form.get('lines') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      this.addLine();
      return;
    }
    this.online.set(navigator.onLine);
    window.addEventListener('online', () => {
      this.online.set(true);
      void this.runSync();
    });
    window.addEventListener('offline', () => this.online.set(false));

    this.loadMaster();
    this.loadBillList();
    void this.refreshPending();
    this.addLine();

    if (typeof document !== 'undefined') {
      const relayout = () => {
        if (this.autocompleteRow() !== null && this.activeItemInput) {
          this.syncItemDropdownLayout();
        }
      };
      document.addEventListener('scroll', relayout, true);
      window.addEventListener('resize', relayout);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('scroll', relayout, true);
        window.removeEventListener('resize', relayout);
      });
    }
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadMaster(): void {
    this.loading.set(true);
    this.master.getItems().subscribe({
      next: (data) => this.itemCatalog.set(data),
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.error.set('Cannot reach the API — check that the backend is running.');
        }
      },
    });
    this.master.getLocations().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.error.set('Cannot reach the API — check that the backend is running.');
        }
      },
    });
  }

  updateConfirmMessage(): string {
    const no = this.editingBillNo();
    const label = no ? `bill ${no}` : 'this bill';
    return `Are you sure you want to update ${label}? Your changes will be saved on the server.`;
  }

  cancelUpdateConfirm(): void {
    this.showUpdateConfirm.set(false);
    this.pendingUpdatePayload = null;
  }

  executePendingUpdate(): void {
    const payload = this.pendingUpdatePayload;
    const id = this.editingId();
    this.showUpdateConfirm.set(false);
    this.pendingUpdatePayload = null;
    if (!payload || id == null) {
      return;
    }
    this.saving.set(true);
    this.api.updateBill(id, payload).subscribe({
      next: (r) => {
        this.success.set(r.message);
        this.saving.set(false);
        this.loadBillList();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  loadBillList(): void {
    this.api.listBills().subscribe({
      next: (list) => this.bills.set(list.map((b) => ({ id: b.id, billNo: b.billNo }))),
      error: () => {},
    });
  }

  async refreshPending(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
      const list = await this.offline.listPending();
      this.pending.set(list);
    } catch {
      /* ignore */
    }
  }

  async runSync(): Promise<void> {
    if (!navigator.onLine) return;
    this.success.set(null);
    try {
      const r = await this.offline.syncPending();
      await this.refreshPending();
      if (r.synced > 0) {
        const msg = `Synced ${r.synced} offline bill(s) to the server.`;
        this.success.set(msg);
        this.notify.showSuccess(msg);
        this.syncHistory.update((h) =>
          [{ syncedAt: new Date().toISOString(), billCount: r.synced }, ...h].slice(0, 10),
        );
        this.loadBillList();
      }
      if (r.failed > 0) {
        this.notify.showInfo(
          r.synced > 0
            ? `${r.failed} bill(s) still pending (others synced).`
            : `${r.failed} bill(s) still pending — fix errors or try again.`,
        );
      }
    } catch {
      this.notify.showError('Sync failed unexpectedly.');
      this.error.set('Sync failed.');
    }
  }

  onTabSelected(tabId: string): void {
    this.activeTab.set(tabId as PurchaseBillTabId);
  }

  addLine(): void {
    this.lines.push(this.createLineGroup());
  }

  createLineGroup(
    values?: Partial<{
      itemId: number;
      itemQuery: string;
      locationId: number;
      cost: number;
      price: number;
      quantity: number;
      discountPercent: number;
    }>,
  ): FormGroup {
    return this.fb.group({
      itemId: [values?.itemId ?? null, Validators.required],
      itemQuery: [values?.itemQuery ?? ''],
      locationId: [values?.locationId ?? null, Validators.required],
      cost: [values?.cost ?? 0, [Validators.required, Validators.min(0)]],
      price: [values?.price ?? 0, [Validators.required, Validators.min(0)]],
      quantity: [values?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      discountPercent: [values?.discountPercent ?? 0, [Validators.min(0), Validators.max(100)]],
    });
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
    if (this.lines.length === 0) this.addLine();
  }

  openAutocomplete(index: number, event: FocusEvent): void {
    const el = event.target;
    this.activeItemInput = el instanceof HTMLInputElement ? el : null;
    const query = this.activeItemInput?.value ?? '';
    this.autocompleteRow.set(index);
    this.autocompleteHighlight.set(0);
    this.syncItemDropdownLayout();
    this.runItemSearchRequest(query)
      .pipe(take(1))
      .subscribe((list) => this.itemSuggestions.set(list));
  }

  onItemQueryInput(index: number, value: string, input: EventTarget | null): void {
    this.activeItemInput = input instanceof HTMLInputElement ? input : this.activeItemInput;
    this.autocompleteRow.set(index);
    this.autocompleteHighlight.set(0);
    this.syncItemDropdownLayout();
    this.itemSuggest$.next(value);
  }

  onItemQueryKeydown(event: KeyboardEvent, rowIndex: number): void {
    const list = this.itemSuggestions();
    const open = this.autocompleteRow() === rowIndex;

    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const el = event.target;
      const synthetic = { target: el } as FocusEvent;
      this.openAutocomplete(rowIndex, synthetic);
      return;
    }

    if (!open || list.length === 0) {
      if (event.key === 'Escape') {
        this.closeAutocompleteNow();
      }
      return;
    }

    const hi = this.autocompleteHighlight();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.autocompleteHighlight.set(Math.min(hi + 1, list.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.autocompleteHighlight.set(Math.max(hi - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = list[hi];
      if (item) {
        this.selectItem(rowIndex, item);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeAutocompleteNow();
    }
  }

  selectItem(index: number, item: ItemDto): void {
    const g = this.lines.at(index);
    g.patchValue({ itemId: item.id, itemQuery: item.name });
    this.closeAutocompleteNow();
  }

  /** Delay so mousedown on an option runs before blur closes the panel. */
  closeAutocomplete(): void {
    setTimeout(() => this.closeAutocompleteNow(), 200);
  }

  private closeAutocompleteNow(): void {
    this.autocompleteRow.set(null);
    this.autocompleteHighlight.set(0);
    this.activeItemInput = null;
    this.itemDropdownLayout.set(null);
  }

  private syncItemDropdownLayout(): void {
    const el = this.activeItemInput;
    if (!el || typeof el.getBoundingClientRect !== 'function') {
      this.itemDropdownLayout.set(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const gap = 2;
    const maxHeight = Math.max(120, Math.min(240, window.innerHeight - r.bottom - gap - 12));
    this.itemDropdownLayout.set({
      top: r.bottom + gap,
      left: r.left,
      width: Math.max(r.width, 200),
      maxHeight,
    });
  }

  lineTotalCost(g: FormGroup): number {
    return calcLineTotalCost(g.getRawValue() as LineLike);
  }

  lineTotalSelling(g: FormGroup): number {
    return calcLineTotalSelling(g.getRawValue() as LineLike);
  }

  newBill(): void {
    this.editingId.set(null);
    this.editingBillNo.set(null);
    this.error.set(null);
    this.success.set(null);
    this.form.patchValue({ billDate: this.todayIso() });
    this.lines.clear();
    this.addLine();
    this.activeTab.set('details');
  }

  loadBill(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getBill(id).subscribe({
      next: (d) => {
        this.editingId.set(d.id);
        this.editingBillNo.set(d.billNo);
        this.form.patchValue({ billDate: d.billDate.slice(0, 10) });
        this.lines.clear();
        for (const l of d.lines) {
          this.lines.push(
            this.createLineGroup({
              itemId: l.itemId,
              itemQuery: l.itemName,
              locationId: l.locationId,
              cost: l.cost,
              price: l.price,
              quantity: l.quantity,
              discountPercent: l.discountPercent,
            }),
          );
        }
        if (this.lines.length === 0) this.addLine();
        this.loading.set(false);
        this.activeTab.set('details');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.error.set('Cannot load bill — no connection to the API.');
        }
      },
    });
  }

  save(): void {
    this.error.set(null);
    this.success.set(null);

    this.resolveItemIdsFromTypedNames();
    this.removeEmptyDraftLines();

    if (this.lines.length === 0) {
      this.addLine();
      this.error.set('Add at least one line item.');
      console.warn('[PurchaseBill] save blocked: no lines after cleanup');
      return;
    }

    this.lines.controls.forEach((c) => c.updateValueAndValidity({ emitEvent: false }));
    this.lines.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: true });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.logFormValidationDebug('save blocked: form.invalid');
      this.error.set(this.humanizeFormErrors());
      return;
    }

    const raw = this.form.getRawValue();
    const lines = (raw.lines as Array<Record<string, unknown>>).map((l) => ({
      itemId: Number(l['itemId']),
      locationId: Number(l['locationId']),
      cost: Number(l['cost']),
      price: Number(l['price']),
      quantity: Number(l['quantity']),
      discountPercent: Number(l['discountPercent']),
    }));
    const billDate = String(raw.billDate);
    const editing = this.editingId();

    const payloadPreview = { billDate, lineCount: lines.length, lines };
    console.log('[PurchaseBill] submitting payload', JSON.stringify(payloadPreview, null, 2));

    if (editing != null) {
      this.pendingUpdatePayload = { billDate, lines };
      this.showUpdateConfirm.set(true);
      return;
    }

    const body = { billDate, lines, clientSyncId: crypto.randomUUID() };

    if (!navigator.onLine) {
      void this.offline.savePending(body).then(async () => {
        this.success.set('Saved offline. Will sync when online.');
        await this.refreshPending();
        this.newBill();
      });
      return;
    }

    this.saving.set(true);
    this.api.createBill(body).subscribe({
      next: async (r) => {
        this.success.set(r.message);
        this.saving.set(false);
        this.loadBillList();
        this.editingId.set(r.id);
        this.editingBillNo.set(r.billNo);
        await this.refreshPending();
        this.activeTab.set('summary');
      },
      error: async (err: HttpErrorResponse) => {
        if (err.status === 0) {
          try {
            await this.offline.savePending(body);
            this.success.set('Server unreachable — saved offline for sync.');
            await this.refreshPending();
          } catch {
            this.error.set('Save failed.');
          }
        }
        this.saving.set(false);
      },
    });
  }

  openPdf(): void {
    const id = this.editingId();
    if (id == null) {
      this.error.set('Save the bill first to export PDF.');
      return;
    }
    window.open(this.api.pdfUrl(id), '_blank', 'noopener,noreferrer');
  }

  /** If user typed an item name but did not pick the dropdown, map exact name → itemId. */
  private runItemSearchRequest(query: string) {
    const catalog = this.itemCatalog();
    const trimmed = query.trim();
    const params = trimmed ? { search: trimmed, limit: 25 } : { limit: 5 };
    return this.master.searchItems(params).pipe(
      catchError((err: unknown) => {
        if (catalog.length > 0 && err instanceof HttpErrorResponse && err.status === 0) {
          return of(filterItemsForAutocomplete(catalog, query));
        }
        return of([] as ItemDto[]);
      }),
    );
  }

  private resolveItemIdsFromTypedNames(): void {
    const catalog = this.itemCatalog();
    for (let i = 0; i < this.lines.length; i++) {
      const g = this.lines.at(i);
      const id = g.get('itemId')?.value;
      if (id != null && id !== '') continue;
      const q = String(g.get('itemQuery')?.value ?? '').trim();
      if (!q) continue;
      const match = catalog.find((it) => it.name.toLowerCase() === q.toLowerCase());
      if (match) {
        g.patchValue({ itemId: match.id, itemQuery: match.name });
        console.log('[PurchaseBill] resolved item from text', { row: i, itemId: match.id, name: match.name });
      }
    }
  }

  /** Remove extra blank rows (e.g. after "Add row") so they do not invalidate the whole form. */
  private removeEmptyDraftLines(): void {
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const g = this.lines.at(i);
      const v = g.getRawValue() as {
        itemId: unknown;
        itemQuery: unknown;
        locationId: unknown;
      };
      const noItem = v.itemId == null || v.itemId === '';
      const noLoc = v.locationId == null || v.locationId === '';
      const noQuery = !String(v.itemQuery ?? '').trim();
      const emptyDraft = noItem && noLoc && noQuery;
      if (emptyDraft && this.lines.length > 1) {
        this.lines.removeAt(i);
        console.log('[PurchaseBill] removed empty draft line at index', i);
      }
    }
  }

  private logFormValidationDebug(reason: string): void {
    console.group(`[PurchaseBill] ${reason}`);
    console.log('form.status', this.form.status);
    console.log('form.errors', this.form.errors);
    console.log('billDate errors', this.form.get('billDate')?.errors);
    const raw = this.form.getRawValue();
    console.log('form.getRawValue()', JSON.stringify(raw, null, 2));
    this.lines.controls.forEach((ctrl, idx) => {
      const g = ctrl as FormGroup;
      console.log(`line[${idx}] status=${g.status}`, g.getRawValue(), 'errors:', {
        itemId: g.get('itemId')?.errors,
        itemQuery: g.get('itemQuery')?.errors,
        locationId: g.get('locationId')?.errors,
        cost: g.get('cost')?.errors,
        price: g.get('price')?.errors,
        quantity: g.get('quantity')?.errors,
        discountPercent: g.get('discountPercent')?.errors,
      });
    });
    console.groupEnd();
  }

  private humanizeFormErrors(): string {
    const parts: string[] = [];
    if (this.form.get('billDate')?.invalid) parts.push('Bill date is required.');
    this.lines.controls.forEach((ctrl, idx) => {
      const g = ctrl as FormGroup;
      if (g.invalid) {
        const bits: string[] = [];
        if (g.get('itemId')?.invalid) bits.push('choose an item (pick from list or type exact name)');
        if (g.get('locationId')?.invalid) bits.push('choose a location / batch');
        if (g.get('cost')?.invalid) bits.push('cost invalid');
        if (g.get('price')?.invalid) bits.push('price invalid');
        if (g.get('quantity')?.invalid) bits.push('quantity must be at least 1');
        if (g.get('discountPercent')?.invalid) bits.push('discount % must be 0–100');
        if (bits.length) parts.push(`Row ${idx + 1}: ${bits.join('; ')}`);
      }
    });
    return parts.length ? parts.join(' ') : 'Fix validation errors before saving.';
  }
}
