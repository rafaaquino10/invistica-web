# CLAUDE.md — InvestIQ Frontend

> Âncora para Claude Code. Leia este arquivo INTEIRO antes de qualquer tarefa.
> Última atualização: 2026-03-30 (Swagger-audited)

---

## O que é o InvestIQ

A plataforma de investimentos mais inteligente do Brasil. Dá ao investidor varejo
o mesmo poder de análise de um gestor profissional da Faria Lima.

Backend: Python FastAPI (IQ-Cognit Engine), 60 endpoints REST, Railway.
Frontend: Angular 19, 100% custom, zero bibliotecas de UI, este repositório.

---

## Stack

- Angular 19 (Standalone Components, Signals, OnPush)
- TypeScript 5.7+ strict
- SCSS + CSS Custom Properties (sem Tailwind)
- TradingView Lightweight Charts (gráficos de preço)
- D3.js 7 (treemap, Monte Carlo, heatmap)
- SVG inline custom (barras, linhas, donut, sparkline, radar, gauge)
- Supabase Auth (GoTrue JWT)
- Deploy: Vercel ou Cloudflare Pages

---

## Design System — Regras absolutas

### Cores
- Cor de marca: Obsidian `#3D3D3A`
- Positivo: `#1A7A45` | Negativo: `#C23028` | Alerta: `#A07628` | Info: `#3B6B96`
- Fundo light: `#F8F7F4` | Cards: `#FFFFFF` | Borda: `#E0DDD6`
- Texto: `#1A1A18` / `#6B6960` / `#9C998F`
- **Light mode é o DEFAULT.** Dark mode disponível.

### Tipografia
- UI: `Satoshi` (Fontshare, self-hosted)
- Números: `IBM Plex Mono` (self-hosted)
- REGRA: TODO número (cotação, score, %, R$, delta, volume, ticker, timestamp) usa IBM Plex Mono. SEM EXCEÇÃO.

### Cantos
- border-radius: 2px. Sempre. Nunca arredondado.

### Componentes
- ZERO Angular Material, PrimeNG, NG-ZORRO, Taiga UI
- Cada componente construído do zero com prefixo `iq-`

---

## Angular Patterns — Sempre seguir

```typescript
// SEMPRE Standalone + OnPush
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// SEMPRE Signals para state local
score = input.required<number>();
derived = computed(() => RATING_COLORS[this.rating()]);

// SEMPRE RxJS para dados do servidor
results$ = toObservable(this.filters).pipe(
  debounceTime(300),
  switchMap(f => this.scoreService.screener(f)),
);

// SEMPRE trackBy em @for
@for (item of items; track item.id) { }
```

---

## Ratings — 5 faixas (IMUTÁVEL)

```typescript
type Rating = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'AVOID' | 'DADOS_INSUFICIENTES';
// 82-100 STRONG_BUY | 70-81 BUY | 45-69 HOLD | 30-44 REDUCE | 0-29 AVOID
// NUNCA 4 faixas. NUNCA "Neutro". NUNCA "Excepcional/Saudável/Atenção/Crítico".
```

## Clusters — 9 (IMUTÁVEL)

```typescript
// 1:Financeiro 2:Commodities 3:Consumo 4:Utilities 5:Saúde
// 6:Real Estate 7:Bens de Capital 8:Educação 9:TMT
```

## Regimes — 4 (IMUTÁVEL)

```typescript
// RISK_ON(Expansão) RISK_OFF(Contração) STAGFLATION(Estagflação) RECOVERY(Recuperação)
```

## 3 Pilares + 6 Sub-scores (IMUTÁVEL)

- Quantitativo (score_quanti) — 6 sub-scores: **valuation, quality, risk, dividends, growth, momentum**
- Qualitativo (score_quali) — 6 agentes LLM
- Valuation (score_valuation) — DCF, Gordon, Múltiplos, Monte Carlo
- Pesos DINÂMICOS por cluster. O frontend exibe os pesos do backend.
- `/scores/{ticker}/breakdown` retorna os 6 sub-scores. EXIBIR no radar chart.

---

## API Backend — 60 Endpoints (Swagger-audited)

