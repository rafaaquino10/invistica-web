# CLAUDE.md — InvestIQ Volt Carbon v2

> **Fonte de verdade para toda sessão Claude CLI.**
> Leia INTEGRALMENTE antes de qualquer ação. Não assuma. Não invente. Siga.

---

## O QUE É INVESTIQ

Plataforma de investimentos quantamental proprietária focada no mercado brasileiro de ações.
Visão: Ferramenta hoje → Clube amanhã → Fundo (FIA/multimercado) depois.

---

## STACK

| Item | Valor |
|------|-------|
| Frontend | Angular 19, Standalone Components + Signals + SCSS |
| UI Libs | ZERO. 100% custom. Sem Material, PrimeNG, CDK. |
| Backend | Python FastAPI no Railway |
| Base URL | `https://investiqbackend-production.up.railway.app` |
| Swagger | `/openapi.json` — SEMPRE consultar antes de criar services |
| Banco | Supabase PostgreSQL |
| Ícones | Phosphor Icons (outline inativo, filled ativo) |
| Fonte UI | General Sans (local woff2 em src/assets/fonts/) |
| Fonte Num | IBM Plex Mono (Google Fonts CDN) |

---

## PALETA VOLT CARBON

### Dark Mode (DEFAULT)

```scss
--bg: #050505;
--bg-alt: #0A0C14;
--card: #12141C;
--card-hover: #1A1C26;
--elevated: #242630;
--t1: #F8FAFC;
--t2: #A0A8B8;
--t3: #606878;
--t4: #383E4A;
--border: rgba(255,255,255,0.04);
--border-hover: rgba(208,243,100,0.06);
--volt: #d0f364;
--volt-muted: #a8c450;
--volt-dim: rgba(208,243,100,0.12);
--volt-glow: 0 0 16px rgba(208,243,100,0.25);
--pos: #34D399;
--neg: #EF4444;
--warn: #F59E0B;
--glass-bg: rgba(18,20,28,0.8);
--glass-blur: blur(12px);
```

### Light Mode

```scss
--bg: #F4F5F0;
--bg-alt: #EAEBE6;
--card: #FFFFFF;
--card-hover: #F8F8F4;
--elevated: #EEEFE8;
--t1: #0A0C10;
--t2: #3A3E48;
--t3: #6A6E78;
--t4: #9A9EA8;
--border: rgba(0,0,0,0.06);
--border-hover: rgba(100,120,20,0.08);
--volt: #5A6B10;
--volt-muted: #6E8218;
--volt-dim: rgba(90,107,16,0.06);
--volt-glow: 0 0 12px rgba(90,107,16,0.15);
--pos: #16804A;
--neg: #CC2828;
--warn: #B07A08;
--glass-bg: rgba(255,255,255,0.85);
```

### Score Bands

| Banda | Range | Cor | Glow |
|-------|-------|-----|------|
| STRONG_BUY | 82-100 | var(--volt) | sim |
| BUY | 70-81 | var(--pos) | não |
| HOLD | 45-69 | var(--warn) | não |
| REDUCE | 30-44 | var(--neg) | não |
| AVOID | 0-29 | var(--neg) | não |

---

## TIPOGRAFIA

- **Texto** → General Sans (400,500,600,700). `--font-ui`
- **Números** → IBM Plex Mono (400,500,600,700). `--font-mono`
- **Regra absoluta:** número = mono, texto = ui. Zero exceções.

---

## BACKEND — 66 ENDPOINTS REAIS

> Verificados em `/openapi.json` em Abril/2026.
> NUNCA inventar endpoints. Se não está aqui, não existe.

### analytics (7 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/analytics/regime` | Regime macro atual (Risk On/Off/Estagflação/Recuperação) + SELIC, IPCA, câmbio, petróleo + rotação setorial + kill switch |
| GET | `/analytics/sector-rotation` | Matriz de rotação setorial por regime |
| GET | `/analytics/ic-timeline?months=12` | IC Spearman e taxa de acerto do modelo ao longo do tempo |
| GET | `/analytics/signal-decay` | Quintis de performance por faixa de score |
| GET | `/analytics/sensitivity` | Impacto de cenários macro (SELIC, câmbio, petróleo) nos setores |
| GET | `/analytics/portfolio/{id}/attribution` | Atribuição de performance por setor |
| GET | `/analytics/portfolio/{id}/risk` | HHI, concentração top 3, concentração setorial |

