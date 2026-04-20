# PRODUCT.md — Invística

Documento de posicionamento estratégico e mapa de produto. Fonte de verdade para decisões de feature, UX, copy e roadmap.

Versão 1.2 · abril de 2026 · consolida princípio de pricing como missão (mensalidade não compete com aporte mensal do usuário) e refina frase-tese com o vetor de democratização explícito.

---

## 1 — Posicionamento consolidado

**Research quantamental institucional, aplicado por qualquer investidor comum, com alpha mensurável — a um preço que cabe no orçamento de quem investe.**

Essa frase é o teste de qualquer decisão. Se uma feature serve a research quantamental + acessível ao investidor comum + prova de alpha + pricing que não rouba aporte, entra. Se não serve a pelo menos três destes quatro, fica de fora.

Tradução operacional:
- **Research quantamental institucional** = o motor proprietário é protagonista. Quantitativo completo + qualitativo profundo + valuation multi-modelo são o produto. Nada de "perfil de risco", "questionário comportamental", "recomendação emocional"
- **Aplicado por qualquer investidor comum** = zero barreira financeira. Ticket acessível (SaaS, não cota de fundo com valor mínimo). Interface que não assume conhecimento técnico prévio
- **Com alpha mensurável** = a prova é numérica e auditável. +15,4% a.a. sobre o IBOV desde 2019 é evidência, não promessa
- **A um preço que cabe no orçamento de quem investe** = a mensalidade não pode competir com o aporte mensal do usuário. A Invística existe para viabilizar investimento inteligente, não para consumir o capital que deveria ser investido

---

## 2 — Os 6 princípios de produto

Regras duras. Qualquer funcionalidade proposta deve atender a pelo menos três dos seis para ser considerada.

**Princípio 1 · Motor em primeiro lugar**
Toda feature deve alimentar, consumir ou demonstrar o motor quantamental. O motor é o produto. Feature que não toca o motor (gamificação, social, educação genérica) não é Invística.

**Princípio 2 · Alpha auditável como moeda**
Números são linguagem nativa. Performance real, histórica, walk-forward validada. Zero promessa, zero projeção otimista. Quando a gente diz um número, ele é verificável.

**Princípio 3 · Simplicidade prescritiva, profundidade opcional**
O usuário médio consome. O usuário avançado se aprofunda. Nunca o contrário. A superfície padrão é prescritiva (o motor diz o que fazer). A camada abaixo é analítica (quem quiser vê a tese completa).

**Princípio 4 · Voz editorial contida**
Copy factual, sem pitch, sem adjetivos de venda, sem urgência. Frase curta, número específico, vocabulário institucional com explicação embutida. O produto fala por si.

**Princípio 5 · Marca brasileira, produto brasileiro**
Foco exclusivo em B3 no MVP e V2. Internacional só em V3. Toda métrica comparada contra benchmarks brasileiros (IBOV, CDI, SELIC). Copy em português brasileiro. Nomes de ativos, moeda, convenções locais.

**Princípio 6 · Pricing como missão, não como decisão comercial**
A mensalidade da Invística deve ser inferior ao custo de 2 a 4 unidades de uma ação média brasileira. O usuário não pode precisar escolher entre pagar a plataforma ou comprar mais ações. Essa é a barreira concreta que separa o pequeno investidor do research institucional — uma barreira que cobra R$ 300/mês em newsletters ou exige cota mínima de R$ 100k+ em fundos premium. A Invística existe para derrubar essa barreira. Preço ganha em volume, jamais em ticket médio.

---

## 3 — Os 5 anti-princípios (o que a Invística NÃO é)

Lista de bloqueio. Mesmo que o mercado faça, mesmo que pareça oportunidade, não fazemos.

**Não somos rede social de investimento**
Zero comentário público, zero feed, zero ranking de usuários, zero "gurus seguidos". Ruído puro. Invística é ferramenta profissional, não comunidade.

**Não somos consolidador multi-custódia**
Esse é o domínio da Gorila. Carteira registrada manualmente no MVP, integração via Pluggy apenas em V2. Nunca seremos "o lugar onde você vê tudo que tem" — somos "o lugar que te diz o que fazer".

