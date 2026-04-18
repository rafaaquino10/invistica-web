# CLAUDE.md — Invística (frontend `invistica-web`)

Este documento é a fonte de verdade para tudo que envolve a marca, a voz e a arquitetura visual da Invística no frontend. Claude Code CLI deve consultá-lo antes de qualquer decisão de copy, componente, estilo ou naming.

Última atualização: abril de 2026 · v5 · sistema de marca finalizado com símbolo "Pilar Alpha"

---

## 1 — Identidade

**Nome:** Invística
**Pronúncia:** /in.ˈvis.ti.ka/
**Etimologia:** raiz latina *invest-* (investir, aplicar) + *vís-* (de *videre*, visão) + sufixo *-ica* (disciplina técnica, como estatística, semiótica, física)
**Significado:** disciplina técnica do investir com visão. Sugere metodologia, rigor, conhecimento aplicado.

**Tagline oficial:** *Inteligência que valoriza*

Uso: aparece permanentemente abaixo do logotipo em aplicações formais, ou sozinha em contextos de campanha. Declaração absoluta, sem verbo imperativo.

**Descritor institucional:** *Inteligência aplicada a investimentos*

Uso: acompanha o logotipo em contextos onde a marca precisa de contexto imediato. Sempre em caps com letter-spacing ampliado.

---

## 2 — Manifesto

> Investir é uma disciplina. Tem método, rigor e tempo — como qualquer arte que exige domínio.
>
> Aqui, cada decisão passa por três olhares: o que os números revelam, o que a empresa demonstra ao longo do tempo, o que o preço justo confirma. Os três precisam convergir. Nada avança sem isso.
>
> Esta é a Invística. Uma forma de investir que não depende de sorte, intuição ou pressa.

Texto institucional-mãe. Pode aparecer na home, em contracapa de relatórios, em abertura de apresentações. Citável, não reescrevível.

---

## 3 — Posicionamento (do fundador)

A Invística é a plataforma de investimentos mais inteligente e poderosa do Brasil. É uma ferramenta quantamental proprietária (quantitativo completo + qualitativo profundo) focada exclusivamente no mercado brasileiro. Entrega vantagem mensurável (alpha real) acima do Ibovespa, CDI e SELIC para investidores que buscam performance consistente, sem depender de palpites ou ferramentas genéricas e sem precisar aderir a grande fundo com valor mínimo altíssimo para obter cota.

---

## 4 — Voz editorial (10 regras absolutas)

1. Frases curtas (12-18 palavras). Longas só quando a ideia exige.
2. Zero adjetivo vazio. Só adjetivos que se sustentam por si (rigoroso, auditável, verificável).
3. Números específicos (947 ações B3, +15,4% a.a. vs IBOV, Sharpe 0,67).
4. Vocabulário institucional com explicação embutida.
5. Zero superlativo comercial.
6. Nunca atacar concorrentes.
7. Nunca explicar o óbvio.
8. Zero urgência comercial.
9. Copy em português brasileiro.
10. Tom institucional calmo — severa no método, calorosa na comunicação.

---

## 5 — Arquitetura de marca

**Casa-mãe:** Invística
**Produto-insígnia:** Invscore (nota proprietária 0-100 atribuída a cada ação)
**Componentes internos:** motor quantitativo, 3 pilares de análise — SEM nome próprio público

### Invscore — tratamento tipográfico oficial

`Inv` em serif italic (Fraunces) + `score` em sans-serif light (Geist Sans). Filete amarelo sob a palavra conectando produto à marca-mãe.

### Escala qualitativa do Invscore

| Faixa | Nome | Descrição |
|---|---|---|
| 85-100 | Convicção | Alta qualidade + preço favorável + tese clara |
| 70-84 | Favorável | Qualidade consistente, preço justo |
| 55-69 | Neutro | Sem tese clara em qualquer direção |
| 40-54 | Reserva | Fragilidade em um ou mais pilares |
| 0-39 | Evitar | Fragilidade estrutural em múltiplos pilares |

---

## 6 — Paleta cromática oficial

Sistema dual-mode obrigatório.

### Dark Mode — "Noite OLED"

