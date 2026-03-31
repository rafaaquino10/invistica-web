# InvestIQ — Arquitetura Frontend Definitiva v3.0

> Angular 19 · 100% Custom · Obsidian · Satoshi · Light-first
> Consolida todas as decisões de produto e design tomadas em 2026-03-30
> Substitui todas as versões anteriores (v1, v2)

---

## 1. MANIFESTO

O InvestIQ não é um site de score. Não é um screener com tema bonito.
É o analista mais completo que um investidor varejo brasileiro já teve.

Cada tela responde uma pergunta real que o investidor tem.
Cada componente visual é construído sob medida — zero biblioteca de UI.
Cada número financeiro está em monospace.
Cada cor carrega significado.

A identidade visual é Obsidian: a cor da tinta permanente.
O produto é tão confiante nos seus dados que não precisa de cor para chamar atenção.

---

## 2. DECISÕES DE DESIGN (IMUTÁVEIS)

| Decisão | Definição |
|---------|-----------|
| Tema default | **Light mode** (dark disponível como alternativa) |
| Cor de marca | **Obsidian #3D3D3A** |
| Fonte UI | **Satoshi** (Fontshare, gratuita comercial) |
| Fonte números | **IBM Plex Mono** (toda cotação, score, %, R$, indicador) |
| Cantos | **Retos** (border-radius: 2px máximo) |
| Verde semântico | **#1A7A45** (positivo, ganho, bull) |
| Vermelho semântico | **#C23028** (negativo, perda, bear) |
| Âmbar semântico | **#A07628** (alerta, atenção) |
| Azul semântico | **#3B6B96** (informativo, neutro) |
| Charts de preço | TradingView Lightweight Charts |
| Charts complexos | D3.js (treemap, Monte Carlo, heatmap) |
| Charts simples | SVG inline custom (barras, linhas, donut, sparkline, radar) |
| Componentes UI | **100% custom** — zero Angular Material, PrimeNG, CDK visual |
| Mandato | **EXTIRPADO** — não existe no frontend, nenhum vestígio |

---

## 3. PALETA DE CORES COMPLETA

```scss
// === LIGHT MODE (default) ===
:root {
  // SURFACES
  --surface-0: #F8F7F4;          // Fundo da aplicação (marfim)
  --surface-1: #FFFFFF;           // Cards, painéis
  --surface-2: #F2F1EE;          // Hover, inputs, backgrounds secundários
  --surface-3: #E8E6E1;          // Bordas internas, separadores
  --surface-4: #DDD9D2;          // Elementos desabilitados

  // TEXT
  --text-primary: #1A1A18;       // Texto principal
  --text-secondary: #6B6960;     // Texto secundário
  --text-tertiary: #9C998F;      // Labels, hints
  --text-quaternary: #B8B5AD;    // Desabilitado, placeholder

  // BRAND
  --obsidian: #3D3D3A;           // Cor de marca — acento principal
  --obsidian-bg: rgba(61,61,58, 0.05);   // Background sutil
  --obsidian-border: rgba(61,61,58, 0.15); // Borda sutil

  // SEMANTIC
  --positive: #1A7A45;           // Verde: alta, ganho, bull, upgrade
  --positive-bg: rgba(26,122,69, 0.06);
  --positive-border: rgba(26,122,69, 0.15);
  --negative: #C23028;           // Vermelho: baixa, perda, bear, kill switch
  --negative-bg: rgba(194,48,40, 0.05);
  --negative-border: rgba(194,48,40, 0.15);
  --warning: #A07628;            // Âmbar: alerta, atenção
  --warning-bg: rgba(160,118,40, 0.06);
  --warning-border: rgba(160,118,40, 0.15);
  --info: #3B6B96;               // Azul: informativo, links, proventos
  --info-bg: rgba(59,107,150, 0.06);
  --info-border: rgba(59,107,150, 0.15);

  // BORDERS
  --border-default: #E0DDD6;
  --border-hover: #D4D1C9;
  --border-focus: #3D3D3A;

  // SPACING (8px base grid)
  --space-1: 0.25rem;  // 4px
  --space-2: 0.5rem;   // 8px
  --space-3: 0.75rem;  // 12px
  --space-4: 1rem;     // 16px
  --space-5: 1.25rem;  // 20px
  --space-6: 1.5rem;   // 24px
  --space-8: 2rem;     // 32px
  --space-10: 2.5rem;  // 40px
  --space-12: 3rem;    // 48px

  // RADIUS
  --radius: 2px;       // Único valor. Cantos retos. Sem exceção.

  // TRANSITIONS
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;

  // SHADOWS (sutis, apenas para elevação funcional)
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
}

// === DARK MODE ===
[data-theme="dark"] {
  --surface-0: #07080A;
  --surface-1: #0D0E12;
  --surface-2: #121318;
  --surface-3: #1A1B22;
  --surface-4: #252630;
  --text-primary: #E8E6E1;
  --text-secondary: #8A877F;
  --text-tertiary: #5A5750;
  --text-quaternary: #3D3C36;
  --border-default: #1A1B22;
  --border-hover: #252630;
  --positive: #3DB87A;
  --negative: #D4453A;
  --warning: #D4943A;
  --info: #5B7FA6;
  // obsidian, semantic backgrounds etc. ajustados para dark
}
```