**Não somos corretora nem operador de boletas**
Zero execução de ordens. Recomendamos o que comprar e a que preço. Execução fica na corretora do cliente. Nunca pediremos CPF+senha de conta bancária para executar por ele.

**Não somos edtech ou produtor de conteúdo genérico**
Blog existe, mas serve ao research (notas técnicas, análises de setor, relatórios de resultado). Não produzimos "10 ações para comprar agora", não temos curso, não temos mentoria. Quem quer aprender investe em curso. Quem quer investir usa Invística.

**Não somos robo-advisor baseado em perfil psicográfico**
Zero questionário "qual seu perfil de investidor" no onboarding. O usuário escolhe a tese (value, dividendos, quality, momentum) — não responde questionário de 30 perguntas. Perfil comportamental é preguiça metodológica, não rigor.

---

## 4 — Persona-âncora

Uma única persona para guiar decisões de MVP. Não múltiplas. Uma.

**Alexandre, 37 anos**

Engenheiro formado, trabalha há 12 anos em empresa de tecnologia. Salário CLT mensal de R$ 22 mil, líquido R$ 16 mil. Patrimônio investido de R$ 420 mil, distribuído entre:

- R$ 180k em renda fixa (CDBs, Tesouro Selic, LCIs) em 3 corretoras diferentes
- R$ 210k em ações B3 (12 papéis, concentrado em 4)
- R$ 30k em FIIs (3 papéis)

**Comportamento atual:**
- Monta sua carteira manualmente, decide com base em vídeos de YouTube, newsletters que assina e algumas análises de casas de research (Empiricus, Suno)
- Investe há 8 anos, ficou tecnicamente bom mas não tem certeza se está acima ou abaixo do IBOV — nunca fez a conta
- Usa planilha no Google Sheets para acompanhar carteira, atualiza uma vez por mês
- Assina 2 newsletters premium (~R$ 200/mês no total) mas não consome metade do conteúdo

**Frustrações:**
- Não sabe se o que faz está dando certo de verdade vs só "subindo porque o mercado sobe"
- Cansou de gurus que mudam de opinião mensalmente
- Já tentou 3 plataformas de análise (Status Invest, TradeMap, simplywall.st) — todas genéricas, todas com dados crus sem tese clara
- Quer método, não palpite. Mas não tem 8 horas por semana para virar analista

**O que ele precisa:**
- Saber em 5 minutos se sua carteira atual está boa ou ruim, segundo critérios claros
- Receber recomendação prescritiva baseada em método, não em palpite
- Poder se aprofundar em um ativo específico quando quiser, sem ser obrigado
- Prova de que o método funciona (backtest real, não hipotético)

**O que ele não quer:**
- Mais uma newsletter. Mais um guru. Mais um curso.
- Rede social de investimento
- Questionário de perfil comportamental
- Ferramenta que só mostra dados e o deixa sozinho para tirar conclusão

**Ticket aceitável:** até R$ 50/mês no plano individual é natural para o perfil. Acima disso, exige percepção de valor premium consolidada (research de research, consultoria individual).

**Frequência de uso esperada:** 2-3 vezes por semana nas primeiras 2 semanas; depois 1-2 vezes por semana na rotina; picos de uso em dias de resultado trimestral, evento macro relevante, ou rebalanceamento mensal.

Se uma feature não serve ao Alexandre, **não entra no MVP**. Mesmo que sirva a outro perfil. Priorizamos ele.

---

## 5 — Mapa do produto (arquitetura de informação)

Estrutura hierárquica completa. Todas as páginas do produto existem dentro desta árvore.

