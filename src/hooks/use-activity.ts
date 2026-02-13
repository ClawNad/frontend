import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useActivityFeed(limit = 20) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: () => api.activity.feed({ limit }),
    refetchInterval: 5_000,
  })
}
