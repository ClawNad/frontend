import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CONTRACTS, bondingCurveRouterAbi, erc20Abi } from '@/lib/contracts'
import { useBuyQuote, useSellQuote, useTokenBalance, useTokenAllowance } from '@/hooks/use-token'
import { formatTokenAmount, formatMon } from '@/lib/format'

interface TradeWidgetProps {
  tokenAddress: string
  tokenSymbol: string | null
  agentId: string
}

type TradeMode = 'buy' | 'sell'
type TxStep = 'idle' | 'approve' | 'trade' | 'confirming'

export function TradeWidget({ tokenAddress, tokenSymbol, agentId }: TradeWidgetProps) {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()
  const symbol = tokenSymbol ?? 'TOKEN'

  const [mode, setMode] = useState<TradeMode>('buy')
  const [amount, setAmount] = useState('')
  const [debouncedAmount, setDebouncedAmount] = useState('')
  const [txStep, setTxStep] = useState<TxStep>('idle')

  // Debounce amount input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amount), 300)
    return () => clearTimeout(timer)
  }, [amount])

  // Quotes
  const { data: buyQuote } = useBuyQuote(mode === 'buy' ? tokenAddress : null, debouncedAmount)
  const { data: sellQuote } = useSellQuote(mode === 'sell' ? tokenAddress : null, debouncedAmount)

  // User balance
  const { data: tokenBalance } = useTokenBalance(tokenAddress, userAddress)
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(
    mode === 'sell' ? tokenAddress : null,
    userAddress,
    CONTRACTS.bondingCurveRouter,
  )

  // Write contract
  const { writeContract, data: txHash, reset: resetTx, error: txError } = useWriteContract()
  const { isSuccess: txConfirmed, isLoading: txConfirming } = useWaitForTransactionReceipt({ hash: txHash })

  // Handle tx confirmation
  useEffect(() => {
    if (txConfirmed) {
      if (txStep === 'approve') {
        // Approval confirmed, now do the sell
        setTxStep('trade')
        refetchAllowance()
        executeSell()
      } else {
        // Trade confirmed
        setTxStep('idle')
        setAmount('')
        toast.success(`${mode === 'buy' ? 'Buy' : 'Sell'} successful!`)
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['token-price', tokenAddress] })
        queryClient.invalidateQueries({ queryKey: ['token-trades', tokenAddress] })
        queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
        queryClient.invalidateQueries({ queryKey: ['activity'] })
        resetTx()
      }
    }
  }, [txConfirmed])

  // Handle tx error
  useEffect(() => {
    if (txError) {
      setTxStep('idle')
      const msg = txError.message.includes('User rejected')
        ? 'Transaction cancelled'
        : txError.message.slice(0, 100)
      toast.error(msg)
      resetTx()
    }
  }, [txError])

  function handleBuy() {
    if (!userAddress || !amount || Number(amount) <= 0) return
    setTxStep('trade')

    const minOut = buyQuote ? (buyQuote * 95n) / 100n : 0n // 5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300) // 5 minutes

    writeContract({
      address: CONTRACTS.bondingCurveRouter,
      abi: bondingCurveRouterAbi,
      functionName: 'buy',
      args: [{
        amountOutMin: minOut,
        token: tokenAddress as `0x${string}`,
        to: userAddress,
        deadline,
      }],
      value: parseEther(amount),
    })
  }

  function executeSell() {
    if (!userAddress || !amount || Number(amount) <= 0) return

    const sellAmount = parseEther(amount)
    const minMonOut = sellQuote ? (sellQuote * 95n) / 100n : 0n // 5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300) // 5 minutes

    writeContract({
      address: CONTRACTS.bondingCurveRouter,
      abi: bondingCurveRouterAbi,
      functionName: 'sell',
      args: [{
        amountIn: sellAmount,
        amountOutMin: minMonOut,
        token: tokenAddress as `0x${string}`,
        to: userAddress,
        deadline,
      }],
    })
  }

  function handleSell() {
    if (!userAddress || !amount || Number(amount) <= 0) return

    const sellAmount = parseEther(amount)

    // Check if approval needed
    if (allowance !== undefined && allowance < sellAmount) {
      setTxStep('approve')
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACTS.bondingCurveRouter, sellAmount],
      })
    } else {
      setTxStep('trade')
      executeSell()
    }
  }

  const quote = mode === 'buy' ? buyQuote : sellQuote
  const isProcessing = txStep !== 'idle' || txConfirming
  const balanceDisplay = tokenBalance ? formatTokenAmount(tokenBalance.toString()) : '0'

  return (
    <div className="border border-border bg-card p-4 space-y-4">
      {/* Buy/Sell toggle */}
      <div className="flex gap-1 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => { setMode('buy'); setAmount(''); resetTx(); setTxStep('idle') }}
          className={cn(
            'flex-1 py-2 text-xs font-bold uppercase transition-colors',
            mode === 'buy' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:text-white',
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => { setMode('sell'); setAmount(''); resetTx(); setTxStep('idle') }}
          className={cn(
            'flex-1 py-2 text-xs font-bold uppercase transition-colors',
            mode === 'sell' ? 'bg-red-500 text-white' : 'text-muted-foreground hover:text-white',
          )}
        >
          Sell
        </button>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          {mode === 'buy' ? 'Amount (MON)' : `Amount (${symbol})`}
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full h-10 px-3 bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          disabled={isProcessing}
        />
        {mode === 'sell' && userAddress && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              Balance: {balanceDisplay} {symbol}
            </span>
            {tokenBalance && tokenBalance > 0n && (
              <button
                type="button"
                onClick={() => setAmount(formatEther(tokenBalance))}
                className="text-[10px] text-primary hover:underline"
              >
                Max
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quote display */}
      {quote !== undefined && Number(amount) > 0 && (
        <div className="border border-border/50 bg-muted/20 p-3 text-xs">
          <p className="text-muted-foreground">You receive (est.):</p>
          <p className="text-white font-medium mt-0.5">
            {mode === 'buy'
              ? `~${formatTokenAmount(quote.toString())} ${symbol}`
              : `~${formatMon(quote.toString(), 4)} MON`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">5% max slippage</p>
        </div>
      )}

      {/* Submit button */}
      {!userAddress ? (
        <p className="text-xs text-center text-muted-foreground py-2">Connect wallet to trade</p>
      ) : (
        <Button
          className="w-full"
          onClick={mode === 'buy' ? handleBuy : handleSell}
          disabled={isProcessing || !amount || Number(amount) <= 0}
        >
          {txStep === 'approve'
            ? 'Approving...'
            : txStep === 'trade' || txConfirming
              ? 'Confirming...'
              : mode === 'buy'
                ? `Buy ${symbol}`
                : `Sell ${symbol}`}
        </Button>
      )}
    </div>
  )
}
