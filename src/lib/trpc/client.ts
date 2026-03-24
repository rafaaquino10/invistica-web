/**
 * tRPC client stub — backward compatibility.
 *
 * All data fetching should migrate to @/lib/api/endpoints.
 * This stub prevents build failures for components not yet migrated.
 * Each trpc.*.useQuery() returns { data: undefined, isLoading: true }.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const noopQuery = {
  useQuery: (_input?: any, _opts?: any) => ({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: () => Promise.resolve({ data: undefined }),
  }),
  useMutation: (_opts?: any) => ({
    mutate: () => {},
    mutateAsync: () => Promise.resolve(undefined),
    isLoading: false,
    error: null,
  }),
}

const handler: ProxyHandler<any> = {
  get: (_target, prop) => {
    if (typeof prop === 'string') {
      return new Proxy({}, handler)
    }
    return noopQuery
  },
  apply: () => noopQuery,
}

export const trpc: any = new Proxy({}, handler)
