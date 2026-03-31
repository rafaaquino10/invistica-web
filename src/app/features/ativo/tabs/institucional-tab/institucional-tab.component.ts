import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, forkJoin, catchError, of, filter } from 'rxjs';
import { TickerService } from '../../../../core/services/ticker.service';
import type { InstitutionalHolder, ShortInterestEntry } from '../../../../core/models/ticker.model';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../../../shared/components/iq-empty-state/iq-empty-state.component';
import { CompactNumberPipe } from '../../../../shared/pipes/compact-number.pipe';

@Component({
  selector: 'iq-institucional-tab',
  standalone: true,
  imports: [IqSkeletonComponent, IqEmptyStateComponent, CompactNumberPipe],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else {
      <div class="inst">
        <h4 class="inst__title">Top Fundos Institucionais</h4>
        @if (holders().length > 0) {
          <table class="inst__table">
            <thead>
              <tr>
                <th>Fundo</th>
                <th class="mono">Ações</th>
                <th class="mono">%</th>
                <th class="mono">Var 3m</th>
              </tr>
            </thead>
            <tbody>
              @for (h of holders(); track h.name) {
                <tr>
                  <td>{{ h.name }}</td>
                  <td class="mono">{{ h.shares | compactNumber }}</td>
                  <td class="mono">{{ (h.pct * 100).toFixed(2) }}%</td>
                  <td class="mono" [class.positive]="(h.change_3m ?? 0) > 0" [class.negative]="(h.change_3m ?? 0) < 0">
                    {{ h.change_3m != null ? (h.change_3m > 0 ? '+' : '') + (h.change_3m * 100).toFixed(1) + '%' : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <iq-empty-state title="Sem dados institucionais" description="Dados de holders não disponíveis para este ativo." />
        }

        <h4 class="inst__title" style="margin-top:24px">Short Interest</h4>
        @if (shortInterest().length > 0) {
          <table class="inst__table">
            <thead>
              <tr>
                <th class="mono">Data</th>
                <th class="mono">Short %</th>
                <th class="mono">Days to Cover</th>
              </tr>
            </thead>
            <tbody>
              @for (si of shortInterest(); track si.date) {
                <tr>
                  <td class="mono">{{ si.date }}</td>
                  <td class="mono">{{ (si.short_pct * 100).toFixed(2) }}%</td>
                  <td class="mono">{{ si.days_to_cover?.toFixed(1) ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <iq-empty-state title="Sem dados de short" />
        }
      </div>
    }
  `,
  styles: [`
    .inst { display: flex; flex-direction: column; }
    .inst__title { font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .inst__table { width: 100%; font-size: 0.8125rem; }
    .inst__table th { text-align: left; font-weight: 500; color: var(--text-tertiary); padding: 6px 8px; border-bottom: 1px solid var(--border-default); font-size: 0.6875rem; text-transform: uppercase; }
    .inst__table td { padding: 8px; border-bottom: 1px solid var(--border-default); color: var(--text-primary); }
    .positive { color: var(--positive); }
    .negative { color: var(--negative); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitucionalTabComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly holders = signal<InstitutionalHolder[]>([]);
  readonly shortInterest = signal<ShortInterestEntry[]>([]);

  ngOnInit(): void {
    const t = this.ticker(); if (!t) return; // direct call
    of(t).pipe(
      
      switchMap(t => forkJoin({
        holders: this.tickerService.getInstitutionalHolders(t).pipe(catchError(() => of({ ticker: t, holders: [], count: 0 }))),
        short: this.tickerService.getShortInterest(t).pipe(catchError(() => of({ ticker: t, short_interest: [] }))),
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ holders, short: si }) => {
      this.holders.set(holders.holders ?? []);
      this.shortInterest.set(si.short_interest ?? []);
      this.loading.set(false);
    });
  }
}
