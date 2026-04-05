# INVESTIQ — DESIGN SYSTEM & DASHBOARD SPECIFICATION v1.0

> Este documento é a ÚNICA referência para implementação do frontend InvestIQ.
> Qualquer conflito com documentos anteriores: ESTE PREVALECE.
> Leia inteiro antes de escrever uma linha de código.

---

## PARTE 1 — IDENTIDADE

InvestIQ é a plataforma de investimentos mais inteligente e poderosa do Brasil. Não é um screener. Não é um site de análise genérico. É a primeira plataforma brasileira que dá ao investidor comum o mesmo poder de análise que um gestor profissional de grande fundo tem na Faria Lima.

IQ = Intelligence Quotient. A plataforma É inteligência. O motor IQ-Cognit se manifesta em tudo: scores, fair value, regime, alertas, oportunidades. Cada dado na tela é prova do poder proprietário.

**Tom visual:** Private banking digital. Research desk + terminal + editorial + AI integrados.
**Sensação:** Sofisticado, arrojado, exclusivo. Não é Excel. Não é planilha. É inteligência traduzida em sinais visuais.
**Densidade:** Média — Koyfin style. Denso mas organizado e respirável.

---

## PARTE 2 — PALETA DE CORES

### 2.1 Cor de Identidade
```
Acid Neon:         #D4E500  (cor vibrante — CTAs, linhas, gráficos, destaques)
Acid Neon Dark:    #6B7200  (variante para texto sobre fundo claro)
Acid Neon Bg:      rgba(212, 229, 0, 0.10)  (backgrounds de tags/badges em light)
Acid Neon Bg Dark: rgba(212, 229, 0, 0.08)  (backgrounds de tags/badges em dark)
```

O Acid Neon deve ser SENTIDO em toda a plataforma. Não é um detalhe — é a identidade. Aparece em:
- Linha do gráfico principal (equity curve)
- Fill do gauge de score (faixa 70-81)
- CTAs e botões primários
- Links e ações
- Barra decorativa entre seções
- Scores na faixa Acumular (70-81)
- Badges de oportunidade
- Linha de acento do Intelligence Strip

### 2.2 Cores Semânticas (NUNCA mudam)
```
LIGHT MODE:
  Positivo (lucro/alta):     #16A34A
  Negativo (perda/baixa):    #DC2626
  Alerta (warning):          #A16207
  Informacional:             #3B6B96

DARK MODE:
  Positivo:                  #4ADE80
  Negativo:                  #F87171
  Alerta:                    #FBBF24
  Informacional:             #60A5E9
```

### 2.3 Escala de Scores (IMUTÁVEL)
```
≥82 (Compra Forte):  cor positiva (verde)
70-81 (Acumular):    cor Acid Neon (#D4E500 dark / #6B7200 light)
45-69 (Manter):      cor alerta (amber)
30-44 (Reduzir):     cor negativa (vermelho)
≤29 (Evitar):        cor negativa intensa (vermelho)
```

### 2.4 Superfícies
```
LIGHT MODE:
  Background:     #FAFAF6
  Surface 1:      #FFFFFF   (cards, containers)
  Surface 2:      #F5F5F0   (hover, nested)
  Surface 3:      #EEEEE8   (disabled, skeleton)
  Borda:          #E0DFD8
  Borda sutil:    #ECECE6
  Texto primário: #111110
  Texto secundário: #52524A
  Texto terciário:  #888880
  Texto quaternário: #BBBBAA

DARK MODE:
  Background:     #08080A
  Surface 1:      #0E0E10   (cards, containers)
  Surface 2:      #141416   (hover, nested)
  Surface 3:      #1A1A1E   (disabled, skeleton)
  Borda:          #1E1E18
  Borda sutil:    #161614
  Texto primário: #E8E8E0
  Texto secundário: #A0A098
  Texto terciário:  #666660
  Texto quaternário: #444440
```

### 2.5 CTA / Botões
```
Botão primário:     background #D4E500, color #111110, font-weight 600
Botão primário hover: background #C8D800 (ligeiramente mais escuro)
Botão secundário:   background transparent, border 1px solid #E0DFD8, color #111110
Botão ghost:        background transparent, color #6B7200 (ou #D4E500 em dark)

Em dark mode:
Botão primário:     background #D4E500, color #08080A
```

