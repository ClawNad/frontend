import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useReputation(agentId: string) {
  return useQuery({
    queryKey: ['reputation', agentId],
    queryFn: () => api.reputation.summary(agentId),
    enabled: !!agentId,
    staleTime: 30_000,
  })
}

export function useFeedback(agentId: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['feedback', agentId, params],
    queryFn: () => api.reputation.feedback(agentId, params),
    enabled: !!agentId,
  })
}
