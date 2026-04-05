import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;       // Phosphor icon class (regular)
  iconFill: string;   // Phosphor icon class (filled, for active state)
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
    { title: 'Cockpit', items: [
      { label: 'Dashboard', route: '/dashboard', icon: 'ph ph-squares-four', iconFill: 'ph-fill ph-squares-four' },
    ]},
    { title: 'Descoberta', items: [
      { label: 'Explorar', route: '/explorar', icon: 'ph ph-compass', iconFill: 'ph-fill ph-compass' },
      { label: 'Comparar', route: '/comparar', icon: 'ph ph-columns', iconFill: 'ph-fill ph-columns' },
      { label: 'Mapa', route: '/mapa', icon: 'ph ph-map-trifold', iconFill: 'ph-fill ph-map-trifold' },
    ]},
    { title: 'Patrimonio', items: [
      { label: 'Carteira', route: '/carteira', icon: 'ph ph-briefcase', iconFill: 'ph-fill ph-briefcase' },
      { label: 'Dividendos', route: '/dividendos', icon: 'ph ph-currency-dollar', iconFill: 'ph-fill ph-currency-dollar' },
    ]},
    { title: 'Inteligencia', items: [
      { label: 'Estrategia', route: '/estrategia', icon: 'ph ph-brain', iconFill: 'ph-fill ph-brain' },
      { label: 'Simulador', route: '/simulador', icon: 'ph ph-chart-line-up', iconFill: 'ph-fill ph-chart-line-up' },
      { label: 'Risk Scanner', route: '/risk-scanner', icon: 'ph ph-shield-warning', iconFill: 'ph-fill ph-shield-warning' },
      { label: 'Backtest', route: '/backtest', icon: 'ph ph-clock-counter-clockwise', iconFill: 'ph-fill ph-clock-counter-clockwise' },
    ]},
    { title: 'Monitoramento', items: [
      { label: 'Radar', route: '/radar', icon: 'ph ph-broadcast', iconFill: 'ph-fill ph-broadcast' },
      { label: 'Macro', route: '/macro', icon: 'ph ph-chart-bar', iconFill: 'ph-fill ph-chart-bar' },
    ]},
  ];

  readonly settingsItem: NavItem = {
    label: 'Config',
    route: '/configuracoes',
    icon: 'ph ph-gear',
    iconFill: 'ph-fill ph-gear',
  };
}
