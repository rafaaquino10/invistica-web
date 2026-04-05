import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import {
  StrategyService, StrategyRecommendation, RiskStatus,
  ShortCandidatesResponse, StrategySignalsResponse,
} from '../../core/services/strategy.service';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';

@Component({
  selector: 'iq-strategy',
  standalone: true,
  imports: [RouterLink, IqSkeletonComponent, IqDisclaimerComponent, IqEmptyStateComponent],
  templateUrl: './strategy.component.html',
  styleUrl: './strategy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrategyComponent implements OnInit {
  private readonly strategyService = inject(StrategyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Math = Math;

  readonly loading = signal(true);
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);
  readonly rec = signal<StrategyRecommendation | null>(null);
  readonly risk = signal<RiskStatus | null>(null);
  readonly shorts = signal<ShortCandidatesResponse | null>(null);
  readonly signals = signal<StrategySignalsResponse | null>(null);
  readonly activeTab = signal<'recommendation' | 'signals' | 'shorts'>('recommendation');

  // Computed
  readonly regimeLabel = computed(() => {
    const r = this.risk()?.regime;
    if (r === 'RISK_ON') return 'Mercado Otimista';
    if (r === 'RISK_OFF') return 'Mercado Defensivo';
    if (r === 'STAGFLATION') return 'Estagflacao';
    if (r === 'RECOVERY') return 'Recuperacao';
    return r ?? 'Carregando...';
  });

  readonly regimeColor = computed(() => {
    const r = this.risk()?.regime;
    if (r === 'RISK_ON') return 'var(--positive)';
    if (r === 'RISK_OFF') return 'var(--negative)';
    if (r === 'STAGFLATION') return 'var(--warning)';
    return 'var(--info)';
  });

  readonly confidencePct = computed(() => {
    const c = this.risk()?.confidence?.level;
    return c != null ? Math.round(c * 100) : 0;
  });

  readonly volStressLabel = computed(() => {
    const v = this.risk()?.vol_stress;
    if (!v) return '';
    if (v.is_stressed) return 'ESTRESSADO';
    if (v.ratio > 1.2) return 'ELEVADA';
    return 'NORMAL';
  });

  readonly volStressColor = computed(() => {
    const v = this.risk()?.vol_stress;
    if (!v) return 'var(--text-tertiary)';
    if (v.is_stressed) return 'var(--negative)';
    if (v.ratio > 1.2) return 'var(--warning)';
    return 'var(--positive)';
  });

  readonly exposureMultiplier = computed(() => {
    return this.risk()?.vol_stress?.exposure_multiplier ?? 1.0;
  });

  readonly signalCounts = computed(() => {
    const s = this.signals();
    return { buy: s?.n_buy ?? 0, sell: s?.n_sell ?? 0, hold: s?.n_hold ?? 0 };
  });

  // Score color helpers
  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--acid-dark)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  ratingClass(rating: string): string {
    switch (rating) {
      case 'STRONG_BUY': return 'badge--strong-buy';
      case 'BUY': return 'badge--buy';
      case 'HOLD': return 'badge--hold';
      case 'REDUCE': return 'badge--reduce';
      case 'AVOID': return 'badge--avoid';
      default: return 'badge--hold';
    }
  }

  ratingLabel(rating: string): string {
    switch (rating) {
      case 'STRONG_BUY': return 'Compra Forte';
      case 'BUY': return 'Acumular';
      case 'HOLD': return 'Manter';
      case 'REDUCE': return 'Reduzir';
      case 'AVOID': return 'Evitar';
      default: return rating;
    }
  }

  actionClass(action: string): string {
    switch (action) {
      case 'BUY': return 'action--buy';
      case 'SELL': return 'action--sell';
      case 'HOLD': return 'action--hold';
      case 'ROTATE': return 'action--rotate';
      default: return '';
    }
  }

  actionLabel(action: string): string {
    switch (action) {
      case 'BUY': return 'COMPRAR';
      case 'SELL': return 'VENDER';
      case 'HOLD': return 'MANTER';
      case 'ROTATE': return 'ROTACIONAR';
      default: return action;
    }
  }

  setTab(tab: 'recommendation' | 'signals' | 'shorts'): void {
    this.activeTab.set(tab);
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 15000);

    forkJoin({
      rec: this.strategyService.getRecommendation().pipe(catchError(e => {
        this.error.set('Erro ao carregar recomendacao');
        return of(null);
      })),
      risk: this.strategyService.getRiskStatus().pipe(catchError(() => of(null))),
      shorts: this.strategyService.getShortCandidates().pipe(catchError(() => of(null))),
      signals: this.strategyService.getSignals().pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.rec.set(res.rec);
      this.risk.set(res.risk);
      this.shorts.set(res.shorts);
      this.signals.set(res.signals);
      this.loading.set(false);
      setTimeout(() => this.ready.set(true), 50);
    });
  }
}
