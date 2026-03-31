import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanService } from '../../../core/services/plan.service';
import { IqButtonComponent } from '../iq-button/iq-button.component';

@Component({
  selector: 'iq-pro-lock',
  standalone: true,
  imports: [RouterLink, IqButtonComponent],
  template: `
    @if (planService.isFree()) {
      <div class="pro-lock">
        <div class="pro-lock__overlay">
          <div class="pro-lock__content">
            <span class="pro-lock__badge mono">PRO</span>
            <span class="pro-lock__text">Desbloqueie com o plano Pro</span>
            <iq-button variant="primary" size="sm" routerLink="/configuracoes" [queryParams]="{ upgrade: true }">
              Fazer Upgrade
            </iq-button>
          </div>
        </div>
        <div class="pro-lock__blur">
          <ng-content />
        </div>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: [`
    .pro-lock { position: relative; }
    .pro-lock__blur {
      filter: blur(6px);
      pointer-events: none;
      user-select: none;
      opacity: 0.5;
    }
    .pro-lock__overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .pro-lock__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 32px;
      background: var(--surface-1);
      border: 1px solid var(--border-default);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
    }
    .pro-lock__badge {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #fff;
      background: var(--obsidian);
      padding: 2px 8px;
      border-radius: var(--radius);
      letter-spacing: 0.08em;
    }
    .pro-lock__text {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqProLockComponent {
  readonly planService = inject(PlanService);
}