### Rating Badges — 5 faixas (IMUTÁVEL)

| Rating | Label PT-BR | Cor texto | Background |
|--------|------------|-----------|------------|
| STRONG_BUY | Compra Forte | --positive | --positive-bg + --positive-border |
| BUY | Acumular | --obsidian | --obsidian-bg + --obsidian-border |
| HOLD | Manter | --warning | --warning-bg + --warning-border |
| REDUCE | Reduzir | --warning (mais escuro) | --warning-bg |
| AVOID | Evitar | --negative | --negative-bg + --negative-border |
| DADOS_INSUFICIENTES | Dados Insuficientes | --text-tertiary | --surface-2 |

### Regime Macro — 4 regimes (IMUTÁVEL)

| Regime | Label PT-BR | Cor |
|--------|------------|-----|
| RISK_ON | Expansão | --positive |
| RISK_OFF | Contração | --negative |
| STAGFLATION | Estagflação | --warning |
| RECOVERY | Recuperação | --info |

---

## 4. TIPOGRAFIA

```scss
// Satoshi — toda interface (self-hosted da Fontshare)
$font-ui: 'Satoshi', system-ui, -apple-system, sans-serif;

// IBM Plex Mono — todo número financeiro (self-hosted)
$font-mono: 'IBM Plex Mono', 'SF Mono', 'Consolas', monospace;

// Escala tipográfica
$text-xs: 0.6875rem;    // 11px — timestamps, labels mínimos
$text-sm: 0.75rem;      // 12px — captions, metadados
$text-base: 0.875rem;   // 14px — corpo principal
$text-lg: 1rem;         // 16px — títulos de cards
$text-xl: 1.25rem;      // 20px — títulos de seção
$text-2xl: 1.5rem;      // 24px — título de página, greeting
$text-hero: 2.25rem;    // 36px — score grande, preço, número hero
$text-display: 2.75rem; // 44px — score dentro de gauge

// Pesos
// Satoshi: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
// IBM Plex Mono: 400, 500, 600, 700
```

**Regra absoluta**: `$font-mono` em todo elemento que exibe: cotação, score, percentual, valor monetário, delta, volume, market cap, qualquer indicador numérico, timestamps, códigos de ticker.

---

## 5. STACK TÉCNICA

### Core

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | Angular 19 | Standalone Components, Signals, OnPush, esbuild |
| Linguagem | TypeScript 5.7+ strict | |
| Build | Angular CLI + esbuild | Sub-second HMR |
| Styling | SCSS + CSS Custom Properties | Controle total, sem Tailwind |
| Componentes | 100% custom | Zero dependências visuais |
| Deploy | Vercel ou Cloudflare Pages | SPA estática |

### Visualização

| Biblioteca | Uso | Licença |
|-----------|-----|---------|
| TradingView Lightweight Charts | Gráfico de preço OHLCV | Apache 2.0 |
| D3.js 7 | Treemap, Monte Carlo, heatmap | BSD |
| SVG inline custom | Barras, linhas, donut, sparkline, radar, gauge | — |

