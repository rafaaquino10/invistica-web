# CLAUDE.md — Invística

Documento oficial de contexto para assistentes IA (Claude Code CLI, Claude chat, Cursor, GitHub Copilot) trabalhando no projeto Invística.

Versão 6.0 · abril de 2026 · substitui v5. Consolidação após rebrand visual completo (paleta preto/branco/vermelho, tipografia Inter, referência estrutural Gorila Invest) e após formalização do PRODUCT.md v1.2.

Ler este documento antes de qualquer ação no repositório. Em caso de conflito entre este documento e outros briefings antigos, este prevalece. Conflitos com `PRODUCT.md` devem ser escalados ao fundador Rafael Aquino para decisão.

---

## 1 — Identidade

**Invística** é SaaS de research quantamental aplicado a ações da B3, voltado ao investidor comum sofisticado.

Website: invistica.com.br (DNS ainda não apontado na data desta versão).
Deploy atual: invistica-web.vercel.app.
Backend: invistica-api-production.up.railway.app.
Fundador solo: Rafael Aquino (engenheiro CLT em transição para empreendedor, planejando CGA ANBIMA 2026 para habilitar constituição de gestora CVM em 36 meses).

Nome anterior do projeto: InvestIQ. Nome anterior do score: IQ-Score / IQ-Cognit. **Qualquer referência textual remanescente a esses nomes antigos em código, metadata, UI, copy ou documentação deve ser renomeada** — ver Seção 14 (Rename Semântico Pendente).

---

## 2 — Frase-tese e posicionamento

> **Research quantamental institucional, aplicado por qualquer investidor comum, com alpha mensurável — a um preço que cabe no orçamento de quem investe.**

Quatro vetores não-negociáveis:

1. **Research quantamental institucional** — motor proprietário (quantitativo + qualitativo + valuation multi-modelo) é o produto. Nada de questionário comportamental, perfil psicográfico, recomendação emocional
2. **Aplicado por qualquer investidor comum** — zero barreira financeira, interface sem pressupor conhecimento técnico prévio
3. **Com alpha mensurável** — prova numérica auditável: +15,4% a.a. sobre IBOV desde 2019. Zero promessa, zero projeção
4. **A um preço que cabe no orçamento de quem investe** — mensalidade nunca compete com aporte do usuário

Qualquer feature, copy, tela ou decisão deve atender a pelo menos três destes quatro vetores.

---

## 3 — Os 6 princípios de produto

Referência completa em `PRODUCT.md` seção 2. Resumo operacional:

1. **Motor em primeiro lugar** — toda feature alimenta, consome ou demonstra o motor quantamental
2. **Alpha auditável como moeda** — números são linguagem nativa. Performance real, walk-forward validada
3. **Simplicidade prescritiva, profundidade opcional** — superfície padrão é prescritiva. Camada abaixo é analítica
4. **Voz editorial contida** — copy factual, sem pitch, sem adjetivos de venda. Frase curta, número específico
5. **Marca brasileira, produto brasileiro** — foco B3 no MVP e V2. Benchmarks BR (IBOV, CDI, SELIC). Copy pt-BR
6. **Pricing como missão** — mensalidade inferior a 2-4 unidades de uma ação média. Ganhamos em volume, nunca em ARPU

---

## 4 — Os 5 anti-princípios

O que a Invística **não é**, mesmo que o mercado faça:

1. **Não somos rede social de investimento** — zero feed, zero ranking de usuários, zero "gurus seguidos"
2. **Não somos consolidador multi-custódia** — esse é o domínio da Gorila. Carteira manual no MVP, Pluggy só em V2
3. **Não somos corretora nem operador de boletas** — zero execução de ordens
4. **Não somos edtech nem produtor de conteúdo genérico** — blog serve ao research, não ao ensino
5. **Não somos robo-advisor por perfil psicográfico** — zero questionário de perfil de investidor

---

## 5 — Persona-âncora

