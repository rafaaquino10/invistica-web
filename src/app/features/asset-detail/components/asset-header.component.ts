import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

@Component({
  selector: 'iq-asset-header',
  standalone: true,
  imports: [DecimalPipe, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header-row">
      <div class="left">
        @if (!logoError()) {
          <img class="logo" [src]="logoUrl()" [alt]="ticker()" (error)="logoError.set(true)" />
        } @else {
          <span class="logo-fallback"><span>{{ initials() }}</span></span>
        }
        <div class="ident">
          <h1 class="ticker-name mono">{{ ticker() }}</h1>
          <span class="company-name">{{ companyName() }}</span>
        </div>
      </div>

      <div class="price-block">
        <span class="current-price mono">R$ {{ currentPrice() | number:'1.2-2' }}</span>
        @if (changePct() != null) {
          <span class="change mono" [class.pos]="changePct()! >= 0" [class.neg]="changePct()! < 0">
            {{ changePct()! >= 0 ? '▲ +' : '▼ ' }}{{ changePct()! | number:'1.2-2' }}%
          </span>
        }
        @if (volume()) {
          <span class="volume mono">Vol {{ volume()! | number:'1.0-0' }}</span>
        }
      </div>

      <div class="score-block">
        <span class="score-hero mono">{{ iqScore() ?? '--' }}</span>
        <iq-score-badge [score]="iqScore()" />
        <span class="rating-label label">{{ ratingLabel() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .header-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 0; gap: 24px; flex-wrap: wrap;
      border-bottom: 1px solid var(--border);
    }
    .left { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; border-radius: var(--radius); object-fit: cover; }
    .logo-fallback {
      width: 40px; height: 40px; border-radius: var(--radius); background: var(--elevated);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-ui); font-size: 14px; font-weight: 700; color: var(--t3);
    }
    .ident { display: flex; flex-direction: column; }
    .ticker-name { font-size: 24px; font-weight: 700; color: var(--t1); }
    .company-name { font-family: var(--font-ui); font-size: 13px; color: var(--t2); }
    .price-block { display: flex; align-items: baseline; gap: 10px; }
    .current-price { font-size: 28px; font-weight: 700; color: var(--t1); }
    .change { font-size: 14px; font-weight: 600; }
    .volume { font-size: 11px; color: var(--t3); }
    .score-block { display: flex; align-items: center; gap: 8px; }
    .score-hero { font-size: 32px; font-weight: 700; color: var(--t1); }
    .rating-label { color: var(--t2); }
  `]
})
export class AssetHeaderComponent {
  ticker = input.required<string>();
  companyName = input('');
  currentPrice = input(0);
  changePct = input<number | null>(null);
  volume = input<number | null>(null);
  iqScore = input<number | null>(null);
  ratingLabel = input('');

  readonly logoError = signal(false);
  logoUrl = () => `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${this.ticker()}.jpg`;
  initials = () => this.ticker().replace(/\d+$/, '').slice(0, 2);
}