### Infraestrutura

| Biblioteca | Uso |
|-----------|-----|
| RxJS | Polling, composição de streams, debounce, retry |
| Angular Router | Lazy loading, guards, resolvers |
| Angular HttpClient | REST API + interceptors |
| Supabase JS | Auth GoTrue JWT |

---

## 6. MAPA COMPLETO DE TELAS — 21 TELAS

### 6.1 COCKPIT (2 telas) — Protótipos validados

#### T01: Dashboard `/dashboard`
Briefing matinal inteligente. O investidor abre e em 3 segundos sabe: como está sua carteira, o que mudou, e o que fazer.

**Composição**:
- Saudação contextual com dado principal ("6,3pp acima do CDI")
- Linha Obsidian (marca sutil)
- Regime macro banner (contextualiza o motor)
- Portfolio strip: score gauge + patrimônio + rentabilidade + dividendos YTD
- Gráfico 1: Equity curve (carteira vs CDI vs IBOV) — SVG custom
- Gráfico 2: Dividendos mensais (recebido + projetado) — SVG custom
- Gráfico 3: Exposição setorial vs recomendação do motor — SVG custom
- Coluna inteligência: insights do motor, upgrades, downgrades, proventos
- Coluna direita: top 5 + catalisadores

**Endpoints**: `/portfolio`, `/analytics/regime`, `/scores/top`, `/radar/feed`, `/scores/catalysts`, `/portfolio/analytics`

#### T02: Detalhe do ativo `/ativo/:ticker`
Raio-X completo. Híbrido: overview denso acima do fold + 7 tabs abaixo.

**Overview (acima do fold)**:
- Ticker + nome + setor + cotação + variação
- Score grande + rating badge + delta 7d
- Preço justo + margem de segurança + barra P25-P75
- 3 pilares com pesos dinâmicos por cluster
- Gráfico de cotação (TradingView) com linha de fair value
- Tese de investimento (prosa + bull/bear com evidências)

**Tabs (abaixo do fold)**:
1. Fundamentos — 16+ indicadores agrupados com benchmarks setoriais
2. Valuation — DCF, Gordon, Múltiplos, Monte Carlo, margem histórica, cenários
3. Dividendos — histórico, safety, trap risk, CAGR
4. Notícias & RI — feed com sentimento NLP + eventos CVM/DOU
5. Dossiê qualitativo — 6 dimensões (governança, track record, moat, político, cultura, operacional)
6. Histórico de score — evolução mensal do IQ-Score
7. Institucional — top 10 fundos, short interest, taxa aluguel

**Endpoints**: `/scores/{ticker}`, `/scores/{ticker}/breakdown`, `/valuation/{ticker}`, `/valuation/{ticker}/scenarios`, `/tickers/{ticker}/financials`, `/tickers/{ticker}/dividends`, `/dividends/{ticker}/safety`, `/dividends/{ticker}/trap-risk`, `/news/{ticker}`, `/news/{ticker}/investor-relations`, `/scores/{ticker}/dossier`, `/scores/{ticker}/evidence`, `/scores/{ticker}/thesis`, `/scores/{ticker}/history`, `/scores/{ticker}/risk-metrics`, `/tickers/{ticker}/institutional-holders`, `/tickers/{ticker}/short-interest`

---

### 6.2 DESCOBERTA (4 telas)

#### T03: Explorar (Screener) `/explorar`
Tabela proprietária com todos os ativos. Filtros por cluster, rating, yield, margem, score. Sort por qualquer coluna. Paginação virtual (300+ linhas sem lag). Sparklines. Click abre o ativo.

**Endpoints**: `/scores/screener`, `/clusters`

#### T04: Comparar `/comparar`
Até 5 ativos lado a lado. Tabela comparativa: score, cotação, market cap, fair value, margem, ROE, DL/EBITDA, DY, Piotroski, DuPont driver. Destaque visual no melhor valor de cada métrica.

**Endpoints**: `/scores/compare?tickers=X,Y,Z`

#### T05: Mapa de mercado `/mapa`
Treemap D3. Tamanho = market cap, cor = IQ-Score (ou variação, ou setor — toggle). Hover com tooltip, click navega para o ativo.

