# CLAUDE.md — Invística

> Arquivo de contexto persistente. Lido automaticamente pelo Claude Code a cada nova sessão.
> Última atualização: 2026-04-17

---

## 1 · Identidade da marca-mãe

**Invística** é a casa brasileira de inteligência quantamental aplicada a investimentos em ações.

**Tagline oficial:** *Inteligência que valoriza.*

**Manifesto:**

> Investir é uma disciplina. Tem método, rigor e tempo — como qualquer arte que exige domínio.
>
> Aqui, cada decisão passa por três olhares: o que os números revelam, o que a empresa demonstra ao longo do tempo, o que o preço justo confirma. Os três precisam convergir. Nada avança sem isso.
>
> Esta é a Invística. Uma forma de investir que não depende de sorte, intuição ou pressa.

**Natureza do negócio:** plataforma SaaS de análise e gestão quantamental em paralelo com trilha regulatória para clube de investimentos e eventual gestora CVM. Não é fintech retail, não é corretora, não é app. É buyside acessível.

**Público-âncora:** o vácuo dos R$ 500k–R$ 10M. Retail sofisticado insatisfeito com superficialidade de Gorila/Snowball + semi-profissional que tem assessor XP/BTG mas quer autonomia com rigor + profissional solo (gestor CVM, family office júnior, RI) via plano institucional.

**Postura de marca:** severa no método, calorosa na comunicação. Referências: Apple, Porsche, UBS, Ray-Ban, Ferrari, Mercedes. Nenhuma dessas explica o que faz; todas afirmam por existirem.

---

## 2 · Arquitetura de marca

Três camadas. Apenas duas nomeadas. Nenhuma poluição de jargão interno vazando para o público.

| Camada | Nome | Função |
|--------|------|--------|
| Marca-mãe | **Invística** | A casa |
| Produto-insígnia | **Invscore** | O score de 0 a 100 atribuído a cada ação |
| Componentes internos | Sem nome próprio | Descrição técnica apenas |

**Componentes internos sem nome:**
- O modelo / o motor / o método quantamental — nunca nomeado publicamente
- Pilar Quantitativo, Pilar Qualitativo, Pilar Valuation — descrição neutra, sem marca
- Versão do modelo (ex: v11) — versionamento interno, não público

---

## 3 · Branding do Invscore

### 3.1 · Estrutura do nome

`Inv` (raiz de Invística) + `score` (vocabulário técnico). A tipografia revela essa estrutura sem quebrar a leitura.

### 3.2 · Logotipo oficial

- **`Inv`** em serif display (PP Editorial New)
- **`score`** em sans-serif (Geist Sans)
- **Acento agudo em cobre** sobre o "I" inicial — assinatura visual herdada de Invística
- Filete em cobre de apoio quando aplicável
- A transição serif → sans dentro da palavra narra visualmente que Invscore é *a expressão técnica da inteligência Invística*

### 3.3 · Três estados tipográficos

**Estado 1 — Logotipo oficial (materiais de marca)**
Tipografia dupla (serif + sans), acento em cobre. Uso: página de produto, manifesto, apresentações institucionais, materiais de imprensa, header de relatórios.

**Estado 2 — Forma de produto (UI e copy corrido)**
Escrito como palavra única, em Geist Sans medium, com I capitalizado: `Invscore`. Uso: chat, dashboard, filtros, tooltips, copy corrido do site.
> *"ITUB4 tem Invscore 84."*
> *"Filtre ações com Invscore acima de 80."*

**Estado 3 — Forma numérica (dados tabulares)**
Label "Invscore" em Geist Sans caixa baixa acima, número em Geist Mono com tabular-nums:
> `Invscore`
> `84`

### 3.4 · Escala qualitativa — 5 faixas nomeadas

O Invscore vai de 0 a 100. Para copy e UI, também há leitura qualitativa por faixas:

| Faixa | Nome | Significado |
|-------|------|-------------|
| 85–100 | **Convicção** | Evidência forte nos três pilares |
| 70–84 | **Favorável** | Maioria dos pilares aponta positivo |
| 55–69 | **Neutro** | Pilares divididos ou sem sinal claro |
| 40–54 | **Reserva** | Pelo menos um pilar com alerta |
| 0–39 | **Evitar** | Pilares convergem negativamente |

Copy de exemplo:
> *"VALE3 em Convicção, Invscore 89."*
> *"Essa ação saiu de Favorável para Reserva no último trimestre."*
> *"12 ações em Convicção na metodologia atual."*

### 3.5 · Expressões-satélite (vocabulário oficial)

- **"Invscore alto / baixo"** — referência qualitativa
- **"Dentro do Invscore"** — *"essa convicção está dentro do Invscore da ação"*
- **"Subiu / caiu no Invscore"** — movimento temporal
- **"Acima do Invscore de corte"** — threshold para recomendação
- **"O Invscore médio do setor"** — comparativos agregados

