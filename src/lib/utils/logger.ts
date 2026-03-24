const prefix = '[investiq]'

let Sentry: { captureException: (e: Error, ctx?: unknown) => void; captureMessage: (msg: string, level: string) => void } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require('@sentry/nextjs')
} catch {
  // Sentry not installed — skip error reporting
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(`${prefix} ${message}`, ...args)
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`${prefix} ${message}`, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`${prefix} ${message}`, ...args)
    if (!Sentry) return
    const error = args.find(a => a instanceof Error) as Error | undefined
    if (error) {
      Sentry.captureException(error, { extra: { message } })
    } else {
      Sentry.captureMessage(`${prefix} ${message}`, 'error')
    }
  },
}
