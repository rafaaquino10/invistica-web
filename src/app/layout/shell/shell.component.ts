import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { TickerTapeComponent } from '../ticker-tape/ticker-tape.component';

@Component({
  selector: 'iq-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, TickerTapeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iq-header />
    <div class="shell-body" [class.collapsed]="sidebar.collapsed()">
      <iq-sidebar />
      <main class="shell-content">
        <div class="shell-content-inner">
          <router-outlet />
        </div>
      </main>
    </div>
    <iq-ticker-tape />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bg);
    }

    .shell-body {
      display: flex;
      flex: 1;
      padding-top: var(--header-h);
      padding-bottom: var(--ticker-h);
      transition: padding-left var(--transition-base);
      padding-left: var(--sidebar-w);
    }

    .shell-body.collapsed {
      padding-left: var(--sidebar-w-collapsed);
    }

    .shell-content {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
    }

    .shell-content-inner {
      max-width: var(--content-max-w);
      margin: 0 auto;
      padding: 24px;
    }
  `]
})
export class ShellComponent {
  protected readonly sidebar = inject(SidebarService);
  protected readonly theme = inject(ThemeService);
}
