import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'iq-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly expanded = signal(false);

  toggle(): void {
    this.expanded.update(v => !v);
  }

  readonly groups: NavGroup[] = [
    { title: 'COCKPIT', items: [
      { label: 'Dashboard', route: '/dashboard', icon: 'grid' },
    ]},
    { title: 'DESCOBERTA', items: [
      { label: 'Explorar', route: '/explorar', icon: 'search' },
      { label: 'Comparar', route: '/comparar', icon: 'columns' },
      { label: 'Mapa', route: '/mapa', icon: 'map' },
    ]},
    { title: 'PATRIMÔNIO', items: [
      { label: 'Carteira', route: '/carteira', icon: 'briefcase' },
      { label: 'Dividendos', route: '/dividendos', icon: 'dollar' },
      { label: 'Decidir', route: '/decidir', icon: 'scale' },
      { label: 'Income', route: '/income-planner', icon: 'trending' },
    ]},
    { title: 'INTELIGÊNCIA', items: [
      { label: 'Simulador', route: '/simulador', icon: 'sliders' },
      { label: 'Se eu tivesse', route: '/simulador/comparar', icon: 'rewind' },
      { label: 'Risk Scanner', route: '/risk-scanner', icon: 'shield' },
      { label: 'Institucional', route: '/institucional', icon: 'building' },
    ]},
    { title: 'MONITORAMENTO', items: [
      { label: 'Radar', route: '/radar', icon: 'radio' },
      { label: 'Macro', route: '/macro', icon: 'activity' },
    ]},
    { title: 'AVANÇADO', items: [
      { label: 'Backtest', route: '/backtest', icon: 'clock' },
      { label: 'Analytics', route: '/analytics', icon: 'bar-chart' },
    ]},
  ];

  readonly settingsItem: NavItem = { label: 'Config', route: '/configuracoes', icon: 'settings' };
}
