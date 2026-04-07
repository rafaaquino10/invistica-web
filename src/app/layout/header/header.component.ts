import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SettingsModalComponent } from '../../features/auth/settings/settings-modal.component';

interface SearchResult {
  ticker: string;
  name: string;
}

@Component({
  selector: 'iq-header',
  standalone: true,
  imports: [SettingsModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly query = signal('');
  readonly results = signal<SearchResult[]>([]);
  readonly showResults = signal(false);
  readonly showUserMenu = signal(false);
  readonly showSettings = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (value.length < 2) {
      this.results.set([]);
      this.showResults.set(false);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.api.get<SearchResult[]>('/tickers/search', { q: value }).subscribe({
        next: (data) => {
          this.results.set(data);
          this.showResults.set(data.length > 0);
        },
        error: () => {
          this.results.set([]);
          this.showResults.set(false);
        },
      });
    }, 300);
  }

  selectResult(ticker: string): void {
    this.showResults.set(false);
    this.query.set('');
    this.results.set([]);
    this.router.navigate(['/ativo', ticker]);
  }

  closeSearch(): void {
    setTimeout(() => this.showResults.set(false), 200);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void {
    setTimeout(() => this.showUserMenu.set(false), 200);
  }
}
