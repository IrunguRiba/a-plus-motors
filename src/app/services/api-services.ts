// src/app/services/api-services.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ApiCar, CarsResponse, StoreCar } from '../interfaces/car-interface';

/* ============================================================
   CONFIG
   ============================================================ */

/**
 * Switch to 'http://localhost:4000/api' while developing against a local backend.
 * Better still: move this into src/environments/environment.ts.
 */
export const API_BASE = 'https://a-plus-motors-admin-backend.onrender.com/api';

/** Page size used when pulling the whole catalogue. */
const PAGE_SIZE = 100;

/** How long the cached car list stays fresh (ms). */
const CARS_CACHE_TTL = 60_000;

/* ============================================================
   HELPERS
   ============================================================ */

/** Formats a number as Kenyan shillings, e.g. 1250000 -> "KSh 1,250,000". */
export function ksh(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '';
  return `KSh ${Math.round(n).toLocaleString('en-US')}`;
}

/* ============================================================
   REQUEST PAYLOADS
   ============================================================ */

export type RequestType = 'privacy' | 'inquiry' | 'financing' | 'trade-in' | 'import';

/** Sent from the "I'm interested" modal on the specs page. */
export interface InquiryRequestPayload {
  name: string;
  phone: string;
  carId?: string;
  carName: string;
  price: string;
  schedule: boolean;
  viewingDate?: string;
  viewingTime?: string;
  tradeIn: boolean;
  tradeMake?: string;
  tradeYear?: string;
  tradeMileage?: string;
  message?: string;
}

/** Sent from the complaint form on the privacy page. */
export interface PrivacyRequestPayload {
  name: string;
  email: string;
  category: string;
  categoryLabel: string;
  vehicleDetails?: string;
  message: string;
}

/** Whatever the backend returns after a request is created. */
export interface RequestResponse {
  success: boolean;
  message?: string;
  code?: string;
  id?: string;
  [key: string]: unknown;
}