**Alexandre, 37 anos** — engenheiro CLT, salário R$ 22k/mês, patrimônio R$ 420k (R$ 180k renda fixa + R$ 210k ações + R$ 30k FIIs), 12 papéis em 3 corretoras.

Usa planilha manual. Assina 2 newsletters premium. Nunca fez conta se bate IBOV. Quer método, não palpite. Não tem 8h/semana para virar analista.

Ticket aceitável: até R$ 50/mês.

**Referência completa em `PRODUCT.md` seção 4.**

Regra: se uma feature não serve ao Alexandre, **não entra no MVP**.

---

## 6 — Voz editorial (10 regras)

Toda copy de UI, e-mail, blog, notificação, tooltip e documentação segue estas regras:

1. **Frases curtas.** Máximo 20 palavras por frase sempre que possível
2. **Números antes de adjetivos.** "+15,4% a.a. sobre IBOV" > "performance excepcional"
3. **Zero superlativo vazio.** Proibidos: "incrível", "revolucionário", "surpreendente", "inigualável"
4. **Zero urgência fabricada.** Proibidos: "não perca", "só hoje", "garanta já", countdown timers
5. **Zero pitch.** Proibidos: "descubra como", "aprenda a", "transforme sua"
6. **Vocabulário institucional com explicação embutida.** "Fair Value (preço justo calculado)" > "Fair Value" puro na primeira menção
7. **Nomes próprios em caixa moderada.** Invscore, não INVSCORE. Apenas siglas de método (DCF, CAPM, WACC) em caixa alta
8. **Português brasileiro formal-neutro.** Você, não tu. Vocês, não vós. Evita gíria regional. Evita coloquialismo excessivo
9. **Referências sempre a fontes auditáveis.** "Conforme metodologia em /performance" > "segundo nossos estudos"
10. **Sujeito humano, não corporativo.** "Acompanhamos" > "a plataforma monitora"

---

## 7 — Arquitetura de marca

### 7.1 Paleta cromática oficial

```css
/* Light mode — fundo branco, regra 85% preto+branco, 15% vermelho como acento */
--bg:                #FFFFFF;  /* branco puro */
--bg-elevated:       #FAFAFA;  /* cards, painéis elevados */
--bg-subtle:         #F4F4F5;  /* sessões alternadas */
--text:              #0A0A0A;  /* texto primário */
--text-muted:        #52525B;  /* texto secundário */
--text-dim:          #71717A;  /* labels, metadata */
--text-faint:        #A1A1AA;  /* hint, placeholder */
--border:            #E4E4E7;  /* divisórias padrão */
--border-strong:     #D4D4D8;  /* divisórias ativas */

/* Acento vermelho — uso pontual, 15% máximo da tela */
--accent:            #DC2626;  /* vermelho principal */
--accent-hover:      #B91C1C;  /* estado hover */
--accent-soft-bg:    #FEE2E2;  /* fundo de badge suave */
--accent-soft-text:  #991B1B;  /* texto sobre accent-soft-bg */

/* Dark mode — fundo preto, mesma regra */
--bg-dark:                #0A0A0A;
--bg-elevated-dark:       #141414;
--bg-subtle-dark:         #1C1C1C;
--text-dark:              #FAFAFA;
--text-muted-dark:        #A1A1AA;
--text-dim-dark:          #71717A;
--border-dark:            #27272A;
```

**Regra dura:** vermelho aparece apenas em acentos pontuais — CTA principal, destaque numérico, ponto pulsante de status, hover state, badge de novidade, assinatura do wordmark. **Nunca em blocos grandes de cor. Nunca como fundo de seção inteira.**

### 7.2 Tipografia oficial

