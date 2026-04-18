# InvestIQ Web — Frontend

## Regras para o Claude Code

- Nunca gerar codigo sem seguir o Design System Ocean Forge (secao abaixo).
- Nunca usar bibliotecas de componentes prontas (shadcn, MUI, Chakra). Componentes sao custom sobre Tailwind CSS.
- Todo dado financeiro exibido deve usar `tabular-nums` (font Geist Mono).
- Nao simplificar ou "dumbificar" implementacoes. O padrao e enterprise.
- Copy em PT-BR sempre. Termos tecnicos financeiros podem ficar em ingles quando nao ha traducao consolidada (ex: "spread", "drawdown").
- Zero emojis em qualquer lugar da interface.
- O frontend e um **thin client**. TODA logica de scoring, analytics, valuation e estrategia vive no backend. O front NUNCA recalcula, NUNCA duplica logica. Cada dado vem de `investiq-client.ts` chamando a API Railway.
- Antes de fechar a sessao: atualizar a secao "Ultima Sessao" deste arquivo com o que foi feito e o que falta.

---

## O que e

Frontend da plataforma InvestIQ. Consome a API FastAPI no Railway (40+ endpoints de analise quantamental de acoes B3).

**Repo separado:** este projeto (`investiq-web/`) e independente do backend (`investiq/`). O `investiq/web/` esta vazio (placeholder com `.gitkeep`).

## Backend API

- URL: `https://investiqbackend-production.up.railway.app`
- Swagger: `https://investiqbackend-production.up.railway.app/docs`
- Client: `src/lib/investiq-client.ts` — singleton `investiq` com `.get()`, `.post()`, `.put()`, `.delete()`

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 App Router |
| UI | React 19 + TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 + CSS variables |
| Animations | Framer Motion 11.15 |
| Charts | Lightweight Charts 5.1 (candle/price) + Recharts 2.15 (cartesiano) + D3 7.9 (viz) |
| State | tRPC (RC 11) + TanStack Query 5.64 |
| ORM | Prisma 6.2 + PostgreSQL (Supabase) |
| Auth | Custom JWT (jose) + OAuth (Google/GitHub) + Supabase SSR |
| Forms | React Hook Form 7.54 + Zod 3.24 |
| Payments | Mercado Pago SDK 2.12 (desabilitado — acesso gratuito) |
| Open Finance | react-pluggy-connect 2.12 |
| Toasts | Sonner 2.0 |
| Error tracking | Sentry 10.38 (opcional) |
| Fonts | Geist Sans (UI) + Geist Mono (dados financeiros) |
| Testing | Vitest 4.0 |
| Deploy | Vercel |

## Scripts

```
npm run dev          # Next.js + gateway (turbopack)
npm run build        # Build producao
npm run db:generate  # Prisma generate
npm run db:push      # Push schema para DB
npm run db:studio    # Prisma Studio (GUI)
npm run test         # Vitest
npm run type-check   # tsc --noEmit
```

---

## Design System: Ocean Forge

### Cores (CSS Variables)

**Light mode:**
- Background: `--light-bg: #F7F8FA`
- Cards: `--light-card: #FFFFFF`
- Hover: `--light-hover: #F1F3F5`
- Text: `--light-text: #1A1D23`
- Text secondary: `--light-text-secondary: #5A6170`
- Border: `--light-border: #E3E5EA`

**Dark mode:**
- Background: `--dark-bg: #0C0F17`
- Cards: `--dark-card: #13161F`
- Hover: `--dark-hover: #1C1F2A`
- Text: `--dark-text: #E0E2E8`
- Text secondary: `--dark-text-secondary: #8B919E`
- Border: `--dark-border: #232736`

**Semanticas:**
- Accent: `--accent-1`, `--accent-2`
- Positive: `--pos` (teal)
- Negative: `--neg` (red)
- Warning: `--warn` (amber)
- Sand Gold: `#C4AD78` (premium, scores 81+, logo iQ)
- Ocean Blue: `#2A5078` (primario)

### Score Tiers (cores)
- 81-100: Sand/Gold
- 61-80: Ocean Blue
- 41-60: Gray
- 21-40: Amber
- 0-20: Red

