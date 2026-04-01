import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';

@Component({
  selector: 'dash-ibov',
  standalone: true,
  template: `
    <section class="ibov">
      <div class="ibov__info">
        <span class="ibov__label mono">IBOVESPA</span>
        <span class="ibov__value mono">{{ value().toLocaleString('pt-BR') }}</span>
        <div class="ibov__change">
          <span class="ibov__pct mono" [class.positive]="changePct() >= 0" [class.negative]="changePct() < 0">
            {{ changePct() >= 0 ? '+' : '' }}{{ changePct().toFixed(2) }}%
          </span>
          <span class="ibov__pts mono">{{ changePts() >= 0 ? '+' : '' }}{{ changePts().toLocaleString('pt-BR') }} pts</span>
        </div>
      </div>
      <div class="ibov__chart">
        <svg [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH" preserveAspectRatio="none" class="ibov__svg">
          <!-- Opening line -->
          <line x1="0" [attr.x2]="svgW" [attr.y1]="openY()" [attr.y2]="openY()"
                stroke="var(--surface-3)" stroke-width="0.5" stroke-dasharray="3 3" />
          <!-- Area fill -->
          <polygon [attr.points]="areaPoints()" [attr.fill]="changePct() >= 0 ? 'rgba(26,122,69,0.08)' : 'rgba(194,48,40,0.08)'" />
          <!-- Price line -->
          <polyline [attr.points]="linePoints()" fill="none"
                    [attr.stroke]="changePct() >= 0 ? 'var(--positive)' : 'var(--negative)'"
                    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Last point dot -->
          <circle [attr.cx]="lastX()" [attr.cy]="lastY()"
                  r="2.5" [attr.fill]="changePct() >= 0 ? 'var(--positive)' : 'var(--negative)'" />
        </svg>
      </div>
      <div class="ibov__meta">
        <span class="ibov__meta-item mono">Abertura <strong>{{ opening().toLocaleString('pt-BR') }}</strong></span>
        <span class="ibov__meta-item mono">Mín <strong>{{ low().toLocaleString('pt-BR') }}</strong></span>
        <span class="ibov__meta-item mono">Máx <strong>{{ high().toLocaleString('pt-BR') }}</strong></span>
      </div>
    </section>
  `,
  styles: [`
    .ibov {
      background: var(--surface-1); border: 1px solid var(--border-default);
      border-radius: var(--radius); overflow: hidden;
      display: grid; grid-template-columns: 200px 1fr; grid-template-rows: 1fr auto;
    }
    .ibov__info {
      padding: 16px 20px; display: flex; flex-direction: column; gap: 4px;
      border-right: 1px solid var(--surface-3);
    }
    .ibov__label {
      font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .ibov__value { font-size: 26px; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
    .ibov__change { display: flex; align-items: baseline; gap: 8px; }
    .ibov__pct { font-size: 11px; font-weight: 600; }
    .ibov__pts { font-size: 11px; color: var(--text-tertiary); }
    .ibov__chart { padding: 8px 16px; display: flex; align-items: center; }
    .ibov__svg { width: 100%; height: 80px; }
    .ibov__meta {
      grid-column: 1 / -1; border-top: 1px solid var(--border-default);
      display: flex; gap: 16px; padding: 6px 20px;
    }
    .ibov__meta-item {
      font-size: 9px; color: var(--text-tertiary);
      strong { font-weight: 600; color: var(--text-secondary); }
    }
    .positive { color: var(--positive); }
    .negative { color: var(--negative); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardIbovComponent implements OnInit {
  readonly svgW = 400;
  readonly svgH = 80;

  readonly value = signal(131842);
  readonly opening = signal(130704);
  readonly changePct = signal(0.87);
  readonly changePts = signal(1138);
  readonly high = signal(132105);
  readonly low = signal(130520);

  private prices = signal<number[]>([]);

  readonly openY = signal(0);
  readonly linePoints = signal('');
  readonly areaPoints = signal('');
  readonly lastX = signal(0);
  readonly lastY = signal(0);

  ngOnInit(): void {
    // Generate simulated intraday data (will be replaced with real data)
    const open = this.opening();
    const pts: number[] = [open];
    let p = open;
    for (let i = 0; i < 60; i++) {
      p += (Math.random() - 0.47) * 80;
      p = Math.max(open - 1500, Math.min(open + 2000, p));
      pts.push(p);
    }
    pts[pts.length - 1] = this.value();
    this.prices.set(pts);

    const min = Math.min(...pts) - 200;
    const max = Math.max(...pts) + 200;
    const range = max - min || 1;
    const pad = 4;

    const toY = (v: number) => pad + (this.svgH - 2 * pad) * (1 - (v - min) / range);
    const stepX = this.svgW / (pts.length - 1);

    const openYVal = toY(open);
    this.openY.set(openYVal);

    const coords = pts.map((v, i) => `${(i * stepX).toFixed(1)},${toY(v).toFixed(1)}`);
    this.linePoints.set(coords.join(' '));

    const lastIdx = pts.length - 1;
    this.lastX.set(lastIdx * stepX);
    this.lastY.set(toY(pts[lastIdx]));

    // Area between price and opening
    this.areaPoints.set(
      `0,${openYVal.toFixed(1)} ${coords.join(' ')} ${(lastIdx * stepX).toFixed(1)},${openYVal.toFixed(1)}`
    );
  }
}