### tickers (11 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/tickers` | Lista ativos (paginação, filtro por cluster) |
| GET | `/tickers/search?q=` | Busca por ticker ou nome |
| GET | `/tickers/{ticker}` | Dados completos + cotação + peers |
| GET | `/tickers/{ticker}/quote` | Cotação: open, close, high, low, volume, market cap |
| GET | `/tickers/{ticker}/financials?limit=8` | DRE histórica: ROE, ROIC, margens, Piotroski |
| GET | `/tickers/{ticker}/dividends` | Histórico de proventos |
| GET | `/tickers/{ticker}/peers` | Empresas comparáveis do setor |
| GET | `/tickers/{ticker}/history?days=90` | Cotações diárias OHLCV |
| GET | `/tickers/{ticker}/institutional-holders` | Fundos que detêm o ativo (CVM) |
| GET | `/tickers/{ticker}/short-interest` | Posições vendidas B3 |
| GET | `/tickers/macro/focus-expectations` | Boletim Focus BCB: SELIC, IPCA, PIB, câmbio |

### clusters (1 endpoint)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/clusters` | 9 clusters com KPIs, drivers e pesos |

### iq-cognit / scores (12 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/scores/{ticker}` | Score completo: IQ 0-100, pilares, preço justo (DCF/Gordon/Múltiplos), margem segurança, Monte Carlo, dividendos, tese |
| GET | `/scores/{ticker}/breakdown` | 6 pilares: valuation, qualidade, risco, dividendos, crescimento, momentum |
| GET | `/scores/{ticker}/evidence` | Evidências critério por critério com fonte |
| GET | `/scores/{ticker}/risk-metrics` | Altman Z, Merton PD, alavancagem, Piotroski, liquidez |
| GET | `/scores/{ticker}/dossier` | Dossiê qualitativo 6 dimensões (governança, track record, etc.) |
| GET | `/scores/{ticker}/thesis` | Bull case, bear case, riscos |
| GET | `/scores/{ticker}/history?limit=12` | Evolução do score no tempo |
| GET | `/scores/performance` | CAGR, Alpha, Sharpe, Drawdown do modelo |
| GET | `/scores/top?limit=20` | Ranking por score |
| GET | `/scores/screener` | Filtro: cluster, min_score, rating, min_yield, min_margin |
| GET | `/scores/compare?tickers=X,Y,Z` | Até 5 ativos lado a lado |
| GET | `/scores/catalysts?days=30` | Eventos: fatos CVM + notícias + dividendos próximos |

### valuation (3 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/valuation/{ticker}` | Preço justo: DCF + Gordon + Múltiplos + MC P25/P50/P75 |
| GET | `/valuation/{ticker}/margin` | Margem de segurança atual + histórico |
| GET | `/valuation/{ticker}/scenarios` | Cenários base/bull/bear via Monte Carlo |

### portfolio (9 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/portfolio` | Posições atuais |
| POST | `/portfolio/positions` | Adicionar posição (ticker, quantity, avg_price) |
| PUT | `/portfolio/positions/{id}` | Editar posição |
| DELETE | `/portfolio/positions/{id}` | Remover posição |
| GET | `/portfolio/performance?months=12` | Performance vs benchmarks base 100 |
| GET | `/portfolio/intraday` | Variação intraday vs IBOV base 100 |
| GET | `/portfolio/analytics` | Risco e diversificação |
| GET | `/portfolio/alerts` | Alertas da carteira |
| GET | `/portfolio/smart-contribution?aporte_total=1000` | Sugestão de distribuição do próximo aporte |

### dividends (7 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dividends/calendar?days=30` | Proventos com data-com próxima |
| GET | `/dividends/radar?min_safety=70` | Ativos com maior segurança de dividendo |
| GET | `/dividends/summary?months=12` | Resumo mensal de dividendos |
| GET | `/dividends/projections?months=12` | Projeções futuras |
| POST | `/dividends/simulate` | Simulador de renda passiva (body: tickers + amounts) |
| GET | `/dividends/{ticker}/safety` | Score segurança dividendo 0-100 |
| GET | `/dividends/{ticker}/trap-risk` | Análise de dividend trap |

### news (2 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/news/{ticker}?limit=10` | Notícias com sentimento IA |
| GET | `/news/{ticker}/investor-relations?limit=20` | Fatos relevantes CVM + RI |

### radar (4 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/radar/feed?limit=30&filter=all` | Feed unificado: notícias + score changes + dividendos |
| GET | `/radar/alerts` | Alertas customizados |
| POST | `/radar/alerts` | Criar alerta (price_above/below, score_change, dividend) |
| DELETE | `/radar/alerts/{id}` | Remover alerta |

### strategy (4 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/strategy/portfolio-recommendation` | Carteira ótima: tickers, pesos, motivos |
| GET | `/strategy/signals` | Sinais: comprar, vender, aumentar, rotacionar |
| GET | `/strategy/risk-status` | VolStressMonitor + ConfidenceTracker + regime |
| GET | `/strategy/short-candidates` | Candidatos a short com motivo |