```
--bg-body:        #070A12
--bg-hero:        #0D1120
--bg-surface:     #10141F
--border:         #1C2030
--text-primary:   #F2F1E2
--text-secondary: #7C85A3
--text-tertiary:  #6B7490
--accent:         #FFE93D  (amarelo luminoso)
--accent-ink:     #0A0A00
```

### Light Mode — "Swiss Branco"

```
--bg-body:        #FFFFFF
--bg-hero:        #FFFFFF
--bg-surface:     #FAFAF6
--border:         #E3E6EC
--text-primary:   #0A1F3D  (Azul Aquino)
--text-secondary: #4A5A72
--text-tertiary:  #8A96AD
--accent:         #E8DC20  (amarelo saturado)
--accent-ink:     #1A1D00
--accent-text:    #8A7500  (amarelo-mostarda para texto legível)
```

### Cores funcionais (ambos os modos)

```
Dark:    --positive: #4ADE80   --negative: #F87171   --warning: #FFE93D
Light:   --positive: #16A34A   --negative: #DC2626   --warning: #CA8A04
```

### Princípio de aplicação — 3 camadas

Cor nunca inunda a tela toda. Toda página se organiza em:
1. Header estreito (zona funcional)
2. Hero (cor de marca em superfície grande mas contida)
3. Body de trabalho (UI real, cor como acento pontual)

Amarelo aparece como CTAs, tags destacadas, acentos numéricos, sublinhados. Nunca como fundo de conteúdo textual longo.

---

## 7 — Sistema de marca visual

### 7.1 Componentes

A marca Invística tem **dois ativos visuais principais** que operam como sistema:

**(A) Símbolo "Pilar Alpha"** — forma geométrica proprietária
**(B) Wordmark tipográfico** — a palavra "Invística" em Fraunces

Os dois podem aparecer juntos (lockup) ou separados, conforme o contexto.

### 7.2 Símbolo "Pilar Alpha" — código SVG oficial

```svg
<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Pilar: polígono principal, corte diagonal no topo em -22° -->
  <polygon points="0,60.4 100,20 100,120 0,120" fill="currentColor"/>
  <!-- Acento Alpha: retângulo rotacionado em -22° sobre o pilar -->
  <g transform="rotate(-22 50 30)">
    <rect x="0" y="2" width="100" height="18" rx="4" fill="#E8DC20"/>
  </g>
</svg>
```

Leitura conceitual do símbolo:
- Forma sólida fechada — funciona bordada em polo, gravada em metal, em favicon 16x16
- Corte diagonal no topo (22°) — referência à letra "I" italic do wordmark
- Acento amarelo suspenso — representa o "alpha" acima (alpha acima de IBOV, CDI, SELIC)
- Geometria única no mercado financeiro brasileiro

### 7.3 Wordmark — especificação

```
Fonte:        Fraunces 400 Regular (opsz 144)
Fallback:     Georgia, Times New Roman, serif
Italic:       APENAS no "I" maiúsculo inicial e no "í" com acento interno
Romano:       todas as outras letras (n, v, s, t, i, c, a)
Tracking:     -2% (letter-spacing: -0.02em)
Cor letras:   var(--text-primary) [azul em light, off-white em dark]
```

### 7.4 Acento agudo sobre o "í" — construção

O acento NÃO é o diacrítico padrão da fonte. É elemento geométrico construído:

```css
.accent {
  width: 0.15em;
  height: 0.04em;
  border-radius: 0.02em;
  transform: rotate(-22deg);
  position: absolute;
  top: 0.14em;
  left: 58%;
  background: var(--accent);
}
```

### 7.5 Lockups oficiais (6 variações)

| # | Lockup | Aplicação primária |
|---|---|---|
| 01 | Horizontal Light | Navbar do site, headers de plataforma web |
| 02 | Horizontal Dark | Terminal quantamental, dashboards OLED |
| 03 | Vertical Light | Papelaria, relatórios de gestão, contratos |
| 04 | Vertical Dark | Telas de login, capas de pitchbook digital |
| 05 | Favicon Light | Aba de navegador, bookmark light |
| 06 | Favicon Dark | Ícone de app, avatar institucional dark |

### 7.6 Proporções canônicas

- **Lockup horizontal:** símbolo 0.85em da altura do wordmark, gap de 0.4em entre eles, alinhados pela baseline
- **Lockup vertical:** símbolo 1.2em (maior que o horizontal), gap de 0.5em, centrados horizontalmente
- **Favicon:** símbolo ocupa 60% da área do quadrado, padding de 20% em cada lado