**Fonte única de todo o produto: Inter** (Google Fonts, gratuita).

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
```

Pesos em uso:
- **400 regular** — texto corrido, parágrafos, labels
- **500 medium** — botões, navegação, metadata destacada
- **600 semibold** — subtítulos, destaques em prosa
- **700 bold** — títulos H1 / H2, números em cards, wordmark do produto

**Uso de itálico:** permitido apenas no wordmark da marca (letras "I" inicial e "ı" medial) e em citações bibliográficas. **Nunca em copy corrido de UI.**

**Tracking padrão:**
- Títulos grandes (>32px) — `letter-spacing: -0.03em` (-1.2 a -1.8px)
- Texto corrido — `letter-spacing: 0`
- Labels uppercase — `letter-spacing: 0.15em` (2-3px)

Fontes anteriores **descontinuadas** neste projeto (Fraunces, Georgia, Geist Sans): não usar em nenhuma circunstância no produto Invística.

### 7.3 Wordmark oficial

Renderização padrão:
```
Invística
```

Onde:
- "**I**" inicial em Inter italic
- "**nv**" em Inter romana regular
- "**ı**" medial em Inter italic, sem ponto próprio, **com acento vermelho customizado** posicionado acima
- "**stica**" em Inter romana regular

Peso recomendado: 500 medium para wordmark em aplicações de escala padrão (20-28px). 700 bold para uso hero em tamanhos grandes (>48px).

**Acento vermelho customizado sobre o "ı":** retângulo horizontal simples, dimensões proporcionais:
- Em header 22px: largura 6px, altura 1.5px, `top: -5px`, centralizado
- Em hero 72px: largura 16px, altura 3px, `top: -10px`, centralizado
- Cor: `var(--accent)` (#DC2626)

Em implementação React/HTML, usar estrutura:
```html
<span class="wordmark">
  <span class="italic">I</span>nv<span class="dot-wrap"><span class="italic">ı</span></span>stica
</span>
```

### 7.4 Símbolo

**Status atual:** O símbolo "Pilar Alpha" que existia na v5 foi desenhado em torno do contraste azul+amarelo da paleta antiga. Com a transição para preto/branco/vermelho, o símbolo precisa ser **reinterpretado visualmente** antes de ser reintroduzido na família de assets.

**Até lá, o wordmark opera como lockup único da marca.** Qualquer implementação que exija símbolo isolado (favicon, ícone de app, avatar em redes sociais) deve usar uma das soluções placeholder:

- Quadrado preto `#0A0A0A` com letra "I" em italic Inter 500 branca centralizada
- Ou apenas o acento vermelho horizontal isolado sobre fundo preto (experimental, pendente validação)

**Não regerar SVGs do Pilar Alpha anterior sob nenhuma circunstância** — aquela família está descontinuada. Reinterpretação será tarefa de sessão futura com Rafael.

### 7.5 Estrutura de pastas de assets

```
/public/brand/
  wordmark-light.svg       # wordmark em fundo branco
  wordmark-dark.svg        # wordmark em fundo preto
  favicon.svg              # placeholder quadrado preto + "I" branco italic
  favicon.ico              # fallback raster 32x32
  og-home.png              # imagem OpenGraph 1200x630 branco com wordmark centralizado
  og-article.png           # template OpenGraph para blog posts futuros
```

**Nenhum dos arquivos acima está regerado na v6.** Tarefa pendente listada na Seção 14.

---

## 8 — Referência visual e estrutural: Gorila Invest

**Site:** gorila.com.br

A Invística adota a **gramática estrutural e visual da Gorila** (hierarquia, espaçamento, densidade de informação, CTAs, tipografia sans-serif institucional, composição de hero) **sem copiar a voz editorial** (Gorila é B2B sales-driven; Invística é voz contida institucional).

O que herdamos da Gorila:
- Estrutura de folds organizada e previsível (hero → features → benefícios → público-alvo → CTA → footer)
- Hero com composição dividida (texto à esquerda, visual à direita)
- Navegação compacta no header com menu dropdown para categorias
- CTAs claros (1 primário por fold, nunca 3+)
- Badges de novidade em formato pílula
- Uso editorial de negrito em palavras-chave dentro de prose
- Ilustrações / visualizações ao invés de stock photos

