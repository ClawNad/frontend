import type { PaginatedResponse, ApiResponse } from '@/types/api'
import type { Agent, AgentDetail } from '@/types/agent'
import type { TokenTrade, TokenPrice } from '@/types/token'
import type { ReputationSummary, FeedbackItem } from '@/types/reputation'
import type { RevenueEvent } from '@/types/revenue'
import type { ActivityEvent } from '@/types/activity'
import type { PlatformStats } from '@/types/stats'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

async function fetchApi<T>(
  path: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined>
    method?: string
    body?: unknown
    headers?: Record<string, string>
  },
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const isFormData = options?.body instanceof FormData

  const res = await fetch(url.toString(), {
    method: options?.method ?? 'GET',
    headers: isFormData ? options?.headers : { 'Content-Type': 'application/json', ...options?.headers },
    body: isFormData ? (options.body as FormData) : options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `API Error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  stats: () => fetchApi<ApiResponse<PlatformStats>>('/stats'),

  agents: {
    list: (params?: {
      limit?: number
      offset?: number
      sort?: string
      order?: string
      active?: boolean
      creator?: string
    }) => fetchApi<PaginatedResponse<Agent>>('/agents', { params: params as Record<string, string | number | boolean | undefined> }),

    get: (agentId: string) => fetchApi<ApiResponse<AgentDetail>>(`/agents/${agentId}`),
  },

  tokens: {
    trades: (tokenAddress: string, params?: { limit?: number; offset?: number; tradeType?: string }) =>
      fetchApi<PaginatedResponse<TokenTrade>>(`/tokens/${tokenAddress}/trades`, {
        params: params as Record<string, string | number | boolean | undefined>,
      }),

    price: (tokenAddress: string) => fetchApi<ApiResponse<TokenPrice>>(`/tokens/${tokenAddress}/price`),
  },

  reputation: {
    summary: (agentId: string) => fetchApi<ApiResponse<ReputationSummary>>(`/reputation/${agentId}`),

    feedback: (agentId: string, params?: { limit?: number; offset?: number }) =>
      fetchApi<PaginatedResponse<FeedbackItem>>(`/reputation/${agentId}/feedback`, {
        params: params as Record<string, string | number | boolean | undefined>,
      }),
  },

  revenue: {
    events: (agentId: string, params?: { limit?: number; offset?: number }) =>
      fetchApi<PaginatedResponse<RevenueEvent>>(`/revenue/${agentId}`, {
        params: params as Record<string, string | number | boolean | undefined>,
      }),
  },

  activity: {
    feed: (params?: { limit?: number }) =>
      fetchApi<ApiResponse<ActivityEvent[]>>('/activity', {
        params: params as Record<string, string | number | boolean | undefined>,
      }),
  },

  nadfun: {
    uploadImage: (file: File) => {
      const formData = new FormData()
      formData.append('image', file)
      return fetchApi<ApiResponse<{ url: string }>>('/nadfun/upload-image', {
        method: 'POST',
        body: formData,
      })
    },

    createMetadata: (body: {
      name: string
      symbol: string
      description: string
      image: string
      twitter?: string
      telegram?: string
      website?: string
    }) => fetchApi<ApiResponse<{ url: string }>>('/nadfun/create-metadata', { method: 'POST', body }),

    getSalt: (body: { name: string; symbol: string; deployer: string; tokenURI: string }) =>
      fetchApi<ApiResponse<{ salt: string; token: string }>>('/nadfun/get-salt', { method: 'POST', body }),
  },
}
