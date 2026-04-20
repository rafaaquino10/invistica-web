# Prompt para Claude Web — Protótipo de modais de auth (Invística)

Cole o conteúdo abaixo em uma nova conversa no Claude.ai. O output esperado é um único arquivo HTML vanilla (CSS inline + JS vanilla) que poderá ser validado no navegador e depois convertido em React/Tailwind.

---

Preciso que você produza um **protótipo HTML vanilla único** (CSS inline no `<head>`, JavaScript vanilla no final do `<body>`, zero dependências externas exceto a fonte Inter do Google Fonts) com três fluxos de autenticação de um SaaS brasileiro de research de investimentos chamado **Invística**.

## Contexto de marca

**Invística** — plataforma de research quantamental aplicado a ações da B3. Posicionamento: institucional, sério, brasileiro. Persona-âncora: Alexandre, 37 anos, engenheiro CLT, patrimônio R$ 420k, quer método e não palpite.

Wordmark oficial: a palavra "Invística" grafada com o "**I**" inicial em itálico, "**nv**" em romana, "**ı**" medial em itálico (glyph dotless i U+0131) com um traço vermelho horizontal de acento posicionado acima (retângulo ~6x1.5px em tamanho de header), e "**stica**" em romana. Use esta estrutura HTML:

```html
<span class="wordmark">
  <span class="italic">I</span>nv<span class="dot-wrap"><span class="italic">ı</span></span>stica
</span>
```

Com CSS que posicione o acento vermelho `#DC2626` acima do `ı` via `::before` no `.dot-wrap`.

## Identidade visual

**Paleta** (CSS variables obrigatórias):
```
--bg: #FFFFFF
--bg-elevated: #FAFAFA
--bg-subtle: #F4F4F5
--text: #0A0A0A
--text-muted: #52525B
--text-dim: #71717A
--text-faint: #A1A1AA
--border: #E4E4E7
--border-strong: #D4D4D8
--accent: #DC2626
--accent-hover: #B91C1C
--accent-soft-bg: #FEE2E2
--accent-soft-text: #991B1B
```

Regra dura: vermelho aparece apenas em acentos pontuais (CTA primário, destaque numérico, acento do wordmark, foco de input). **Nunca em blocos grandes de cor. Nunca como fundo de seção inteira.**

**Tipografia:** Inter (Google Fonts). Pesos usados: 400, 500, 600, 700. Italic habilitado. Carregue incluindo explicitamente os estilos itálicos:
```
https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap
```

**Tracking:** títulos grandes `letter-spacing: -0.03em`, texto corrido `0`, labels uppercase `0.15em`.

## O que preciso

Um arquivo HTML com:

1. Uma **landing fake mínima** de referência visual (apenas um header sticky com wordmark + dois botões à direita: "Criar conta" outline e "Acessar plataforma" primário vermelho). Zero conteúdo além disso — é só o pano de fundo para exibir os modais.
2. **Modal de Login** — abre quando o usuário clica em "Acessar plataforma" (no protótipo, abre sempre; na implementação real haverá check de auth antes).
3. **Modal de Criar conta** — abre quando o usuário clica em "Criar conta".
4. **Alternância fluida entre os dois modais** via link secundário dentro de cada um.

### Modal de Login

- Overlay fullscreen com backdrop `rgba(10, 10, 10, 0.45)` + `backdrop-filter: blur(8px)`
- Card central: `max-width: 440px`, `border-radius: 16px`, fundo `var(--bg)`, sombra sutil (`0 20px 60px rgba(0,0,0,0.12)`), `padding: 40px 36px`
- Em mobile (`< 640px`): modal ocupa a tela inteira, sem border-radius nas bordas externas, com padding reduzido
- Botão X discreto no canto superior direito (ícone SVG inline, 20x20, cor `var(--text-dim)`, hover `var(--text)`)
- Wordmark "Invística" no topo (tamanho md ~22px, weight 500)
- Título abaixo do wordmark: **"Acessar plataforma"** — 24px, bold, `letter-spacing: -0.5px`
- Subtítulo: **"Entre com sua conta Invística."** — 14px, `var(--text-muted)`
- Campos (stack vertical, gap 16px):
  - Email (type=email, placeholder "voce@email.com")
  - Senha (type=password, placeholder "••••••••")