Base URL: `API_URL` env var (default: `http://localhost:8000`)
Swagger: https://investiqbackend-production.up.railway.app/docs
OpenAPI: https://investiqbackend-production.up.railway.app/openapi.json

### Acesso por tier (plan gating)
- **Free**: /tickers/* + /clusters (12 endpoints)
- **Pro**: /scores/*, /valuation/*, /portfolio/*, /dividends/*, /news/*, /radar/*, /analytics/*, /backtest (48 endpoints)
- **Público**: /health, /system/llm-status (2 endpoints)

### Services (1 por router)
- TickerService → /tickers/* (11) + /clusters (1)
- ScoreService → /scores/* (12)
- ValuationService → /valuation/* (3)
- PortfolioService → /portfolio/* (7)
- DividendService → /dividends/* (7)
- NewsService → /news/* (2)
- RadarService → /radar/* (4)
- AnalyticsService → /analytics/* (7)
- BillingService → /billing/* (3)
- BacktestService → POST /backtest (1)

### Params importantes (auditados do Swagger)
- `/scores/screener` → limit max **200** (não 50)
- `/dividends/radar` → `min_safety?: int(0-100, def 70)` — filtro por safety score
- `/dividends/summary` → `months?: int(1-60, def 12)`
- `/dividends/projections` → `months?: int(1-24, def 12)`
- `/tickers/{ticker}/financials` → `limit?: int(1-40, def 8)`
- `/tickers/{ticker}/history` → `days?: int(7-730, def 90)`
- `/backtest` → benchmarks aceita: IBOV, CDI, SMLL, IDIV, IFIX, SPX, USD, GOLD

---

## 21 Telas

### Cockpit
1. Dashboard `/dashboard`
2. Detalhe do ativo `/ativo/:ticker` (overview + 7 tabs incl. Institucional)

### Descoberta
3. Explorar `/explorar`
4. Comparar `/comparar`
5. Mapa de mercado `/mapa`
6. **Termômetro** `/termometro`

### Gestão de patrimônio
7. Carteira `/carteira`
8. Dividendos `/dividendos`
9. **Decidir** `/decidir`
10. **Income Planner** `/income-planner`

### Inteligência
11. **Simulador macro** `/simulador`
12. **Se eu tivesse** `/simulador/comparar`
13. **Risk Scanner** `/risk-scanner`
14. **Institucional** `/institucional`

### Monitoramento
15. Radar `/radar`
16. Macro `/macro`

### Avançado
17. Backtest `/backtest`
18. Analytics `/analytics`

### Conta
19. Configurações `/configuracoes`
20. Login `/login` + Registro `/registro`
21. Checkout `/checkout/sucesso` · `/checkout/falha` · `/checkout/pendente`

---

## O que NUNCA fazer

- NUNCA usar Angular Material, PrimeNG, ou qualquer lib de componentes
- NUNCA usar Tailwind CSS
- NUNCA calcular score no frontend
- NUNCA usar NgModules
- NUNCA usar ChangeDetectionStrategy.Default
- NUNCA usar border-radius > 2px
- NUNCA usar a palavra "Mandato" (EXTIRPADO)
- NUNCA mostrar ratings antigos (Excepcional/Saudável/Atenção/Crítico)
- NUNCA usar número financeiro sem IBM Plex Mono
- NUNCA habilitar GitHub OAuth para end users
- NUNCA inventar endpoints — consultar Swagger real se tiver dúvida

---

## Disclaimer CVM (obrigatório em toda tela com score/valuation/diagnóstico)

"Informações para fins educacionais. Não constitui recomendação de investimento.
Rentabilidade passada não garante resultados futuros."

---

## Referências

- RAIO-X-BACKEND-INVESTIQ.md — backend completo (60 endpoints, schemas, providers, jobs)
- ARQUITETURA-FRONTEND-INVESTIQ-v3.1.md — frontend completo (design system, 21 telas, patterns)
- Swagger produção: https://investiqbackend-production.up.railway.app/docs
- OpenAPI JSON: https://investiqbackend-production.up.railway.app/openapi.json