### backtest (1 endpoint)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/backtest` | Backtest Nuclear: Long&Short, alavancagem dinâmica, custos, IR. Body: start/end_date, universe_size, long_pct, benchmarks, enable_short, enable_leverage |

### billing (3 endpoints — DESATIVADOS NO FRONTEND)

| Método | Rota | Nota |
|--------|------|------|
| POST | `/billing/webhook` | Webhook Mercado Pago — backend only |
| POST | `/billing/checkout` | Checkout — NÃO USAR no frontend |
| GET | `/billing/status` | Status assinatura — NÃO EXIBIR |

### health (2 endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/system/llm-status` | Status pool de chaves LLM |

---

## MAPEAMENTO TELA → ENDPOINTS

| Tela | Rota | Endpoints principais |
|------|------|---------------------|
| Landing | `/` | scores/performance |
| Dashboard | `/dashboard` | portfolio, portfolio/performance, portfolio/intraday, scores/top, scores/performance, analytics/regime, strategy/signals, scores/catalysts |
| Explorar | `/explorar` | scores/screener, tickers, tickers/search, clusters, scores/top |
| Ativo | `/ativo/:ticker` | scores/{t}, scores/{t}/breakdown, scores/{t}/evidence, scores/{t}/dossier, scores/{t}/thesis, scores/{t}/history, scores/{t}/risk-metrics, tickers/{t}, tickers/{t}/quote, tickers/{t}/financials, tickers/{t}/history, tickers/{t}/dividends, tickers/{t}/peers, tickers/{t}/institutional-holders, tickers/{t}/short-interest, valuation/{t}, valuation/{t}/margin, valuation/{t}/scenarios, news/{t}, news/{t}/investor-relations, dividends/{t}/safety, dividends/{t}/trap-risk |
| Comparar | `/comparar` | scores/compare, tickers/search |
| Decidir | `/decidir` | strategy/portfolio-recommendation, strategy/signals, strategy/risk-status, strategy/short-candidates, scores/catalysts |
| Carteiras IQ | `/carteiras-inteligentes` | strategy/portfolio-recommendation, analytics/regime, analytics/sector-rotation |
| Carteira | `/carteira` | portfolio (CRUD), portfolio/performance, portfolio/intraday, portfolio/analytics, portfolio/alerts, portfolio/smart-contribution, analytics/portfolio/{id}/attribution, analytics/portfolio/{id}/risk |
| Dividendos | `/dividendos` | dividends/calendar, dividends/radar, dividends/summary, dividends/projections, dividends/simulate |
| Radar | `/radar` | radar/feed, radar/alerts (CRUD) |
| Mapa | `/mapa` | tickers, clusters, scores/screener |
| Macro | `/macro` | analytics/regime, analytics/sector-rotation, analytics/sensitivity, analytics/ic-timeline, analytics/signal-decay, tickers/macro/focus-expectations |
| Simulador | `/simulador` | backtest, analytics/sensitivity, valuation/{t}/scenarios, analytics/regime |

---

## LAYOUT

### Sidebar (colapsável, localStorage)

```
── Dashboard              (house)

DESCOBRIR
── Explorar               (magnifying-glass)
── Comparar               (columns)

DECIDIR
── Decidir                (crosshair)
── Carteiras IQ           (briefcase)

INVESTIR
── Carteira               (wallet)
── Dividendos             (currency-dollar)
── Simulador              (chart-line-up)

MONITORAR
── Radar                  (radar)
── Mapa                   (map-trifold)
── Macro                  (chart-bar)
```

### Header

- Esquerda: Logo IQ + "INVESTIQ"
- Centro: Busca (`GET /tickers/search?q=`)
- Direita: Toggle dark/light + Avatar dropdown (Perfil, Configurações, Sair)

### Ticker Tape (footer fixo, 32px)

Scroll horizontal com dados de `/tickers/{ticker}/quote`.

---

## REGRAS IMUTÁVEIS

| # | Regra |
|---|-------|
| R01 | Número → IBM Plex Mono. Texto → General Sans. Sem exceção. |
| R02 | Border-radius máximo 4px. |
| R03 | Zero shimmer, zero skeleton. |
| R04 | Zero menção a planos pagos. |
| R05 | Zero bibliotecas UI externas. |
| R06 | Cor financeira = informação. Verde/vermelho/âmbar só em contexto financeiro. |
| R07 | Volt #d0f364 só em: scores ≥82, CTAs primários, alpha positivo. |
| R08 | Dark mode default. |
| R09 | Cada tela < 2 segundos. |
| R10 | Lazy loading por rota. |
| R11 | Swagger é fonte de verdade. Não inventar endpoints. |
| R12 | Phosphor Icons exclusivamente. |
| R13 | Configurações no dropdown do avatar. |
| R14 | Max-width 1440px. |
| R15 | Glassmorphism em cards. |
| R16 | Ticker tape no footer. |
| R17 | Não existe Mandato. |
| R18 | Standalone Components, OnPush, Signals. |