O que **não** herdamos da Gorila:
- Copy pitch-y ("liberdade para criar", "mais potente e inteligente")
- Adjetivos de impacto ("experiências incríveis")
- Super CTAs repetidos ao longo da página
- Multiplicidade de públicos-alvo apresentados simultaneamente

---

## 9 — Arquitetura técnica

### 9.1 Stack

**Frontend** (`invistica-web`, deploy Vercel):
- Next.js 16 (App Router)
- React 19
- TypeScript strict
- Tailwind CSS 4 + shadcn/ui
- Configuração via `@theme inline` em `globals.css` (sem `tailwind.config.ts`)
- Lucide icons
- Recharts para visualizações de dados
- Framer Motion para animações

**Backend** (`invistica-api`, deploy Railway):
- Python 3.12 + FastAPI
- PostgreSQL (via Supabase)
- Redis Upstash para cache
- Pipelines de dados com Prefect
- Motor quantamental proprietário (v11 em produção)

**Dados:**
- B3 via provedor licenciado (cobertura de 947 ações)
- Dados fundamentalistas via BMF&Bovespa + CVM
- Pluggy (Open Finance) — **apenas em V2**, não usar no MVP

**Integrações de pagamento:**
- Mercado Pago (PIX, cartão, assinatura recorrente) — MVP
- Stripe como fallback V2

### 9.2 Endpoints principais (backend)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/trial-start          # cria trial de 14 dias
GET    /user/me
GET    /user/plan

GET    /assets                     # lista completa B3 (947 ativos)
GET    /assets/:ticker             # dados completos de um ativo
GET    /assets/:ticker/invscore    # score 0-100 + 11 sub-scores + faixa qualitativa
GET    /assets/:ticker/valuation   # DCF + Gordon + Múltiplos + Monte Carlo
GET    /assets/:ticker/dividends   # histórico + safety score + projeção
GET    /assets/:ticker/thesis      # tese institucional do motor

GET    /ranking/invscore           # top 100 ordenado por score
GET    /ranking/by-thesis/:thesis  # value | dividends | quality | momentum

POST   /portfolio                  # criar/editar carteira manual
GET    /portfolio                  # carteira do usuário
GET    /portfolio/analysis         # score ponderado + stress test + exposição
GET    /portfolio/recommendations  # sugestões prescritivas de rebalanceamento

GET    /performance                # track record do motor (público)
GET    /performance/walk-forward   # detalhe walk-forward 2012-hoje
```

Todos os endpoints protegidos por JWT + row-level-security do Supabase.

### 9.3 Convenções de código

**TypeScript:**
- Strict mode sempre. Zero `any`
- Interfaces para contratos de API em `/src/types/api.ts`
- Zod schemas para validação de input em `/src/schemas/`

**React:**
- Componentes funcionais apenas
- Hooks customizados em `/src/hooks/`
- Server Components por padrão; `'use client'` apenas quando necessário
- Props sempre tipadas via interface nomeada (não inline)

**Tailwind:**
- Não escrever CSS puro. Tudo via classes Tailwind
- Usar `cn()` helper para merging condicional
- Tokens do design system via CSS variables em `globals.css`

**Nomenclatura:**
- Componentes: PascalCase (`InvscoreCard.tsx`)
- Hooks: camelCase com prefixo `use` (`useInvscore.ts`)
- Utils: camelCase (`formatCurrency.ts`)
- Tipos: PascalCase com prefixo `T` opcional (`Invscore` ou `TInvscore`)

**Commits:**
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`
- Mensagens em português
- Exemplo: `feat: adiciona componente InvscoreCard com sub-scores`

---

## 10 — Escala Invscore

O Invscore é a nota proprietária 0-100 da Invística. **Implementação viva no motor v11 em produção.** Os valores abaixo são as faixas qualitativas oficiais para apresentação ao usuário.

