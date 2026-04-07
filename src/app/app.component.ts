import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';
import { SplashComponent } from './features/auth/splash/splash.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SplashComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (supabase.isLoading()) {
      <iq-splash />
    } @else {
      <router-outlet />
    }
  `,
})
export class AppComponent {
  protected readonly supabase = inject(SupabaseService);
}