Essas expressões devem aparecer organicamente em copy, posts, relatórios — vocabulário que se naturaliza com uso consistente.

---

## 4 · Filosofia editorial — voz da marca

Regras operacionais para qualquer texto de qualquer superfície (home, emails, posts, carta ao investidor, UI microcopy):

1. **Frases curtas. Pontos finais frequentes.** Período médio: 12–18 palavras.
2. **Zero adjetivo sem substância.** "Poderoso", "completo", "inovador", "revolucionário" proibidos. Toda qualidade é provada com número, método ou exemplo concreto.
3. **Números específicos vencem arredondamento.** Não é "milhares de análises"; é "947 ações". Não é "performance superior"; é "+15,4% a.a. vs IBOV (2012–2025)".
4. **Vocabulário institucional sem opacidade.** Termos técnicos corretos (Sharpe, Information Coefficient, margem de segurança, walk-forward) sempre com explicação embutida na primeira aparição.
5. **Zero superlativo comercial.** "Melhor do Brasil", "mais avançado", "número 1" são linguagem de concorrente. Invística afirma pelo método, não pelo ranking.
6. **Nunca atacar concorrentes.** Direto nem indireto. Nada de "ao contrário de outros", "sem os vícios do mercado".
7. **Nunca explicar o óbvio.** Se o leitor não entende um conceito, ele aprende navegando — não é educado no manifesto.
8. **Zero linguagem de urgência comercial.** Nada de "comece agora", "transforme seus investimentos". Invística convida, não convoca.
9. **Números técnicos ficam em páginas técnicas.** Metodologia, Backtest, Resultados — ali sim, rigor quantitativo visível.
10. **Copy em PT-BR sempre.** Termos técnicos financeiros em inglês quando não há tradução consolidada (spread, drawdown, alpha).

---

## 5 · Identidade visual — paleta

### 5.1 · Modo primário: dark

Contexto profissional de investimento é dark por convenção (terminal Bloomberg, research institucional). Light mode existe como secundário.

### 5.2 · Cores primárias

| Nome | Hex | Uso |
|------|-----|-----|
| Preto absoluto | `#0A0C10` | Background primário dark mode |
| Off-white institucional | `#ECEAE4` | Texto primário sobre fundo escuro |
| Cobre dessaturado | `#B87333` | Acento único da marca |
| Cobre claro | `#D69A5C` | Variante para detalhes sobre fundo escuro (melhor contraste) |

### 5.3 · Cinzas editoriais

| Nome | Hex | Uso |
|------|-----|-----|
| Surface 1 | `#12151C` | Cards primários |
| Surface 2 | `#1C2029` | Cards secundários, hover |
| Border | `#2A2F3A` | Bordas sutis |
| Text secondary | `#9EA3AE` | Labels, captions, metadados |
| Text tertiary | `#5C6170` | Texto menos relevante |

### 5.4 · Cores funcionais (sempre dessaturadas)

| Nome | Hex | Uso |
|------|-----|-----|
| Positivo | `#4E9B7E` | Ganhos, compras, positivo |
| Negativo | `#C45D5D` | Perdas, vendas, negativo |
| Atenção | `#D9A854` | Alertas, warnings |

### 5.5 · Regras absolutas de cor

- Verde e vermelho puros **proibidos** — sempre dessaturados
- Cobre só é usado como **acento**, nunca em área grande
- Fundo preto absoluto sem textura, sem gradiente, sem ruído
- Apenas uma cor de marca (cobre) — proibida expansão de paleta sem discussão explícita

---

## 6 · Identidade visual — tipografia

### 6.1 · Sistema de três vozes

- **Display editorial (serif):** **PP Editorial New** (Pangram Pangram) como primeira opção. Alternativas aceitas: Tiempos Headline, Reckless Neue. Uso: logotipo Invística, primeira parte (`Inv`) do logotipo Invscore, títulos de páginas institucionais, thesis statements.
- **UI principal (sans):** **Geist Sans**. Uso: toda UI funcional, formulários, navegação, body copy técnico, segunda parte (`score`) do logotipo Invscore.
- **Tabular mono (dados):** **Geist Mono**. Uso: tickers, preços, números do Invscore em tabelas, qualquer dado financeiro que precise alinhamento rígido.

### 6.2 · Regras globais de número

- `font-variant-numeric: tabular-nums lining-nums` aplicado globalmente via CSS no `body`
- Milhar com ponto, decimal com vírgula (padrão brasileiro)
- Zero sempre com traço cortante se a fonte oferecer (Geist Mono tem)