**Endpoints**: `/scores/screener?limit=200`

#### T06: Termômetro do mercado `/termometro` ← NOVA
"Como está a B3 agora?" em 5 segundos.

**Composição**:
- Distribuição de ativos por faixa de rating (donut)
- Heatmap setorial de scores médios (D3)
- Barra de sentimento agregado de notícias
- Regime macro + kill switches ativos
- Momentum agregado + variação IBOV
- Top 5 altas e baixas do dia
- Quantos upgrades e downgrades na semana

**Endpoints**: `/scores/screener` (múltiplos filtros), `/analytics/regime`, `/radar/feed`, `/scores/top`, `/scores/catalysts`

---

### 6.3 GESTÃO DE PATRIMÔNIO (4 telas)

#### T07: Carteira `/carteira`
Posições com P&L, YoC, IQ-Score. CRUD de posições. Analytics: HHI, beta, exposição setorial, correlações. Alertas da carteira.

**Endpoints**: `/portfolio`, `/portfolio/positions` (CRUD), `/portfolio/analytics`, `/portfolio/alerts`

#### T08: Dividendos `/dividendos`
Calendário de proventos. Radar de melhores pagadores. Resumo recebidos. Projeções 12m. Simulador de renda passiva.

**Endpoints**: `/dividends/calendar`, `/dividends/radar`, `/dividends/summary`, `/dividends/projections`, `/dividends/simulate`

#### T09: Decidir `/decidir` ← NOVA
"Tenho R$ X este mês. Onde alocar?"

**Composição**:
- Input de valor (R$ 500 a R$ 100.000)
- Visualização da distribuição sugerida (donut + lista)
- Para cada ativo sugerido: ticker, percentual, valor R$, motivo (score, margem, correção setorial)
- Contexto: regime atual, desbalanceamentos da carteira
- Botão "Aceitar" que adiciona as posições à carteira

**Endpoints**: `/portfolio/smart-contribution?aporte_total=X`, `/analytics/regime`, `/portfolio/analytics`

#### T10: Income Planner `/income-planner` ← NOVA
"Quero R$ 3.000/mês de renda passiva. O que preciso?"

**Composição**:
- Input: meta de renda mensal + aporte mensal disponível
- Carteira ideal sugerida (ativos com melhor DY + safety + score)
- Projeção temporal: gráfico de crescimento com reinvestimento
- Timeline: "em X anos você atinge a meta"
- Tabela: ativos sugeridos com yield, safety, valor necessário

**Endpoints**: `/dividends/simulate`, `/dividends/radar`, `/scores/screener` (filtro yield), `/tickers/{ticker}/dividends`

**Backend novo necessário**: idealmente endpoint `/dividends/income-plan?target_monthly=3000&monthly_contribution=2000` que retorna carteira otimizada. Sem ele, composição client-side é possível mas menos precisa.

---

### 6.4 INTELIGÊNCIA (4 telas)

#### T11: Simulador de cenários macro `/simulador` ← NOVA
Sliders interativos: SELIC, IPCA, câmbio, Brent. Impacto em tempo real na carteira.

**Composição**:
- 4 sliders com valores atuais + range de stress
- Painel de impacto: por posição da carteira (variação estimada)
- Setores mais afetados (positiva e negativamente)
- Regime macro resultante se o cenário se concretizar
- Score médio estimado da carteira no novo cenário

**Endpoints**: `/analytics/sensitivity`, `/analytics/regime`, `/analytics/sector-rotation`, `/portfolio`

#### T12: Se eu tivesse... `/simulador/comparar` ← NOVA
"Se eu tivesse comprado X em vez de Y há Z meses?"

**Composição**:
- Seletor: 2 ativos + período + valor investido
- Gráfico comparativo de equity curve (SVG)
- Tabela: retorno total, dividendos recebidos, max drawdown
- Diferença em R$ e %

**Endpoints**: `/tickers/{ticker}/history`, `/tickers/{ticker}/dividends`
**Cálculo**: client-side com dados históricos.

