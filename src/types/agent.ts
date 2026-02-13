import type { TokenTrade } from './token'
import type { FeedbackItem } from './reputation'
import type { RevenueEvent } from './revenue'

export interface Agent {
  id: string
  agentId: string
  tokenAddress: string
  creator: string
  agentWallet: string
  agentURI: string
  endpoint: string
  tokenName: string | null
  tokenSymbol: string | null
  active: boolean
  launchedAt: string
  blockNumber: string
  txHash: string
  totalRevenue: string
  totalFeedback: number
  totalScore: string
  tokenGraduated: boolean
}

export interface AgentDetail extends Agent {
  trades: TokenTrade[]
  feedback: FeedbackItem[]
  revenueEvents: RevenueEvent[]
}
