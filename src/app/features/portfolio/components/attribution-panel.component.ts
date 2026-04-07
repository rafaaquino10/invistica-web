import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface SectorAttrib { sector: string; weight: number; return_pct: number; contribution: number; }

@Component({
  selector: 'iq-attribution-panel',
  standalone: true,
  imports: [DecimalPipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">ATRIBUIÇÃO</span>
      @if (sectors().length > 0) {
        <table>
          <thead><tr><th>Setor</th><th class="num">Peso</th><th class="num">Retorno</th><th class="num">Contrib.</th></tr></thead>
          <tbody>
            @for (s of sectors(); track s.sector) {
              <tr>
                <td class="label">{{ s.sector }}</td>
                <td class="num mono">{{ s.weight | percent:'1.0-0' }}</td>
                <td class="num mono" [class.pos]="s.return_pct > 0" [class.neg]="s.return_pct < 0">{{ s.return_pct | percent:'1.1-1' }}</td>
                <td class="num mono" [class.pos]="s.contribution > 0" [class.neg]="s.contribution < 0">{{ s.contribution | percent:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <span class="empty label">Indisponível</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 5px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); }
    .num { text-align: right; }
    .empty { color: var(--t4); }
  `]
})
export class AttributionPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  portfolioId = input('default');
  readonly sectors = signal<SectorAttrib[]>([]);

  ngOnInit(): void {
    this.api.get<{ sectors: SectorAttrib[] }>(`/analytics/portfolio/${this.portfolioId()}/attribution`).subscribe({
      next: d => this.sectors.set(d.sectors || []),
      error: () => {},
    });
  }
}
