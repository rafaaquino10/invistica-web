import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { planGuard } from './core/guards/plan.guard';

export const routes: Routes = [
  // ── Auth routes (outside shell) ──
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },

  // ── Checkout routes (outside shell) ──
  {
    path: 'checkout/sucesso',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'checkout/falha',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'checkout/pendente',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },

  // ── Shell (authenticated) ──
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // Cockpit
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'ativo/:ticker',
        loadComponent: () => import('./features/ativo/ativo.component').then(m => m.AtivoComponent),
      },

      // Descoberta
      {
        path: 'explorar',
        loadComponent: () => import('./features/explorar/explorar.component').then(m => m.ExplorarComponent),
      },
      {
        path: 'comparar',
        loadComponent: () => import('./features/comparar/comparar.component').then(m => m.CompararComponent),
        canActivate: [planGuard],
      },
      {
        path: 'mapa',
        loadComponent: () => import('./features/mapa/mapa.component').then(m => m.MapaComponent),
        canActivate: [planGuard],
      },
      {
        path: 'termometro',
        loadComponent: () => import('./features/termometro/termometro.component').then(m => m.TermometroComponent),
        canActivate: [planGuard],
      },

      // Patrimônio
      {
        path: 'carteira',
        loadComponent: () => import('./features/carteira/carteira.component').then(m => m.CarteiraComponent),
        canActivate: [planGuard],
      },
      {
        path: 'dividendos',
        loadComponent: () => import('./features/dividendos/dividendos.component').then(m => m.DividendosComponent),
        canActivate: [planGuard],
      },
      {
        path: 'decidir',
        loadComponent: () => import('./features/decidir/decidir.component').then(m => m.DecidirComponent),
        canActivate: [planGuard],
      },
      {
        path: 'income-planner',
        loadComponent: () => import('./features/income-planner/income-planner.component').then(m => m.IncomePlannerComponent),
        canActivate: [planGuard],
      },

      // Inteligência
      {
        path: 'simulador',
        loadComponent: () => import('./features/simulador/simulador.component').then(m => m.SimuladorComponent),
        canActivate: [planGuard],
      },
      {
        path: 'simulador/comparar',
        loadComponent: () => import('./features/simulador-comparar/simulador-comparar.component').then(m => m.SimuladorCompararComponent),
        canActivate: [planGuard],
      },
      {
        path: 'risk-scanner',
        loadComponent: () => import('./features/risk-scanner/risk-scanner.component').then(m => m.RiskScannerComponent),
        canActivate: [planGuard],
      },
      {
        path: 'institucional',
        loadComponent: () => import('./features/institucional/institucional.component').then(m => m.InstitucionalComponent),
        canActivate: [planGuard],
      },

      // Monitoramento
      {
        path: 'radar',
        loadComponent: () => import('./features/radar/radar.component').then(m => m.RadarComponent),
        canActivate: [planGuard],
      },
      {
        path: 'macro',
        loadComponent: () => import('./features/macro/macro.component').then(m => m.MacroComponent),
        canActivate: [planGuard],
      },

      // Avançado
      {
        path: 'backtest',
        loadComponent: () => import('./features/backtest/backtest.component').then(m => m.BacktestComponent),
        canActivate: [planGuard],
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        canActivate: [planGuard],
      },

      // Conta
      {
        path: 'configuracoes',
        loadComponent: () => import('./features/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
      },

      // Default redirect
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
