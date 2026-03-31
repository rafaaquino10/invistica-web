import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RegimeService } from '../../core/services/regime.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { REGIME_LABELS, RegimeType } from '../../core/models/regime.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'iq-header',
  standalone: true,
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

  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
