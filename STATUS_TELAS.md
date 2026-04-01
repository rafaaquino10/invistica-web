# Status Real de Cada Tela — InvestIQ Web

Atualizado: 2026-03-31

## Legenda
- ✅ Funciona com dados reais do backend
- ⚠️ Funciona parcialmente (alguns dados faltam)
- 🔒 Depende de auth/portfolio (precisa de login + posições)
- ⏳ Depende do pipeline de scoring rodar (GitHub Actions: `iq_daily_scores.yml`)
- ❌ Sem dados no backend

---

## Landing Page `/`
✅ **100% funcional** — Dados hardcoded por design (vitrine do motor). Gráfico animado, strip de cotações, análise rotativa, tudo funciona.

## Dashboard `/dashboard`
⚠️ **Parcial**
- ✅ Regime macro (Selic, IPCA, câmbio, Brent) — dados reais
- ✅ Catalisadores (notícias) — dados reais, ~50 itens
- ⚠️ Top 5 IQ-Score — só 2 ativos com score (RVEE3, CAML3). **Causa: pipeline de scoring não rodou para todos os tickers.**
- 🔒 Portfolio strip, equity curve, dividendos — depende de login + posições adicionadas
- ❌ Inteligência (radar feed) — backend retorna feed vazio

## Explorer `/explorar`
⚠️ **Parcial**
- ✅ 201 tickers listados com logos, nomes, setores
- ⚠️ IQ-Score: só 2 tickers têm score. Resto mostra "—". **Causa: pipeline de scoring.**
- ✅ Sort bidirecional em 11 colunas funciona
- ✅ Click no ticker navega para detalhe

## Detalhe do Ativo `/ativo/:ticker`
⚠️ **Parcial (depende do ticker)**
- ✅ Header: ticker, nome, cluster, logo — funciona para todos
- ✅ Cotação: preço, open, high, low, volume, market cap — funciona para ~90% dos tickers
- ✅ Gráfico TradingView: candlestick + volume — funciona quando ticker tem histórico
- ⚠️ IQ-Score: null para maioria dos tickers. **Causa: pipeline.**
- ⚠️ Fair Value: null para maioria. **Causa: pipeline.**
- ✅ Tese: existe para tickers processados pelo quali (ex: PETR4)

### Tabs:
| Tab | Status | Detalhe |
|---|---|---|
| Fundamentos | ✅ | ROE, ROIC, margens, Piotroski, Altman Z — dados reais de financials |
| Valuation | ⚠️ | Fair value existe para poucos tickers. Gráficos de margem e cenários funcionam quando dados existem |
| Dividendos | ✅ | Histórico de proventos por ano — dados reais |
| Notícias & RI | ✅ | Notícias reais com sentimento. RI vazio para a maioria |
| Dossiê | ✅ | Dimensões qualitativas com narrativa e evidências — dados reais |
| Histórico | ⏳ | Precisa do pipeline rodar para acumular histórico de scores |
| Institucional | ❌ | Backend não tem dados de holders/short interest ainda |

## Comparar `/comparar`
✅ **Funciona**
- ✅ Busca, auto-compare, cards visuais, 3 gráficos, tabela
- ⚠️ Métricas como IQ-Score, Fair Value podem estar null. **Causa: pipeline.**

## Mapa de Mercado `/mapa`
⚠️ **Parcial**
- ✅ Treemap renderiza
- ⚠️ Dados do screener: poucos tickers com score. Treemap colorido por variação (não por score).

## Termômetro `/termometro`
⚠️ **Parcial**
- ✅ Distribuição por rating: funciona (2 ativos)
- ✅ Regime macro: dados reais
- ⚠️ Heatmap: poucos dados. **Causa: pipeline.**

## Carteira `/carteira`
🔒 **Depende de login**
- ✅ UI de listagem, CRUD, analytics — código pronto
- 🔒 POST precisa de JWT do Supabase (login obrigatório)
- ❌ CORS em Vercel: fix no backend deployado mas Railway pode precisar de redeploy

## Dividendos `/dividendos`
⚠️ **Parcial**
- ❌ Calendário: backend vazio (sem próximos proventos nos 30 dias)
- ❌ Radar: backend vazio
- 🔒 Resumo/Projeções: depende de portfolio
- ✅ Simulador: funciona se digitar tickers e valores

## Decidir `/decidir`
🔒 **Depende de portfolio** — Precisa de posições para sugerir alocação

## Income Planner `/income-planner`
⚠️ **Parcial** — Busca dividend radar do backend, mas pode estar vazio

## Simulador Macro `/simulador`
⚠️ **Parcial**
- ✅ Regime e sliders: dados reais
- 🔒 Impactos: depende de portfolio

## Se eu tivesse `/simulador/comparar`
✅ **Funciona** — Busca histórico de preço e dividendos, calcula retorno client-side

## Risk Scanner `/risk-scanner`
🔒 **Depende de portfolio**

## Institucional `/institucional`
❌ **Sem dados** — Backend não tem holders/short interest

## Radar `/radar`
❌ **Feed vazio** — Backend não gera items no feed

## Macro `/macro`
✅ **Funciona**
- ✅ Regime, indicators, rotação setorial, heatmap — dados reais
- ❌ Focus BCB: vazio

## Backtest `/backtest`
⏳ **Depende do pipeline** — Precisa de scores históricos

## Analytics `/analytics`
⏳ **Sem dados suficientes** — Precisa de 30+ dias de scores

## Configurações `/configuracoes`
✅ **Funciona** (layout pronto, billing depende de config)

## Login/Registro `/login` `/registro`
✅ **Funciona** (Supabase configurado)

---

## Causa raiz da maioria dos problemas

**O pipeline `IQ Daily Scores` (GitHub Actions) precisa rodar.** Ele processa todos os ~267 tickers com:
1. compute_quanti (score quantitativo)
2. compute_quali (score qualitativo via LLM)
3. compute_valuation (fair value DCF/Gordon/Múltiplos)
4. compute_iq_score (score final consolidado)
5. compute_theses (tese de investimento)

Sem esse pipeline, só 2 tickers têm scores (RVEE3, CAML3). O restante tem dados parciais (financials, cotações, notícias) mas sem IQ-Score.

**Para resolver:** Disparar `gh workflow run iq_daily_scores.yml` no repositório do backend.
