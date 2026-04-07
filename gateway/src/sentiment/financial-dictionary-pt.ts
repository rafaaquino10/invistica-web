// ─── Financial Dictionary (Portuguese) ──────────────────────────
// Based on the Loughran-McDonald framework, adapted for Brazilian
// financial markets and Portuguese language.
// 150+ positive, 150+ negative, 50+ uncertainty words.

// ─── Positive Words ─────────────────────────────────────────────

export const POSITIVE_WORDS = new Set([
  // Resultados financeiros
  'lucro', 'lucros', 'lucratividade', 'lucrativo', 'lucrativa',
  'rentabilidade', 'rentável', 'superávit', 'superavit',
  'crescimento', 'cresceu', 'crescer', 'crescente',
  'avançou', 'avancou', 'avanço', 'avanco', 'avançar',
  'expansão', 'expansao', 'expandiu', 'expandir',
  'alta', 'altas', 'elevação', 'elevou', 'elevar',
  'valorização', 'valorizacao', 'valorizou', 'valorizar',
  'recorde', 'recordes', 'histórico', 'historico',
  'superou', 'supera', 'superação', 'superando',
  'surpreendeu', 'surpreendente', 'surpreender',
  'positivo', 'positiva', 'positivos', 'positivas',
  'melhorou', 'melhora', 'melhorar', 'melhoria',
  'incremento', 'incrementou', 'incrementar',
  'aceleração', 'aceleracao', 'acelerou', 'acelerar',
  'ganho', 'ganhos', 'ganhar',
  'fortaleceu', 'fortalecer', 'fortalecimento',
  'sólido', 'solido', 'sólida', 'solida',
  'robusto', 'robusta', 'robustez',
  'estável', 'estavel', 'estabilidade',

  // Dividendos e proventos
  'dividendo', 'dividendos', 'provento', 'proventos',
  'jcp', 'bonificação', 'bonificacao',
  'distribuição', 'distribuicao', 'distribuir',
  'payout', 'yield', 'rendimento', 'rendimentos',
  'remuneração', 'remuneracao',

  // Mercado e recomendações
  'upgrade', 'recomendação', 'recomendacao', 'compra',
  'outperform', 'overweight', 'buy',
  'recuperação', 'recuperacao', 'recuperou', 'recuperar',
  'resiliência', 'resiliencia', 'resiliente',
  'otimismo', 'otimista', 'otimistas',
  'confiança', 'confianca', 'confiante',
  'atrativo', 'atrativa', 'atratividade',
  'potencial', 'promissor', 'promissora',
  'oportunidade', 'oportunidades',

  // Operacional e corporativo
  'eficiência', 'eficiencia', 'eficiente',
  'produtividade', 'produtivo', 'produtiva',
  'inovação', 'inovacao', 'inovar', 'inovador',
  'inauguração', 'inauguracao', 'inaugurou',
  'lançamento', 'lancamento', 'lançou', 'lancou',
  'aprovação', 'aprovacao', 'aprovou', 'aprovar',
  'acordo', 'acordos', 'parceria', 'parcerias',
  'fusão', 'fusao', 'aquisição', 'aquisicao',
  'investimento', 'investimentos', 'investir',
  'modernização', 'modernizacao', 'modernizar',

  // Financeiro e crédito
  'desalavancagem', 'liquidez', 'solvência', 'solvencia',
  'investment grade', 'grau de investimento',
  'amortização', 'amortizacao', 'amortizar',
  'capitalização', 'capitalizacao',
  'sustentável', 'sustentavel', 'sustentabilidade',
  'geração de caixa', 'geracao de caixa',
  'fluxo de caixa', 'caixa livre',

  // Macro positivo
  'crescimento econômico', 'crescimento economico',
  'emprego', 'empregos', 'contratação', 'contratacoes',
  'redução de juros', 'corte de juros', 'afrouxamento',

  // Adjetivos gerais positivos
  'favorável', 'favoravel', 'excelente', 'excepcional',
  'destaque', 'brilhante', 'impressionante',
  'consistente', 'saudável', 'saudavel',
  'superior', 'acima', 'além', 'alem',
  'benefício', 'beneficio', 'beneficiar',
  'conquista', 'conquistou', 'êxito', 'exito',
  'sucesso', 'vitória', 'vitoria',

  // Verbos de tendência positiva
  'sobe', 'subiu', 'subir', 'subindo',
  'cresce', 'lidera', 'liderou', 'liderar',
  'avança', 'impulsiona', 'impulsionou',
  'amplia', 'ampliou', 'ampliar',
  'dobrou', 'dobrar', 'triplicou',
])

// ─── Negative Words ─────────────────────────────────────────────

