import { Component, ChangeDetectionStrategy, inject, signal, output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

interface TopAsset { ticker: string; company_name: string; iq_score: number; rating_label: string; }

@Component({
  selector: 'iq-empty-portfolio',
  standalone: true,
  imports: [AssetCellComponent, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-page">
      <div class="hero glass">
        <i class="ph ph-wallet hero-icon"></i>
        <h1>Monte sua carteira</h1>
        <p>Conecte sua corretora para importar automaticamente ou adicione posições manualmente</p>
        <div class="hero-actions">
          <button class="btn-volt cta" (click)="connectBroker.emit()">Conectar Corretora</button>
          <button class="btn-outline cta" (click)="addManual.emit()">Adicionar Manualmente</button>
        </div>
      </div>

      @if (topAssets().length > 0) {
        <div class="top-section card">
          <span class="overline">ENQUANTO ISSO — TOP OPORTUNIDADES</span>
          <table>
            <tbody>
              @for (a of topAssets(); track a.ticker) {
                <tr class="row" (click)="goTo(a.ticker)">
                  <td><iq-asset-cell [ticker]="a.ticker" [name]="a.company_name" /></td>
                  <td><iq-score-badge [score]="a.iq_score" /></td>
                  <td class="label">{{ a.rating_label }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .empty-page { display: flex; flex-direction: column; gap: 20px; align-items: center; padding-top: 40px; }
    .hero {
      padding: 40px; text-align: center; display: flex; flex-direction: column;
      align-items: center; gap: 12px; max-width: 500px; border-radius: var(--radius);
    }
    .hero-icon { font-size: 48px; color: var(--t4); }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    p { font-size: 13px; color: var(--t2); line-height: 1.5; max-width: 360px; }
    .hero-actions { display: flex; gap: 10px; }
    .btn-volt {
      padding: 10px 20px; background: var(--volt); color: #050505;
      border-radius: var(--radius); font-weight: 700;
    }
    .btn-volt:hover { opacity: 0.9; }
    .btn-outline {
      padding: 10px 20px; border: 1px solid var(--border); color: var(--t2);
      border-radius: var(--radius); font-weight: 700;
    }
    .btn-outline:hover { border-color: var(--border-hover); }
    .top-section { padding: 16px; width: 100%; max-width: 600px; }
    table { width: 100%; border-spacing: 0; }
    td { padding: 8px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .row { cursor: pointer; transition: background var(--transition-fast); }
    .row:hover { background: var(--card-hover); }
  `]
})
export class EmptyPortfolioComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly topAssets = signal<TopAsset[]>([]);
  readonly connectBroker = output<void>();
  readonly addManual = output<void>();

  ngOnInit(): void {
    this.api.get<{ top: TopAsset[] }>('/scores/top', { limit: 5 }).subscribe({
      next: d => this.topAssets.set(d.top || []),
    });
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
