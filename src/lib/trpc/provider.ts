/**
 * tRPC provider stub — backward compatibility.
 *
 * Re-exports the same stub as client.ts.
 * Components importing from '@/lib/trpc/provider' get the same proxy.
 */

export { trpc } from './client'
