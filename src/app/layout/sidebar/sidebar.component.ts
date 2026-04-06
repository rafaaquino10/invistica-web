import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../core/services/sidebar.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly sidebar = inject(SidebarService);

  readonly topItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'house' },
  ];

  readonly groups: NavGroup[] = [
    {
      title: 'DESCOBRIR',
      items: [
        { label: 'Explorar', route: '/explorar', icon: 'magnifying-glass' },
        { label: 'Comparar', route: '/comparar', icon: 'columns' },
      ],
    },
    {
      title: 'DECIDIR',
      items: [
        { label: 'Decidir', route: '/decidir', icon: 'crosshair' },
        { label: 'Carteiras IQ', route: '/carteiras-inteligentes', icon: 'briefcase' },
      ],
    },
    {
      title: 'INVESTIR',
      items: [
        { label: 'Carteira', route: '/carteira', icon: 'wallet' },
        { label: 'Dividendos', route: '/dividendos', icon: 'currency-dollar' },
        { label: 'Simulador', route: '/simulador', icon: 'chart-line-up' },
      ],
    },
    {
      title: 'MONITORAR',
      items: [
        { label: 'Radar', route: '/radar', icon: 'broadcast' },
        { label: 'Mapa', route: '/mapa', icon: 'map-trifold' },
        { label: 'Macro', route: '/macro', icon: 'chart-bar' },
      ],
    },
  ];
}
