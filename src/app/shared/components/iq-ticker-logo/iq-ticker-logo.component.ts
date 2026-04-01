import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

const BASE_URL = 'https://raw.githubusercontent.com/thefintz/icones-b3/main/icones';

@Component({
  selector: 'iq-ticker-logo',
  standalone: true,
  template: `
    @if (!errored()) {
      <img class="logo"
           [src]="logoUrl()"
           [alt]="ticker()"
           [style.width.px]="size()"
           [style.height.px]="size()"
           (error)="errored.set(true)"
           loading="lazy" />
    } @else {
      <span class="logo logo--fallback mono"
            [style.width.px]="size()"
            [style.height.px]="size()"
            [style.fontSize.px]="size() * 0.35">
        {{ ticker().substring(0, 2) }}
      </span>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo {
      border-radius: 50%;
      object-fit: contain;
      flex-shrink: 0;
      background: var(--surface-2);
    }
    .logo--fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: var(--text-tertiary);
      border: 1px solid var(--border-default);
      text-transform: uppercase;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqTickerLogoComponent {
  readonly ticker = input.required<string>();
  readonly size = input(24);
  readonly errored = signal(false);

  logoUrl(): string {
    return `${BASE_URL}/${this.ticker().toUpperCase()}.png`;
  }
}