/* ============================================================
   SERVICE
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class ApiServices {
  private http = inject(HttpClient);

  private readonly carsUrl = `${API_BASE}/admin/cars`;
  private readonly blogsUrl = `${API_BASE}/admin/blogs`;
  private readonly requestsUrl = `${API_BASE}/requests`;

  /* ----------------------------------------------------------
     CARS
     ---------------------------------------------------------- */

  private carsCache$?: Observable<ApiCar[]>;
  private carsCachedAt = 0;

  /** One page of cars: GET /admin/cars/all?page=&limit= */
  getCarsPage(page = 1, limit = 10): Observable<CarsResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<CarsResponse>(`${this.carsUrl}/all`, { params });
  }

  /**
   * Every car, across all pages. The result is cached and shared for a minute,
   * so the specs page (and its "similar cars") does not refetch on every navigation.
   * Pass force = true to bypass the cache.
   */
  getAllCars(force = false): Observable<ApiCar[]> {
    const fresh = this.carsCache$ && Date.now() - this.carsCachedAt < CARS_CACHE_TTL;
    if (!force && fresh) return this.carsCache$!;

    const request$ = this.getCarsPage(1, PAGE_SIZE).pipe(
      switchMap((first) => {
        const pages = first.pagination?.pages ?? 1;
        if (pages <= 1) return of(first.cars ?? []);

        const rest = Array.from({ length: pages - 1 }, (_, i) =>
          this.getCarsPage(i + 2, PAGE_SIZE).pipe(map((r) => r.cars ?? [])),
        );
        return forkJoin(rest).pipe(map((chunks) => [...(first.cars ?? []), ...chunks.flat()]));
      }),
      tap(() => (this.carsCachedAt = Date.now())),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.carsCache$ = request$;
    // If the request fails, drop the cache so the next call retries.
    request$.subscribe({ error: () => (this.carsCache$ = undefined) });
    return request$;
  }

  /**
   * Cars visible on the website (showOnWeb), recommended ones first.
   * Used by the home page hero.
   */
  getWebCars(): Observable<ApiCar[]> {
    return this.getAllCars().pipe(
      map((cars) =>
        cars
          .filter((c) => c.showOnWeb)
          .sort((a, b) => Number(b.recommended) - Number(a.recommended)),
      ),
    );
  }

  /**
   * Web-visible cars mapped to the card shape used by the store and financing pages.
   */
  getStoreCars(): Observable<StoreCar[]> {
    return this.getWebCars().pipe(map((cars) => cars.map((c) => this.toStoreCar(c))));
  }

  private toStoreCar(c: ApiCar): StoreCar {
    const thisYear = new Date().getFullYear();
    return {
      id: c._id,
      image: c.photos?.[0] ?? '',
      year: String(c.year ?? ''),
      make: c.make ?? '',
      name: c.model ?? '',
      price: ksh(c.price),
      oldPrice: '',
      mileage: c.mileage > 0 ? `${c.mileage.toLocaleString('en-US')} km` : '',
      gearbox: c.transmission ?? '',
      fuel: c.fuel ?? '',
      engine: c.engine > 0 ? `${c.engine.toLocaleString('en-US')} cc` : '',
      isNew: c.year >= thisYear - 1 && (c.mileage ?? 0) < 5000,
      deal: !!c.negotiable,
      reviewVideoUrl: c.reviewVideoUrl,
    };
  }

  /** POST /admin/cars/find  { _id } */
  getCarById(id: string): Observable<ApiCar | null> {
    return this.http
      .post<{ success?: boolean; car?: ApiCar; data?: ApiCar }>(`${this.carsUrl}/find`, {
        _id: id,
      })
      .pipe(map((res) => res?.car ?? res?.data ?? null));
  }

  /** POST /admin/cars/search */
  searchCars(criteria: Record<string, unknown>): Observable<ApiCar[]> {
    return this.http
      .post<CarsResponse>(`${this.carsUrl}/search`, criteria)
      .pipe(map((res) => res?.cars ?? []));
  }

  /* ----------------------------------------------------------
     REQUESTS (inquiry, financing, trade-in, import, privacy)
     ---------------------------------------------------------- */

  /** POST /requests/:type */
  submitRequest<T extends object>(type: RequestType, payload: T): Observable<RequestResponse> {
    return this.http.post<RequestResponse>(`${this.requestsUrl}/${type}`, payload);
  }

  submitInquiry(payload: InquiryRequestPayload): Observable<RequestResponse> {
    return this.submitRequest('inquiry', payload);
  }

  /** POST /requests/privacy */
  submitPrivacy(payload: PrivacyRequestPayload): Observable<RequestResponse> {
    return this.submitRequest('privacy', payload);
  }

  submitFinancing<T extends object>(payload: T): Observable<RequestResponse> {
    return this.submitRequest('financing', payload);
  }

  submitTradeIn<T extends object>(payload: T): Observable<RequestResponse> {
    return this.submitRequest('trade-in', payload);
  }

  submitImport<T extends object>(payload: T): Observable<RequestResponse> {
    return this.submitRequest('import', payload);
  }

  /* ----------------------------------------------------------
     BLOGS
     ---------------------------------------------------------- */

  /** GET /admin/blogs — returns the list whatever envelope the backend wraps it in. */
  getBlogs(): Observable<any[]> {
    return this.http
      .get<unknown>(this.blogsUrl)
      .pipe(map((res) => this.extractList(res, ['blogs', 'posts', 'data', 'items'])));
  }

  /** Pulls an array out of `[...]` or `{ success, <key>: [...] }` style responses. */
  private extractList(res: unknown, keys: string[]): any[] {
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      for (const k of keys) {
        const v = (res as Record<string, unknown>)[k];
        if (Array.isArray(v)) return v;
      }
    }
    return [];
  }

  getBlogById<T = unknown>(id: string): Observable<T> {
    return this.http.get<T>(`${this.blogsUrl}/${id}`);
  }

  /** GET /admin/blogs/side-info */
  getSideInfo(): Observable<any[]> {
    return this.http
      .get<unknown>(`${this.blogsUrl}/side-info`)
      .pipe(map((res) => this.extractList(res, ['sideInfo', 'sideInfos', 'items', 'data'])));
  }
}