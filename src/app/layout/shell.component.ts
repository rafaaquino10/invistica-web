import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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
      @if (mobileMenuOpen()) {
        <div class="shell__overlay" (click)="mobileMenuOpen.set(false)"></div>
      }
      <iq-sidebar class="shell__sidebar"
        [class.shell__sidebar--open]="mobileMenuOpen()"
        (navigated)="mobileMenuOpen.set(false)" />
      <div class="shell__main">
        <div class="shell__header-row">
          <button class="shell__hamburger" (click)="toggleMobileMenu()" aria-label="Menu">
            <i [class]="mobileMenuOpen() ? 'ph ph-x' : 'ph ph-list'"></i>
          </button>
          <iq-header class="shell__header" />
        </div>
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

    .shell__sidebar { grid-row: 1 / -1; }

    .shell__main {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .shell__header-row {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .shell__hamburger {
      display: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      flex-shrink: 0;
      font-size: 20px;
    }

    .shell__header { flex: 1; min-width: 0; }
    .shell__tape { flex-shrink: 0; }

    .shell__content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 24px 32px;
      background: var(--surface-0);
    }

    .shell__overlay { display: none; }

    /* ═══ MOBILE: sidebar drawer ═══ */
    @media (max-width: 767px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .shell__sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: none;
      }

      .shell__sidebar--open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
      }

      .shell__overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 99;
        animation: fadeIn 200ms ease;
      }

      .shell__hamburger {
        display: flex;
      }

      .shell__content {
        padding: 16px;
      }
    }

    /* ═══ TABLET ═══ */
    @media (min-width: 768px) and (max-width: 1279px) {
      .shell__content { padding: 20px; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly planService = inject(PlanService);

  readonly mobileMenuOpen = signal(false);

  constructor() {
    this.planService.load();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }
}
