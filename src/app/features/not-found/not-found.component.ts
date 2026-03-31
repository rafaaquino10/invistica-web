import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';

@Component({
  selector: 'iq-not-found',
  standalone: true,
  imports: [RouterLink, IqButtonComponent],
  template: `
    <div class="nf">
      <div class="nf__card">
        <span class="nf__code mono">404</span>
        <h1 class="nf__title">Página não encontrada</h1>
        <p class="nf__desc">O endereço que você acessou não existe ou foi removido.</p>
        <iq-button variant="primary" routerLink="/dashboard">Voltar ao Dashboard</iq-button>
      </div>
    </div>
  `,
  styles: [`
    .nf { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--surface-0); }
    .nf__card { text-align: center; max-width: 400px; padding: 48px 32px; }
    .nf__code { font-size: 4rem; font-weight: 700; color: var(--text-quaternary); line-height: 1; }
    .nf__title { font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin: 16px 0 8px; }
    .nf__desc { font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 24px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
