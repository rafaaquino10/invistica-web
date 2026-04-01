import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError } from 'rxjs';
import { ScoreService } from '../../core/services/score.service';
import { TickerService } from '../../core/services/ticker.service';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
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
          @for (opt of colorOptions; track opt.value) {
            <button class="mmap__toggle"
                    [class.mmap__toggle--active]="colorBy() === opt.value"
                    (click)="colorBy.set(opt.value)">{{ opt.label }}</button>
          }
        </div>
      </div>
      @if (loading()) {
        <iq-skeleton variant="rect" width="100%" height="500px" />
      } @else {
        <iq-treemap [data]="items()" [colorBy]="colorBy()" (itemClick)="onItemClick($event)" />
      }
      <iq-disclaimer />
    </div>
  `,
  styles: [`
    .mmap { max-width: 1440px; margin: 0 auto; }
    .mmap__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .mmap__title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
    .mmap__toggles { display: flex; gap: 2px; }
    .mmap__toggle {
      border: none; background: transparent; padding: 6px 12px;
      font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500;
      color: var(--text-tertiary); border-radius: 2px; cursor: pointer;
    }
    .mmap__toggle:hover { color: var(--text-primary); background: var(--surface-2); }
    .mmap__toggle--active { color: var(--obsidian); background: var(--obsidian-bg); font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketMapComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);
  private readonly tickerService = inject(TickerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly items = signal<TreemapItem[]>([]);
  readonly colorBy = signal<'change' | 'score' | 'sector'>('change');

  readonly colorOptions = [
    { label: 'Variação', value: 'change' as const },
    { label: 'IQ-Score', value: 'score' as const },
    { label: 'Setor', value: 'sector' as const },
  ];

  onItemClick(item: TreemapItem): void {
    this.router.navigate(['/ativo', item.ticker]);
  }

  ngOnInit(): void {
    this.scoreService.screener({ limit: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        const scored = res.results ?? [];
        // Fallback to tickers list if screener has few results
        if (scored.length < 20) {
          this.tickerService.list({ limit: 200 })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(tr => {
              const set = new Set(scored.map(r => r.ticker));
              const merged = [
                ...scored.map(r => this.toTreemapItem(r)),
                ...(tr.tickers ?? []).filter(t => !set.has(t.ticker)).map(t => ({
                  ticker: t.ticker,
                  name: t.company_name,
                  value: 1,
                  score: 0,
                  change: 0,
                  cluster: CLUSTER_NAMES[t.cluster_id as ClusterId] ?? 'Outros',
                  cluster_id: t.cluster_id ?? 0,
                })),
              ];
              this.items.set(merged);
              this.loading.set(false);
            });
        } else {
          this.items.set(scored.map(r => this.toTreemapItem(r)));
          this.loading.set(false);
        }
      });
  }

  private toTreemapItem(r: any): TreemapItem {
    return {
      ticker: r.ticker,
      name: r.company_name,
      value: r.iq_score || 1,
      score: r.iq_score ?? 0,
      change: (r.safety_margin ?? 0) * 10,
      cluster: CLUSTER_NAMES[r.cluster_id as ClusterId] ?? 'Outros',
      cluster_id: r.cluster_id ?? 0,
    };
  }
}