```
Invística (logado)
│
├── 1 · Home (Dashboard inteligente)
│   ├── Painel de carteira (vs benchmarks, vs teses alternativas)
│   ├── Sinais do motor (BUY/SELL/ROTATE do dia)
│   ├── Contexto macro (regime atual, SELIC, IPCA, indicadores)
│   └── Oportunidades rankeadas (top Invscore do momento)
│
├── 2 · Descobrir
│   ├── Screener (6 lentes: valor, dividendos, quality, defensiva, momento, growth)
│   ├── Ranking Invscore (top 100 da B3, filtrável)
│   └── Radar (alertas de mudança de score/tese)
│
├── 3 · Ativo (página por ticker)
│   ├── Visão geral (hero com Invscore + preço + resumo)
│   ├── Valuation (DCF, Gordon, Múltiplos, Monte Carlo, Fair Value final)
│   ├── Dividendos (histórico, safety score, projeção)
│   ├── Invscore X-Ray (detalhamento dos 3 pilares + 11 sub-scores)
│   ├── Tese institucional (o que o motor pensa da empresa)
│   └── Notícias e eventos (filtradas por relevância)
│
├── 4 · Carteira
│   ├── Minha carteira (registro manual no MVP, via Pluggy em V2)
│   ├── Análise (score ponderado, exposição por setor/fator, stress test)
│   ├── Recomendações prescritivas (o que comprar/vender para melhorar)
│   └── Rebalanceamento (sugestão de ações para aplicar aporte novo)
│
├── 5 · Teses
│   ├── Seletor de tese (value, dividendos, quality, momentum)
│   ├── Carteira modelo por tese (top picks do motor para aquela tese)
│   ├── Performance histórica por tese (backtest walk-forward)
│   └── Explicação da tese (metodologia, quando funciona, quando falha)
│
├── 6 · Simulador
│   ├── Simulador de aportes (quanto vira em X anos, com parâmetros)
│   ├── Projeção de longo prazo (carteira atual + aportes mensais)
│   └── Comparador (Invística vs IBOV vs CDI vs cenários)
│
├── 7 · Performance
│   ├── Track record Invística (CAGR, alpha, Sharpe, max DD)
│   ├── Walk-forward histórico (2012-hoje)
│   ├── Metodologia auditada (premissas, custos, impostos, survivorship)
│   └── Relatório mensal (performance do motor vs benchmarks)
│
├── 8 · Relatórios
│   ├── Resultado trimestral (análise dos 947 ativos pós-ITR)
│   ├── Research de setor (periódico, aprofundado)
│   ├── Panorama macro mensal
│   └── Notas técnicas (eventos relevantes)
│
└── 9 · Conta
    ├── Perfil (dados, senha, 2FA)
    ├── Plano e pagamento (MP integrado)
    ├── Notificações (email, push, frequência)
    └── Referência (indique um amigo)
```

Páginas públicas (não logado):

```
Invística (público)
├── Home (landing com hero + seções)
├── Método (explicação do motor quantamental, pilares, transparência)
├── Performance (track record público, visível antes de cadastro)
├── Preços
├── Sobre
└── Login / Cadastro
```

---

## 6 — Priorização MVP · V2 · V3

Organização por fase, alinhada com ambição 24/36 meses (ecossistema Invística → gestora CVM).

### MVP · primeiros 4 meses · base de usuários pagantes iniciais

Objetivo: provar que o produto resolve a dor do Alexandre e que ele paga por isso.

**Módulos no ar:**
1. Home com dashboard básico
2. Descobrir — apenas Ranking Invscore (screener fica para V2)
3. Ativo — apenas Visão geral + Invscore X-Ray (valuation completo fica para V2)
4. Carteira — registro manual + análise de score ponderado
5. Teses — seletor + carteira modelo (sem explicação metodológica completa)
6. Performance — track record público e logado
7. Conta — essencial (perfil, plano, pagamento)

**O que fica de fora do MVP (importante):**
- Simulador (entra em V2)
- Relatórios (entra em V2)
- Explorer/screener com 6 lentes (MVP só tem ranking)
- DCF, Gordon, Monte Carlo na página de ativo (V2)
- Radar de alertas (V2)
- Rebalanceamento automático (V2)

**Ticket MVP:** plano único Premium de R$ 38,90/mês (ou R$ 388/ano, dois meses grátis), com trial de 14 dias gratuito antes da primeira cobrança. Durante o trial, acesso completo. Sem freemium eterno. O trial de 14 dias dá ao Alexandre tempo suficiente para registrar a carteira, explorar o Invscore de seus ativos atuais e entender a tese — o que filtra curioso de cliente real após a conversão.

### V2 · meses 5–12 · aprofundamento e retenção

Objetivo: aumentar tempo de uso por usuário e reduzir churn.