### Tipografia
- Font principal: Geist Sans (--font-geist-sans)
- Font mono: Geist Mono (--font-geist-mono) — obrigatorio em dados financeiros
- Tamanhos custom: caption, small, body, base, subheading, heading, title, display, hero

### Animacoes
- fade-in (0.3s), slide-up/down (0.3s), scale-in (0.2s), pulse-slow (3s)
- Framer Motion para sequencias complexas e stagger

### Espacamento
- v2-1 a v2-8 (CSS variables)
- Border radius: xs(2px), sm(4px), md(6px), lg/xl/2xl(8px), full(9999px)

---

## Estrutura do Projeto

```
investiq-web/
├── src/
│   ├── app/                          # App Router
│   │   ├── layout.tsx                # Root: Auth + TRPC + Theme providers
│   │   ├── middleware.ts             # Auth redirect rules
│   │   ├── error.tsx                 # Error boundary
│   │   ├── not-found.tsx             # 404
│   │   ├── robots.ts                 # SEO
│   │   ├── sitemap.ts               # Dynamic sitemap
│   │   │
│   │   ├── (marketing)/              # Paginas publicas (6)
│   │   │   ├── page.tsx              # Landing page (hero + features + CTA)
│   │   │   ├── backtest/             # Resultados backtest (charts + metricas)
│   │   │   ├── cookies/              # Politica de cookies
│   │   │   ├── privacidade/          # Politica de privacidade (LGPD)
│   │   │   ├── termos/               # Termos de servico
│   │   │   └── prototipos/           # Design prototype showcase
│   │   │
│   │   ├── (auth)/                   # Auth (3 paginas)
│   │   │   ├── login/                # Login + social + demo
│   │   │   ├── register/             # Registro + social
│   │   │   └── onboarding/           # Wizard 3 steps (perfil, setores, objetivo)
│   │   │
│   │   ├── (dashboard)/              # Protegidas — requerem auth (13 paginas)
│   │   │   ├── dashboard/            # KPI strip + performance + signals + regime + posicoes
│   │   │   ├── explorer/             # Screener: 6 lenses, colunas dinamicas, filtros
│   │   │   ├── ativo/[ticker]/       # Detalhe: 5 tabs (overview, valuation, dividendos, score, noticias)
│   │   │   ├── portfolio/            # Lista portfolios + criar
│   │   │   ├── portfolio/[id]/       # Detalhe: holdings, P&L, weighted view
│   │   │   ├── portfolio/importar/   # Import CSV wizard
│   │   │   ├── comparar/             # Comparacao lado a lado
│   │   │   ├── dividends/            # Calendario + yield analysis
│   │   │   ├── radar/                # Risk radar scatter
│   │   │   ├── mapa/                 # Heatmap setorial
│   │   │   ├── estrategias/          # Smart portfolios, alocacao, short candidates
│   │   │   ├── estrategias/[id]/     # Detalhe estrategia + backtest
│   │   │   └── settings/             # Preferencias, plano, conta
│   │   │
│   │   └── api/                      # API Routes (22 routes)
│   │       ├── auth/                 # login, register, logout, me, demo, github, google, callbacks
│   │       ├── trpc/[trpc]/          # Gateway tRPC
│   │       ├── mercadopago/          # checkout, manage, webhook
│   │       ├── jobs/                 # score-snapshot, weekly-report
│   │       ├── pipeline/             # trigger pipeline
│   │       ├── debug/pipeline/       # debug status
│   │       ├── onboarding/complete/  # salvar onboarding
│   │       ├── health/               # health check
│   │       └── og/                   # OG image generator
│   │
│   ├── components/                   # ~127 componentes custom
│   │   ├── ui/           (39)        # Design system: button, card, badge, input, modal, tabs, etc
│   │   ├── charts/       (11)        # price-chart, performance, radar, gauge, sparkline, donut, treemap
│   │   ├── score/        (10)        # gauge, xray, evidence, qualitative-cards, risk-lab, thesis, dossier
│   │   ├── layout/       (9)         # sidebar, header, bottom-nav, ticker-tape, theme-toggle, help-fab
│   │   ├── dashboard/    (8)         # kpi-strip, positions-table, opportunities, regime, signals, alerts
│   │   ├── portfolio/    (8)         # analytics-tab, performance, diagnostics, irpf, csv-import, smart-contribution
│   │   ├── asset/        (7)         # dividend-summary, dividend-trap, dupont, peers, news, calendar
│   │   ├── analytics/    (7)         # hit-rate, ic-timeline, quintile, sector-rotation, sensitivity
│   │   ├── screener/     (5)         # table, filters, pagination, column-selector
│   │   ├── onboarding/   (4)         # quiz, tour, checklist
│   │   ├── valuation/    (2)         # dcf-card, monte-carlo-card
│   │   ├── billing/      (2)         # paywall-gate
│   │   ├── brand/        (2)         # logo
│   │   ├── seo/          (2)         # json-ld
│   │   └── [outros]      (11)        # community, education, insights, momentum, simulation, strategy, etc
│   │
│   ├── lib/
│   │   ├── trpc/                     # 17 tRPC routers
│   │   │   └── routers/
│   │   │       ├── assets.ts         # list, getByTicker, search, history, sparklines, evidence, dossier, holders, short
│   │   │       ├── screener.ts       # query, rankings, export, heatmap, opportunities, treemap
│   │   │       ├── portfolio.ts      # CRUD, transactions, performance, monte carlo, smart contribution
│   │   │       ├── backtest.ts       # summary, run, risk, IC, signal decay, catalysts, sector rotation
│   │   │       ├── radar.ts          # alerts CRUD, insights, health, reports, news
│   │   │       ├── dividends.ts      # calendar, summary, projections, simulate, trap risk
│   │   │       ├── analytics.ts      # attribution (Brinson), risk (VaR/Beta/HHI), scenario, quintile
│   │   │       ├── economy.ts        # indicators, regime, CAGED pulse
│   │   │       ├── user.ts           # profile, preferences, notifications
│   │   │       ├── community.ts      # comments, upvotes
│   │   │       ├── news.ts           # ticker news, RI events
│   │   │       ├── insights.ts       # list, per-ticker
│   │   │       ├── smart-portfolios.ts # list, detail, simulate
│   │   │       ├── score-history.ts  # history, movers, feedback
│   │   │       ├── score-snapshots.ts # snapshots, forward returns, metrics
│   │   │       ├── valuation.ts      # getByTicker, dcf
│   │   │       └── pluggy.ts         # connect token, import positions
│   │   │
│   │   ├── auth/                     # Custom JWT auth (NAO usa NextAuth)
│   │   │   ├── jwt.ts               # sign/verify tokens (jose)
│   │   │   ├── cookies.ts           # get/set/clear auth cookies
│   │   │   ├── session.ts           # current user getter
│   │   │   ├── credentials.ts       # email/password login
│   │   │   ├── oauth-google.ts      # Google OAuth flow
│   │   │   ├── oauth-github.ts      # GitHub OAuth flow
│   │   │   ├── demo-user.ts         # Demo mode
│   │   │   └── provider.tsx         # AuthProvider context
│   │   │
│   │   ├── investiq-client.ts       # Singleton API client para backend Railway
│   │   ├── gateway-client.ts        # Fetch wrappers para data layer
│   │   │
│   │   ├── data/                    # Orquestracao de dados
│   │   │   ├── data-orchestrator.ts # getAssets(), getAssetByTicker()
│   │   │   ├── data-fetcher.ts      # fetch gateway: quotes, fundamentals, news
│   │   │   ├── data-merger.ts       # merge backend scores + gateway fundamentals
│   │   │   ├── investiq-adapter.ts  # mapeia formato backend → frontend
│   │   │   └── asset-cache.ts       # cache in-memory com TTL
│   │   │
│   │   ├── scoring/                 # Interpretacao client-side (enrichment, NAO recalculo)
│   │   │   ├── iq-score.ts          # Engine v3 AQ Score (1.177 linhas)
│   │   │   ├── lens-calculator.ts   # Lenses: value, dividends, growth, defensive, momentum
│   │   │   ├── regime-detector.ts   # Deteccao regime SELIC/IPCA
│   │   │   ├── score-narrator.ts    # Narrativa dos scores
│   │   │   └── sentiment-adjustment.ts
│   │   │
│   │   ├── analytics/               # Performance attribution, risk, scenarios
│   │   ├── ai/                      # claude-client, ollama, research-note, synthesis
│   │   ├── mercadopago/             # checkout, webhooks (desabilitado)
│   │   ├── repositories/            # DAL: prisma/ (prod) + demo/ (mock)
│   │   ├── email/                   # Resend client, weekly template
│   │   ├── pipeline/                # sensors, analyzers, synthesizers
│   │   └── utils/                   # formatters, cn, a11y, motion, logger
│   │
│   └── middleware.ts                # Auth check, route protection
│
├── prisma/
│   └── schema.prisma                # User, Asset, Quote, Fundamental, AqScore, Portfolio, etc
│
├── packages/
│   └── @investiq/shared/            # Types + constants compartilhados (web + futuro mobile)
│       ├── types.ts                 # AssetData, AqScoreSummary, Portfolio, AuthUser, etc
│       └── constants.ts             # PLAN_LIMITS, SECTORS, SECTOR_LABELS
│
├── public/                          # Assets estaticos, favicon, fonts, manifest
├── tailwind.config.ts               # Design tokens Ocean Forge
├── next.config.ts                   # Security headers, Sentry, image domains
├── vercel.json                      # Cron jobs (score-snapshot sex 18h, weekly-report sex 19h)
└── package.json
```

