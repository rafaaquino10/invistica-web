// ─── Claude API Client ──────────────────────────────────────
// Client para Anthropic Claude API (Haiku 4.5 para diagnósticos, Sonnet para research).
// Custo estimado: ~$0.001 por diagnóstico (Haiku), ~$0.01 por research note (Sonnet).
// Fallback para Ollama local se API key não configurada.

import { logger } from '../utils/logger'

const ANTHROPIC_API_KEY = process.env['ANTHROPIC_API_KEY'] ?? ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// Modelos disponíveis
export const CLAUDE_MODELS = {
  // Haiku 4.5: rápido e barato para diagnósticos do dia-a-dia
  haiku: 'claude-haiku-4-5-20251001',
  // Sonnet 4.6: mais detalhado para research notes premium
  sonnet: 'claude-sonnet-4-6',
} as const

export type ClaudeModel = keyof typeof CLAUDE_MODELS

export interface ClaudeCompletionOptions {
  model?: ClaudeModel
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  timeoutMs?: number
}

/**
 * Verifica se a Claude API está configurada e acessível.
 */
export function isClaudeAvailable(): boolean {
  return ANTHROPIC_API_KEY.length > 0
}

/**
 * Gera completion via Claude API.
 * Retorna o texto da resposta.
 * Throws em caso de erro (caller deve tratar).
 */
export async function generateClaudeCompletion(
  prompt: string,
  options: ClaudeCompletionOptions = {},
): Promise<string> {
  const {
    model = 'haiku',
    temperature = 0.2,
    maxTokens = 500,
    systemPrompt,
    timeoutMs = 30_000,
  } = options

  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY não configurada')
  }

  const modelId = CLAUDE_MODELS[model]
  const messages: Array<{ role: string; content: string }> = [
    { role: 'user', content: prompt },
  ]

  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: maxTokens,
    temperature,
    messages,
  }

  if (systemPrompt) {
    body['system'] = systemPrompt
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    logger.warn(`Claude API ${modelId} erro ${res.status}: ${errorBody.slice(0, 200)}`)
    throw new Error(`Claude API ${res.status}: ${errorBody.slice(0, 100)}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text

  if (!text) {
    throw new Error('Claude API retornou resposta vazia')
  }

  return text
}

/**
 * System prompt padrão para diagnósticos Invscore.
 * Garante tom consultivo, dados reais, sem recomendação de compra/venda.
 */
export const IQ_SYSTEM_PROMPT = `Você é o motor de inteligência Invscore, um analista fundamentalista sênior focado no mercado de ações brasileiro.

REGRAS ABSOLUTAS:
1. Use SOMENTE os dados fornecidos — NUNCA invente números
2. NUNCA recomende compra ou venda diretamente
3. Use linguagem descritiva: "momento favorável", "sinais de atenção", "fundamentos deteriorando"
4. Sempre em português brasileiro
5. Se houver fato relevante CVM, dê destaque imediato
6. Se houver contradição entre fundamentos e notícias, destaque o conflito
7. Máximo 4 frases por bullet point
8. Inclua dados numéricos em cada observação

DISCLAIMER (incluir ao final):
"As análises são de caráter informativo e educacional. Não constituem recomendação de investimento."`
