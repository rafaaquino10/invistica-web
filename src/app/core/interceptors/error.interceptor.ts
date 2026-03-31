import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      const status = error.status;
      const url = error.url ?? req.url;

      if (status === 401) {
        console.warn(`[HTTP 401] Não autenticado — ${url}`);
      } else if (status === 403) {
        console.warn(`[HTTP 403] Acesso negado — ${url}`);
      } else if (status >= 500) {
        console.error(`[HTTP ${status}] Erro do servidor — ${url}`);
      }

      return throwError(() => error);
    }),
  );
};
