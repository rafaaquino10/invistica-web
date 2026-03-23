import { z } from 'zod'

// ─── Modo demo: sem DATABASE_URL ────────────────────────────
const isDemoMode = !process.env['DATABASE_URL']
const isProduction = process.env['NODE_ENV'] === 'production'

const serverEnvSchema = z.object({
  // Database — obrigatória em produção, opcional em demo
  DATABASE_URL: isDemoMode
    ? z.string().optional()
    : z.string().url({ message: 'DATABASE_URL é obrigatória em produção' }),

  DIRECT_URL: z.string().optional(),

  // Auth — SEMPRE obrigatória, sem fallback
  AUTH_SECRET: z.string().min(16, {
    message: 'AUTH_SECRET é obrigatória (mínimo 16 caracteres). Gere com: openssl rand -base64 32',
  }),

  // Legado (suportado para compatibilidade)
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  APP_URL: z.string().optional(),

  // Gateway
  GATEWAY_URL: z.string().url({ message: 'GATEWAY_URL é obrigatória' }).default('http://localhost:4000'),

  // OAuth Providers (opcionais em dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Public
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Mercado Pago — webhook secret obrigatório em produção
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: isProduction
    ? z.string().min(1, { message: 'MERCADOPAGO_WEBHOOK_SECRET é obrigatória em produção' })
    : z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // Feature flags
  ALLOW_DEMO: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Para client-side (apenas NEXT_PUBLIC_ vars)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    console.error('[ERROR] Variáveis de ambiente inválidas:', errors)
    throw new Error(
      `Variáveis de ambiente inválidas: ${Object.entries(errors)
        .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
        .join('; ')}`
    )
  }

  return parsed.data
}

function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env['NEXT_PUBLIC_API_BASE_URL'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_SENTRY_DSN: process.env['NEXT_PUBLIC_SENTRY_DSN'],
  })

  if (!parsed.success) {
    console.error('[ERROR] Variáveis de ambiente de cliente inválidas:', parsed.error.flatten().fieldErrors)
    throw new Error('Variáveis de ambiente de cliente inválidas')
  }

  return parsed.data
}

// Export lazy-loaded env para evitar problemas durante build
export const env = {
  get server() {
    return getServerEnv()
  },
  get client() {
    return getClientEnv()
  },
}

// Acesso direto para vars comuns
export const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:4000'