#### T13: Risk Scanner `/risk-scanner` ← NOVA
Varredura proativa de riscos ocultos na carteira.

**Composição**:
- Lista de riscos detectados com severidade (crítico / atenção / ok)
- Cada risco: tipo, descrição, ativo(s) afetado(s), ação sugerida
- Tipos: concentração (HHI), correlação perigosa, Merton PD subindo, Beneish flag, exposição setorial desbalanceada, kill switch próximo, DL/EBITDA acima do limite
- Score geral de saúde da carteira (semáforo)

**Endpoints**: `/portfolio/analytics`, `/scores/{ticker}/risk-metrics` (para cada posição), `/analytics/regime`, `/analytics/sector-rotation`

#### T14: O que os fundos fazem `/institucional` ← NOVA
Visão agregada de movimentações institucionais.

**Composição**:
- Top ativos com maior aumento de posição institucional (mês vs mês anterior)
- Top ativos mais vendidos (short interest crescente)
- Para cada ativo: maiores fundos, shares, variação, taxa de aluguel
- Click abre ativo na tab Institucional

**Endpoints**: `/tickers/{ticker}/institutional-holders`, `/tickers/{ticker}/short-interest`
**Nota**: dados mensais com lag 30-60 dias (CVM Fundos / B3).

---

### 6.5 MONITORAMENTO (2 telas)

#### T15: Radar `/radar`
Feed inteligente unificado. Alertas customizados CRUD.

**Endpoints**: `/radar/feed`, `/radar/alerts` (GET, POST, DELETE)

#### T16: Macro `/macro`
Regime, rotação setorial, stress test, BCB Focus.

**Endpoints**: `/analytics/regime`, `/analytics/sector-rotation`, `/analytics/sensitivity`, `/tickers/macro/focus-expectations`

---

### 6.6 AVANÇADO (2 telas)

#### T17: Backtest `/backtest`
Backtest interativo do IQ-Score. Form + resultados.

**Endpoints**: `POST /backtest`, `/scores/performance`

#### T18: Analytics `/analytics`
IC Spearman timeline, signal decay (quintis), performance do modelo.

**Endpoints**: `/analytics/ic-timeline`, `/analytics/signal-decay`, `/scores/performance`, `/analytics/portfolio/{id}/attribution`, `/analytics/portfolio/{id}/risk`

---

### 6.7 CONTA (3 telas + 3 rotas)

#### T19: Configurações `/configuracoes`
Perfil, plano, billing (Mercado Pago), tema, alertas.

**Endpoints**: `/billing/status`, `POST /billing/checkout`, Supabase Auth

#### T20: Login `/login` + Registro `/registro`
Email + senha ou Google OAuth. Supabase GoTrue.

#### T21: Checkout redirects `/checkout/sucesso` · `/checkout/falha` · `/checkout/pendente`
Retorno do Mercado Pago.

---

## 7. ARQUITETURA ANGULAR

### 7.1 Estrutura de pastas