| Faixa | Score   | Label         | Semântica                                    | Cor em UI                |
|-------|---------|---------------|----------------------------------------------|--------------------------|
| 5     | 85–100  | **Convicção** | Três pilares convergem. Alocação sugerida    | `var(--accent)` sólido   |
| 4     | 70–84   | **Favorável** | Qualidade consistente. Posição justificada   | `var(--accent)` 60% opac |
| 3     | 55–69   | **Neutro**    | Sem tese clara. Monitorar                    | `var(--accent)` 35% opac |
| 2     | 40–54   | **Reserva**   | Fragilidade pontual. Evitar aumentar posição | `var(--text-dim)`        |
| 1     | 0–39    | **Evitar**    | Risco estrutural. Sair da posição            | `var(--text-dim)` mais   |

**Nunca representar score com verde/vermelho tradicional (bull/bear).** A Invística usa gradiente de vermelho → cinza, coerente com a identidade de marca, **sem** associação emocional com "positivo/negativo".

---

## 11 — Pricing e monetização

**Plano único MVP e V2:**
- **Premium R$ 38,90/mês** (ou R$ 388/ano com 2 meses grátis)
- **Trial de 14 dias gratuito** antes da primeira cobrança, acesso completo
- **Sem freemium, sem tier grátis eterno**

**Razão estratégica (imutável no primeiro ano):** ver `PRODUCT.md` seção 2 princípio 6. Pricing como missão. Volume sobre ARPU.

**Meta de breakeven:** ~1.000 assinantes pagantes gerando ~R$ 40k MRR, suficientes para infraestrutura (Vercel Pro, Railway Pro, Supabase Pro, Upstash, licenças de dados B3) + alocação para OpenAI/Anthropic API (análise qualitativa) + retirada pró-labore mínima do fundador.

**Disciplina de custo obrigatória:** margem unitária de R$ 38,90 é apertada. Toda decisão de infraestrutura deve considerar custo unitário marginal. Em caso de dúvida, priorizar caching agressivo (Redis Upstash) antes de chamar APIs pagas.

---

## 12 — Mapa de páginas do produto

Referência completa em `PRODUCT.md` seção 5. Resumo para implementação:

**Páginas públicas (não logado):**
- `/` Home (landing)
- `/metodo` Método
- `/performance` Performance auditada
- `/precos` Preços
- `/sobre` Sobre
- `/blog` Blog (stub no MVP, ativação em V2)
- `/login`, `/signup`, `/trial-start`, `/esqueci-senha`

**Páginas logadas (autenticadas):**
- `/app` Home (dashboard inteligente)
- `/app/descobrir` Descobrir (ranking Invscore no MVP, screener + radar em V2)
- `/app/ativo/:ticker` Página de ativo
- `/app/carteira` Carteira
- `/app/teses` Teses
- `/app/simulador` Simulador (V2)
- `/app/performance` Performance
- `/app/relatorios` Relatórios (V2)
- `/app/conta` Conta

**Priorização MVP/V2/V3 detalhada em `PRODUCT.md` seção 6.**

---

## 13 — Sessão operacional de trabalho

### 13.1 Workflow padrão de nova feature

1. Claude lê `CLAUDE.md` (este) + `PRODUCT.md` + eventual briefing específico
2. Claude confirma entendimento antes de produzir código
3. Claude implementa em branch dedicada (`feat/nome-feature`)
4. Claude propõe testes automatizados onde aplicável
5. Rafael revisa e faz merge
6. Deploy automático via Vercel (frontend) ou Railway (backend)

### 13.2 Workflow de decisão visual

1. Rafael descreve pedido
2. Claude pergunta em caso de ambiguidade — **nunca adivinha paleta, tipografia ou hierarquia**
3. Claude produz protótipo HTML vanilla primeiro (mockup rápido)
4. Rafael valida visualmente
5. Só após validação, Claude converte em componente React

