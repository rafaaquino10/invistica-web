import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  // Landing — layout próprio, sem shell, público
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },

  // Auth — layout próprio, sem shell
  {
    path: 'entrar',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'criar-conta',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/callback/callback.component').then(m => m.CallbackComponent),
  },
  {
    path: 'auth/reset',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },

  // App — dentro do shell, protegido por AuthGuard
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
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
