import { Component, ChangeDetectionStrategy } from '@angular/core';

interface TapeItem {
  label: string;
  value: string;
  change: number;
}

@Component({
  selector: 'iq-ticker-tape',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tape">
      <div class="tape-track">
        @for (item of items; track item.label) {
          <span class="tape-item">
            <span class="tape-label">{{ item.label }}</span>
            <span class="tape-value mono">{{ item.value }}</span>
            <span class="tape-change mono" [class.pos]="item.change >= 0" [class.neg]="item.change < 0">
              {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
            </span>
          </span>
        }
        <!-- Duplicate for seamless loop -->
        @for (item of items; track item.label + '-dup') {
          <span class="tape-item">
            <span class="tape-label">{{ item.label }}</span>
            <span class="tape-value mono">{{ item.value }}</span>
            <span class="tape-change mono" [class.pos]="item.change >= 0" [class.neg]="item.change < 0">
              {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
            </span>
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--ticker-h);
      z-index: 200;
    }

    .tape {
      height: 100%;
      background: var(--bg-alt);
      border-top: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .tape-track {
      display: flex;
      gap: 32px;
      white-space: nowrap;
      animation: scroll 40s linear infinite;
      padding-left: 16px;
    }

    .tape-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .tape-label {
      font-family: var(--font-ui);
      font-size: 11px;
      font-weight: 600;
      color: var(--t3);
    }

    .tape-value {
      font-size: 11px;
      font-weight: 600;
      color: var(--t1);
    }

    .tape-change {
      font-size: 11px;
      font-weight: 500;
    }

    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `]
})
export class TickerTapeComponent {
  readonly items: TapeItem[] = [
    { label: 'IBOV', value: '128.450', change: 1.23 },
    { label: 'IFIX', value: '3.210', change: 0.15 },
    { label: 'USD/BRL', value: '5,12', change: -0.48 },
    { label: 'SELIC', value: '14,25%', change: 0.00 },
    { label: 'IPCA', value: '4,87%', change: 0.12 },
    { label: 'S&P 500', value: '5.248', change: 0.67 },
    { label: 'BTC', value: '$67.840', change: 2.34 },
  ];
}
