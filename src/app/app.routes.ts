import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  // Landing — layout próprio, sem shell
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },

  // App — dentro do shell (sidebar + header + ticker tape)
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'explorar',
        loadComponent: () =>
          import('./features/explorer/explorer.component').then(m => m.ExplorerComponent),
      },
      {
        path: 'ativo/:ticker',
        loadComponent: () =>
          import('./features/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent),
      },
      {
        path: 'comparar',
        loadComponent: () =>
          import('./features/compare/compare.component').then(m => m.CompareComponent),
      },
      {
        path: 'decidir',
        loadComponent: () =>
          import('./features/decide/decide.component').then(m => m.DecideComponent),
      },
      {
        path: 'carteiras-inteligentes',
        loadComponent: () =>
          import('./features/smart-portfolios/smart-portfolios.component').then(m => m.SmartPortfoliosComponent),
      },
      {
        path: 'carteira',
        loadComponent: () =>
          import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent),
      },
      {
        path: 'dividendos',
        loadComponent: () =>
          import('./features/dividends/dividends.component').then(m => m.DividendsComponent),
      },
      {
        path: 'simulador',
        loadComponent: () =>
          import('./features/simulator/simulator.component').then(m => m.SimulatorComponent),
      },
      {
        path: 'radar',
        loadComponent: () =>
          import('./features/radar/radar.component').then(m => m.RadarComponent),
      },
      {
        path: 'mapa',
        loadComponent: () =>
          import('./features/market-map/market-map.component').then(m => m.MarketMapComponent),
      },
      {
        path: 'macro',
        loadComponent: () =>
          import('./features/macro/macro.component').then(m => m.MacroComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
