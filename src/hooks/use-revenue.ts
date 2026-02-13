import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useRevenueEvents(agentId: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['revenue', agentId, params],
    queryFn: () => api.revenue.events(agentId, params),
    enabled: !!agentId,
  })
}
