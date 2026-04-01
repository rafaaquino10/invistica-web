import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

const API_PATHS = ['/scores', '/tickers', '/clusters', '/valuation', '/portfolio', '/dividends', '/news', '/radar', '/analytics', '/billing', '/backtest', '/health'];

// Cache token in memory — avoid calling Supabase for every request
let cachedToken: string | null = null;
let tokenExpiry = 0;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiCall = API_PATHS.some(p => req.url.startsWith(p) || req.url.includes(p));
  if (!isApiCall) {
    return next(req);
  }

  // Use cached token if still valid (refresh every 5 min)
  if (cachedToken && Date.now() < tokenExpiry) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${cachedToken}` } }));
  }

  const authService = inject(AuthService);

  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      if (token) {
        cachedToken = token;
        tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min cache
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      }
      return next(req);
    }),
  );
};
