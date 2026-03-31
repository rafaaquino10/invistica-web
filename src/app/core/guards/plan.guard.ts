import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';

interface BillingStatus {
  plan: string;
  active: boolean;
}

export const planGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);

  return api.get<BillingStatus>('/billing/status').pipe(
    map(status => {
      if (status.plan === 'free') {
        return router.createUrlTree(['/configuracoes'], {
          queryParams: { upgrade: true },
        });
      }
      return true;
    }),
    catchError(() => {
      // On network/auth error, allow access — auth guard handles authentication
      return of(true);
    }),
  );
};