**Módulos adicionados:**
- Descobrir completo (screener 6 lentes + Radar)
- Ativo completo (valuation multi-modelo, tese institucional, notícias filtradas)
- Carteira completa (recomendações prescritivas, rebalanceamento de aporte)
- Simulador completo
- Relatórios (resultado trimestral, setor, macro mensal)
- Integração Pluggy (custódia automática)

**Estrutura de planos V2:**
- Um único plano Premium R$ 38,90/mês mantido no primeiro ano completo
- A decisão de introduzir tiers adicionais (Completo, Pro, enterprise) só será tomada após 12 meses de operação consolidada com o plano único
- Hipóteses de evolução (a serem validadas com dados reais do primeiro ano):
  - Se ARPU médio baixo + alta demanda por features avançadas → introduzir tier Pro
  - Se churn alto + retenção baixa → manter plano único e investir em ativação
  - Se base B2B espontânea crescer (advisors usando para analisar clientes) → estudar tier PJ

### V3 · meses 13–36 · ecossistema e gestora CVM

Objetivo: consolidar Invística como referência em research B3 e abrir gestora.

**Expansões:**
- FIIs cobertos pelo motor
- Small caps e defensive com motor dedicado
- API B2B (advisors, escritórios, gestoras boutique consumindo Invscore)
- Blog editorial ativo (Wealth Trends equivalente Invística)
- Guia Invística (documentação de research aberta)
- Fundo CVM (Rafael com CGA ANBIMA) — cota disponível para clientes Pro
- Expansão LATAM (ações Chile, México, Argentina) — explorar

---

## 7 — Três jornadas críticas de usuário

Teste prático de se o mapa faz sentido. São as jornadas que **precisam funcionar** no MVP, ponta a ponta.

### Jornada 1 · Primeiro login (Dia 1)

1. Usuário criou conta e pagou
2. Chega logado pela primeira vez
3. **Home mostra:** CTA claro "Registre sua carteira atual para começarmos"
4. Usuário vai para Carteira → Registrar carteira manual
5. Adiciona os 12 papéis que tem hoje, com quantidade e preço médio
6. Invística calcula em 3 segundos: Invscore ponderado da carteira atual = **67**
7. **Home se atualiza:** "Sua carteira está em faixa Neutro. Aqui estão 5 sugestões de troca que elevariam para Favorável"
8. Usuário clica em uma das sugestões → vai para página do Ativo → vê tese + Invscore de 85
9. Entende a recomendação
10. Volta para Home com sensação de "caramba, isso é método de verdade"

**Critério de sucesso:** em 15 minutos, o Alexandre sai do login sabendo algo que ele não sabia antes — que sua carteira está mediana e que tem 5 ações objetivamente melhores disponíveis.

### Jornada 2 · Semana 2 · escolha de tese

1. Usuário volta à plataforma pela 4ª vez
2. Clica em Teses no menu
3. Vê 4 cards: Value, Dividendos, Quality, Momentum
4. Cada um mostra: carteira modelo atual, performance histórica, CAGR, alpha vs IBOV
5. Alexandre é atraído por Dividendos (perfil comportamental próprio dele)
6. Clica em Dividendos → vê top 10 papéis modelo, peso sugerido de cada um
7. Compara com sua carteira atual (Carteira → Análise): só 2 papéis em comum
8. **Decisão:** migrar gradualmente para carteira modelo de Dividendos
9. Vai para Rebalanceamento (V2) — mas no MVP, apenas anota as recomendações

**Critério de sucesso:** o usuário escolhe uma tese, entende o racional, e tem um plano claro para implementar.

### Jornada 3 · Dia de resultado trimestral (recorrente)

1. WEGE3 divulga resultado trimestral. Alexandre tem WEGE3 na carteira
2. Recebe push/email: "WEGE3 divulgou resultado. Invscore atualizado: 86 → 82"
3. Entra na plataforma → vai direto para página do Ativo → WEGE3
4. Vê o novo X-Ray do Invscore (o que caiu e por quê)
5. Vê análise do resultado pelo motor (não é texto editorial, é estruturada: receita vs consenso, margem vs histórico, guidance vs expectativa)
6. Decide se mantém ou troca
7. Consulta Carteira → recomendações para saber se deve reduzir posição