### 13.3 Regras de comunicação assistente ↔ fundador

- Frases curtas, factuais, sem elogio automático
- Reconhecer erro imediatamente quando cobrado, sem justificar excessivamente
- Nunca produzir 3 opções quando 1 basta
- Propor 3 caminhos quando a decisão é estratégica
- Ao receber print de referência: analisar tecnicamente antes de sugerir implementação
- Nunca sugerir copy sensacionalista. Voz contida sempre (princípio 4 e voz editorial seção 6)

---

## 14 — Pendências técnicas conhecidas

Itens que precisam ser executados **antes ou durante a implementação do MVP**. Ordem sugerida:

### 14.1 Rename semântico (prioridade alta)

Executar via Claude Code CLI no repositório `invistica-web`:

**Strings a renomear em todo o código, metadata, OpenGraph, títulos de página:**
- `InvestIQ` → `Invística`
- `investiq` → `invistica`
- `INVESTIQ` → `INVISTICA`
- `IQ-Score` → `Invscore`
- `IQ-Cognit` → `Invscore`
- `iq-score` → `invscore`
- `iqScore` → `invscore`

**Também em:**
- `package.json` nome do projeto
- `README.md`
- `next.config.ts` metadata
- Arquivos `.env` e `.env.example` (variáveis com prefixo)
- Títulos `<title>` em layouts
- OpenGraph `og:title`, `og:description`, `og:site_name`

**Prompt sugerido para Claude Code CLI:**
> Leia o CLAUDE.md na raiz do projeto. Execute o rename semântico listado na Seção 14.1. Não altere código funcional, apenas strings de identidade visual, metadata e documentação. Preserve histórico git com commits separados por categoria (metadata, UI, docs).

### 14.2 Família de assets da marca (prioridade alta)

Regerar em paleta preto/branco/vermelho + Inter:
- `wordmark-light.svg`
- `wordmark-dark.svg`
- `favicon.svg`
- `favicon.ico`
- `og-home.png` (template Figma a criar)

Símbolo Pilar Alpha está **descontinuado** até reinterpretação em sessão futura com Rafael.

### 14.3 Landing nova (prioridade alta)

Converter `hero-invistica-v2.html` (mockup validado) em componente React + Tailwind na rota `/` do `invistica-web`.

**Prompt sugerido para Claude Code CLI:**
> Converta o arquivo hero-invistica-v2.html em componente React funcional usando App Router. Extraia os tokens de cor para CSS variables em globals.css. Use Tailwind para layout. Preserve motion (framer-motion). Garanta responsividade mobile. Use next/font para Inter.

### 14.4 DNS (prioridade média)

Só após landing nova estar em produção e validada visualmente por Rafael: apontar `invistica.com.br` → Vercel.

### 14.5 Seções pós-hero da landing (bloqueadas pela área logada)

Folds pós-hero são o **último entregável do rebuild v6**. Ficam bloqueados até que toda a área logada (MVP de 7 módulos) esteja construída e aprovada pelo Rafael, para que os folds possam referenciar features e páginas reais — padrão Gorila — em vez de vaporware.

Escopo preliminar: screenshots/mockups do produto logado, features do motor quantamental, prova de performance. Detalhamento só após a área logada estar pronta.

### 14.6 Camadas 2, 3, 4 do produto — inversão de ordem

Originalmente (`PRODUCT.md` §9) as Camadas 2, 3 e 4 eram pré-requisito para implementar os módulos logados:
- Camada 2 — Funcionalidades por módulo
- Camada 3 — Wireframes dos 7 módulos MVP
- Camada 4 — Copy editorial por página

**Decisão 2026-04-20 (ver §15):** essa ordem foi invertida. Vamos direto ao código da área logada, iterativamente, módulo por módulo, com validação do Rafael entre entregas. Camadas 2/3/4, se produzidas, viram documentação posterior do que foi construído — nunca mais pré-requisito bloqueante.