export const NEGATIVE_WORDS = new Set([
  // Resultados financeiros
  'prejuízo', 'prejuizo', 'prejuízos', 'prejuizos',
  'perda', 'perdas', 'perdeu', 'perder',
  'déficit', 'deficit', 'déficits',
  'queda', 'quedas', 'caiu', 'cair', 'caindo',
  'recuo', 'recuou', 'recuar',
  'retração', 'retracao', 'retraiu', 'retrair',
  'baixa', 'baixas', 'baixou',
  'desvalorização', 'desvalorizacao', 'desvalorizou',
  'tombo', 'tombou', 'despencou', 'despencar',
  'frustrou', 'frustrante', 'frustração', 'frustracao',
  'decepcionou', 'decepção', 'decepcao', 'decepcionante',
  'negativo', 'negativa', 'negativos', 'negativas',
  'piorou', 'piora', 'piorar', 'deterioração', 'deterioracao',
  'desaceleração', 'desaceleracao', 'desacelerou',
  'encolheu', 'encolher', 'encolhimento',
  'redução', 'reducao', 'reduziu', 'reduzir',
  'diminuição', 'diminuicao', 'diminuiu',
  'contraiu', 'contração', 'contracao',
  'fraco', 'fraca', 'fracos', 'fracas', 'fraqueza',
  'abaixo', 'inferior', 'aquém', 'aquem',

  // Risco e dívida
  'dívida', 'divida', 'dívidas', 'dividas',
  'endividamento', 'endividada', 'endividado',
  'alavancagem', 'alavancada', 'alavancado',
  'inadimplência', 'inadimplencia', 'inadimplente',
  'calote', 'default', 'moratória', 'moratoria',
  'rebaixamento', 'rebaixou', 'rebaixar',
  'downgrade', 'underweight', 'sell',
  'recessão', 'recessao', 'depressão', 'depressao',
  'crise', 'crises', 'colapso',
  'falência', 'falencia', 'insolvência', 'insolvencia',
  'recuperação judicial', 'rj', 'concordata',

  // Mercado
  'venda', 'vendas', 'underperform',
  'volatilidade', 'volátil', 'volatil',
  'incerteza', 'incertezas', 'instabilidade',
  'pânico', 'panico', 'medo', 'temor', 'temores',
  'fuga', 'saída', 'saida', 'êxodo', 'exodo',
  'correção', 'correcao', 'derreteu', 'derreter',
  'desabou', 'desabar', 'afundou', 'afundar',
  'pessimismo', 'pessimista', 'pessimistas',

  // Operacional e corporativo
  'demissão', 'demissao', 'demissões', 'demissoes',
  'reestruturação', 'reestruturacao',
  'fechamento', 'fechou', 'fechar',
  'suspensão', 'suspensao', 'suspendeu', 'suspender',
  'embargo', 'embargou', 'embargar',
  'multa', 'multas', 'penalidade', 'penalidades',
  'investigação', 'investigacao', 'investigado',
  'fraude', 'fraudes', 'fraudulento',
  'irregularidade', 'irregularidades',
  'escândalo', 'escandalo', 'escândalos',
  'corrupção', 'corrupcao', 'corrupto',
  'processo', 'processos', 'litígio', 'litigio',
  'condenação', 'condenacao', 'condenado',

  // Macro negativo
  'inflação', 'inflacao', 'inflacionário', 'inflacionario',
  'juros altos', 'aperto monetário', 'aperto monetario',
  'desemprego', 'desempregado', 'desocupação',
  'estagflação', 'estagflacao',
  'austeridade', 'recessivo', 'recessiva',
  'desaceleração econômica', 'desaceleracao economica',

  // Eventos adversos
  'acidente', 'acidentes', 'desastre', 'catástrofe',
  'incêndio', 'incendio', 'vazamento',
  'greve', 'greves', 'paralisação', 'paralisacao',
  'interrupção', 'interrupcao', 'interrompeu',
  'sanção', 'sancao', 'sanções', 'sancoes',
  'proibição', 'proibicao', 'proibiu',

  // Verbos de tendência negativa
  'desce', 'desceu', 'descer', 'descendo',
  'recua', 'retrocede', 'retrocedeu',
  'deteriora', 'desmorona', 'desmoronou',
  'liquida', 'liquidou', 'liquidação', 'liquidacao',
])

// ─── Uncertainty Words ──────────────────────────────────────────

export const UNCERTAINTY_WORDS = new Set([
  'pode', 'poderia', 'poderá', 'podera',
  'talvez', 'possível', 'possivel', 'possivelmente',
  'provável', 'provavel', 'provavelmente',
  'risco', 'riscos', 'arriscado',
  'incerto', 'incerteza', 'incertezas',
  'indefinido', 'indefinição', 'indefinicao',
  'depende', 'dependendo', 'dependerá',
  'condicional', 'condicionado',
  'eventual', 'eventualmente',
  'especulação', 'especulacao', 'especular', 'especulativo',
  'rumor', 'rumores', 'boato', 'boatos',
  'expectativa', 'expectativas', 'espera-se',
  'previsão', 'previsao', 'prever',
  'estimativa', 'estimativas', 'estimar',
  'projeção', 'projecao', 'projetar',
  'cenário', 'cenario', 'cenários', 'cenarios',
  'hipótese', 'hipotese', 'hipotético',
  'dúvida', 'duvida', 'dúvidas', 'duvidoso',
  'aguardar', 'aguarda', 'aguardando',
  'imprevisível', 'imprevisivel',
  'instável', 'instavel',
  'questionável', 'questionavel',
  'controverso', 'controversa', 'controvérsia',
  'divergência', 'divergencia', 'divergente',
  'ambíguo', 'ambiguo', 'ambiguidade',
])

// ─── Negation Words ─────────────────────────────────────────────
// These flip sentiment of the following word

export const NEGATION_WORDS = new Set([
  'não', 'nao', 'nem', 'nunca', 'jamais',
  'sem', 'nenhum', 'nenhuma', 'nada',
  'tampouco', 'sequer',
])

// ─── Intensifier Words ──────────────────────────────────────────
// These amplify the sentiment of nearby words

export const INTENSIFIER_WORDS = new Set([
  'muito', 'bastante', 'extremamente', 'significativamente',
  'fortemente', 'drasticamente', 'consideravelmente',
  'substancialmente', 'expressivamente', 'notavelmente',
])
