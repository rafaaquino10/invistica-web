import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

const API_PATHS = ['/scores', '/tickers', '/clusters', '/valuation', '/portfolio', '/dividends', '/news', '/radar', '/analytics', '/billing', '/backtest', '/health'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept API calls, not assets/fonts/etc.
  const isApiCall = API_PATHS.some(p => req.url.startsWith(p) || req.url.includes(p));
  if (!isApiCall) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(authReq);
      }
      return next(req);
    }),
  );
};
