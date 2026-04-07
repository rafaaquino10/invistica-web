// ─── Swagger / OpenAPI Configuration ──────────────────────────────
// Auto-generates API documentation for all gateway routes.
// Accessible at /docs (Swagger UI) and /docs/json (raw spec).

import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InvestIQ Gateway API',
      version: '3.0.0',
      description: `
API do Gateway InvestIQ — camada de dados financeiros para o frontend Next.js.

## Fontes de Dados
- **CVM** (dados.cvm.gov.br) — Demonstrações financeiras oficiais (DFP/ITR)
- **brapi** — Cotações, dividendos, módulos financeiros
- **BCB** — Indicadores macroeconômicos (SELIC, IPCA, CDI)
- **CAGED** — Dados de emprego setorial
- **RSS** — Notícias do mercado

## Arquitetura
- Cache SWR (Stale-While-Revalidate) com persistência em disco
- CVM é fonte primária; brapi preenche gaps
- Zero mock em dados de mercado
- Background jobs periódicos (5min a 24h)

## Rate Limits
- Global: 300 req/min por IP
- Endpoints pesados (\`/fundamentals\`, \`/modules\`): 30 req/min
      `,
      contact: {
        name: 'InvestIQ',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Desenvolvimento local',
      },
    ],
    tags: [
      { name: 'Cotações', description: 'Preços e cotações em tempo real' },
      { name: 'Fundamentais', description: 'Indicadores fundamentalistas (CVM + brapi)' },
      { name: 'Qualitativo', description: 'Métricas qualitativas derivadas (Earnings Quality, Moat, Z-Score)' },
      { name: 'Histórico', description: 'Dados históricos de preço (OHLCV)' },
      { name: 'Dividendos', description: 'Histórico de dividendos' },
      { name: 'Empresas', description: 'Metadados e perfis de empresas' },
      { name: 'Notícias', description: 'Notícias do mercado via RSS com análise de sentimento' },
      { name: 'Economia', description: 'Indicadores macroeconômicos (BCB)' },
      { name: 'Score', description: 'Score history, movers e alerts' },
      { name: 'Momentum', description: 'Sinais de momentum técnico' },
      { name: 'Intelligence', description: 'Síntese de inteligência de mercado' },
      { name: 'RI', description: 'Eventos de Relações com Investidores (CVM IPE)' },
      { name: 'Dados Alternativos', description: 'CAGED emprego, beta, sparklines' },
      { name: 'Admin', description: 'Endpoints administrativos' },
      { name: 'Sistema', description: 'Health check e status' },
    ],
    components: {
      schemas: {
        FundamentalData: {
          type: 'object',
          properties: {
            ticker: { type: 'string', example: 'PETR4' },
            cotacao: { type: 'number', example: 38.90 },
            peRatio: { type: 'number', nullable: true, example: 5.2 },
            pbRatio: { type: 'number', nullable: true, example: 1.1 },
            psr: { type: 'number', nullable: true, example: 0.8 },
            dividendYield: { type: 'number', nullable: true, example: 8.5, description: 'Dividend Yield (%)' },
            pAtivo: { type: 'number', nullable: true },
            pCapGiro: { type: 'number', nullable: true },
            pEbit: { type: 'number', nullable: true },
            pAtivCircLiq: { type: 'number', nullable: true },
            evEbit: { type: 'number', nullable: true },
            evEbitda: { type: 'number', nullable: true },
            margemEbit: { type: 'number', nullable: true, description: 'Margem EBIT (%)' },
            margemLiquida: { type: 'number', nullable: true, description: 'Margem Líquida (%)' },
            liquidezCorrente: { type: 'number', nullable: true },
            roic: { type: 'number', nullable: true, description: 'ROIC (%)' },
            roe: { type: 'number', nullable: true, description: 'ROE (%)' },
            liq2meses: { type: 'number', nullable: true, description: 'Volume médio 2 meses (R$)' },
            patrimLiquido: { type: 'number', nullable: true, description: 'Patrimônio Líquido (R$)' },
            divBrutPatrim: { type: 'number', nullable: true },
            crescimentoReceita5a: { type: 'number', nullable: true, description: 'CAGR Receita 5 anos (%)' },
            netDebtEbitda: { type: 'number', nullable: true },
            payout: { type: 'number', nullable: true, description: 'Payout (%)' },
            crescLucro5a: { type: 'number', nullable: true, description: 'CAGR Lucro 5 anos (%)' },
            fiftyTwoWeekHigh: { type: 'number', nullable: true },
            fiftyTwoWeekLow: { type: 'number', nullable: true },
            freeCashflow: { type: 'number', nullable: true },
            ebitda: { type: 'number', nullable: true },
            trendScore: { type: 'number', nullable: true, description: '-2 a +2 pts' },
            roeMedia5a: { type: 'number', nullable: true },
            mrgLiquidaMedia5a: { type: 'number', nullable: true },
            // Qualitative
            earningsQuality: { type: 'number', nullable: true, description: '0-100, qualidade dos lucros' },
            moatScore: { type: 'number', nullable: true, description: '0-100, vantagem competitiva' },
            moatClassification: { type: 'string', nullable: true, enum: ['wide', 'narrow', 'none'] },
            altmanZScore: { type: 'number', nullable: true, description: '< 1.8 distress, > 3.0 safe' },
            altmanZone: { type: 'string', nullable: true, enum: ['safe', 'grey', 'distress'] },
            roicPersistence: { type: 'number', nullable: true, description: 'Anos consecutivos ROIC > WACC' },
            fcfYield: { type: 'number', nullable: true, description: 'FCF / Market Cap (%)' },
          },
        },
        QualitativeMetrics: {
          type: 'object',
          properties: {
            ticker: { type: 'string', example: 'VALE3' },
            accrualsRatio: { type: 'number', nullable: true, description: '|accruals/ativo| — menor = melhor' },
            earningsQuality: { type: 'number', nullable: true, description: '0-100' },
            fcfToNetIncome: { type: 'number', nullable: true, description: 'FCF / Lucro Líquido' },
            fcf: { type: 'number', nullable: true, description: 'FCF em BRL' },
            fcfYield: { type: 'number', nullable: true, description: 'FCF / Market Cap (%)' },
            fcfGrowthRate: { type: 'number', nullable: true, description: 'CAGR FCF 5 anos (%)' },
            altmanZScore: { type: 'number', nullable: true },
            altmanZone: { type: 'string', nullable: true, enum: ['safe', 'grey', 'distress'] },
            moatScore: { type: 'number', nullable: true, description: '0-100' },
            moatClassification: { type: 'string', nullable: true, enum: ['wide', 'narrow', 'none'] },
            roicPersistence: { type: 'number', nullable: true },
            marginStability: { type: 'number', nullable: true, description: '0-100' },
            pricingPower: { type: 'number', nullable: true, description: 'Cresc. receita real acima IPCA (%)' },
            reinvestmentRate: { type: 'number', nullable: true },
            assetTurnoverTrend: { type: 'number', nullable: true },
            shortTermDebtRatio: { type: 'number', nullable: true },
            debtCostEstimate: { type: 'number', nullable: true, description: 'Custo estimado da dívida (%)' },
            netDebtToFcf: { type: 'number', nullable: true },
          },
        },
        Quote: {
          type: 'object',
          properties: {
            stock: { type: 'string', example: 'PETR4' },
            name: { type: 'string', example: 'PETROBRAS PN' },
            close: { type: 'number', example: 38.90 },
            change: { type: 'number', example: -1.23 },
            volume: { type: 'number', example: 45000000 },
            market_cap: { type: 'number', example: 500000000000 },
            sector: { type: 'string', example: 'Petróleo e Gás' },
          },
        },
        NewsArticle: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            link: { type: 'string' },
            source: { type: 'string' },
            pubDate: { type: 'string' },
            category: { type: 'string' },
            sentiment: {
              type: 'object',
              properties: {
                score: { type: 'number', description: '-1.0 a +1.0' },
                label: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                confidence: { type: 'number' },
              },
            },
            tickers: { type: 'array', items: { type: 'string' } },
          },
        },
        RiEvent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyName: { type: 'string' },
            ticker: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['fato_relevante', 'comunicado_mercado', 'aviso_acionistas', 'assembleia', 'resultado_trimestral'] },
            title: { type: 'string' },
            date: { type: 'string' },
            documentUrl: { type: 'string', nullable: true },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
            service: { type: 'string' },
            version: { type: 'string' },
            uptime: { type: 'number', description: 'Segundos' },
            memory: { type: 'object', properties: { heapUsed: { type: 'number' }, heapTotal: { type: 'number' }, unit: { type: 'string' } } },
            providers: { type: 'object' },
            caches: { type: 'object' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            source: { type: 'string' },
            cached: { type: 'boolean' },
            count: { type: 'number' },
            fetchedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      // ─── Cotações ─────────────────────────────────────────
      '/v1/quotes/all': {
        get: {
          tags: ['Cotações'],
          summary: 'Todas as cotações',
          description: 'Retorna cotações de ~780 ações brasileiras. Fonte: brapi.',
          responses: {
            200: { description: 'Lista de cotações', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Quote' } }, count: { type: 'number' } } } } } },
          },
        },
      },
      '/v1/quotes': {
        get: {
          tags: ['Cotações'],
          summary: 'Cotações filtradas',
          parameters: [
            { name: 'tickers', in: 'query', required: true, schema: { type: 'string' }, description: 'Tickers separados por vírgula', example: 'PETR4,VALE3,ITUB4' },
          ],
          responses: {
            200: { description: 'Cotações dos tickers solicitados' },
            400: { description: 'Parâmetro tickers ausente' },
          },
        },
      },

      // ─── Fundamentais ─────────────────────────────────────
      '/v1/fundamentals/all': {
        get: {
          tags: ['Fundamentais'],
          summary: 'Todos os indicadores fundamentalistas',
          description: 'Retorna ~807 ações com 30+ indicadores cada. Merge de CVM (primário) + brapi (secundário) + métricas qualitativas.',
          responses: {
            200: { description: 'Lista de fundamentais', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/FundamentalData' } }, source: { type: 'string' }, count: { type: 'number' } } } } } },
          },
        },
      },
      '/v1/fundamentals': {
        get: {
          tags: ['Fundamentais'],
          summary: 'Indicadores filtrados por ticker',
          parameters: [
            { name: 'tickers', in: 'query', required: true, schema: { type: 'string' }, example: 'PETR4,VALE3' },
          ],
          responses: {
            200: { description: 'Fundamentais dos tickers solicitados' },
            400: { description: 'Parâmetro tickers ausente' },
          },
        },
      },
      '/v1/fundamentals-cvm': {
        get: {
          tags: ['Fundamentais'],
          summary: 'Dados brutos CVM',
          description: 'Indicadores calculados exclusivamente a partir dos dados oficiais da CVM (DFP/ITR).',
          responses: { 200: { description: 'Fundamentais CVM' } },
        },
      },

      // ─── Qualitativo ──────────────────────────────────────
      '/v1/qualitative/all': {
        get: {
          tags: ['Qualitativo'],
          summary: 'Todas as métricas qualitativas',
          description: 'Retorna Earnings Quality, Moat Score, Altman Z-Score, FCF, Debt Profile para ~381 ações. Calculado a partir dos dados CVM existentes.',
          responses: {
            200: { description: 'Métricas qualitativas', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/QualitativeMetrics' } }, count: { type: 'number' } } } } } },
          },
        },
      },
      '/v1/qualitative': {
        get: {
          tags: ['Qualitativo'],
          summary: 'Métricas qualitativas por ticker',
          parameters: [
            { name: 'tickers', in: 'query', required: true, schema: { type: 'string' }, example: 'PETR4,VALE3' },
          ],
          responses: { 200: { description: 'Métricas qualitativas filtradas' } },
        },
      },
      '/v1/qualitative/{ticker}': {
        get: {
          tags: ['Qualitativo'],
          summary: 'Detalhe qualitativo de um ticker',
          parameters: [
            { name: 'ticker', in: 'path', required: true, schema: { type: 'string' }, example: 'PETR4' },
          ],
          responses: {
            200: { description: 'Métricas qualitativas do ticker' },
            404: { description: 'Ticker não encontrado' },
          },
        },
      },

      // ─── Histórico ────────────────────────────────────────
      '/v1/history/{ticker}': {
        get: {
          tags: ['Histórico'],
          summary: 'Histórico de preços OHLCV',
          parameters: [
            { name: 'ticker', in: 'path', required: true, schema: { type: 'string' }, example: 'PETR4' },
            { name: 'range', in: 'query', schema: { type: 'string', enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'], default: '1mo' } },
            { name: 'interval', in: 'query', schema: { type: 'string', enum: ['1d', '1wk', '1mo'], default: '1d' } },
          ],
          responses: { 200: { description: 'Dados OHLCV históricos' } },
        },
      },

      // ─── Dividendos ───────────────────────────────────────
      '/v1/dividends/{ticker}': {
        get: {
          tags: ['Dividendos'],
          summary: 'Histórico de dividendos',
          parameters: [
            { name: 'ticker', in: 'path', required: true, schema: { type: 'string' }, example: 'TAEE11' },
          ],
          responses: { 200: { description: 'Lista de dividendos pagos' } },
        },
      },

      // ─── Empresas ─────────────────────────────────────────
      '/v1/companies': {
        get: {
          tags: ['Empresas'],
          summary: 'Lista de empresas',
          description: 'Metadados de todas as empresas: ticker, nome, setor, subsetor.',
          responses: { 200: { description: 'Lista de empresas' } },
        },
      },
      '/v1/companies/{ticker}': {
        get: {
          tags: ['Empresas'],
          summary: 'Perfil detalhado da empresa',
          parameters: [
            { name: 'ticker', in: 'path', required: true, schema: { type: 'string' }, example: 'WEGE3' },
          ],
          responses: { 200: { description: 'Perfil da empresa com descrição, setor e indicadores' } },
        },
      },

      // ─── Notícias ─────────────────────────────────────────
      '/v1/news': {
        get: {
          tags: ['Notícias'],
          summary: 'Notícias do mercado',
          description: 'Notícias agregadas de feeds RSS com análise de sentimento (Loughran-McDonald PT-BR).',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filtro por categoria' },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 50 }, description: 'Limite de resultados' },
          ],
          responses: { 200: { description: 'Lista de notícias com sentimento', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } } } } } } } },
        },
      },

      // ─── Economia ─────────────────────────────────────────
      '/v1/benchmarks': {
        get: {
          tags: ['Economia'],
          summary: 'Benchmarks (SELIC, CDI, IBOV)',
          description: 'Indicadores de referência do mercado brasileiro.',
          responses: { 200: { description: 'Benchmarks atuais' } },
        },
      },
      '/v1/economy': {
        get: {
          tags: ['Economia'],
          summary: 'Indicadores macroeconômicos',
          description: 'SELIC, IPCA, CDI, câmbio — fonte BCB SGS.',
          responses: { 200: { description: 'Indicadores macro' } },
        },
      },

      // ─── Score ────────────────────────────────────────────
      '/v1/scores/history/{ticker}': {
        get: {
          tags: ['Score'],
          summary: 'Histórico de score de um ticker',
          parameters: [{ name: 'ticker', in: 'path', required: true, schema: { type: 'string' }, example: 'PETR4' }],
          responses: { 200: { description: 'Série temporal do IQ Score' } },
        },
      },
      '/v1/scores/movers': {
        get: {
          tags: ['Score'],
          summary: 'Maiores variações de score',
          description: 'Ações com maior variação de score no período recente.',
          responses: { 200: { description: 'Score movers' } },
        },
      },
      '/v1/scores/alerts': {
        get: {
          tags: ['Score'],
          summary: 'Alertas de score',
          description: 'Ações que cruzaram limiares de classificação (ex: de Atenção para Saudável).',
          responses: { 200: { description: 'Score alerts' } },
        },
      },

      // ─── Momentum ─────────────────────────────────────────
      '/v1/momentum': {
        get: {
          tags: ['Momentum'],
          summary: 'Sinais de momentum',
          description: 'Sinais técnicos macro, setorial e por ativo.',
          parameters: [{ name: 'ticker', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: 'Sinais de momentum' } },
        },
      },

      // ─── Intelligence ─────────────────────────────────────
      '/v1/intelligence': {
        get: {
          tags: ['Intelligence'],
          summary: 'Síntese de inteligência',
          description: 'Combinação de sentimento de notícias + contexto macro.',
          responses: { 200: { description: 'Intelligence synthesis' } },
        },
      },

      // ─── RI ───────────────────────────────────────────────
      '/v1/ri': {
        get: {
          tags: ['RI'],
          summary: 'Eventos de RI (últimos 30 dias)',
          description: 'Fatos relevantes, comunicados ao mercado, assembleias — fonte CVM IPE.',
          responses: { 200: { description: 'Lista de eventos RI', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/RiEvent' } } } } } } } },
        },
      },

      // ─── Dados Alternativos ────────────────────────────────
      '/v1/beta': {
        get: {
          tags: ['Dados Alternativos'],
          summary: 'Beta de todas as ações',
          description: 'Beta rolling 12M vs IBOV.',
          responses: { 200: { description: 'Map de betas' } },
        },
      },
      '/v1/sparklines': {
        get: {
          tags: ['Dados Alternativos'],
          summary: 'Sparklines (30d close)',
          description: 'Preços de fechamento dos últimos 30 dias para mini-gráficos.',
          responses: { 200: { description: 'Sparkline data' } },
        },
      },
      '/v1/alternative/caged': {
        get: {
          tags: ['Dados Alternativos'],
          summary: 'Dados CAGED (emprego)',
          description: 'Dados de emprego formal por setor (CAGED/MTE).',
          responses: { 200: { description: 'Dados CAGED' } },
        },
      },
      '/v1/modules': {
        get: {
          tags: ['Fundamentais'],
          summary: 'Módulos brapi',
          description: 'Dados financeiros derivados da API brapi (fonte secundária).',
          responses: { 200: { description: 'Módulos financeiros' } },
        },
      },

      // ─── Admin ────────────────────────────────────────────
      '/v1/admin/refresh': {
        post: {
          tags: ['Admin'],
          summary: 'Forçar refresh de cache',
          description: 'Força reconstrução do cache unificado.',
          responses: { 200: { description: 'Cache refreshed' } },
        },
      },

      // ─── Sistema ──────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Sistema'],
          summary: 'Health check',
          description: 'Status detalhado do gateway: providers, caches, memória, uptime.',
          responses: {
            200: { description: 'Gateway saudável', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
            503: { description: 'Gateway degradado/down' },
          },
        },
      },
    },
  },
  apis: [], // No JSDoc annotations needed — paths defined inline above
}

export const swaggerSpec = swaggerJsdoc(options)
