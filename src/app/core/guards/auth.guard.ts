import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait for session check to complete
  if (supabase.isLoading()) {
    await new Promise<void>(resolve => {
      const check = setInterval(() => {
        if (!supabase.isLoading()) { clearInterval(check); resolve(); }
      }, 50);
      // Timeout after 5s
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
  }

  if (supabase.isAuthenticated()) return true;

  router.navigate(['/entrar'], { queryParams: { returnUrl: state.url } });
  return false;
};
