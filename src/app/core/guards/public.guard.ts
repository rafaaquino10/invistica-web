import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

export const publicGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.isLoading()) {
    await new Promise<void>(resolve => {
      const check = setInterval(() => {
        if (!supabase.isLoading()) { clearInterval(check); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
  }

  if (supabase.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
