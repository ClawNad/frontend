import { formatEther } from 'viem'

/** Format a wei string to human-readable with N decimal places */
export function formatMon(wei: string, decimals = 2): string {
  if (!wei || wei === '0') return '0'
  return Number(formatEther(BigInt(wei))).toFixed(decimals)
}

/** Format large token amounts (wei) to compact form: 150K, 1.2M */
export function formatTokenAmount(wei: string): string {
  if (!wei || wei === '0') return '0'
  const num = Number(formatEther(BigInt(wei)))
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  if (num >= 1) return num.toFixed(2)
  return num.toFixed(6)
}

/** Format a number compactly: 1.2K, 25K, 1.5M */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}

/** Truncate an address to 0xAb12...3f4d */
export function truncateAddress(address: string, startLen = 6, endLen = 4): string {
  if (!address) return ''
  if (address.length <= startLen + endLen + 2) return address
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`
}

/** Convert unix timestamp string to relative time */
export function timeAgo(timestamp: string): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - Number(timestamp)
  if (diff < 0) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/** Reputation score (100-500) to stars (1.0-5.0) */
export function scoreToStars(score: string | number): number {
  const n = Number(score)
  if (n === 0) return 0
  return n / 100
}

/** Bonding progress from on-chain (0 to 1e18) to percentage (0-100) */
export function progressToPercent(progress: bigint): number {
  return Number(progress) / 1e16
}

/** Explorer link for address or tx */
export function explorerUrl(type: 'address' | 'tx', value: string): string {
  const base = import.meta.env.VITE_EXPLORER_URL || 'https://monadscan.com'
  return `${base}/${type}/${value}`
}

/** Display token name with null fallback */
export function displayTokenName(name: string | null, symbol: string | null, agentId: string): string {
  if (name) return name
  if (symbol) return symbol
  return `Agent #${agentId}`
}

/** Format USD-like value */
export function formatUsd(value: string | number, decimals = 2): string {
  const n = Number(value)
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(decimals)}`
}
