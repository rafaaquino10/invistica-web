import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
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
    <section class="movers">
      <!-- ALTAS -->
      <div class="movers__card">
        <h3 class="movers__title mono">MAIORES ALTAS</h3>
        @for (item of gainers(); track item.ticker) {
          <a class="movers__item" [routerLink]="'/ativo/' + item.ticker">
            <span class="movers__ticker mono">{{ item.ticker }}</span>
            <svg [attr.viewBox]="'0 0 48 20'" class="movers__spark" preserveAspectRatio="none">
              <polyline [attr.points]="genSparkUp()" fill="none" stroke="var(--positive)" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            <span class="movers__price mono">{{ item.price.toFixed(2) }}</span>
            <span class="movers__change movers__change--up mono">+{{ item.change.toFixed(2) }}%</span>
          </a>
        }
      </div>

      <!-- BAIXAS -->
      <div class="movers__card">
        <h3 class="movers__title mono">MAIORES BAIXAS</h3>
        @for (item of losers(); track item.ticker) {
          <a class="movers__item" [routerLink]="'/ativo/' + item.ticker">
            <span class="movers__ticker mono">{{ item.ticker }}</span>
            <svg [attr.viewBox]="'0 0 48 20'" class="movers__spark" preserveAspectRatio="none">
              <polyline [attr.points]="genSparkDown()" fill="none" stroke="var(--negative)" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            <span class="movers__price mono">{{ item.price.toFixed(2) }}</span>
            <span class="movers__change movers__change--down mono">{{ item.change.toFixed(2) }}%</span>
          </a>
        }
      </div>

      <!-- EXPOSIÇÃO -->
      <div class="movers__card">
        <div class="movers__expo-header">
          <h3 class="movers__title mono">MINHA EXPOSIÇÃO</h3>
          <a class="movers__link" routerLink="/carteira">Carteira →</a>
        </div>
        @if (sectors().length > 0) {
          @for (s of sectors(); track s.name) {
            <div class="movers__sector">
              <span class="movers__sector-name">{{ s.name }}</span>
              <div class="movers__sector-bar-wrap">
                <div class="movers__sector-bar" [style.width.%]="s.pct"></div>
              </div>
              <span class="movers__sector-pct mono">{{ s.pct.toFixed(0) }}%</span>
            </div>
          }
          @if (hhi() > 0) {
            <div class="movers__hhi">
              <span class="movers__hhi-label mono">CONCENTRAÇÃO (HHI)</span>
              <div class="movers__hhi-row">
                <span class="movers__hhi-value mono">{{ hhi().toFixed(0) }}</span>
                <span class="movers__hhi-class" [class.positive]="hhi() < 1500" [class.negative]="hhi() >= 2500"
                      [style.color]="hhi() < 1500 ? 'var(--positive)' : hhi() >= 2500 ? 'var(--negative)' : 'var(--warning)'">
                  {{ hhi() < 1500 ? 'Baixa' : hhi() >= 2500 ? 'Alta' : 'Moderada' }}
                </span>
              </div>
            </div>
          }
        } @else {
          <p class="movers__empty">Adicione posições à carteira.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .movers { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .movers__card {
      background: var(--surface-1); border: 1px solid var(--border-default);
      border-radius: var(--radius); padding: 14px 16px;
    }
    .movers__title {
      font-size: 9px; font-weight: 600; color: var(--text-tertiary);
      text-transform: uppercase; letter-spacing: 0.10em; margin-bottom: 12px;
    }
    .movers__item {
      display: flex; align-items: center; gap: 0;
      padding: 6px 0; border-bottom: 1px solid var(--border-default);
      text-decoration: none; color: inherit;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-2); margin: 0 -8px; padding: 6px 8px; border-radius: var(--radius); }
    }
    .movers__ticker { font-size: 11px; font-weight: 700; width: 52px; flex-shrink: 0; color: var(--text-primary); }
    .movers__spark { width: 48px; height: 20px; flex-shrink: 0; margin-right: 8px; }
    .movers__price { font-size: 10px; width: 58px; text-align: right; color: var(--text-secondary); flex-shrink: 0; }
    .movers__change {
      font-size: 10px; font-weight: 700; width: 54px; text-align: right; flex-shrink: 0;
      &--up { color: var(--positive); }
      &--down { color: var(--negative); }
    }

    .movers__expo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .movers__link { font-size: 10px; color: var(--text-tertiary); text-decoration: none; &:hover { color: var(--text-primary); } }

    .movers__sector { display: flex; align-items: center; gap: 0; padding: 4px 0; }
    .movers__sector-name { font-size: 10px; color: var(--text-secondary); width: 70px; flex-shrink: 0; }
    .movers__sector-bar-wrap {
      flex: 1; height: 6px; background: var(--surface-3); border-radius: 1px; margin: 0 8px;
    }
    .movers__sector-bar { height: 100%; background: var(--text-primary); border-radius: 1px; }
    .movers__sector-pct { font-size: 10px; font-weight: 700; width: 36px; text-align: right; color: var(--text-primary); }

    .movers__hhi { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-default); }
    .movers__hhi-label { font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; }
    .movers__hhi-row { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
    .movers__hhi-value { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .movers__hhi-class { font-size: 11px; font-weight: 600; }

    .movers__empty { font-size: 11px; color: var(--text-tertiary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMoversComponent {
  readonly gainers = input<MoverItem[]>([]);
  readonly losers = input<MoverItem[]>([]);
  readonly sectors = input<SectorExposure[]>([]);
  readonly hhi = input(0);

  genSparkUp(): string {
    const pts: number[] = [];
    let y = 14;
    for (let i = 0; i < 10; i++) { y += (Math.random() - 0.35) * 3; y = Math.max(2, Math.min(18, y)); pts.push(y); }
    return pts.map((v, i) => `${(i * 48 / 9).toFixed(1)},${v.toFixed(1)}`).join(' ');
  }

  genSparkDown(): string {
    const pts: number[] = [];
    let y = 6;
    for (let i = 0; i < 10; i++) { y += (Math.random() - 0.65) * 3; y = Math.max(2, Math.min(18, y)); pts.push(y); }
    return pts.map((v, i) => `${(i * 48 / 9).toFixed(1)},${v.toFixed(1)}`).join(' ');
  }
}
