import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../core/api-endpoints';
import { environment } from '../../../../environments/environment';
import {
  AuditLogDto,
  PurchaseBillCreateRequest,
  PurchaseBillDetail,
  PurchaseBillSaveResponse,
  PurchaseBillSummary,
  PurchaseBillUpdateRequest,
} from '../../../models/purchase-bill.model';

@Injectable({ providedIn: 'root' })
export class PurchaseBillApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private url(path: string): string {
    return `${this.base}${path}`;
  }

  listBills(): Observable<PurchaseBillSummary[]> {
    return this.http.get<PurchaseBillSummary[]>(this.url(ApiEndpoints.purchaseBills));
  }

  getBill(id: number): Observable<PurchaseBillDetail> {
    return this.http.get<PurchaseBillDetail>(`${this.url(ApiEndpoints.purchaseBills)}/${id}`);
  }

  createBill(body: PurchaseBillCreateRequest): Observable<PurchaseBillSaveResponse> {
    return this.http.post<PurchaseBillSaveResponse>(this.url(ApiEndpoints.purchaseBills), body);
  }

  updateBill(id: number, body: PurchaseBillUpdateRequest): Observable<PurchaseBillSaveResponse> {
    return this.http.put<PurchaseBillSaveResponse>(`${this.url(ApiEndpoints.purchaseBills)}/${id}`, body);
  }

  getAuditLogs(): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(this.url(ApiEndpoints.auditLogs));
  }

  pdfUrl(id: number): string {
    return `${this.url(ApiEndpoints.purchaseBills)}/${id}/pdf`;
  }
}
