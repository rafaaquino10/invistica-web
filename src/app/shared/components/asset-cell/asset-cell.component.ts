import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

@Component({
  selector: 'iq-asset-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cell">
      @if (!logoError()) {
        <img class="logo"
             [src]="logoUrl()"
             [alt]="ticker()"
             (error)="logoError.set(true)"
             loading="lazy" />
      } @else {
        <span class="logo-fallback">
          <span>{{ initials() }}</span>
        </span>
      }
      <div class="info">
        <span class="cell-ticker mono">{{ ticker() }}</span>
        <span class="cell-name">{{ shortName() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .logo {
      width: 28px; height: 28px; border-radius: 2px;
      object-fit: cover; flex-shrink: 0;
    }
    .logo-fallback {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 2px;
      background: var(--elevated); flex-shrink: 0;
      font-family: var(--font-ui); font-size: 9px; font-weight: 700; color: var(--t3);
    }
    .info { display: flex; flex-direction: column; min-width: 0; }
    .cell-ticker { font-size: 12px; font-weight: 700; color: var(--t1); }
    .cell-name {
      font-family: var(--font-ui); font-size: 9px; color: var(--t3);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
  `]
})
export class AssetCellComponent {
  ticker = input.required<string>();
  name = input<string>('');

  readonly logoError = signal(false);

  logoUrl = () =>
    `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${this.ticker()}.jpg`;

  initials = () => this.ticker().replace(/\d+$/, '').slice(0, 2);

  shortName = () => {
    const n = this.name();
    if (!n) return '';
    return n
      .replace(/\b(S\.?A\.?|LTDA|CIA|HOLDING|PARTICIPACOES|PARTICIPAÇÕES|INVESTIMENTOS)\b\.?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };
}
