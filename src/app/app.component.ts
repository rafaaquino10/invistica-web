import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  protected readonly supabase = inject(SupabaseService);

  ngOnInit(): void {
    // Safety timeout: if isLoading is still true after 3s, force it to false
    setTimeout(() => {
      if (this.supabase.isLoading()) {
        this.supabase.isLoading.set(false);
      }
    }, 3000);
  }
}
