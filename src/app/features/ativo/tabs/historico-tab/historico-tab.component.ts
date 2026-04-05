import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, filter } from 'rxjs';
import { ScoreService } from '../../../../core/services/score.service';
import type { ScoreHistory } from '../../../../core/models/score.model';
import { IqLineChartComponent, LineSeries } from '../../../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../../../shared/components/iq-empty-state/iq-empty-state.component';

@Component({
  selector: 'iq-historico-tab',
  standalone: true,
  imports: [IqLineChartComponent, IqSkeletonComponent, IqEmptyStateComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else if (series().length > 0) {
      <div class="hist">
        <h4 class="hist__title">Evolução do IQ-Score (últimos 12 meses)</h4>
        <iq-line-chart [series]="series()" />
      </div>
    } @else {
      <iq-empty-state title="Sem histórico suficiente" description="Dados de score serão exibidos após acumular histórico." />
    }
  `,
  styles: [`
    .hist { max-width: 600px; }
    .hist__title { font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoTabComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly scoreService = inject(ScoreService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly series = signal<LineSeries[]>([]);

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    const t = this.ticker(); if (!t) return; // direct call
    of(t).pipe(

      switchMap(t => this.scoreService.getHistory(t, 12).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(hist => {
      if (hist?.history?.length) {
        const sorted = [...hist.history].reverse();
        const iqData = sorted.map(h => h.iq_score ?? 0);
        const quantiData = sorted.map(h => h.score_quanti ?? 0);
        const qualiData = sorted.map(h => h.score_quali ?? 0);
        const valData = sorted.map(h => h.score_valuation ?? 0);

        const lines: LineSeries[] = [
          { name: 'IQ-Score', data: iqData, color: 'var(--obsidian)' },
          { name: 'Quanti', data: quantiData, color: 'var(--info)' },
          { name: 'Quali', data: qualiData, color: 'var(--positive)' },
          { name: 'Valuation', data: valData, color: 'var(--warning)', dashed: true },
        ];
        this.series.set(lines);
      }
      this.loading.set(false);
    });
  }
}
