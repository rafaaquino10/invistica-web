import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface MoverItem {
  ticker: string;
  price: number;
  change: number;
}

export interface SectorExposure {
  name: string;
  pct: number;
}

@Component({
  selector: 'dash-movers',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mov">
      <div class="mov__header">
        <button class="mov__tab mono" [class.mov__tab--active]="tab() === 'up'" (click)="tab.set('up')">ALTAS</button>
        <button class="mov__tab mono" [class.mov__tab--active]="tab() === 'down'" (click)="tab.set('down')">BAIXAS</button>
      </div>
      @if (tab() === 'up') {
        @for (item of gainers(); track item.ticker) {
          <a class="mov__item" [routerLink]="'/ativo/' + item.ticker">
            <span class="mov__ticker mono">{{ item.ticker }}</span>
            <svg viewBox="0 0 40 16" class="mov__spark" preserveAspectRatio="none">
              <polyline [attr.points]="genSpark(true)" fill="none" stroke="var(--positive)" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            <span class="mov__change mov__change--up mono">+{{ item.change.toFixed(1) }}%</span>
          </a>
        }
      } @else {
        @for (item of losers(); track item.ticker) {
          <a class="mov__item" [routerLink]="'/ativo/' + item.ticker">
            <span class="mov__ticker mono">{{ item.ticker }}</span>
            <svg viewBox="0 0 40 16" class="mov__spark" preserveAspectRatio="none">
              <polyline [attr.points]="genSpark(false)" fill="none" stroke="var(--negative)" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            <span class="mov__change mov__change--down mono">{{ item.change.toFixed(1) }}%</span>
          </a>
        }
      }
    </div>
  `,
  styles: [`
    .mov {
      background: var(--surface-1); border: 1px solid var(--border-default);
      border-radius: var(--radius); padding: 14px 16px;
    }
    .mov__header { display: flex; gap: 2px; margin-bottom: 10px; }
    .mov__tab {
      border: none; background: transparent; padding: 4px 8px;
      font-size: 9px; font-weight: 500; color: var(--text-tertiary);
      cursor: pointer; border-radius: var(--radius); letter-spacing: 0.08em;
      &:hover { color: var(--text-primary); }
    }
    .mov__tab--active { color: var(--text-primary); background: var(--surface-2); font-weight: 600; }

    .mov__item {
      display: flex; align-items: center; gap: 0;
      padding: 5px 0; border-bottom: 1px solid var(--border-default);
      text-decoration: none; color: inherit;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-2); margin: 0 -8px; padding: 5px 8px; border-radius: var(--radius); }
    }
    .mov__ticker { font-size: 11px; font-weight: 700; width: 56px; color: var(--text-primary); }
    .mov__spark { width: 40px; height: 16px; flex: 1; margin: 0 6px; }
    .mov__change {
      font-size: 10px; font-weight: 700; text-align: right; min-width: 48px;
      &--up { color: var(--positive); }
      &--down { color: var(--negative); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMoversComponent {
  readonly gainers = input<MoverItem[]>([]);
  readonly losers = input<MoverItem[]>([]);
  readonly tab = signal<'up' | 'down'>('up');

  genSpark(up: boolean): string {
    const pts: number[] = [];
    let y = up ? 12 : 4;
    for (let i = 0; i < 8; i++) {
      y += (Math.random() - (up ? 0.35 : 0.65)) * 2.5;
      y = Math.max(1, Math.min(15, y));
      pts.push(y);
    }
    return pts.map((v, i) => `${(i * 40 / 7).toFixed(1)},${v.toFixed(1)}`).join(' ');
  }
}