### 7.7 Regras de proteção

- O símbolo Pilar Alpha é inviolável — não alterar corte diagonal, ângulo do acento, proporções internas
- O acento amarelo é o único elemento em amarelo em qualquer aplicação
- Tamanho mínimo: horizontal 120px de largura; símbolo isolado 24px (favicon)
- Espaçamento de segurança: área livre equivalente à altura do acento em todos os lados
- Fundos permitidos: branco puro, Noite OLED, amarelo Invística (só para variação destaque)
- Não permitido: alterar cores do acento, inclinar o logotipo, aplicar sombras, gradientes ou efeitos

---

## 8 — Tipografia

### Display serif — Fraunces

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,144,400;1,144,400&display=swap" rel="stylesheet">
```

```css
font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
font-variation-settings: "opsz" 144, "wght" 400;
```

Usada em: logotipo, títulos grandes (h1/h2), citações editoriais, frase-manifesto.

Migração futura: em ~1 ano para **PP Editorial New** (Pangram Pangram, licença paga). Proporções próximas, troca trivial de `@font-face`.

### UI sans — Geist Sans

```css
font-family: 'Geist', 'Helvetica Neue', Arial, sans-serif;
```

Usada em: corpo de texto, navegação, labels, descritores, tags, botões. Pesos 300/400/500.

### Dados tabulares — Geist Mono

```css
.tabular {
  font-family: 'Geist Mono', 'SF Mono', 'Courier New', monospace;
  font-variant-numeric: tabular-nums lining-nums;
}
```

Usada em: números de cotação, scores, percentuais, gráficos, tabelas de dados.

### Descritor institucional

Quando aparece com o logotipo:
- Geist Sans weight 400
- Font-size 1/6 da altura do nome
- Letter-spacing 3-4px
- `text-transform: uppercase`
- Cor `var(--text-secondary)`

---

## 9 — Estrutura de assets da marca

Hospedar em `/public/brand/` no repositório:

```
invistica-web/
└── public/
    ├── favicon.ico
    ├── favicon.png
    └── brand/
        ├── invistica-lockup-horizontal-light.svg
        ├── invistica-lockup-horizontal-dark.svg
        ├── invistica-lockup-vertical-light.svg
        ├── invistica-lockup-vertical-dark.svg
        ├── invistica-simbolo-light.svg
        ├── invistica-simbolo-dark.svg
        ├── invistica-wordmark-only-light.svg
        ├── invistica-wordmark-only-dark.svg
        └── invistica-monocromatico.svg
```

---

## 10 — Stack técnica

Frontend (`invistica-web`):

- **Framework:** Next.js 16 (App Router)
- **React:** 19
- **Styling:** Tailwind CSS 3.4 (customizado com paleta Invística)
- **RPC:** tRPC 11
- **ORM:** Prisma
- **DB:** Supabase (Postgres)
- **Cache:** Upstash (Redis)
- **Open Banking:** Pluggy
- **Pagamento:** Mercado Pago
- **Error tracking:** Sentry
- **Fontes:** Fraunces (Google Fonts) + Geist Sans (Vercel) + Geist Mono (Vercel)
- **Deploy:** Vercel (`invistica-web.vercel.app`)

---

## 11 — Contratos externos (backend `invistica-api`)

Backend separado em Python/FastAPI, deployado em Railway.

- **Base URL produção:** `https://invistica-api-production.up.railway.app`
- **Variável de ambiente:** `NEXT_PUBLIC_API_URL`
- **Contrato:** OpenAPI 3 exposto em `/openapi.json`
- **Auth:** JWT via header `Authorization: Bearer <token>`

Endpoints críticos consumidos pelo frontend:
- `/scores/{ticker}` — retorna Invscore + pilares + tese
- `/scores/top` — ranking por Invscore
- `/portfolio/*` — gestão de carteira
- `/tickers` — metadata das ações
- `/analytics/regime` — contexto macro

Mudanças breaking nesses endpoints requerem rename coordenado em N telas do frontend.

---

## 12 — Público-alvo e posicionamento

