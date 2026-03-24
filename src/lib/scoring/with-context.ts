// ─── IQ-Score with Context ────────────────────────────────────
// Thin wrapper around calcularAqScore. Previously applied prediction
// markets context adjustment — Kalshi removed (US data, irrelevant for BR).
// Kept for backward compatibility with components that import from here.

import { calcularAqScore, type AqScoreResult, type DadosFundamentalistas } from './aq-score'

export interface AqScoreWithContext extends AqScoreResult {}

export function calcularAqScoreComContexto(
  dados: DadosFundamentalistas,
  _contracts: unknown[] | null
): AqScoreWithContext {
  return calcularAqScore(dados)
}