**Critério de sucesso:** o Alexandre entende em 10 minutos o que aconteceu com o ativo dele, sem precisar ler 2 relatórios de casa de research.

---

## 8 — Métricas norte-magnéticas

As 5 que medem se o produto está funcionando. Não são métricas de marketing (CAC, churn, LTV) — são métricas de produto.

**Métrica 1 · Tempo até primeira carteira registrada**
Do momento do primeiro login até o usuário registrar a carteira completa. Meta MVP: **15 minutos em média, 80% dos usuários em menos de 30 minutos**. Se passar disso, o onboarding está falhando.

**Métrica 2 · Retorno na semana 2**
Percentual de usuários que voltam à plataforma pelo menos 2 vezes entre o dia 8 e o dia 14 após cadastro. Meta MVP: **60%+**. Menos que isso significa que o valor entregue não é claro.

**Métrica 3 · Sessões por semana na rotina (após semana 4)**
Mediana de sessões semanais de usuários ativos após o primeiro mês. Meta: **2,5 sessões/semana**. Abaixo de 1,5, é ferramenta esquecida. Acima de 4, é vício ruim (ansiedade, churn emocional).

**Métrica 4 · Score NPS declarado dos que cancelam**
Pergunta obrigatória ao cancelar: "de 0 a 10, o quanto você recomendaria a Invística a um investidor sério como você?". Se cancelantes dão 7+, é problema de preço ou momento — ajustável. Se dão 5-, é problema de produto — grave.

**Métrica 5 · Razão de convicção**
Percentual de usuários que, após 60 dias, declaram em survey que "confiam no Invscore para tomar decisão de investir". Meta: **70%+**. Esta é a métrica-coração do produto. Se o Invscore não vira fonte de convicção, a Invística falhou no seu core.

Explicitamente ausentes (propositalmente):
- Conversão de visitante em pagante — métrica de marketing, não de produto
- MRR — métrica financeira, consequência de produto funcionar
- Feature adoption rate — ruído; importa se o Alexandre usa o que ele precisa, não se todo mundo usa tudo

---

## 9 — Próximos passos após este documento

Ordem sugerida de continuação, sessão a sessão:

**Próxima sessão · Camada 2 — Funcionalidades por módulo MVP**
Para cada um dos 7 módulos do MVP (Home, Descobrir, Ativo, Carteira, Teses, Performance, Conta), detalhar:
- Quais componentes existem na tela
- Quais dados consome do backend
- Interações possíveis do usuário
- Estados (vazio, carregando, erro, sucesso)

Saída: documento `PRODUCT-MVP-MODULES.md` com especificação de cada módulo.

**Sessão seguinte · Camada 3 — Wireframes das páginas MVP**
Para cada módulo, desenhar wireframe em HTML/CSS vanilla (padrão do que fizemos no hero), com paleta preto/branco/vermelho e estrutura Gorila adaptada. Não é design final — é esqueleto visual para validar fluxo.

Saída: 7 wireframes navegáveis (um por módulo).

**Sessão seguinte · Camada 4 — Copy editorial por página**
Copy final de cada tela seguindo as 10 regras editoriais do CLAUDE.md v5. Títulos, subtítulos, labels, mensagens de estado, confirmações.

Saída: documento `PRODUCT-COPY.md` com copy por tela.

**Sessão seguinte · Camada 5 — Conversão em React/Next.js**
Com wireframes + copy validados, via Claude Code CLI:
- Converter wireframes em componentes React com Tailwind
- Integrar com backend `invistica-api-production.up.railway.app`
- Implementar em `invistica-web` no repositório

Antes disso, executar também:
- **Rename semântico** do código (InvestIQ → Invística, IQ-Score → Invscore) — via Claude Code CLI
- **Atualização CLAUDE.md v6** com decisões desta sessão (paleta nova, tipografia Inter, referência Gorila, persona Alexandre, princípios 1-5, anti-princípios)

---

Fim do PRODUCT.md.

Este documento substitui qualquer briefing anterior de produto. Decisões conflitantes tomadas no passado devem ser resolvidas a favor deste documento ou discutidas explicitamente para atualização.