```
investiq-web/
├── public/
│   ├── fonts/
│   │   ├── Satoshi-Variable.woff2
│   │   ├── Satoshi-VariableItalic.woff2
│   │   ├── IBMPlexMono-Regular.woff2
│   │   ├── IBMPlexMono-Medium.woff2
│   │   ├── IBMPlexMono-SemiBold.woff2
│   │   └── IBMPlexMono-Bold.woff2
│   └── icons/                        # SVGs custom
│
├── src/
│   ├── main.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── app.component.ts
│   │
│   ├── core/
│   │   ├── services/                 # 1 service por router do backend
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── ticker.service.ts
│   │   │   ├── score.service.ts
│   │   │   ├── valuation.service.ts
│   │   │   ├── portfolio.service.ts
│   │   │   ├── dividend.service.ts
│   │   │   ├── news.service.ts
│   │   │   ├── radar.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── backtest.service.ts
│   │   │   ├── regime.service.ts
│   │   │   ├── quote-stream.service.ts
│   │   │   └── theme.service.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── plan.guard.ts
│   │   └── models/                   # Tipagem completa
│   │       ├── score.model.ts
│   │       ├── ticker.model.ts
│   │       ├── portfolio.model.ts
│   │       ├── regime.model.ts
│   │       ├── valuation.model.ts
│   │       ├── news.model.ts
│   │       ├── radar.model.ts
│   │       ├── analytics.model.ts
│   │       ├── backtest.model.ts
│   │       └── cluster.model.ts
│   │
│   ├── shared/                       # Componentes 100% custom
│   │   ├── components/
│   │   │   ├── iq-table/
│   │   │   ├── iq-score-gauge/
│   │   │   ├── iq-rating-badge/
│   │   │   ├── iq-sparkline/
│   │   │   ├── iq-kpi-card/
│   │   │   ├── iq-pillar-bars/
│   │   │   ├── iq-sub-score-radar/
│   │   │   ├── iq-regime-badge/
│   │   │   ├── iq-price-chart/       # TradingView wrapper
│   │   │   ├── iq-treemap/           # D3 wrapper
│   │   │   ├── iq-monte-carlo/       # D3 wrapper
│   │   │   ├── iq-bar-chart/
│   │   │   ├── iq-line-chart/
│   │   │   ├── iq-donut-chart/
│   │   │   ├── iq-heatmap/
│   │   │   ├── iq-fair-value-bar/
│   │   │   ├── iq-modal/
│   │   │   ├── iq-dropdown/
│   │   │   ├── iq-tabs/
│   │   │   ├── iq-tooltip/
│   │   │   ├── iq-skeleton/
│   │   │   ├── iq-empty-state/
│   │   │   ├── iq-search/
│   │   │   ├── iq-button/
│   │   │   ├── iq-input/
│   │   │   ├── iq-slider/            # Range slider para simuladores
│   │   │   ├── iq-toggle/
│   │   │   ├── iq-accordion/
│   │   │   ├── iq-toast/
│   │   │   └── iq-disclaimer/
│   │   ├── pipes/
│   │   │   ├── currency-brl.pipe.ts
│   │   │   ├── percent.pipe.ts
│   │   │   ├── compact-number.pipe.ts
│   │   │   ├── rating-label.pipe.ts
│   │   │   ├── cluster-name.pipe.ts
│   │   │   └── regime-label.pipe.ts
│   │   ├── directives/
│   │   │   ├── click-outside.directive.ts
│   │   │   ├── intersection.directive.ts
│   │   │   ├── resize-observer.directive.ts
│   │   │   └── autofocus.directive.ts
│   │   └── utils/
│   │       ├── format.ts
│   │       ├── colors.ts
│   │       ├── math.ts
│   │       └── date.ts
│   │
│   ├── features/                     # Lazy loaded
│   │   ├── dashboard/
│   │   ├── explorer/
│   │   ├── asset/                    # /ativo/:ticker com 7 tabs
│   │   ├── compare/
│   │   ├── market-map/
│   │   ├── thermometer/              # NOVO
│   │   ├── portfolio/
│   │   ├── dividends/
│   │   ├── decide/                   # NOVO
│   │   ├── income-planner/           # NOVO
│   │   ├── scenario-simulator/       # NOVO
│   │   ├── what-if/                  # NOVO
│   │   ├── risk-scanner/             # NOVO
│   │   ├── institutional/            # NOVO
│   │   ├── radar/
│   │   ├── macro/
│   │   ├── backtest/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── auth/
│   │
│   ├── layout/
│   │   ├── shell.component.ts
│   │   ├── sidebar/
│   │   ├── header/
│   │   └── ticker-tape/
│   │
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _reset.scss
│   │   ├── _typography.scss
│   │   ├── _animations.scss
│   │   ├── _scrollbar.scss
│   │   ├── _mixins.scss
│   │   └── global.scss
│   │
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
│
├── angular.json
├── tsconfig.json
├── CLAUDE.md
└── package.json
```

### 7.2 Angular Patterns

- **Standalone Components only** — zero NgModules
- **Signals para state local** — computed(), effect(), input(), output()
- **RxJS para streams do servidor** — polling, composição, interop via toObservable/toSignal
- **OnPush em TODOS os componentes** — sem exceção
- **Lazy loading por feature** — cada rota carrega só o necessário
- **trackBy em todo @for** — identidade por ticker/id
- **1 service por router do backend** — ScoreService, TickerService, etc.

