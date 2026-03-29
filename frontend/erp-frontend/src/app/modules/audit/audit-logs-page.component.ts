import { DatePipe, SlicePipe, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PurchaseBillApiService } from '../purchase/services/purchase-bill-api.service';
import { AuditLogDto } from '../../models/purchase-bill.model';

@Component({
  selector: 'app-audit-logs-page',
  imports: [DatePipe, SlicePipe, RouterLink],
  template: `
    <div class="page">
      <header class="toolbar">
        <h1>Audit logs</h1>
        <a routerLink="/purchase" class="link">Purchase</a>
      </header>
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      @if (loading()) {
        <p>Loading…</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>Time</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Old value</th>
                <th>New value</th>
              </tr>
            </thead>
            <tbody>
              @if (rows().length === 0) {
                <tr>
                  <td colspan="6" class="muted">No audit rows yet. Create or update a purchase bill to record activity.</td>
                </tr>
              } @else {
                @for (row of rows(); track row.id) {
                  <tr>
                    <td class="num">{{ row.id }}</td>
                    <td>{{ row.createdAt | date: 'medium' }}</td>
                    <td>{{ row.entity }}</td>
                    <td>{{ row.action }}</td>
                    <td class="mono">{{ row.oldValue | slice: 0 : 120 }}</td>
                    <td class="mono">{{ row.newValue | slice: 0 : 120 }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.25rem 2rem;
      font-family: system-ui, sans-serif;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
      font-size: 1.25rem;
    }
    .link {
      color: #1a56c4;
    }
    .err {
      color: #b00020;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th,
    td {
      border: 1px solid #cfd4dc;
      padding: 0.4rem 0.5rem;
      vertical-align: top;
    }
    th {
      background: #f0f2f5;
      text-align: left;
    }
    .mono {
      font-family: ui-monospace, monospace;
      word-break: break-all;
    }
    .num {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .table-wrap {
      overflow: auto;
    }
    .muted {
      color: #5a6578;
      font-style: italic;
    }
  `,
})
export class AuditLogsPageComponent implements OnInit {
  private readonly api = inject(PurchaseBillApiService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AuditLogDto[]>([]);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.api.getAuditLogs().subscribe({
      next: (data) => {
        this.rows.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.error.set('Could not reach the API. Is the backend running?');
        }
      },
    });
  }
}
