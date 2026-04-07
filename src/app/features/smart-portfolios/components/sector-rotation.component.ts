import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface RotationMatrix {
  matrix: Record<string, Record<string, number>>;
  clusters: Record<string, string>;
}

@Component({
  selector: 'iq-sector-rotation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">ROTAÇÃO SETORIAL POR REGIME</span>
      @if (regimes().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Setor</th>
                @for (r of regimes(); track r) {
                  <th [class.active-regime]="r === currentRegime()">{{ r }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (sector of sectors(); track sector) {
                <tr>
                  <td class="sector-name label">{{ sector }}</td>
                  @for (r of regimes(); track r) {
                    <td [class.active-regime]="r === currentRegime()">
                      <span class="tilt-badge" [class]="tiltClass(matrix()[r]?.[sector] || 0)">
                        {{ tiltLabel(matrix()[r]?.[sector] || 0) }}
                      </span>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty label">Indisponível</div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--t4); text-align: center; padding: 5px 6px;
      border-bottom: 1px solid var(--border); white-space: nowrap;
    }
    th:first-child { text-align: left; }
    th.active-regime { color: var(--volt); border-bottom-color: var(--volt); }
    td { padding: 4px 6px; text-align: center; border-bottom: 1px solid var(--border); }
    td.active-regime { background: var(--volt-dim); }
    .sector-name { text-align: left; font-size: 11px; color: var(--t2); white-space: nowrap; }
    .tilt-badge {
      display: inline-block; padding: 1px 6px; border-radius: var(--radius);
      font-size: 9px; font-weight: 700;
    }
    .tilt-fav { background: var(--pos-dim); color: var(--pos); }
    .tilt-unfav { background: var(--neg-dim); color: var(--neg); }
    .tilt-neutral { color: var(--t4); }
    .empty { text-align: center; padding: 20px; color: var(--t4); }
  `]
})
export class SectorRotationComponent implements OnInit {
  private readonly api = inject(ApiService);
  currentRegime = input('');

  readonly matrix = signal<Record<string, Record<string, number>>>({});
  readonly regimes = signal<string[]>([]);
  readonly sectors = signal<string[]>([]);

  ngOnInit(): void {
    this.api.get<RotationMatrix>('/analytics/sector-rotation').subscribe({
      next: d => {
        this.matrix.set(d.matrix || {});
        this.regimes.set(Object.keys(d.matrix || {}));
        const sectorSet = new Set<string>();
        for (const regime of Object.values(d.matrix || {})) {
          for (const s of Object.keys(regime)) sectorSet.add(s);
        }
        this.sectors.set([...sectorSet]);
      },
      error: () => {},
    });
  }

  tiltClass(val: number): string {
    if (val >= 2) return 'tilt-fav';
    if (val <= -2) return 'tilt-unfav';
    return 'tilt-neutral';
  }

  tiltLabel(val: number): string {
    if (val >= 2) return '▲';
    if (val <= -2) return '▼';
    return '—';
  }
}
