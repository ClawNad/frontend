import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/shared/star-rating'
import { CONTRACTS, agentRatingAbi } from '@/lib/contracts'

interface RatingModalProps {
  open: boolean
  onClose: () => void
  agentId: string
}

const TAG_OPTIONS = ['accurate', 'fast', 'reliable', 'creative', 'helpful', 'thorough']
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

export function RatingModal({ open, onClose, agentId }: RatingModalProps) {
  const { address: userAddress } = useAccount()
  const queryClient = useQueryClient()

  const [rating, setRating] = useState(0)
  const [tag1, setTag1] = useState('')
  const [tag2, setTag2] = useState('')

  const { writeContract, data: txHash, reset: resetTx, error: txError } = useWriteContract()
  const { isSuccess: txConfirmed, isLoading: txConfirming } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (txConfirmed) {
      toast.success('Rating submitted!')
      queryClient.invalidateQueries({ queryKey: ['reputation', agentId] })
      queryClient.invalidateQueries({ queryKey: ['feedback', agentId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      resetTx()
      handleClose()
    }
  }, [txConfirmed])

  useEffect(() => {
    if (txError) {
      const msg = txError.message.includes('User rejected')
        ? 'Transaction cancelled'
        : txError.message.slice(0, 100)
      toast.error(msg)
      resetTx()
    }
  }, [txError])

  function handleClose() {
    setRating(0)
    setTag1('')
    setTag2('')
    onClose()
  }

  function handleSubmit() {
    if (!userAddress || rating === 0 || !tag1) return

    // Score: 1-5 stars → 100-500 on-chain (2 decimal precision: 100 = 1.00, 500 = 5.00)
    const score = BigInt(rating * 100)

    writeContract({
      address: CONTRACTS.agentRating,
      abi: agentRatingAbi,
      functionName: 'rateAgent',
      args: [BigInt(agentId), score, tag1, tag2 || '', '', ZERO_BYTES32],
    })
  }

  if (!open) return null

  const isSubmitting = !!txHash && !txConfirmed

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/60" aria-hidden onClick={handleClose} />
      <div className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Rate Agent #{agentId}</h2>
          <button type="button" onClick={handleClose} className="p-2 -m-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Star selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Rating *</label>
            <StarRating rating={rating} size="lg" interactive onRate={setRating} />
            {rating > 0 && <p className="text-xs text-muted-foreground mt-1">{rating} / 5 stars</p>}
          </div>

          {/* Tag 1 selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Primary Tag *</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTag1(tag)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    tag1 === tag
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted/50 border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Tag 2 (optional) */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Secondary Tag (optional)</label>
            <input
              type="text"
              value={tag2}
              onChange={(e) => setTag2(e.target.value)}
              placeholder="e.g. well-documented"
              className="w-full h-10 px-3 bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Submit */}
          {!userAddress ? (
            <p className="text-xs text-center text-muted-foreground py-2">Connect wallet to rate</p>
          ) : (
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={rating === 0 || !tag1 || isSubmitting || txConfirming}
            >
              {isSubmitting || txConfirming ? 'Submitting...' : 'Submit Rating'}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
