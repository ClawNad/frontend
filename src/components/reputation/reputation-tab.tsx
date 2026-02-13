import { useState } from 'react'
import { Star } from 'lucide-react'
import { useReputation, useFeedback } from '@/hooks/use-reputation'
import { scoreToStars, truncateAddress, timeAgo } from '@/lib/format'
import { StarRating } from '@/components/shared/star-rating'
import { TagBadge } from '@/components/shared/tag-badge'
import { TxHashLink } from '@/components/shared/tx-hash-link'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { RatingModal } from './rating-modal'

interface ReputationTabProps {
  agentId: string
}

export function ReputationTab({ agentId }: ReputationTabProps) {
  const { data: repData, isLoading: repLoading } = useReputation(agentId)
  const { data: feedbackData, isLoading: fbLoading } = useFeedback(agentId, { limit: 20 })
  const [ratingModalOpen, setRatingModalOpen] = useState(false)

  const rep = repData?.data
  const feedback = feedbackData?.data ?? []

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          Score Overview
        </h3>
        {repLoading ? (
          <Skeleton className="h-16 w-64" />
        ) : rep ? (
          <div className="flex items-center gap-4">
            <StarRating rating={scoreToStars(rep.avgScore)} size="lg" showValue />
            <span className="text-xs text-muted-foreground">({rep.totalFeedback} ratings)</span>
            <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={() => setRatingModalOpen(true)}>
              <Star className="w-3 h-3 mr-1" />
              Rate Agent
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">No ratings yet</p>
            <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={() => setRatingModalOpen(true)}>
              <Star className="w-3 h-3 mr-1" />
              Be the first to rate
            </Button>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          Reviews
        </h3>
        {fbLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <EmptyState title="No reviews yet" description="Rate this agent to be the first reviewer" />
        ) : (
          <div className="space-y-3">
            {feedback.map((fb) => (
              <div key={fb.id} className="border border-border/50 bg-muted/10 p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {truncateAddress(fb.rater)}
                  </span>
                  <StarRating rating={scoreToStars(fb.score)} size="sm" />
                  {fb.tag1 && <TagBadge tag={fb.tag1} variant="primary" />}
                  {fb.tag2 && <TagBadge tag={fb.tag2} />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{timeAgo(fb.blockTimestamp)}</span>
                  <TxHashLink hash={fb.txHash} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <RatingModal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        agentId={agentId}
      />
    </div>
  )
}
