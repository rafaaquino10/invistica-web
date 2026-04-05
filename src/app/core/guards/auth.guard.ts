import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Still loading session — wait (Supabase auto-refresh may be in-flight)
  if (auth.isLoading()) {
    // Return a promise that resolves once loading finishes
    return new Promise<boolean>((resolve) => {
      const check = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(check);
          if (auth.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 50);
      // Timeout after 5s — let them through (graceful degradation)
      setTimeout(() => {
        clearInterval(check);
        resolve(true);
      }, 5000);
    });
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
