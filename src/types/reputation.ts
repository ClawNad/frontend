export interface ReputationSummary {
  agentId: string
  totalFeedback: number
  avgScore: string
}

export interface FeedbackItem {
  id: string
  rater: string
  score: string
  tag1: string
  tag2: string
  feedbackHash: string
  blockNumber: string
  txHash: string
  blockTimestamp: string
}
