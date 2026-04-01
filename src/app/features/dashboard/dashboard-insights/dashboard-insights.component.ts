import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IqTickerLogoComponent } from '../../../shared/components/iq-ticker-logo/iq-ticker-logo.component';

export interface InsightCard {
  type: 'upgrade' | 'risk' | 'dividend' | 'opportunity' | 'alert' | 'news';
  tag: string;
  text: string;
  footer?: string;
  timestamp?: string;
}

export interface RecommendedAsset {
  ticker: string;
  company_name: string;
  score: number;
  margin?: number | null;
}

export interface UpcomingDividend {
  day: string;
  month: string;
  ticker: string;
  detail: string;
  userAmount?: number;
}

@Component({
  selector: 'dash-insights',
  standalone: true,
  imports: [RouterLink, DatePipe, IqTickerLogoComponent],
  template: `
    <section class="insights">
      <!-- LEFT: MOTOR -->
      <div class="insights__left">
        <div class="insights__header">
          <h3 class="insights__title">O QUE O MOTOR ESTÁ VENDO</h3>
          <a class="insights__link" routerLink="/radar">Ver tudo →</a>
        </div>
        <div class="insights__stack">
          @for (card of cards(); track $index) {
            <div class="insights__card" [style.borderLeftColor]="borderColor(card.type)">
              <div class="insights__card-top">
                <span class="insights__pill" [style.color]="pillColor(card.type)" [style.backgroundColor]="pillBg(card.type)">{{ card.tag }}</span>
                @if (card.timestamp) {
                  <span class="insights__time mono">{{ card.timestamp }}</span>
                }
              </div>
              <p class="insights__text">{{ card.text }}</p>
              @if (card.footer) {
                <span class="insights__footer mono">{{ card.footer }}</span>
              }
            </div>
          }
          @if (cards().length === 0) {
            <div class="insights__empty">Nenhum insight disponível.</div>
          }
        </div>
      </div>

      <!-- RIGHT: 3 CARDS -->
      <div class="insights__right">
        <!-- MOTOR RECOMENDA -->
        <div class="insights__rcard">
          <div class="insights__rcard-header">
            <h3 class="insights__rcard-title mono">MOTOR RECOMENDA</h3>
            <a class="insights__link" routerLink="/explorar">Explorar →</a>
          </div>
          @for (a of recommended(); track a.ticker) {
            <a class="insights__rec-item" [routerLink]="'/ativo/' + a.ticker">
              <iq-ticker-logo [ticker]="a.ticker" [size]="20" />
              <span class="insights__rec-ticker mono">{{ a.ticker }}</span>
              <span class="insights__rec-name">{{ a.company_name }}</span>
              <span class="insights__rec-score mono" [style.color]="scoreColor(a.score)">{{ a.score }}</span>
              @if (a.margin != null && a.margin > 0) {
                <span class="insights__rec-margin mono">+{{ (a.margin * 100).toFixed(0) }}%</span>
              }
            </a>
          }
          @if (recommended().length === 0) {
            <span class="insights__empty-sm">Sem recomendações.</span>
          }
        </div>

        <!-- PRÓXIMOS DIVIDENDOS -->
        <div class="insights__rcard">
          <h3 class="insights__rcard-title mono">PRÓXIMOS DIVIDENDOS</h3>
          @for (d of dividends(); track $index) {
            <div class="insights__div-item">
              <div class="insights__div-date">
                <span class="insights__div-day mono">{{ d.day }}</span>
                <span class="insights__div-month mono">{{ d.month }}</span>
              </div>
              <div class="insights__div-info">
                <span class="insights__div-ticker mono">{{ d.ticker }}</span>
                <span class="insights__div-detail">{{ d.detail }}</span>
              </div>
              @if (d.userAmount) {
                <span class="insights__div-amount mono">R$ {{ d.userAmount.toFixed(2) }}</span>
              } @else {
                <span class="insights__div-amount mono insights__div-amount--na">—</span>
              }
            </div>
          }
          @if (dividends().length === 0) {
            <span class="insights__empty-sm">Nenhum provento próximo.</span>
          }
        </div>

        <!-- EQUITY CURVE MINI -->
        <div class="insights__rcard">
          <div class="insights__rcard-header">
            <h3 class="insights__rcard-title mono">EQUITY CURVE</h3>
            <span class="insights__rcard-period mono">12M</span>
          </div>
          <svg viewBox="0 0 300 80" class="insights__equity" preserveAspectRatio="none">
            <!-- Area fill -->
            <polygon points="0,80 0,60 30,55 60,50 90,52 120,45 150,42 180,38 210,35 240,30 270,28 300,25 300,80" fill="var(--obsidian)" opacity="0.06" />
            <!-- Carteira -->
            <polyline points="0,60 30,55 60,50 90,52 120,45 150,42 180,38 210,35 240,30 270,28 300,25"
                      fill="none" stroke="var(--obsidian)" stroke-width="1.5" stroke-linecap="round" />
            <!-- CDI -->
            <polyline points="0,60 30,58 60,56 90,54 120,52 150,50 180,48 210,46 240,44 270,42 300,40"
                      fill="none" stroke="var(--text-quaternary)" stroke-width="0.8" />
            <!-- IBOV -->
            <polyline points="0,60 30,57 60,59 90,53 120,55 150,48 180,50 210,45 240,42 270,38 300,35"
                      fill="none" stroke="var(--text-quaternary)" stroke-width="0.8" stroke-dasharray="4 3" />
          </svg>
          <div class="insights__equity-legend">
            <span class="insights__eq-leg mono"><span class="insights__eq-dot" style="background:var(--obsidian)"></span>Carteira +15%</span>
            <span class="insights__eq-leg mono"><span class="insights__eq-dot" style="background:var(--text-quaternary)"></span>CDI +8%</span>
            <span class="insights__eq-leg mono"><span class="insights__eq-dot" style="background:var(--text-quaternary)"></span>IBOV +10%</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .insights { display: grid; grid-template-columns: 1fr 340px; gap: 16px; }

    .insights__left { display: flex; flex-direction: column; gap: 0; }
    .insights__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .insights__title { font-size: 11px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.04em; }
    .insights__link { font-size: 10px; color: var(--text-tertiary); text-decoration: none; &:hover { color: var(--obsidian); } }

    .insights__stack {
      border: 1px solid var(--border-default); border-radius: var(--radius);
      overflow: hidden; display: flex; flex-direction: column; gap: 1px; background: var(--border-default);
    }
    .insights__card {
      padding: 13px 16px; background: var(--surface-1); border-left: 3px solid;
      cursor: default; transition: background 0.12s;
      &:hover { background: var(--surface-2); }
    }
    .insights__card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .insights__pill {
      font-family: 'IBM Plex Mono', monospace; font-size: 7px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 5px; border-radius: 1px;
    }
    .insights__time { font-size: 8px; color: var(--text-quaternary); }
    .insights__text { font-size: 11px; line-height: 1.4; color: var(--text-primary); }
    .insights__footer { font-size: 9px; color: var(--text-tertiary); margin-top: 4px; display: block; }

    // RIGHT
    .insights__right { display: flex; flex-direction: column; gap: 16px; }
    .insights__rcard {
      background: var(--surface-1); border: 1px solid var(--border-default);
      border-radius: var(--radius); padding: 14px 16px;
    }
    .insights__rcard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .insights__rcard-title { font-size: 9px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.10em; margin-bottom: 10px; }
    .insights__rcard-header .insights__rcard-title { margin-bottom: 0; }
    .insights__rcard-period { font-size: 9px; color: var(--text-quaternary); }

    .insights__rec-item {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 0; border-bottom: 1px solid var(--border-default);
      text-decoration: none; color: inherit;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-2); margin: 0 -8px; padding: 5px 8px; border-radius: var(--radius); }
    }
    .insights__rec-ticker { font-size: 11px; font-weight: 700; width: 52px; color: var(--text-primary); }
    .insights__rec-name { font-size: 9px; color: var(--text-tertiary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .insights__rec-score { font-size: 15px; font-weight: 700; }
    .insights__rec-margin { font-size: 9px; font-weight: 600; color: var(--positive); width: 36px; text-align: right; }

    .insights__div-item {
      display: flex; align-items: center; gap: 10px;
      padding: 5px 0; border-bottom: 1px solid var(--border-default);
      &:last-child { border-bottom: none; }
    }
    .insights__div-date { display: flex; flex-direction: column; align-items: center; min-width: 28px; }
    .insights__div-day { font-size: 15px; font-weight: 700; color: var(--obsidian); line-height: 1; }
    .insights__div-month { font-size: 7px; text-transform: uppercase; color: var(--text-tertiary); }
    .insights__div-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
    .insights__div-ticker { font-size: 11px; font-weight: 700; color: var(--text-primary); }
    .insights__div-detail { font-size: 9px; color: var(--text-tertiary); }
    .insights__div-amount { font-size: 11px; font-weight: 700; color: var(--positive); }
    .insights__div-amount--na { color: var(--text-quaternary); }

    .insights__equity { width: 100%; height: 80px; display: block; }
    .insights__equity-legend { display: flex; gap: 12px; margin-top: 8px; }
    .insights__eq-leg { font-size: 9px; color: var(--text-tertiary); display: flex; align-items: center; gap: 4px; }
    .insights__eq-dot { width: 6px; height: 2px; border-radius: 1px; flex-shrink: 0; }

    .insights__empty { font-size: 11px; color: var(--text-tertiary); padding: 20px; text-align: center; background: var(--surface-1); }
    .insights__empty-sm { font-size: 10px; color: var(--text-tertiary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardInsightsComponent {
  readonly cards = input<InsightCard[]>([]);
  readonly recommended = input<RecommendedAsset[]>([]);
  readonly dividends = input<UpcomingDividend[]>([]);

  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--obsidian)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  borderColor(type: string): string {
    switch (type) {
      case 'upgrade': return 'var(--positive)';
      case 'risk': return 'var(--negative)';
      case 'dividend': return 'var(--info)';
      case 'alert': return 'var(--warning)';
      default: return 'var(--obsidian)';
    }
  }

  pillColor(type: string): string { return this.borderColor(type); }

  pillBg(type: string): string {
    switch (type) {
      case 'upgrade': return 'var(--positive-bg)';
      case 'risk': return 'var(--negative-bg)';
      case 'dividend': return 'var(--info-bg)';
      case 'alert': return 'var(--warning-bg)';
      default: return 'var(--obsidian-bg)';
    }
  }
}
