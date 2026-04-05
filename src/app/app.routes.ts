import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { planGuard } from './core/guards/plan.guard';

export const routes: Routes = [
  // ── Landing (public, outside shell) ──
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },

  // ── Auth routes (outside shell) ──
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent),
  },

  // ── Checkout routes (outside shell) ──
  {
    path: 'checkout/sucesso',
    loadComponent: () => import('./features/checkout-page/checkout-sucesso.component').then(m => m.CheckoutSucessoComponent),
  },
  {
    path: 'checkout/falha',
    loadComponent: () => import('./features/checkout-page/checkout-falha.component').then(m => m.CheckoutFalhaComponent),
  },
  {
    path: 'checkout/pendente',
    loadComponent: () => import('./features/checkout-page/checkout-pendente.component').then(m => m.CheckoutPendenteComponent),
  },

  // ── Onboarding (authenticated, outside shell) ──
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [authGuard],
  },

  // ── Shell (authenticated) ──
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // Cockpit (Pro)
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [planGuard],
      },
      {
        path: 'ativo/:ticker',
        loadComponent: () => import('./features/ativo/ativo.component').then(m => m.AtivoComponent),
        canActivate: [planGuard],
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
        path: 'estrategia',
        loadComponent: () => import('./features/strategy/strategy.component').then(m => m.StrategyComponent),
        canActivate: [planGuard],
      },
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
        loadComponent: () => import('./features/radar-page/radar-page.component').then(m => m.RadarPageComponent),
        canActivate: [planGuard],
      },
      {
        path: 'macro',
        loadComponent: () => import('./features/macro-page/macro-page.component').then(m => m.MacroPageComponent),
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
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },

    ],
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
