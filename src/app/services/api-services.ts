// src/app/services/api-services.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, retry, shareReplay, switchMap, tap } from 'rxjs';
import { ApiCar, CarsResponse, StoreCar } from '../interfaces/car-interface';

export const ksh = (n: number): string => `Ksh ${(n ?? 0).toLocaleString('en-US')}`;

@Injectable({ providedIn: 'root' })
export class ApiServices {
  private http = inject(HttpClient);
  private readonly api = 'https://a-plus-motors-admin-backend.onrender.com/api/admin';

  private all$?: Observable<ApiCar[]>;

  getCars(page = 1, limit = 10): Observable<CarsResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<CarsResponse>(`${this.api}/cars/all`, { params })
      .pipe(retry({ count: 1, delay: 1000 }));
  }

  /**
   * Fetches the latest N web-visible cars (default 18 for the store belt).
   * Uses the cached "all cars" feed so the API is only hit once per session,
   * then sorts by createdAt descending so "latest" is genuinely latest.
   */
  getLatestCars(limit = 18): Observable<ApiCar[]> {
    return this.getAllCars().pipe(
      map(cars =>
        cars
          .filter(c => c.showOnWeb)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      )
    );
  }

  /**
   * Fetches ALL web-visible recommended cars, capped at `limit` (default 6).
   */
  getRecommendedCars(limit = 6): Observable<ApiCar[]> {
    return this.getAllCars().pipe(
      map(cars =>
        cars
          .filter(c => c.showOnWeb && c.recommended)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      )
    );
  }

  getAllCars(force = false): Observable<ApiCar[]> {
    if (force || !this.all$) {
      this.all$ = this.fetchAll().pipe(
        tap({ error: () => (this.all$ = undefined) }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.all$;
  }

  getWebCars(): Observable<ApiCar[]> {
    return this.getAllCars().pipe(map(cars => cars.filter(c => c.showOnWeb)));
  }

  getStoreCars(): Observable<StoreCar[]> {
    return this.getWebCars().pipe(map(cars => cars.map(c => this.toStoreCar(c))));
  }

  getCarById(id: string): Observable<ApiCar | undefined> {
    return this.getAllCars().pipe(map(cars => cars.find(c => c._id === id)));
  }

  private fetchAll(): Observable<ApiCar[]> {
    return this.getCars(1, 50).pipe(
      switchMap(first => {
        const { pages, limit } = first.pagination;
        if (pages <= 1) return of(first.cars);
        const rest = Array.from({ length: pages - 1 }, (_, i) => this.getCars(i + 2, limit));
        return forkJoin(rest).pipe(
          map(results => ([] as ApiCar[]).concat(first.cars, ...results.map(r => r.cars)))
        );
      })
    );
  }

  private toStoreCar(c: ApiCar): StoreCar {
    const ageDays = (Date.now() - new Date(c.createdAt).getTime()) / 86_400_000;
    return {
      id: c._id,
      image: c.photos?.[0] ?? '',
      year: String(c.year),
      make: c.make,
      name: c.model,
      price: ksh(c.price),
      oldPrice: '',
      mileage: `${(c.mileage ?? 0).toLocaleString('en-US')} km`,
      gearbox: c.transmission,
      fuel: c.fuel,
      engine: `${((c.engine ?? 0) / 1000).toFixed(1)}L`,
      isNew: ageDays <= 30,
      deal: false,
      reviewVideoUrl: c.reviewVideoUrl ?? ''
    };
  }
}