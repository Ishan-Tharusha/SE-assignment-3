import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../core/api-endpoints';
import { environment } from '../../environments/environment';
import { ItemDto } from '../models/item.model';
import { LocationDto } from '../models/location.model';

export interface ItemSearchParams {
  /** Server-side name filter (contains, starts-with ranked first). */
  search?: string;
  /** Max rows (backend caps at 100). */
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Full item catalog (no query params). */
  getItems(): Observable<ItemDto[]> {
    return this.http.get<ItemDto[]>(`${this.base}${ApiEndpoints.items}`);
  }

  /**
   * Autocomplete / search: `GET /api/items?search=&limit=`
   * - `limit` only → first N items by name (e.g. 5 for default suggestions)
   * - `search` → filtered list (optional `limit`)
   */
  searchItems(params: ItemSearchParams): Observable<ItemDto[]> {
    let httpParams = new HttpParams();
    const s = params.search?.trim();
    if (s) httpParams = httpParams.set('search', s);
    if (params.limit != null && params.limit > 0) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http.get<ItemDto[]>(`${this.base}${ApiEndpoints.items}`, { params: httpParams });
  }

  getLocations(): Observable<LocationDto[]> {
    return this.http.get<LocationDto[]>(`${this.base}${ApiEndpoints.locations}`);
  }
}
