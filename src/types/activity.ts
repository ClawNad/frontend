export interface ActivityLaunch {
  type: 'launch'
  timestamp: string
  agentId: string
  tokenName: string
  tokenSymbol: string
  creator: string
  txHash: string
}

export interface ActivityTrade {
  type: 'trade'
  timestamp: string
  tradeType: 'buy' | 'sell'
  monAmount: string
  tokenAmount: string
  trader: string
  agent?: { agentId: string; tokenSymbol: string }
  txHash?: string
}

export interface ActivityFeedback {
  type: 'feedback'
  timestamp: string
  score: string
  tag1: string
  rater: string
  agent?: { agentId: string }
  txHash?: string
}

export type ActivityEvent = ActivityLaunch | ActivityTrade | ActivityFeedback
