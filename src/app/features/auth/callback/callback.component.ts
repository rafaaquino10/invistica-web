import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SplashComponent } from '../splash/splash.component';

@Component({
  selector: 'iq-callback',
  standalone: true,
  imports: [SplashComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iq-splash />`,
})
export class CallbackComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.hash.substring(1));
    if (params.get('error')) {
      this.router.navigate(['/entrar'], { queryParams: { error: 'auth_failed' } });
      return;
    }

    const timeout = setTimeout(() => {
      this.router.navigate(['/entrar'], { queryParams: { error: 'callback_timeout' } });
    }, 10000);

    const unsub = this.supabase.isAuthenticated;
    const check = setInterval(() => {
      if (unsub()) {
        clearTimeout(timeout);
        clearInterval(check);
        this.router.navigate(['/dashboard']);
      }
    }, 200);
  }
}
