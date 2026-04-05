# PROMPT — CORREÇÃO CIRÚRGICA DE FUNDAÇÃO (NÃO DELETA NADA)

Leia o CLAUDE.md. Este prompt corrige problemas GLOBAIS que afetam todas as telas.
NÃO delete nenhum componente, service, ou rota. Apenas MELHORE o que existe.

---

## 1. TIPOGRAFIA — LEGIBILIDADE URGENTE

O site está com texto pequeno demais e cores de texto fracas demais. Corrija GLOBALMENTE:

No arquivo de variáveis SCSS (src/styles/_variables.scss ou equivalente):

```scss
// TEXTO — aumentar contraste e tamanho base
--text-primary: #1A1A18;      // Deve ser quase preto, NÃO cinza
--text-secondary: #4A4840;    // Mais escuro que antes (era #6B6960, muito claro)
--text-tertiary: #7A7770;     // Mais escuro que antes (era #9C998F)
--text-quaternary: #A09D95;   // Placeholders e disabled
```

No arquivo global.scss ou _typography.scss:

```scss
body {
  font-size: 15px;            // Era 14px — aumentar 1px faz enorme diferença
  line-height: 1.55;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Labels mono (usados em headers de seção)
// O letter-spacing 0.12em com font-size 9px fica microscópico.
// Manter 9px mas garantir que cor é --text-secondary (mais escuro), não --text-tertiary
```

Verificar que a fonte Satoshi está carregando corretamente:
- Abra DevTools > Network > Font
- Se Satoshi não aparece, o @font-face está errado ou o arquivo .woff2 não está em public/fonts/
- Se não estiver carregando, usar Google Fonts como fallback temporário:
  No index.html: <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  E no SCSS: --font-ui: 'Satoshi', 'Sora', system-ui, sans-serif;

Mesma verificação para IBM Plex Mono:
  Fallback: <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

---

## 2. LOADING STATES — PARAR O SHIMMER INFINITO

O problema: os skeleton loaders ficam piscando indefinidamente mesmo quando não há dados para carregar, ou ficam visíveis por tempo demais.

Correções:

A) Em CADA componente que usa skeleton/loading:
```typescript
// ANTES (errado): loading fica true pra sempre se o observable não emite
loading = signal(true);

// DEPOIS (correto): timeout de segurança
loading = signal(true);
// No ngOnInit ou no effect:
setTimeout(() => {
  if (this.loading()) this.loading.set(false); // Forçar parar após 5s
}, 5000);
```

B) Os skeletons devem ter duração MÁXIMA. Se os dados não chegam em 3 segundos, mostrar o conteúdo vazio (empty state) em vez de shimmer infinito.

C) A animação de shimmer deve ser SUTIL — não um flash branco brilhante. Corrigir o keyframe:
```scss
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.8s ease-in-out infinite; // Mais lento e suave
}
```

D) Verificar que os skeletons têm o MESMO tamanho que o conteúdo real para evitar layout shift.

---

## 3. PERFORMANCE — CARREGAMENTO LENTO

A) Verificar lazy loading das rotas. No app.routes.ts, CADA feature deve ser loadComponent:
```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
}
```
NÃO use loadChildren se o feature é um único componente. loadChildren é para módulos com sub-rotas.

B) Verificar se TradingView Lightweight Charts e D3.js estão sendo importados apenas nos componentes que usam:
```typescript
// ERRADO: import no topo do module/service global
import { createChart } from 'lightweight-charts';

// CORRETO: dynamic import dentro do componente
async ngAfterViewInit() {
  const { createChart } = await import('lightweight-charts');
  // usar aqui
}
```

C) Verificar o bundle size:
```bash
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/investiq-web/stats.json
```
Se algum chunk está > 500KB, tem algo que não está lazy loaded.

D) Adicionar preconnect no index.html:
```html
<link rel="preconnect" href="https://investiqbackend-production.up.railway.app" crossorigin>
<link rel="dns-prefetch" href="https://investiqbackend-production.up.railway.app">
```

E) Os services que fazem múltiplas chamadas ao backend no init de uma tela devem usar forkJoin para paralelizar:
```typescript
// ERRADO: sequencial
const scores = await this.scoreService.getTop(5);
const regime = await this.analyticsService.getRegime();
const feed = await this.radarService.getFeed(10);

// CORRETO: paralelo
forkJoin({
  scores: this.scoreService.getTop(5),
  regime: this.analyticsService.getRegime(),
  feed: this.radarService.getFeed(10)
}).subscribe(({ scores, regime, feed }) => {
  // usar tudo junto
});
```

