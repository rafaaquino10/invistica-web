import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { planGuard } from './core/guards/plan.guard';

export const routes: Routes = [
  // ── Dev route (no auth) ──
  {
    path: 'dev/components',
    loadComponent: () => import('./features/dev-components/dev-components.component').then(m => m.DevComponentsComponent),
  },

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
        loadComponent: () => import('./features/explorer/explorer.component').then(m => m.ExplorerComponent),
      },
      {
        path: 'comparar',
        loadComponent: () => import('./features/compare/compare.component').then(m => m.CompareComponent),
        canActivate: [planGuard],
      },
      {
        path: 'mapa',
        loadComponent: () => import('./features/market-map/market-map.component').then(m => m.MarketMapComponent),
        canActivate: [planGuard],
      },
      {
        path: 'termometro',
        loadComponent: () => import('./features/thermometer/thermometer.component').then(m => m.ThermometerComponent),
        canActivate: [planGuard],
      },

      // Patrimônio
      {
        path: 'carteira',
        loadComponent: () => import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent),
        canActivate: [planGuard],
      },
      {
        path: 'dividendos',
        loadComponent: () => import('./features/dividends/dividends.component').then(m => m.DividendsComponent),
        canActivate: [planGuard],
      },
      {
        path: 'decidir',
        loadComponent: () => import('./features/decide/decide.component').then(m => m.DecideComponent),
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
        loadComponent: () => import('./features/scenario-simulator/scenario-simulator.component').then(m => m.ScenarioSimulatorComponent),
        canActivate: [planGuard],
      },
      {
        path: 'simulador/comparar',
        loadComponent: () => import('./features/what-if/what-if.component').then(m => m.WhatIfComponent),
        canActivate: [planGuard],
      },
      {
        path: 'risk-scanner',
        loadComponent: () => import('./features/risk-scanner/risk-scanner.component').then(m => m.RiskScannerComponent),
        canActivate: [planGuard],
      },
      {
        path: 'institucional',
        loadComponent: () => import('./features/institutional/institutional.component').then(m => m.InstitutionalComponent),
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