Razão: o hero completo e seus folds não podem ser 100% fiéis a um produto que ainda não existe. Precisamos construir a área logada primeiro, aprovar, e só então fechar a landing tipo Gorila.

---

## 15 — Histórico de decisões importantes

Registro de decisões estratégicas com data e racional. Novas decisões devem ser adicionadas aqui ao final, nunca sobrescrever.

**2025-09** — Decisão de rebrand de InvestIQ para Invística. Motivo: InvestIQ comunica ferramenta genérica, Invística evoca *inquisitio* latino (pesquisa metódica) e tem identidade brasileira única.

**2026-01** — Definição da paleta azul Aquino (#1E40AF) + amarelo neon (#FFE93D) + fonte Fraunces. Razão: queríamos signaling editorial sério + ponto de impacto. **REVERTIDA em 2026-04.**

**2026-04** — Pivot completo de paleta e tipografia:
- Paleta: azul Aquino + amarelo → preto `#0A0A0A` + branco `#FFFFFF` + vermelho `#DC2626`
- Tipografia: Fraunces → Inter
- Referência estrutural: Gorila Invest como norte de hierarquia e composição
- Razão: paleta azul+amarelo ficava "fintech genérica"; preto+branco+vermelho comunica institucional premium sem concorrer visualmente com Itaú (laranja+azul) ou Santander (vermelho dominante). Inter resolve gap de kerning que Geist criava no wordmark com I+ı italic

**2026-04** — Persona-âncora formalizada: **Alexandre, 37 anos**, engenheiro CLT R$ 22k/mês, patrimônio R$ 420k. Substituiu persona anterior genérica.

**2026-04** — Pricing elevado a princípio de produto (princípio 6): R$ 38,90/mês mantido por pelo menos 12 meses. Volume sobre ARPU.

**2026-04** — Anti-princípios explicitados: não somos rede social / consolidador multi-custódia / corretora / edtech / robo-advisor por perfil.

**2026-04** — MVP enxuto definido: Home + Ranking Invscore + Ativo básico + Carteira manual + Teses + Performance + Conta. Screener, valuation multi-modelo, simulador e relatórios vão para V2.

**2026-04** — Stack ajustada para Tailwind 4 no bootstrap v6 (default do Next 16). Configuração migra para `@theme inline` em `globals.css`, sem `tailwind.config.ts`. Razão: default do framework, sintaxe atual, alinhado com shadcn/ui recente.

**2026-04-20** — **Inversão da ordem de build no rebuild v6.** O hero (seção principal) já foi entregue na sessão 3, mas os folds pós-hero e a versão "Gorila-completa" da landing ficam para o fim. A partir de agora a ordem é: **área logada (MVP de 7 módulos) → aprovação → só então finalização do hero e folds da landing**. Razão: o hero e seus links não podem ser 100% fiéis a um produto que ainda não existe. Camadas 2/3/4 do `PRODUCT.md` deixam de ser pré-requisito bloqueante (ver §14.6) e passam a ser documentação opcional do que for construído. Páginas institucionais `/sobre`, `/blog` e `/precos` foram eliminadas do escopo — o preço do trial vive embutido no modal de cadastro (sessão 4).

---

## 16 — Documentos vivos relacionados

- `PRODUCT.md` v1.2 — posicionamento estratégico e mapa de produto completo
- `README.md` — orientações de setup local (frontend e backend)
- `CHANGELOG.md` — histórico de versões do produto em produção
- Documentos futuros a criar: `PRODUCT-MVP-MODULES.md`, `PRODUCT-COPY.md`, `DESIGN-SYSTEM.md`

---

Fim do CLAUDE.md v6.

Este documento substitui integralmente o CLAUDE.md v5. Versões anteriores devem ser arquivadas para referência histórica mas nunca consultadas para decisões operacionais.