**Primário (PF):** investidor com R$ 500k a R$ 10M em ativos. Perfil: retail sofisticado, semi-profissional, gestor solo, family office júnior, profissional de RI. Lê relatórios completos, valoriza método, desconfia de promessas, quer entender.

**Secundário (PJ):** gestoras independentes, family offices, consultorias de investimento, RIs buscando solução institucional. ~R$ 1.500/mês+ como referência.

**Postura competitiva:**
- Severa no método, calorosa na comunicação
- Nunca ataca concorrentes diretamente
- Referências: Apple, Porsche, UBS, Ray-Ban, Ferrari, Mercedes
- Compete em disciplina, não em features

---

## 13 — Roadmap evolutivo

### V1 (0–9 meses) — atual
Análise quantamental + gestão prescritiva para toda B3. Três teses (Value, Dividendos, Quality/Growth). Motor v11 em produção. Performance auditada: CAGR 21,2%, alpha +15,4% a.a. vs IBOV.

### V2 (9–18 meses)
Motor dedicado a FIIs. Expansão Small Caps e Defensive. API B2B.

### V3 (18–36 meses)
Clube de investimentos → gestora CVM (dependente de CGA ANBIMA 2026).

---

## 14 — Convenções de código

### Componentes

- **Naming:** PascalCase descritivo. `InvscoreCard`, `PortfolioTable`, `PilarValuation`
- **Estrutura:** um componente por arquivo, export default
- **Props:** sempre tipadas, interfaces nomeadas (`InvscoreCardProps`)
- **Compostos:** Radix UI como base, Tailwind styling

### Números e dados

- **Monetários:** `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Percentuais:** sempre com sinal (`+15,4%` / `-3,2%`)
- **Separador decimal:** vírgula (pt-BR)
- **Tabular nums:** `font-variant-numeric: tabular-nums lining-nums` obrigatório

### Tokens de cor em Tailwind

Evitar `bg-yellow-400`, `text-blue-900`. Usar tokens semânticos:

```
bg-body, bg-hero, bg-surface
text-primary, text-secondary, text-tertiary
border-subtle, border-emphasis
accent, accent-ink
```

Definir em `tailwind.config.ts` apontando para variáveis CSS da seção 6.

### Copy em componentes

- Zero placeholder comercial. Usar `[pendente: descrição]`, nunca lorem ipsum
- Microcopy segue as 10 regras da seção 4

---

## 15 — Regras para Claude Code CLI

1. **Ler este CLAUDE.md antes de qualquer mudança de estilo, copy ou branding.**
2. **Nunca usar "InvestIQ", "IQ-Cognit" ou "IQ-Score" em código novo.** Referências antigas em processo de rename semântico.
3. **Nunca propor cores fora da paleta oficial.**
4. **Seguir a voz editorial das 10 regras.**
5. **Referência ao backend via `NEXT_PUBLIC_API_URL`.** Nunca hardcode URL de API.
6. **Commits em português, imperativo, curtos.** Exemplo: `feat: adiciona card Invscore na home`
7. **Quando houver dúvida sobre marca ou estilo, parar e perguntar.**

---

## 16 — Histórico de decisões

- **Nome "Invística"** escolhido após descoberta de plágio do domínio `investiq.com.br`. Domínios `.com.br` e `.com` registrados.
- **Cobre rejeitado** — associação errada com tecnologia retrógrada.
- **Verde esmeralda rejeitado** — próximo demais de Ágora.
- **Amarelos Ferrari/Rossi rejeitados** — signaling esportivo errado para research.
- **Paleta final: azul Aquino + amarelo neon** — raiz familiar do fundador + território virgem no mercado financeiro BR.
- **Dark = "Noite OLED"** (preto-azulado com tingimento), não azul BIC nem preto puro.
- **Light = "Swiss Branco"** (branco puro com amarelo aflorado), não creme nem marfim.
- **Símbolo "Pilar Alpha"** (polígono com corte diagonal + acento amarelo rotacionado) foi finalizado no Gemini 3 Pro após tentativas frustradas em SVG inline, Recraft e plugins Figma. Sistema de 6 lockups + favicon entregue como HTML/CSS executável.
- **Fraunces** como display serif gratuita. PP Editorial New como migração futura (1+ ano).

---

Fim do CLAUDE.md v5.

Para dúvidas, correções ou evoluções deste documento, consultar diretamente Rafael Aquino (fundador).
