import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function usePlatformStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.stats(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}
