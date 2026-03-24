const prefix = '[investiq]'

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
  },
}
