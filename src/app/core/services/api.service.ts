import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const CACHE_TTL = 60_000; // 1 minute default cache

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly inflight = new Map<string, Observable<any>>();

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }

    const cacheKey = `${path}?${httpParams.toString()}`;

    // Return cached if fresh
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return of(cached.data as T);
    }

    // Deduplicate in-flight requests
    const existing = this.inflight.get(cacheKey);
    if (existing) return existing as Observable<T>;

    const req$ = this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams }).pipe(
      tap(data => {
        this.cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
        this.inflight.delete(cacheKey);
      }),
      catchError(err => {
        this.inflight.delete(cacheKey);
        return this.handleError(err);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.inflight.set(cacheKey, req$);
    return req$;
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body).pipe(
      tap(() => this.invalidateCache(path)),
      catchError(err => this.handleError(err)),
    );
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body).pipe(
      tap(() => this.invalidateCache(path)),
      catchError(err => this.handleError(err)),
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`).pipe(
      tap(() => this.invalidateCache(path)),
      catchError(err => this.handleError(err)),
    );
  }

  private invalidateCache(path: string): void {
    // Clear cache entries that start with this path's base
    const base = path.split('/').slice(0, 2).join('/');
    for (const key of this.cache.keys()) {
      if (key.startsWith(base)) this.cache.delete(key);
    }
  }

  private handleError(error: unknown): Observable<never> {
    console.error('[ApiService]', error);
    return throwError(() => error);
  }
}
