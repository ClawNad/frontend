export interface RevenueEvent {
  id: string
  eventType: 'deposit' | 'distribute' | 'buyback'
  paymentToken: string
  amount: string
  agentShare: string | null
  buybackShare: string | null
  platformFee: string | null
  fromAddress: string
  toAddress: string | null
  blockNumber: string
  txHash: string
  blockTimestamp: string
}
