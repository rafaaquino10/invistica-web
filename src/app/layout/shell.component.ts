import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { TickerTapeComponent } from './ticker-tape/ticker-tape.component';
import { PlanService } from '../core/services/plan.service';

@Component({
  selector: 'iq-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, TickerTapeComponent],
  template: `
    <div class="shell">
      <iq-sidebar class="shell__sidebar" />
      <div class="shell__main">
        <iq-header class="shell__header" />
        <iq-ticker-tape class="shell__tape" />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: auto 1fr;
      height: 100vh;
      overflow: hidden;
    }

    .shell__sidebar {
      grid-row: 1 / -1;
    }

    .shell__main {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .shell__header { flex-shrink: 0; }
    .shell__tape { flex-shrink: 0; }

    .shell__content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      background: var(--surface-0);
    }

    @media (max-width: 767px) {
      .shell { grid-template-columns: 1fr; }
      .shell__sidebar { display: none; }
      .shell__content { padding: var(--space-3); }
    }

    @media (min-width: 768px) and (max-width: 1279px) {
      .shell__content { padding: var(--space-4); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly planService = inject(PlanService);

  constructor() {
    this.planService.load();
  }
}
