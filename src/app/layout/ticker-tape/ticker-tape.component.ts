import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';

interface TapeItem {
  ticker: string;
  price: number;
  delta: number;
}

@Component({
  selector: 'iq-ticker-tape',
  standalone: true,
  imports: [IqTickerLogoComponent],
  templateUrl: './ticker-tape.component.html',
  styleUrl: './ticker-tape.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerTapeComponent {
  readonly paused = signal(false);

  togglePause(): void {
    this.paused.update(v => !v);
  }

  readonly items: TapeItem[] = [
    { ticker: 'PETR4', price: 49.67, delta: 1.23 },
    { ticker: 'VALE3', price: 79.50, delta: -0.87 },
    { ticker: 'ITUB4', price: 32.15, delta: 0.45 },
    { ticker: 'BBDC4', price: 14.82, delta: -0.32 },
    { ticker: 'ABEV3', price: 12.90, delta: 0.18 },
    { ticker: 'WEGE3', price: 38.75, delta: 2.15 },
    { ticker: 'RENT3', price: 45.20, delta: -1.56 },
    { ticker: 'BBAS3', price: 28.90, delta: 0.67 },
    { ticker: 'MGLU3', price: 8.45, delta: -3.21 },
    { ticker: 'SUZB3', price: 55.30, delta: 0.92 },
    { ticker: 'ELET3', price: 41.80, delta: -0.45 },
    { ticker: 'HAPV3', price: 4.12, delta: 1.78 },
    { ticker: 'RADL3', price: 26.50, delta: -0.15 },
    { ticker: 'JBSS3', price: 34.60, delta: 0.34 },
    { ticker: 'B3SA3', price: 12.35, delta: -0.62 },
  ];
}
