import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScoreService } from '../../core/services/score.service';
import { IqTreemapComponent, TreemapItem } from '../../shared/components/iq-treemap/iq-treemap.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

@Component({
  selector: 'iq-market-map',
  standalone: true,
  imports: [IqTreemapComponent, IqButtonComponent, IqSkeletonComponent, IqDisclaimerComponent],
  template: `
    <div class="mmap">
      <div class="mmap__header">
        <h1 class="mmap__title">Mapa de Mercado</h1>
        <div class="mmap__toggles">
          <iq-button [variant]="colorBy() === 'change' ? 'primary' : 'secondary'" size="sm" (clicked)="colorBy.set('change')">Variação</iq-button>
        </div>
      </div>
      @if (loading()) {
        <iq-skeleton variant="rect" width="100%" height="400px" />
      } @else {
        <iq-treemap [data]="items()" [colorBy]="colorBy()" (itemClick)="onItemClick($event)" />
      }
      <iq-disclaimer />
    </div>
  `,
  styles: [`
    .mmap { max-width: 1200px; margin: 0 auto; }
    .mmap__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .mmap__title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
    .mmap__toggles { display: flex; gap: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketMapComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly items = signal<TreemapItem[]>([]);
  readonly colorBy = signal<'change' | 'score'>('change');

  onItemClick(item: TreemapItem): void {
    this.router.navigate(['/ativo', item.ticker]);
  }

  ngOnInit(): void {
    this.scoreService.screener({ limit: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.items.set((res.results ?? []).map(r => ({
          ticker: r.ticker,
          name: r.company_name,
          value: r.iq_score || 1,
          score: r.iq_score,
          change: (r.safety_margin ?? 0) * 10,
        })));
        this.loading.set(false);
      });
  }
}
