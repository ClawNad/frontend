export interface TokenTrade {
  id: string
  tokenAddress: string
  trader: string
  tradeType: 'buy' | 'sell'
  monAmount: string
  tokenAmount: string
  blockNumber: string
  txHash: string
  blockTimestamp: string
}

export interface TokenPrice {
  tokenAddress: string
  priceInMon: string
  marketCap: string
  progress: number
  graduated: boolean
  reserves: {
    realMon: string
    realToken: string
    virtualMon: string
    virtualToken: string
  }
}
