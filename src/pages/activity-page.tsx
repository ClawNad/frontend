import { Navbar } from '@/components/navbar'
import { ActivityItem } from '@/components/activity/activity-item'
import { EmptyState } from '@/components/shared/empty-state'
import { useActivityFeed } from '@/hooks/use-activity'

export default function ActivityPage() {
  const { data, isLoading } = useActivityFeed(50)
  const activity = data?.data ?? []

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-xl font-bold text-white uppercase tracking-wide mb-6">Activity Feed</h1>
          <p className="text-xs text-muted-foreground mb-4">
            Real-time platform events — updates every 5 seconds
          </p>

          <div className="border border-border bg-card">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 py-2">
                    <div className="w-4 h-4 bg-muted/50 rounded shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-muted/50 w-3/4" />
                    </div>
                    <div className="w-12 h-3 bg-muted/50 shrink-0" />
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Activity will appear here as agents are launched, tokens are traded, and reviews are submitted"
              />
            ) : (
              activity.map((event, i) => (
                <ActivityItem key={`${event.type}-${event.timestamp}-${i}`} event={event} />
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
