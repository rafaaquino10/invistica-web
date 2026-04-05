import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
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
        <div class="mmap__header-left">
          <h1 class="mmap__title">Mapa de Mercado</h1>
          <span class="mmap__meta">{{ items().length }} ativos · {{ scoredCount() }} com score</span>
        </div>
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
        <div class="mmap__legend">
          @if (colorBy() === 'score') {
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--negative)"></span> 0-29 Evitar</span>
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--warning)"></span> 30-69 Manter</span>
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--obsidian)"></span> 70-81 Acumular</span>
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--positive)"></span> 82+ Compra Forte</span>
          }
          @if (colorBy() === 'change') {
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--negative)"></span> Negativo</span>
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--text-quaternary)"></span> Neutro</span>
            <span class="mmap__legend-item"><span class="mmap__legend-dot" style="background: var(--positive)"></span> Positivo</span>
          }
        </div>
      }
      <iq-disclaimer />
    </div>
  `,
  styles: [`
    .mmap { width: 100%; }
    .mmap__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .mmap__header-left { display: flex; flex-direction: column; gap: 2px; }
    .mmap__title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
    .mmap__meta { font-size: 12px; color: var(--text-quaternary); }
    .mmap__toggles { display: flex; gap: 2px; }
    .mmap__toggle {
      border: none; background: transparent; padding: 6px 12px;
      font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500;
      color: var(--text-tertiary); border-radius: 2px; cursor: pointer;
    }
    .mmap__toggle:hover { color: var(--text-primary); background: var(--surface-2); }
    .mmap__toggle--active { color: var(--obsidian); background: var(--obsidian-bg); font-weight: 600; }
    .mmap__legend { display: flex; gap: 20px; margin-top: 12px; padding-top: 8px; }
    .mmap__legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-tertiary); }
    .mmap__legend-dot { width: 10px; height: 10px; border-radius: 2px; }
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

  readonly scoredCount = computed(() => this.items().filter(i => i.score > 0).length);

  readonly colorOptions = [
    { label: 'Variação', value: 'change' as const },
    { label: 'IQ-Score', value: 'score' as const },
    { label: 'Setor', value: 'sector' as const },
  ];

  onItemClick(item: TreemapItem): void {
    this.router.navigate(['/ativo', item.ticker]);
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
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
