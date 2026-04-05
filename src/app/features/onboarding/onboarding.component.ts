import {
  Component, ChangeDetectionStrategy, inject, signal, DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortfolioService } from '../../core/services/portfolio.service';
import { TickerService } from '../../core/services/ticker.service';
import { IqSearchComponent, SearchResult } from '../../shared/components/iq-search/iq-search.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';

interface QuickPosition {
  ticker: string;
  quantity: number;
  avg_price: number;
}

@Component({
  selector: 'iq-onboarding',
  standalone: true,
  imports: [FormsModule, IqSearchComponent, IqButtonComponent, IqTickerLogoComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly portfolioService = inject(PortfolioService);
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal(1);
  readonly saving = signal(false);
  readonly searchResults = signal<SearchResult[]>([]);
  readonly positions = signal<QuickPosition[]>([]);

  // Step 1: Profile
  readonly selectedProfile = signal<string | null>(null);

  readonly profiles = [
    { id: 'conservador', label: 'Conservador', icon: 'ph ph-shield-check', desc: 'Prefiro seguranca e dividendos consistentes' },
    { id: 'equilibrado', label: 'Equilibrado', icon: 'ph ph-scales', desc: 'Busco um equilibrio entre risco e retorno' },
    { id: 'arrojado', label: 'Arrojado', icon: 'ph ph-rocket', desc: 'Aceito volatilidade por retornos maiores' },
  ];

  selectProfile(id: string): void {
    this.selectedProfile.set(id);
  }

  // Step 2: Add positions
  onSearch(q: string): void {
    if (q.length < 2) { this.searchResults.set([]); return; }
    this.tickerService.search(q, 8).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        const existing = new Set(this.positions().map(p => p.ticker));
        this.searchResults.set(
          res.tickers.filter(t => !existing.has(t.ticker))
            .map(t => ({ label: t.ticker, value: t.ticker, subtitle: t.company_name }))
        );
      });
  }

  addTicker(r: SearchResult): void {
    // Buscar preco atual para avg_price default
    this.tickerService.getQuote(r.value).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: q => {
          this.positions.update(p => [...p, { ticker: r.value, quantity: 100, avg_price: q?.close ?? 0 }]);
        },
        error: () => {
          this.positions.update(p => [...p, { ticker: r.value, quantity: 100, avg_price: 0 }]);
        },
      });
    this.searchResults.set([]);
  }

  removePosition(ticker: string): void {
    this.positions.update(p => p.filter(x => x.ticker !== ticker));
  }

  updateQty(ticker: string, qty: number): void {
    this.positions.update(p => p.map(x => x.ticker === ticker ? { ...x, quantity: qty } : x));
  }

  updatePrice(ticker: string, price: number): void {
    this.positions.update(p => p.map(x => x.ticker === ticker ? { ...x, avg_price: price } : x));
  }

  // Navigation
  nextStep(): void {
    if (this.step() === 1 && !this.selectedProfile()) return;
    if (this.step() < 3) this.step.update(s => s + 1);
  }

  prevStep(): void {
    if (this.step() > 1) this.step.update(s => s - 1);
  }

  // Step 3: Finish
  finish(): void {
    const pos = this.positions();
    if (pos.length === 0) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.saving.set(true);
    let completed = 0;
    const total = pos.length;

    pos.forEach(p => {
      if (p.quantity > 0 && p.avg_price > 0) {
        this.portfolioService.addPosition({ ticker: p.ticker, quantity: p.quantity, avg_price: p.avg_price })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => { completed++; if (completed >= total) this.router.navigate(['/dashboard']); },
            error: () => { completed++; if (completed >= total) this.router.navigate(['/dashboard']); },
          });
      } else {
        completed++;
        if (completed >= total) this.router.navigate(['/dashboard']);
      }
    });
  }

  skipTodashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