- Estilo de input: altura 44px, `border-radius: 8px`, borda `1px solid var(--border-strong)`, padding `0 14px`, `font-size: 15px`. No foco: borda `var(--accent)` + `box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12)`.
- Label acima de cada input: 13px, weight 500, `var(--text)`, `margin-bottom: 6px`
- Link "Esqueci minha senha" alinhado à direita abaixo do campo de senha, 13px, `var(--text-muted)`, sublinhado no hover
- CTA primário (full-width): **"Entrar"** — altura 48px, `background: var(--accent)`, texto branco weight 600, `border-radius: 8px`, hover `var(--accent-hover)` + `transform: translateY(-1px)`, transição 150ms
- Rodapé do modal: texto 14px centralizado, `var(--text-muted)`, com **"Ainda não tem conta?"** + link "Criar conta" em `var(--text)` weight 500 sublinhado, que ao clique troca para o modal de cadastro (ver alternância abaixo)

### Modal de Criar conta

- Mesmo layout visual e dimensões do modal de login
- Wordmark + título: **"Criar conta"**
- Subtítulo: **"14 dias grátis. Depois R$ 38,90/mês. Cancele quando quiser."** — esta linha é importante, inclua literal
- Campos (stack vertical, gap 16px):
  - Nome completo (type=text)
  - Email (type=email)
  - Senha (type=password, placeholder "Mínimo 8 caracteres")
- Checkbox abaixo dos campos: quadrado 16x16, `border-radius: 4px`, checado com acento vermelho e check branco. Label do checkbox: 13px, `var(--text-muted)`, com texto **"Li e aceito os Termos de uso e Política de privacidade."** onde "Termos de uso" e "Política de privacidade" são links sublinhados em `var(--text)`.
- CTA primário: **"Começar 14 dias grátis"** — mesmo estilo do Entrar. Desabilitar (opacity 0.5, cursor not-allowed) enquanto o checkbox não estiver marcado.
- Disclaimer abaixo do CTA: 12px, `var(--text-faint)`, centralizado: **"Sem cartão de crédito. Cancele antes do fim do trial e não pague nada."**
- Rodapé do modal: **"Já tem conta?"** + link "Entrar" em `var(--text)` weight 500, que alterna para o modal de login

### Alternância entre modais

Ao clicar em "Criar conta" dentro do modal de login (ou "Entrar" dentro do modal de criar conta), o modal atual faz fade-out + scale down leve (200ms) e o novo modal faz fade-in + scale up (250ms). O backdrop permanece. Use `opacity` + `transform: scale()` + `transition`.

### Comportamento geral

- Clique no backdrop (fora do card) fecha o modal
- Tecla `Esc` fecha o modal
- Quando um modal está aberto, `body` ganha `overflow: hidden`
- Focus trap dentro do modal (o primeiro input do modal recebe foco automático ao abrir, e Tab não escapa para fora do card)
- Entrada do modal: backdrop faz fade-in (180ms), card faz fade-in + scale de 0.96 para 1 (280ms, ease-out)
- Saída: inverso
- Submits dos formulários: `event.preventDefault()` + `console.log('login submit', {email, password})` / `console.log('signup submit', {name, email, password})` — zero integração real
- Validação mínima: inputs required, email com type=email. Se o submit falhar por required, o browser mostra a mensagem nativa.

## Voz editorial obrigatória

Todos os textos devem seguir estas regras:

1. Frases curtas, máximo 20 palavras
2. Zero superlativo vazio ("incrível", "revolucionário", "poderoso" — proibidos)
3. Zero urgência fabricada ("não perca", "garanta já" — proibidos)
4. Zero pitch ("descubra como", "transforme sua" — proibidos)
5. Português brasileiro formal-neutro, trate por "você"
6. Números antes de adjetivos quando possível

Os textos que forneci acima já seguem essa voz. Se precisar escrever algum texto adicional (ex: uma mensagem de erro stub, um tooltip), siga as mesmas regras.

## Referência estrutural

Inspire-se na **Gorila Invest** (gorila.com.br) para densidade, hierarquia e peso visual — mas sem copiar a voz (Gorila é pitch-y, Invística é contida). Para auth modals especificamente, Linear (linear.app) e Stripe são boas referências de execução limpa.

## Responsividade

100% responsivo por default. Breakpoints sugeridos:
- `< 640px`: modal ocupa a tela inteira, sem border-radius nas bordas, padding reduzido, CTA permanece full-width
- `≥ 640px`: modal centralizado com `max-width: 440px`

O header fake da landing deve ter padding `px: 24px` em mobile, `40px` em md, `64px` em lg, `96px` em xl — não use `max-width` fixo no container do header; conteúdo ocupa 100% do viewport com padding escalonado.

## Output

Um único arquivo `.html` auto-contido. CSS dentro de `<style>` no `<head>`. JavaScript vanilla dentro de `<script>` no fim do `<body>`. Carregamento da Inter via `<link>` do Google Fonts. Zero outras dependências externas.

O arquivo deve abrir funcional ao dar duplo clique. Pode me entregar o arquivo completo dentro de um único code block `html`.