### 7.3 Autenticação

Supabase GoTrue JWT. Bearer token no header via auth interceptor.
Google OAuth + email/password. GitHub OAuth PROIBIDO para end users.

---

## 8. ORDEM DE CONSTRUÇÃO

### Fase 0: Fundação (1-2 dias)
- `ng new investiq-web --standalone --style=scss --routing --ssr=false`
- SCSS global: variables, reset, typography, animations
- Fonts self-hosted (Satoshi + IBM Plex Mono)
- ApiService + interceptors + auth
- Theme service (light/dark)
- **Gate**: App roda, login funciona, tema alterna

### Fase 1: Shell + Primitivos (3-4 dias)
- Shell: sidebar + header + ticker tape
- Todos os componentes primitivos (iq-button, iq-input, iq-modal, etc.)
- Todos os pipes e directives
- **Gate**: Shell navegável, primitivos funcionam

### Fase 2: Componentes de dados (3-4 dias)
- iq-table, iq-score-gauge, iq-rating-badge, iq-pillar-bars
- iq-sparkline, iq-kpi-card, iq-fair-value-bar
- iq-bar-chart, iq-line-chart, iq-donut-chart
- iq-price-chart (TradingView), iq-treemap (D3), iq-monte-carlo (D3)
- iq-disclaimer
- **Gate**: Cada componente funciona com dados mock

### Fase 3: Dashboard + Ativo (4-5 dias)
- Dashboard completo com 3 gráficos + inteligência
- Ativo overview + 7 tabs (incluindo Institucional)
- **Gate**: Fluxo dashboard → ativo funciona end-to-end

### Fase 4: Descoberta (3-4 dias)
- Explorer (screener) + Comparar + Mapa + Termômetro
- **Gate**: Busca → filtro → análise funciona

### Fase 5: Gestão de patrimônio (4-5 dias)
- Carteira + Dividendos + Decidir + Income Planner
- **Gate**: CRUD posições, smart contribution, simulação de dividendos

### Fase 6: Inteligência (4-5 dias)
- Simulador macro + Se eu tivesse + Risk Scanner + Institucional
- **Gate**: Simulações interativas funcionam

### Fase 7: Monitoramento + Avançado (3-4 dias)
- Radar + Macro + Backtest + Analytics
- **Gate**: Feed, alertas, backtest funcionam

### Fase 8: Conta + Polish (2-3 dias)
- Settings + billing + auth + checkout redirects
- Plan gating (Free vs Pro)
- Empty states, error states, loading states
- Performance audit, acessibilidade
- **Gate**: Plataforma completa e polida

---

## 9. REGRAS IMUTÁVEIS

1. Todo número financeiro em IBM Plex Mono. Sem exceção.
2. Disclaimer CVM em toda tela com score, valuation ou diagnóstico.
3. 5 faixas de rating: STRONG_BUY / BUY / HOLD / REDUCE / AVOID.
4. 9 clusters: Financeiro, Commodities, Consumo, Utilities, Saúde, Real Estate, Bens de Capital, Educação, TMT.
5. 3 pilares: Quanti / Quali / Valuation. Pesos dinâmicos por cluster.
6. 4 regimes: RISK_ON / RISK_OFF / STAGFLATION / RECOVERY.
7. Cores semânticas são as deste documento.
8. Auth é Supabase GoTrue JWT.
9. GitHub OAuth proibido para end users.
10. O frontend NUNCA calcula score.
11. Zero bibliotecas de componentes visuais.
12. OnPush em TODOS os componentes.
13. Standalone Components only.
14. Signals para state local. RxJS para streams.
15. SCSS com CSS Custom Properties. Sem Tailwind.
16. Light mode default. Dark mode disponível.
17. Obsidian #3D3D3A como cor de marca.
18. Satoshi como fonte de UI. IBM Plex Mono como fonte de números.
19. Border-radius: 2px. Cantos retos.
20. MANDATO NÃO EXISTE. Nenhum vestígio no frontend.

---

*InvestIQ — Arquitetura Frontend Definitiva v3.0 — 2026-03-30*
