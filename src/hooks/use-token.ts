import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { api } from '@/lib/api'
import { CONTRACTS, lensAbi, erc20Abi } from '@/lib/contracts'

export function useTokenPrice(tokenAddress: string | null) {
  return useQuery({
    queryKey: ['token-price', tokenAddress],
    queryFn: () => api.tokens.price(tokenAddress!),
    enabled: !!tokenAddress,
    refetchInterval: 10_000,
  })
}

export function useTokenTrades(tokenAddress: string | null, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['token-trades', tokenAddress, params],
    queryFn: () => api.tokens.trades(tokenAddress!, params),
    enabled: !!tokenAddress,
    refetchInterval: 10_000,
  })
}

// Lens.getAmountOut returns (address router, uint256 amountOut)
// We extract the amountOut (index 1) via select
export function useBuyQuote(tokenAddress: string | null, monAmount: string) {
  const enabled = !!tokenAddress && !!monAmount && Number(monAmount) > 0
  return useReadContract({
    address: CONTRACTS.lens,
    abi: lensAbi,
    functionName: 'getAmountOut',
    args: enabled ? [tokenAddress as `0x${string}`, parseEther(monAmount), true] : undefined,
    query: {
      enabled,
      select: (data) => (data as readonly [string, bigint])[1],
    },
  })
}

export function useSellQuote(tokenAddress: string | null, tokenAmount: string) {
  const enabled = !!tokenAddress && !!tokenAmount && Number(tokenAmount) > 0
  return useReadContract({
    address: CONTRACTS.lens,
    abi: lensAbi,
    functionName: 'getAmountOut',
    args: enabled ? [tokenAddress as `0x${string}`, parseEther(tokenAmount), false] : undefined,
    query: {
      enabled,
      select: (data) => (data as readonly [string, bigint])[1],
    },
  })
}

export function useBondingProgress(tokenAddress: string | null) {
  return useReadContract({
    address: CONTRACTS.lens,
    abi: lensAbi,
    functionName: 'getProgress',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 5_000,
    },
  })
}

export function useIsGraduated(tokenAddress: string | null) {
  return useReadContract({
    address: CONTRACTS.lens,
    abi: lensAbi,
    functionName: 'isGraduated',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress },
  })
}

export function useTokenBalance(tokenAddress: string | null, userAddress: string | undefined) {
  return useReadContract({
    address: tokenAddress as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress,
    },
  })
}

export function useTokenAllowance(tokenAddress: string | null, ownerAddress: string | undefined, spenderAddress: `0x${string}`) {
  return useReadContract({
    address: tokenAddress as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress as `0x${string}`, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!ownerAddress,
    },
  })
}
