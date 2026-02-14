import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useAgents(params: {
  limit?: number
  offset?: number
  sort?: string
  order?: string
  active?: boolean
  creator?: string
}) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => api.agents.list(params),
    staleTime: 10_000,
  })
}

export function useInfiniteAgents(params: {
  limit?: number
  sort?: string
  order?: string
  active?: boolean
  search?: string
}) {
  const limit = params.limit ?? 20
  return useInfiniteQuery({
    queryKey: ['agents-infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      api.agents.list({ ...params, limit, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: 10_000,
  })
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => api.agents.get(agentId),
    enabled: !!agentId,
    staleTime: 5_000,
  })
}