### 6.3 · Decisões absolutas de UI

- **Zero emoji** em qualquer interface de produção
- **Zero glassmorphism**, zero glow, zero gradient decorativo
- **Mobile-first** a partir de 375px
- **Radius máximo 8px** (coerente com disciplina anti-template já codificada no Tailwind atual)
- **Animação ease-out curta** (150–250ms), nunca spring bouncy, nunca animação performática sem função
- Logotipo Invística usa acento agudo do "í" em cobre como elemento gráfico distintivo
- Logotipo Invscore usa acento agudo sobre o "I" inicial em cobre (rima visual com Invística)

---

## 7 · Arquitetura do produto

### 7.1 · O motor quantamental (sem nome próprio)

**3 pilares. 9 setores. Regime-aware. 947 ações B3 analisadas diariamente.**

- **Pilar Quantitativo** — 5 sub-scores: Qualidade (ROE, ROIC, Piotroski), Risco (Altman Z-Score, Merton PD), Valuation (múltiplos relativos ao setor), Crescimento (CAGR 5a), Momento (RSI, MA)
- **Pilar Qualitativo** — 6 dimensões avaliadas por IA: Pricing Power, Alocação de Capital, Gestão, Resiliência, Competitividade, Governança
- **Pilar Valuation** — 4 modelos combinados: DCF (5 anos), Gordon DDM, Múltiplos setoriais, Monte Carlo (10.000 simulações, bandas P25/P75)

**Versão interna:** v11 Adaptive Apex, com gatekeeper de 3 camadas e rotação setorial ajustada por regime macro (Risk On / Risk Off / Estagflação / Recuperação). *Versionamento não exposto publicamente.*

**Performance validada:** walk-forward 2012–2025, CAGR 21,2%, alpha +15,4% a.a. vs IBOV, Sharpe 0,67, Max DD −37,2%. R$1M → R$12,79M no período. Custos reais, impostos e survivorship bias considerados.

**Output do motor:** o Invscore — nota de 0 a 100 atribuída a cada ação, com faixa qualitativa nomeada.

### 7.2 · Universo de ativos V1

**Todas as ações da B3.** UX deve deixar claro que o universo é completo, com marcação visual para ativos de baixa liquidez (`ADTV < R$ 2M`) indicando "Liquidez insuficiente para aporte > R$ 50k" — transparência radical sem excluir ninguém da análise.

### 7.3 · Teses de investimento V1

Três teses no V1, cobrindo 90% da demanda sem dispersar execução:

1. **Value** (Guepardo-style) — qualidade + preço + paciência
2. **Dividendos** (income-first) — safety score, DY projetado, detecção de trap risk
3. **Quality / Growth** (Baillie Gifford adaptado ao Brasil)

### 7.4 · Roadmap

**V1 (0–9 meses):** Plataforma de análise quantamental + gestão prescritiva de carteira. Recomendação nível prescritivo (*"Compre R$ 3.400 de VALE3 hoje"*), sem execução direta. Importação via Pluggy, rebalance plan, ordens sugeridas para execução manual. Backtest público sob login.

**V2 (9–18 meses):** FIIs como motor dedicado (indicadores próprios, não reaproveitamento de equities). Teses adicionais: Small Caps, Defensive. Abertura B2B profissional via API.

**V3 (18–36 meses):** Clube de investimentos (após certificação CVM). Eventual evolução para gestora CVM com fundo aberto espelhando a metodologia. SaaS continua rodando em paralelo como funil de aquisição.

---

## 8 · Modelo de negócio

### 8.1 · PF — SaaS puro

Monetização por assinatura. Tiering a fechar após validação de mercado, mas direção indicativa:
- Tier popular — demonstração/observador
- Tier essencial — análise completa + 3 teses
- Tier profissional — gestão prescritiva + backtest + laboratório

### 8.2 · PJ — Institucional sob consulta

Licenciamento B2B para gestor solo, family office júnior, RI de empresas listadas. Preço alto, baixo volume, alta margem. A partir de R$ 1.500/mês, negociado caso a caso.

### 8.3 · Regulatório

Hoje: plataforma informacional. Trilha: certificação CGA ANBIMA (2026) → analista CVM → eventual gestor CVM (V3).

---

## 9 · Stack técnica

### 9.1 · Definido (backend/dados)

- **Banco de dados:** Supabase (PostgreSQL)
- **Cache:** Redis via Upstash
- **Orquestração de agentes:** LangGraph
- **Dados de mercado:** Brapi (B3), dados fundamentalistas próprios, CVM
- **Pagamento:** Mercado Pago
- **Monitoramento:** Sentry

### 9.2 · Frontend (estado atual do repositório herdado)

