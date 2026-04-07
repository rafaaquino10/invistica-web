// ─── Ollama Client ──────────────────────────────────────────
// Cliente para Ollama local (custo zero). Opcional — app funciona sem.

const OLLAMA_URL = process.env['OLLAMA_URL'] || 'http://localhost:11434'
const MODEL = process.env['OLLAMA_MODEL'] || 'qwen2.5:7b'

export async function generateCompletion(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      options: {
        temperature: options?.temperature ?? 0.3,
        num_predict: options?.maxTokens ?? 500,
      },
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  const data = await res.json()
  return data.response
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}
