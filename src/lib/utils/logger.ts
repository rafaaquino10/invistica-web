const prefix = '[investiq]'
const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(`${prefix} ${message}`, ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`${prefix} ${message}`, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`${prefix} ${message}`, ...args)
  },
}