---

## 4. NAVEGAÇÃO — ESCONDER TELAS VAZIAS TEMPORARIAMENTE

Telas que não mostram nada útil devem ser ESCONDIDAS da sidebar até estarem prontas. Isso não é regredir — é profissionalismo. Ninguém mostra uma tela vazia pro cliente.

No sidebar component, comentar (NÃO deletar) os links para telas que estão vazias ou quebradas. Manter apenas:

VISÍVEIS (funcionam):
- Dashboard
- Explorar
- Comparar
- Mapa
- Carteira
- Dividendos
- Radar (se o feed funciona)
- Configurações

ESCONDER TEMPORARIAMENTE (comentar no template, NÃO deletar a rota nem o componente):
- Decidir (se não tem smart contribution implementado)
- Income Planner (se não tem simulação)
- Simulador (se não tem sensitivity)
- Se eu tivesse (se não tem cálculo)
- Risk Scanner (se não tem risk metrics)
- Institucional (se não tem dados)
- Termômetro (se não tem agregação)
- Macro (se não tem dados do Focus)
- Backtest (se não tem o form completo)
- Analytics (se não tem IC timeline)

Para cada tela escondida, adicionar um comentário:
```html
<!-- TODO: Habilitar quando tiver dados/implementação completa -->
<!-- <a routerLink="/decidir">Decidir</a> -->
```

As rotas continuam existindo no app.routes.ts — apenas o link na sidebar é comentado.

---

## 5. ESTILO GLOBAL — ACABAMENTO

A) Cards estão muito "achatados". Adicionar sombra sutil:
```scss
.card, [class*="card"] {
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  transition: box-shadow 200ms ease;
  &:hover {
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }
}
```

B) Transições entre rotas — adicionar fade suave:
```scss
router-outlet + * {
  animation: fadeIn 200ms ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

C) Scrollbar custom (se não tem):
```scss
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-quaternary); }
```

D) Links e botões precisam de cursor pointer e transição:
```scss
a, button, [role="button"] {
  cursor: pointer;
  transition: opacity 150ms ease, background 150ms ease;
}
```

E) Tabelas precisam de hover consistente:
```scss
tr:hover td, .table-row:hover {
  background: var(--surface-2);
}
```

F) Garantir que o ticker tape no topo está funcionando suavemente — se está travando, reduzir a quantidade de items ou simplificar a animação CSS.

---

## 6. EMPTY STATES PARA TELAS QUE FICAM VISÍVEIS

Para as telas que permanecem visíveis na sidebar mas podem não ter dados:

Dashboard sem portfolio:
- Mostrar o hero banner com IBOV e movers (funciona sem portfolio)
- Na seção de insights: "Adicione posições na carteira para ver insights personalizados."
- Na seção "Motor recomenda": mostrar top 5 normalmente (não depende de portfolio)

Carteira vazia:
- "Você ainda não tem posições. Adicione seu primeiro ativo para começar."
- Botão: "Adicionar posição"

Dividendos sem dados:
- "Sem proventos registrados. Adicione posições na carteira para acompanhar dividendos."

Radar sem items:
- Se o feed vem vazio, mostrar: "Nenhum evento recente. Os insights aparecerão conforme o motor detectar movimentações."

---

## ORDEM DE EXECUÇÃO

1. Primeiro: corrigir variáveis de cor e tamanho de fonte (impacto global imediato)
2. Segundo: corrigir loading/skeletons (para de piscar)
3. Terceiro: verificar fontes carregando (Satoshi + IBM Plex Mono)
4. Quarto: esconder telas vazias da sidebar
5. Quinto: adicionar sombras, transições, scrollbar, hover states
6. Sexto: paralelizar chamadas de API (forkJoin)
7. Sétimo: verificar lazy loading e bundle size

Após cada correção, rodar ng serve e verificar visualmente.

NÃO MUDE O LAYOUT DE NENHUMA TELA. Não mexa no HTML do dashboard, explorar, etc.
Este prompt é APENAS para fundação: tipografia, cores, performance, loading, acabamento.

git add -A && git commit -m "fix: fundação — tipografia legível, loading states, performance, acabamento global"
