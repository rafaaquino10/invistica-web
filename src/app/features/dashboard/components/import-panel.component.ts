import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'iq-import-panel',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-content">
        <i class="ph ph-wallet panel-icon"></i>
        <p class="panel-text">Conecte sua corretora para acompanhar seu portfólio</p>
        <div class="panel-actions">
          <button class="btn-primary cta">Conectar corretora</button>
          <a class="btn-outline cta" routerLink="/carteira">Entrada manual</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 24px; display: flex; align-items: center; justify-content: center; }
    .panel-content { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .panel-icon { font-size: 32px; color: var(--t4); }
    .panel-text { font-size: 13px; color: var(--t3); max-width: 240px; line-height: 1.5; }
    .panel-actions { display: flex; gap: 8px; }
    .btn-primary {
      padding: 8px 16px; background: var(--volt); color: #050505;
      border-radius: var(--radius); font-weight: 700; transition: opacity var(--transition-fast);
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-outline {
      padding: 8px 16px; border: 1px solid var(--border); color: var(--t2);
      border-radius: var(--radius); font-weight: 700; transition: border-color var(--transition-fast);
    }
    .btn-outline:hover { border-color: var(--border-hover); }
  `]
})
export class ImportPanelComponent {}
