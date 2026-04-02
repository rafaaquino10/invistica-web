import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';

@Component({
  selector: 'dash-ibov',
  standalone: true,
  template: `
    <div class="ibov">
      <span class="ibov__label mono">IBOVESPA</span>
      <span class="ibov__value mono">{{ value().toLocaleString('pt-BR') }}</span>
      <div class="ibov__row">
        <span class="ibov__pct mono" [class.positive]="changePct() >= 0" [class.negative]="changePct() < 0">
          {{ changePct() >= 0 ? '+' : '' }}{{ changePct().toFixed(2) }}%
        </span>
        <svg viewBox="0 0 60 24" class="ibov__spark" preserveAspectRatio="none">
          <polyline [attr.points]="sparkPoints()" fill="none"
                    [attr.stroke]="changePct() >= 0 ? 'var(--positive)' : 'var(--negative)'"
                    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="ibov__meta">
        <span class="mono">Abert {{ opening().toLocaleString('pt-BR') }}</span>
        <span class="mono">Máx {{ high().toLocaleString('pt-BR') }}</span>
      </div>
    </div>
  `,
  styles: [`
    .ibov {
      background: var(--surface-1); border: 1px solid var(--border-default);
      border-radius: var(--radius); padding: 14px 16px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .ibov__label {
      font-size: 9px; color: var(--text-tertiary); text-transform: uppercase;
      letter-spacing: 0.08em; font-weight: 600;
    }
    .ibov__value { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
    .ibov__row { display: flex; align-items: center; gap: 8px; }
    .ibov__pct { font-size: 11px; font-weight: 600; }
    .ibov__spark { width: 60px; height: 24px; flex-shrink: 0; }
    .ibov__meta { display: flex; gap: 10px; font-size: 8px; color: var(--text-quaternary); margin-top: 2px; }
    .positive { color: var(--positive); }
    .negative { color: var(--negative); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardIbovComponent implements OnInit {
  readonly value = signal(131842);
  readonly opening = signal(130704);
  readonly changePct = signal(0.87);
  readonly high = signal(132105);
  readonly sparkPoints = signal('');

  ngOnInit(): void {
    // Generate spark
    const pts: number[] = [];
    let y = 12;
    for (let i = 0; i < 15; i++) {
      y += (Math.random() - 0.45) * 3;
      y = Math.max(3, Math.min(21, y));
      pts.push(y);
    }
    this.sparkPoints.set(pts.map((v, i) => `${(i * 60 / 14).toFixed(1)},${v.toFixed(1)}`).join(' '));
  }
}