---

## Autenticacao

**Sistema custom** (NAO usa NextAuth):
- JWT via `jose` — sign/verify com `AUTH_SECRET`
- Cookies HTTP-only para sessao
- OAuth: Google + GitHub (flows em `lib/auth/oauth-*.ts`)
- Demo mode: usuario de teste com acesso completo
- Middleware protege rotas `/dashboard`, `/explorer`, `/portfolio`, `/dividends`, `/radar`, `/settings`, `/comparar`, `/ativo`, `/mapa`, `/estrategias`
- Rotas `/login`, `/register` redirecionam para `/dashboard` se ja autenticado

## Planos (shared constants)

| Recurso | Free | Pro | Elite |
|---------|------|-----|-------|
| Portfolios | 1 | 5 | 20 |
| Ativos/portfolio | 10 | 50 | 200 |
| Filtros screener | 3 | 10 | Ilimitado |
| AQ Scores/dia | 3 | 50 | Ilimitado |
| Assets explorer | 15 | 100 | Ilimitado |

Definidos em `packages/@investiq/shared/constants.ts`.

## Prisma Models (principais)

- **User**: auth, plan (free/pro/elite), preferences, onboarding
- **Asset**: ticker, name, sector, type, CNPJ, ISIN
- **Quote**: OHLCV diario
- **Fundamental**: metricas financeiras (balanco, DRE, ratios)
- **AqScore**: IQ-Score + breakdown por pilar
- **Dividend**: ex-date, valor por acao
- **ScoreSnapshot**: historico de scores para feedback loop
- **Portfolio**: carteira do usuario
- **Position**: holdings (qty, avg cost)
- **Transaction**: buy/sell/dividend/split
- **Alert**: alertas customizados (preco, score, dividendo)
- **Comment/Vote**: comunidade
- **Goal/Milestone**: metas financeiras
- **Insight**: insights AI personalizados
- **WeeklyReport**: relatorio semanal automatico
- **WebhookEvent**: audit trail Mercado Pago

## Variaveis de Ambiente

```bash
# Backend
INVESTIQ_API_URL=https://investiqbackend-production.up.railway.app

# Database (Supabase PostgreSQL)
DATABASE_URL=
DIRECT_URL=

# Auth
AUTH_SECRET=          # openssl rand -base64 32
APP_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API
NEXT_PUBLIC_API_BASE_URL=

# Sentry (opcional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Feature flags
ALLOW_DEMO=false
NEXT_PUBLIC_USE_MOCK_API=false
```

## Vercel Cron Jobs

- `/api/jobs/score-snapshot` — sexta 18:00 UTC (snapshot semanal)
- `/api/jobs/weekly-report` — sexta 19:00 UTC (relatorio semanal)

## Security Headers (next.config.ts)

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS: max-age=63072000; includeSubDomains; preload
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Referrer-Policy: origin-when-cross-origin

---

## Ultima Sessao

**Data:** 2026-04-15
**O que foi feito:** Auditoria completa e reescrita do CLAUDE.md para refletir estado real do projeto (stack, componentes, rotas, design system, auth, tRPC routers).
**O que falta:** Melhorias a serem definidas pelo Rafael.