---

## PARTE 3 — TIPOGRAFIA

### 3.1 Fonte
```
ÚNICA fonte para TUDO: Onest
Carregamento: @fontsource-variable/onest (npm) ou Fontsource CDN
Pesos: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

NÃO usar nenhuma fonte monoespacada. IBM Plex Mono EXTIRPADO.
Números financeiros usam Onest com font-variant-numeric: tabular-nums.

### 3.2 Escala de Tamanhos
```
Números hero (score, patrimônio):  32px, weight 700
Números grandes (KPIs):            24px, weight 700
Números médios (preços, %):        18px, weight 600
Corpo de texto:                    15px, weight 400
Corpo forte:                       15px, weight 600
Labels de seção:                   12px, weight 600, capitalize
Labels de dados (KPI labels):      11px, weight 500, capitalize, color texto-terciário
Texto auxiliar:                    12px, weight 400, color texto-secundário
Texto pequeno:                     11px, weight 400, color texto-terciário
Badge/tag texto:                   10px, weight 600, uppercase, letter-spacing 0.02em
```

### 3.3 Regras
- Labels de seção: Capitalize (ex: "Evolução patrimonial", não "EVOLUÇÃO PATRIMONIAL")
- Números: sempre font-variant-numeric: tabular-nums
- Tickers de ações (PETR4, WEGE3): weight 600, mesmo tamanho do contexto
- line-height para corpo: 1.5
- line-height para números/KPIs: 1.1
- letter-spacing para números grandes: -0.02em

---

## PARTE 4 — ESPAÇAMENTO & LAYOUT

### 4.1 Grid Base
```
Unidade base: 4px
Espaçamento entre seções:  32px (8 unidades)
Padding interno de cards:  20px (5 unidades)
Gap entre cards:           20px
Gap entre elementos internos: 12px
```

### 4.2 Layout Principal
```
┌─────────┬──────────────────────────────────────────────┐
│         │  TICKER TAPE (sempre visível, height ~36px)   │
│ SIDEBAR │├──────────────────────────────────────────────┤
│ (colap- ││                                              │
│ sável)  ││         CONTEÚDO PRINCIPAL                   │
│         ││         max-width: 1440px                    │
│         ││         padding: 24px 32px                   │
│         ││         margin: 0 auto                       │
│         ││                                              │
└─────────┴──────────────────────────────────────────────┘
```

Sidebar colapsada: ~56px (só ícones)
Sidebar expandida: ~220px (ícones + texto)
Ticker tape: faixa superior fixa com cotações em movimento

### 4.3 Cards
```
background:    var(--surface-1)
border:        1px solid var(--border)
border-radius: 2px
box-shadow:    0 1px 3px rgba(0,0,0,0.04)  (light)
               0 1px 3px rgba(0,0,0,0.15)  (dark)
