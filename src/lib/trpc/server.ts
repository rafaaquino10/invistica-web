import 'server-only'

import { createCallerFactory } from './trpc'
import { createContext } from './context'
import { appRouter } from './routers'

const createCaller = createCallerFactory(appRouter)

export const api = async () => {
  const context = await createContext()
  return createCaller(context)
}
