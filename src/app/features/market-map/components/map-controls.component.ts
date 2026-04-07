import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

export interface MapOptions {
  sizeMode: 'market_cap' | 'equal';
  colorMode: 'change' | 'score' | 'dy';
  groupBy: 'sector' | 'cluster';
  highlightPortfolio: boolean;
}

@Component({
  selector: 'iq-map-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div class="control">
        <span class="label">Tamanho</span>
        <select class="sel" [value]="opts.sizeMode" (change)="update('sizeMode', $any($event.target).value)">
          <option value="market_cap">Market Cap</option>
          <option value="equal">Peso igual</option>
        </select>
      </div>
      <div class="control">
        <span class="label">Cor</span>
        <select class="sel" [value]="opts.colorMode" (change)="update('colorMode', $any($event.target).value)">
          <option value="change">Variação dia</option>
          <option value="score">Score IQ</option>
          <option value="dy">DY Projetado</option>
        </select>
      </div>
      <div class="control">
        <span class="label">Agrupar</span>
        <select class="sel" [value]="opts.groupBy" (change)="update('groupBy', $any($event.target).value)">
          <option value="sector">Setor</option>
          <option value="cluster">Cluster IQ</option>
        </select>
      </div>
      @if (hasPortfolio()) {
        <label class="control toggle-control">
          <input type="checkbox" [checked]="opts.highlightPortfolio" (change)="update('highlightPortfolio', !opts.highlightPortfolio)" />
          <span class="label">Destacar carteira</span>
        </label>
      }
    </div>
  `,
  styles: [`
    .bar { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); flex-wrap: wrap; }
    .control { display: flex; align-items: center; gap: 6px; }
    .sel { height: 28px; padding: 0 8px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-family: var(--font-ui); font-size: 11px; }
    .sel:focus { border-color: var(--border-active); outline: none; }
    .sel option { background: var(--card); }
    .toggle-control { cursor: pointer; }
    input[type="checkbox"] { accent-color: var(--volt); }
  `]
})
export class MapControlsComponent {
  hasPortfolio = input(false);
  optionsChanged = output<MapOptions>();

  opts: MapOptions = { sizeMode: 'market_cap', colorMode: 'change', groupBy: 'sector', highlightPortfolio: true };

  update(key: keyof MapOptions, value: any): void {
    (this.opts as any)[key] = value;
    this.optionsChanged.emit({ ...this.opts });
  }
}