---

## ESTRUTURA DE PASTAS

```
src/
├── styles/
│   ├── tokens.scss
│   └── typography.scss
├── assets/fonts/general-sans/
├── app/
│   ├── core/services/ (theme, sidebar, api)
│   ├── core/guards/
│   ├── core/interceptors/
│   ├── shared/components/
│   ├── shared/pipes/
│   ├── layout/ (shell, sidebar, header, ticker-tape)
│   └── features/ (landing, dashboard, explorer, asset-detail, compare, decide, smart-portfolios, portfolio, dividends, radar, market-map, macro, simulator)
├── app.routes.ts
├── app.component.ts
├── styles.scss
└── index.html
```

---

## BIBLIOTECA DE GRÁFICOS — APACHE ECHARTS

Usar apache-echarts + ngx-echarts (wrapper Angular oficial).
Instalar: npm install echarts ngx-echarts

Tipos de gráfico usados no InvestIQ:
- Line/Area: equity curves, performance, evolução de score, projeções
- Bar: composição setorial, atribuição de performance, dividendos mensais
- Treemap: mapa de mercado (tamanho = market cap, cor = variação ou score)
- Radar: comparação de pilares entre ativos
- Gauge: score hero na tela de ativo

Zero gráficos de candlestick. InvestIQ NÃO é plataforma de day trade.

Requisitos visuais (TODOS os gráficos):
- Fundo transparente (herda --bg do tema)
- Zero grid lines pesadas. Apenas linhas sutis rgba(255,255,255,0.03) em dark, rgba(0,0,0,0.04) em light
- Crosshair de precisão com snap nos datapoints
- Tooltip rico: fundo glassmorphism, números em IBM Plex Mono
- Dark mode: linha principal em volt #d0f364, área com gradiente volt→transparente, benchmarks em cinza pontilhado
- Light mode: linha principal em #5A6B10, mesma estrutura
- Responsivo: gráfico ocupa 100% da largura do container, resize automático
- Zoom com scroll do mouse nos gráficos de série temporal
- Períodos selecionáveis via botões (1M, 3M, 6M, 12M, MAX)
- Animação de entrada suave (400ms ease-out) — única animação permitida
- Legenda minimalista abaixo do gráfico
- Tema ECharts registrado globalmente (dark-volt e light-volt) para consistência total

---

## PLUGGY OPEN FINANCE

InvestIQ usa Pluggy (pluggy.ai) para importar carteiras automaticamente das corretoras brasileiras.
Trial: 14 dias free, até 20 conexões.

### Frontend
- Embutir Pluggy Connect Widget para o usuário autorizar conexão com sua corretora
- Após autorização, enviar accessToken para o backend
- Widget deve seguir a paleta Volt Carbon onde possível (Pluggy permite customização de cores)

### Backend (PENDENTE — não implementado ainda)
- Endpoint POST /portfolio/import-pluggy que recebe accessToken
- Chama Pluggy API para buscar investments do usuário
- Converte para formato de posições do InvestIQ
- Salva no portfolio do usuário

### UX
- Na tela de Carteira: botão "Importar da Corretora" que abre o widget Pluggy
- Também disponível no Dashboard quando o usuário não tem carteira

---

## EMPTY STATES

Quando o usuário não tem carteira montada:
- Dashboard: mostra dados de mercado + top scores + regime macro. Seção de carteira NÃO aparece. No lugar, card com CTA "Importe sua carteira" (abre Pluggy) ou "Monte manualmente".
- Carteira: estado vazio elegante + botão "Importar da Corretora" + "Adicionar posição manual"
- Dividendos: mostra calendário geral do mercado, sem seção pessoal
- Radar: mostra feed de mercado, sem alertas pessoais até criar

NUNCA mostrar zeros, tabelas vazias ou "Nenhum dado encontrado". Sempre conteúdo útil de mercado + CTA claro.

---

## ORDEM DE EXECUÇÃO

1. ~~Clean slate~~ ✅
2. ~~Angular 19 scaffold~~ ✅
3. Design system (tokens, typography, fontes, styles.scss) ← PRÓXIMO
4. Services core (ThemeService, SidebarService, ApiService)
5. Layout shell (sidebar + header + ticker tape + routing lazy)
6. Dashboard (primeira tela com dados reais)
7. Explorar → Ativo → Carteira → demais telas
