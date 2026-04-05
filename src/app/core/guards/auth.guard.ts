import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (auth.isLoading()) {
    return new Promise<boolean | import('@angular/router').UrlTree>((resolve) => {
      const check = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(check);
          resolve(auth.isAuthenticated() ? true : router.createUrlTree(['/login']));
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        resolve(auth.isAuthenticated() ? true : router.createUrlTree(['/login']));
      }, 5000);
    });
  }

  return router.createUrlTree(['/login']);
};