- Next.js 16 + React 19
- Tailwind CSS 3.4 (token system V2 já implementado, com disciplina anti-template)
- tRPC 11 + Prisma 6
- TanStack Query
- Framer Motion
- Lightweight Charts (séries de preço) + Recharts/D3 (charts analíticos)
- Pluggy Connect (Open Finance)
- Geist Sans + Geist Mono (a complementar com PP Editorial New)

### 9.3 · Arquitetura

- Monorepo com `packages/shared`
- Gateway BFF separado entre front e API
- CSP rigorosa + HSTS preload + X-Frame-Options DENY
- Demo mode via feature flag (`NEXT_PUBLIC_DEMO_MODE`)

---

## 10 · Convenções de código

### 10.1 · TypeScript

- Strict mode obrigatório
- Sem `any` — tipar tudo explicitamente
- Types simples preferidos sobre Interfaces, exceto quando herança exige

### 10.2 · Componentes React

- Functional components only
- Props tipadas inline para componentes simples, type separado para complexos
- Naming: PascalCase para componentes, camelCase para hooks e utils

### 10.3 · Git

- Commits em português, mensagens descritivas
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

---

## 11 · Regras absolutas para o Claude Code

1. **Nunca gerar código que contradiga a paleta, a tipografia ou as decisões absolutas de UI.** Se houver dúvida, perguntar antes de gerar.
2. **Nunca assumir features ou decisões de produto não documentadas aqui.** Consultar antes.
3. **Todo dado financeiro exibido deve usar `tabular-nums`.**
4. **Não simplificar ou "dumbificar" implementações.** O padrão é enterprise.
5. **Copy em PT-BR sempre, respeitando as 10 regras editoriais da seção "Voz da marca".**
6. **Nunca adicionar bibliotecas de componentes prontas** (shadcn, MUI, Chakra) sem discussão explícita. Componentes são construídos em cima de Radix UI primitivos.
7. **Nunca usar `IQ-Score`, `IQ-Cognit` ou variações** — essa nomenclatura é legada do InvestIQ e não pertence à Invística. O score se chama Invscore. O motor não tem nome público.
8. **Antes de fechar a sessão:** atualizar a seção "Estado atual" abaixo com o que foi feito e o que falta. Atualizar também o log de sessões.

---

## 12 · Estado atual

**Fase:** Transição do front herdado (InvestIQ) para identidade nova (Invística). Marca, manifesto, paleta, tipografia e branding do Invscore fechados. Backend em produção no Railway com o motor quantamental funcional.

**Concluído:**
- Nome Invística registrado nos domínios `.com.br` e `.com`
- Instagram `@invistica` garantido
- Tagline oficial: *Inteligência que valoriza*
- Manifesto v2 aprovado
- Paleta dark-first com cobre dessaturado definida
- Sistema tipográfico de três vozes definido
- **Nome do score definido: Invscore**
- Tratamento tipográfico do Invscore definido (serif + sans + acento cobre)
- Escala qualitativa do Invscore definida (Convicção / Favorável / Neutro / Reserva / Evitar)
- Arquitetura de marca fechada (Invística → Invscore → componentes sem nome)
- Backtests v11 validados (CAGR 21,2%, alpha +15,4% a.a.)
- Stack backend em produção
- 40+ endpoints expostos via API

**Próximos passos (em ordem):**
- [ ] Registro INPI classe 36 (serviços financeiros) e classe 9 (software) para Invística e Invscore
- [ ] Produção do logotipo Invística e Invscore em SVG final (PP Editorial New + Geist Sans)
- [ ] Rename de `InvestIQ` / `IQ-Score` / `IQ-Cognit` para `Invística` / `Invscore` no código do repositório `investiq-web`
- [ ] Aplicação da paleta nova sobre o token system V2 existente
- [ ] Carregar PP Editorial New na stack de fontes
- [ ] Reescrita da landing: home-manifesto, página metodologia, página resultados
- [ ] Ticker page unificada (tela-herói consumindo ~12 endpoints em dossiê único)
- [ ] Apontamento de DNS dos domínios `invistica.com.br` e `invistica.com`
- [ ] Certificação CGA ANBIMA em 2026

---

## 13 · Log de sessões

| Data | Resumo | Decisões fechadas |
|------|--------|-------------------|
| 2026-04-17 | Rebrand completo InvestIQ → Invística. Identidade visual, voz, posicionamento, produto-insígnia. | Nome Invística; tagline *Inteligência que valoriza*; cobre dessaturado `#B87333`; serif PP Editorial New + Geist Sans/Mono; manifesto v2; roadmap V1/V2/V3; modelo PF SaaS + PJ institucional; **nome do score: Invscore**; tratamento tipográfico dual (serif+sans); escala qualitativa 5 faixas nomeadas; motor e pilares sem nome próprio |
