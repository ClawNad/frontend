import { useQuery } from '@tanstack/react-query'
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

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => api.agents.get(agentId),
    enabled: !!agentId,
    staleTime: 5_000,
  })
}
