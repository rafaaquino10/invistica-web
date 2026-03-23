import * as Sentry from '@sentry/nextjs'

const prefix = '[aq-invest]'

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
    // Report errors to Sentry
    const error = args.find(a => a instanceof Error) as Error | undefined
    if (error) {
      Sentry.captureException(error, { extra: { message } })
    } else {
      Sentry.captureMessage(`${prefix} ${message}`, 'error')
    }
  },
}