padding:       20px (default) ou conforme contexto
```

Cards NÃO têm cantos arredondados grandes. Máximo 2px. É terminal, não app mobile.

### 4.4 Responsividade
```
max-width: 1440px com margin auto
Abaixo de 1440px: conteúdo se adapta fluidamente
Abaixo de 1024px: layout empilha verticalmente
Abaixo de 768px: sidebar vira drawer, conteúdo full width
```

---

## PARTE 5 — ÍCONES

```
Biblioteca: Phosphor Icons
Package: @phosphor-icons/web ou phosphor-angular
Estilo padrão: outline (regular)
Estilo ativo: filled (ex: sidebar item selecionado)
Tamanho padrão: 20px
Tamanho sidebar: 22px
Tamanho inline com texto: 16px
Cor: herda do texto pai
```

---

## PARTE 6 — GRÁFICOS

### 6.1 Biblioteca
```
D3.js (d3) — para TUDO. Sem Chart.js, sem Lightweight Charts, sem Recharts.
Package: d3 (npm)
```

### 6.2 Estilo Visual
```
Linha principal:        2.5px, cor Acid Neon (#6B7200 light / #D4E500 dark)
Área fill:              mesma cor com opacity 0.06 (light) ou 0.04 (dark)
Linhas secundárias:     1.2px, cor texto-terciário
Linhas tracejadas:      1.2px, dasharray "5 4"
Grid lines:             0.5px, cor borda
Eixo Y:                 labels à esquerda, 10px, cor texto-terciário
Eixo X:                 labels embaixo, 10px, cor texto-terciário
Dot no último ponto:    circle r=4, mesma cor da linha
Tooltip no hover:       card flutuante com dados (implementar com D3)
```

### 6.3 Gráficos Obrigatórios
```
Equity Curve:     line chart com área fill, 3 séries (carteira, CDI, IBOV)
IBOV Intraday:    area chart com linha de abertura tracejada
Dividendos:       bar chart com barras sólidas (recebido) e com opacity (projetado)
Treemap:          D3 treemap para exposição setorial e mapa de mercado
Gauge:            SVG arc para score da carteira
Sparklines:       mini line charts 48x18px nos movers
```

### 6.4 Animações de Gráficos
```
No load da página:
- Linhas: desenham da esquerda para direita (stroke-dasharray animation)
- Barras: crescem de baixo para cima (height transition)
- Gauge: arco preenche do 0 ao valor (stroke-dashoffset transition)
- Números: count up animation (0 → valor final em ~600ms)
Duration: 600-800ms
Easing: ease-out
```

---

## PARTE 7 — COMPONENTES

### 7.1 Rating Badge
```
Compra Forte (≥82):
  light: background rgba(22,163,74,0.08), color #16A34A, border 1px solid rgba(22,163,74,0.12)
  dark:  background rgba(74,222,128,0.1), color #4ADE80

Acumular (70-81):
  light: background rgba(212,229,0,0.10), color #6B7200
  dark:  background rgba(212,229,0,0.08), color #D4E500

Manter (45-69):
  light: background rgba(161,98,7,0.08), color #A16207
  dark:  background rgba(251,191,36,0.1), color #FBBF24

Reduzir (30-44):
  light: background rgba(220,38,38,0.06), color #DC2626
  dark:  background rgba(248,113,113,0.08), color #F87171

Evitar (≤29):
  light: background rgba(220,38,38,0.10), color #DC2626, border 1px solid rgba(220,38,38,0.15)
  dark:  background rgba(248,113,113,0.12), color #F87171

Formato: font-size 10px, weight 600, uppercase, letter-spacing 0.02em, padding 3px 10px
```

### 7.2 Score Number
O número do score (67, 85, 33) MUDA DE COR por faixa:
- Mesmas cores das faixas do Rating Badge (sem background)
- Em contexto hero (gauge): font-size 32px
- Em tabela/lista: font-size 14-16px

### 7.3 Signal Tag (IQ Signals)
```
Upgrade:       border-left verde, tag verde
Risco:         border-left vermelho, tag vermelho
Oportunidade:  border-left Acid, tag Acid
Concentração:  border-left amber, tag amber
Dividendo:     border-left verde, tag verde
Evento:        border-left borda, tag neutro
```

### 7.4 Ticker Tape
```
Faixa superior fixa, height 36px
Background: var(--surface-1) com border-bottom 1px solid var(--border)
Animação: scroll horizontal contínuo via CSS (translateX)
Cada item: Ticker · Preço · Variação% (verde ou vermelho)
Separador: dot ou pipe entre items
Velocidade: ~50px/s (configurável)
```

### 7.5 Sidebar
```
Colapsada (default):
  Width: 56px
  Mostra: só ícones Phosphor (22px), centralizados
  Logo: "iQ" em Acid Neon

Expandida:
  Width: 220px
  Mostra: ícone + nome da tela
  Toggle: botão no topo ou hover

Item ativo:
  Background: var(--acid-bg)
  Color: var(--acid-dark) light / var(--acid) dark
  Ícone: filled (não outline)
  Indicador: barra 3px Acid Neon à esquerda

Item inativo:
  Color: texto-terciário
  Ícone: outline
  Hover: background var(--surface-2)

Agrupamento: labels de grupo entre seções (ex: "Descoberta", "Patrimônio")
```

---

## PARTE 8 — TRANSIÇÕES E ANIMAÇÕES

### 8.1 Interface
```
Transições de UI: ZERO.
Hover em botões: instantâneo
Mudança de página: instantâneo (sem fade)
Abertura de sidebar: instantâneo
Trocas de estado: instantâneo

NÃO usar transitions em: backgrounds, colors, borders, transforms de UI.
A interface é terminal — reage imediatamente.
```

### 8.2 Dados e Gráficos
```
Gráficos: animação sutil no primeiro load (linhas desenham, barras crescem)
Gauge: arco preenche com easing ease-out, 600ms
Números: count-up de 0 ao valor, 400ms
Sparklines: sem animação (aparecem prontas)

Quando dados atualizam (ex: refresh): sem animação, valor substitui instantaneamente.
Animação só no PRIMEIRO load da página.
```

---

## PARTE 9 — DASHBOARD — ESPECIFICAÇÃO COMPLETA

O dashboard é a tela principal. O investidor abre e vê inteligência proprietária traduzida em sinais visuais. Sem parágrafos. Sem texto longo. Puro sinal com dado quantitativo.

### 9.1 Hierarquia de Conteúdo (IMUTÁVEL)
```
1. Meu portfólio (score, P&L, patrimônio, alpha, beta)
2. Gráficos de performance (equity curve, dividendos, benchmarks)
3. Mercado AGORA (IBOV, movers, sentimento)
4. Inteligência do motor (sinais, oportunidades, alertas)
```

### 9.2 Zona 1 — Intelligence Strip

Uma faixa COMPACTA no topo do conteúdo (abaixo do ticker tape).

```
Layout: flex, align-items center, gap 12px, wrap
Padding: 10px 20px
Background: var(--text-primary) em light (#111110) / var(--surface-1) em dark com border
Height: ~40px (uma linha)
Cor do texto: var(--text-quaternary) no tema escuro da strip

Conteúdo (em sequência, separado por ·):
  • [dot 8px vermelho] Mercado defensivo
  • [texto Acid] 2 oportunidades detectadas
  • [texto vermelho] 1 alerta na carteira
  • Copom em 3 dias

A strip funciona como um TICKER de inteligência.
Acid Neon como linha de acento no bottom (2px).
```

NÃO mostrar: SELIC, IPCA, câmbio (isso vai na tela /macro).
NÃO mostrar: "Motor: valuation + dividendos" (o cliente não precisa saber).
NÃO usar: "Contração" (jargão). Usar: "Mercado defensivo" / "Mercado otimista" / "Mercado neutro".

### 9.3 Zona 2 — Portfolio Command

Layout SOLTO (não tabelado). Score como hero visual, KPIs como grupo horizontal com respiro.

```
Layout: flex, gap 40px, align-items flex-end
Margin-bottom: 32px

Elemento 1 — Score Gauge (flex-shrink: 0)
  SVG arc gauge, width ~120px
  Arco background: var(--border)
  Arco fill: cor por faixa do score, stroke-width 8, stroke-linecap round
  Número central: 32px weight 700, cor por faixa
  Badge abaixo: rating label com cores da seção 7.1
  Animação: arco preenche no load (600ms ease-out)
  Animação: número faz count-up (400ms)

Elemento 2 — KPIs (flex, gap 36px, flex-wrap wrap)
  Cada KPI é um grupo vertical:
    - Label: 12px weight 500, capitalize, cor texto-terciário
    - Valor: 28px weight 700, cor depende do dado
    - Sub: 12px weight 400, cor texto-quaternário

  KPIs (nesta ordem):
    1. Patrimônio: "R$ 30.786" (cor neutra) / sub: "12 posições"
    2. P&L dia: "+R$ 142" (cor positiva) / sub: "+0,46%"
    3. P&L total: "-0,74%" (cor negativa) / sub: "-R$ 228"
    4. Alpha vs CDI: "+7,0pp" (cor Acid) / sub: "12 meses"
    5. Próx. dividendo: "R$ 210" (cor neutra) / sub: "04 Abr · BBAS3"
    6. Beta: "0,82" (cor neutra) / sub: "Defensivo"

Após os KPIs, uma barra decorativa Acid Neon (height 2px, width 100%).

DADOS:
  - Score: GET /portfolio → iq_score
  - Patrimônio: GET /portfolio → total_value
  - P&L: calculado a partir das posições
  - Alpha: GET /portfolio/analytics → alpha_vs_cdi
  - Dividendo: GET /dividends/calendar?days=30 → primeiro item
  - Beta: GET /portfolio/analytics → beta
```

### 9.4 Zona 3 — Gráficos de Performance

Layout: grid 2 colunas (conteúdo principal 1fr + coluna lateral 340px), gap 32px.

#### 9.4.1 Evolução Patrimonial (coluna principal)

```
Título: "Evolução patrimonial" — 12px weight 600, capitalize
Seletor de período: 1M | 3M | 6M | 12M | Max — align-items right
  Ativo: cor Acid, weight 600
  Inativo: cor texto-quaternário

Gráfico D3: height 240px (NÃO menos que isso)
  OBRIGATÓRIO: eixo Y à esquerda (valores) E eixo X embaixo (meses/datas)
  Grid lines horizontais: 0.5px, cor var(--border)
  3 séries:
    - Carteira: linha 2.5px Acid Neon + area fill Acid 0.06 + dot r=4 no último ponto
    - CDI: linha 1.2px texto-terciário, sólida
    - Ibovespa: linha 1.2px texto-quaternário, tracejada
  Legenda: abaixo do gráfico, flex gap 20px, dot+label para cada série
  Tooltip no hover: card com data, valor de cada série

Métricas abaixo (flex, gap 32px):
  Carteira +15,0% (cor Acid)
  CDI +8,0% (cor texto-quaternário)
  Ibovespa +10,0% (cor texto-quaternário)
  Alpha +7,0pp (cor positiva)
  Max Drawdown -8,2% (cor texto-quaternário)
  Sharpe 1,24 (cor texto-quaternário)

Cada métrica: valor 20px weight 700, label 10px abaixo em texto-terciário

DADOS: Performance calculada a partir do portfólio + CDI/IBOV de referência
```

#### 9.4.2 Coluna Lateral (3 blocos empilhados, gap 28px)

**Bloco 1 — Ibovespa**
```
Label: "Ibovespa" — 12px weight 600, capitalize
Valor: 32px weight 700
Variação: 14px weight 600, cor positiva/negativa + pts em opacity 0.3
Gráfico: D3 area chart, height 60px
  Linha de abertura: tracejada horizontal
  Área fill: verde se acima abertura, vermelho se abaixo
  OBRIGATÓRIO: eixo X com horas (10h, 11h, ... 15h)
Footer: Abertura, Máximo, Volume — 11px

DADOS: Ticker tape data ou endpoint específico de IBOV
```

**Bloco 2 — Exposição Setorial (TREEMAP, não barras)**
```
Label: "Exposição setorial" — 12px weight 600
D3 treemap: height 80px
  Cada setor é um retângulo proporcional ao peso na carteira
  Cor: variações de Acid Neon (mais escuro = maior peso)
  Texto dentro: % e nome do setor abreviado
  Se um setor está ACIMA do recomendado pelo regime: borda vermelha no retângulo

DADOS: GET /portfolio/analytics → sector_exposure
```

**Bloco 3 — Dividendos Recebidos**
```
Label: "Dividendos recebidos" — 12px weight 600
D3 bar chart: height 70px
  12 barras (Jan-Dez), cada uma representando dividendos do mês
  Barras com valor: cor positiva (verde)
  Barras sem valor (meses futuros): cor positiva com opacity 0.15 (projeção)
  OBRIGATÓRIO: labels J F M A M J J A S O N D no eixo X
  Valores em cima das barras que tem dado
  Grid line horizontal sutil no valor máximo

DADOS: GET /dividends/summary?months=12
```

### 9.5 Zona 4 — Mercado

Layout: grid 3 colunas (1fr, 1fr, 340px), gap 28px.

#### 9.5.1 Maiores Altas (coluna 1)
```
Título: "Maiores altas" — 12px weight 600
4-5 itens, cada um:
  Layout: flex, align-items center, gap 8px, padding 10px 0
  Separador: linha 1px entre itens

  1. Rank: 11px, peso leve, width 16px (1, 2, 3, 4)
  2. Ticker: 14px weight 600, width 56px
  3. Sparkline: SVG 48x18px, cor positiva (linha ascendente)
  4. Variação: 13px weight 600, cor positiva, text-align right
  5. Score IQ: 14px weight 700, COR POR FAIXA, text-align right
  6. Score dot: circle 6px com cor da faixa

  Hover: cursor pointer, click navega para /ativo/{ticker}

DADOS: GET /scores/screener sortido por variação do dia (top 5 positivos)
```

#### 9.5.2 Maiores Baixas (coluna 2)
```
Mesmo formato da coluna 1, com:
  - Variação em cor negativa
  - Sparklines descendentes em cor negativa
  - Se o ativo está NA CARTEIRA do usuário: borda esquerda 2px vermelha + ticker em vermelho

DADOS: GET /scores/screener sortido por variação do dia (bottom 5)
```

#### 9.5.3 IQ Radar — Fora da Carteira (coluna 3)
```
Título: "IQ Radar · Fora da carteira"
3-4 itens, cada um:
  1. Ticker: 15px weight 600
  2. Score: 22px weight 700, cor por faixa
  3. Barra de margem de segurança: track 4px + fill Acid Neon proporcional
  4. Margem %: 13px weight 600, cor positiva

  Label "Margem de segurança" acima da barra em 10px texto-terciário

Lógica: GET /scores/top?limit=10, FILTRAR os que NÃO estão no portfólio do usuário.
Ordenar por margem de segurança decrescente.
```

### 9.6 Zona 5 — IQ Signals

Layout: grid 3 colunas (repeat(3, 1fr)), gap 16px.

```
Título: "IQ Signals" — 12px weight 600, margin-bottom 12px

Cada signal é um CARD INDEPENDENTE (não lista):
  Padding: 18px 20px
  Border-left: 3px solid (cor por tipo)
  Background: var(--surface-1)
  Border: 1px solid var(--border)
  Box-shadow: padrão dos cards
  Hover: cursor pointer

  Conteúdo:
    Linha 1: Tag (10px, uppercase, padding 2px 8px) ............ Ícone (16px weight 700)
    Linha 2: Ticker (16px weight 700)
    Linha 3: Dado principal (24px weight 700, cor por tipo)
    Linha 4: Contexto curto (11px, cor texto-terciário, max 1 linha)

Tipos de signal:
  1. Upgrade:       Tag "Upgrade" verde · "RENT3" · "55 → 62" (cor Acid) · "Quanti melhorou"
  2. Risco:         Tag "Risco" vermelho · "CSAN3" · "38 → 33" (vermelho) · "DL/EBITDA 4,2x"
  3. Oportunidade:  Tag "Oportunidade" Acid · "WEGE3" · "Score 85" (verde) · "Margem 27%"
  4. Concentração:  Tag "Concentração" amber · "Carteira" · "47%" (amber) · "Limite 30%"
  5. Dividendo:     Tag "Dividendo" verde · "BBAS3" · "R$ 210" (verde) · "Ex-div 04 Abr"
  6. Evento:        Tag "Evento" neutro · "Copom" · "3 dias" (neutro) · "Manutenção"

Mostrar 6 signals (2 linhas de 3). Prioridade:
  1. Alertas da carteira do usuário (posições com queda > 1% ou score mudou)
  2. Oportunidades (ativos top score fora da carteira)
  3. Upgrades/downgrades das últimas 24h
  4. Concentração (se HHI > 0.25 ou setor > 30%)
  5. Dividendos próximos
  6. Eventos macro

DADOS: Combinação de /radar/feed + /scores/top + /portfolio/analytics + /dividends/calendar
Os signals são GERADOS no frontend combinando múltiplas APIs.
```

### 9.7 O que NÃO está no dashboard
```
- Painel macro completo (vai na tela /macro)
- Lista completa de posições da carteira (vai na tela /carteira)
- Screener (vai na tela /explorar)
- Detalhes de ativos (vai na tela /ativo/:ticker)
- Notícias genéricas (NUNCA no dashboard — catalisadores sim, mas formatados como signals)
- Texto longo, parágrafos, narrativas extensas
- Dados repetidos entre seções
```

---

## PARTE 10 — REGRAS IMUTÁVEIS

1. Onest é a ÚNICA fonte. Sem exceção. Sem mono.
2. Acid Neon #D4E500 é a identidade. Deve ser SENTIDO, não escondido.
3. Border-radius: 2px máximo. Sempre. Em tudo.
4. Transições de UI: ZERO. Instantâneo. Terminal.
5. Gráficos: D3.js puro. Sem Chart.js, sem TradingView, sem Recharts.
6. Cores semânticas: verde = lucro, vermelho = perda. NUNCA misturar com a marca.
7. Score muda de cor por faixa. Sempre.
8. Mandato: EXTIRPADO. Zero presença.
9. Light e dark mode: ambos nativos, mesma excelência.
10. O frontend SERVE o motor. Cada pixel prova o poder do IQ-Cognit.
11. Sem parágrafos no dashboard. Puro sinal + dado quantitativo.
12. Sem jargão econômico incompreensível. "Mercado defensivo", não "Contração".
13. Sem dados repetidos entre seções.
14. Sem notícias genéricas. Só inteligência proprietária.
15. Gráficos SEMPRE com eixo X e eixo Y. Sem gráfico mudo.

---

## PARTE 11 — VARIÁVEIS SCSS

```scss
// ===== PALETA =====
$acid-neon: #D4E500;
$acid-dark: #6B7200;
$acid-bg: rgba(212, 229, 0, 0.10);

$positive-light: #16A34A;
$positive-dark: #4ADE80;
$negative-light: #DC2626;
$negative-dark: #F87171;
$warning-light: #A16207;
$warning-dark: #FBBF24;
$info-light: #3B6B96;
$info-dark: #60A5E9;

// ===== LIGHT THEME =====
$light-bg: #FAFAF6;
$light-surface-1: #FFFFFF;
$light-surface-2: #F5F5F0;
$light-surface-3: #EEEEE8;
$light-border: #E0DFD8;
$light-border-subtle: #ECECE6;
$light-text-1: #111110;
$light-text-2: #52524A;
$light-text-3: #888880;
$light-text-4: #BBBBAA;

// ===== DARK THEME =====
$dark-bg: #08080A;
$dark-surface-1: #0E0E10;
$dark-surface-2: #141416;
$dark-surface-3: #1A1A1E;
$dark-border: #1E1E18;
$dark-border-subtle: #161614;
$dark-text-1: #E8E8E0;
$dark-text-2: #A0A098;
$dark-text-3: #666660;
$dark-text-4: #444440;

// ===== TIPOGRAFIA =====
$font-family: 'Onest Variable', 'Onest', system-ui, -apple-system, sans-serif;
$font-size-hero: 32px;
$font-size-large: 24px;
$font-size-medium: 18px;
$font-size-body: 15px;
$font-size-label: 12px;
$font-size-small: 11px;
$font-size-tag: 10px;

// ===== ESPAÇAMENTO =====
$gap-section: 32px;
$gap-card: 20px;
$gap-element: 12px;
$padding-card: 20px;
$padding-page: 24px 32px;
$max-width: 1440px;
$border-radius: 2px;
$sidebar-collapsed: 56px;
$sidebar-expanded: 220px;
$ticker-tape-height: 36px;
```

---

## PARTE 12 — IMPLEMENTAÇÃO NO CLI

Ao implementar, o CLI deve:

1. Ler este documento INTEIRO antes de começar
2. Criar/atualizar o arquivo de variáveis SCSS com TODAS as variáveis da Parte 11
3. Implementar o theme switching (light/dark) como CSS custom properties no :root e [data-theme="dark"]
4. Implementar a sidebar colapsável como componente independente
5. Implementar o ticker tape como componente independente
6. Implementar o dashboard com as 5 zonas exatas da Parte 9, na ordem especificada
7. Todos os gráficos com D3.js, com AMBOS os eixos, com animação no load
8. Testar em light e dark mode
9. Verificar que a fonte Onest está carregando (npm install @fontsource-variable/onest)
10. Verificar que Phosphor Icons está instalado

O Acid Neon deve ser VISÍVEL e SENTIDO ao abrir o site. Se você abrir o dashboard e não perceber o amarelo, está errado.
