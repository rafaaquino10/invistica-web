import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RegimeService } from '../../core/services/regime.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { REGIME_LABELS, RegimeType } from '../../core/models/regime.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'iq-header',
  standalone: true,
  imports: [RouterLink, ClickOutsideDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly regimeService = inject(RegimeService);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  readonly regime = toSignal(this.regimeService.regime$);
  readonly user = this.authService.currentUser;
  readonly menuOpen = signal(false);

  readonly regimeLabel = computed(() => {
    const r = this.regime();
    if (!r) return '';
    return REGIME_LABELS[r.regime as RegimeType] ?? r.label;
  });

  readonly userInitials = computed(() => {
    const u = this.user();
    if (!u?.email) return '?';
    return u.email.substring(0, 2).toUpperCase();
  });

  readonly userName = computed(() => {
    const u = this.user();
    return u?.user_metadata?.['full_name'] || u?.email?.split('@')[0] || '';
  });

  readonly userEmail = computed(() => this.user()?.email ?? '');

  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
    await this.authService.signOut();
    window.location.href = '/login';
  }
}
