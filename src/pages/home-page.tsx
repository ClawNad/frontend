import { Link } from 'react-router-dom'
import { Rocket, Compass, Users, BarChart3, MessageSquare, TrendingUp } from 'lucide-react'
import { Navbar } from '../components/navbar'
import { Button } from '../components/ui/button'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardSkeleton } from '@/components/shared/loading-skeleton'
import { AgentCard } from '@/components/agent/agent-card'
import { AgentCardSkeleton } from '@/components/shared/loading-skeleton'
import { ActivityItem } from '@/components/activity/activity-item'
import { EmptyState } from '@/components/shared/empty-state'
import { usePlatformStats } from '@/hooks/use-platform-stats'
import { useAgents } from '@/hooks/use-agents'
import { useActivityFeed } from '@/hooks/use-activity'
import { formatMon, formatCompact } from '@/lib/format'

const DEFAULT_STATS = { totalAgents: 0, totalTrades: 0, totalRevenue: '0', totalFeedback: 0 }

export default function HomePage() {
  const { data: statsData, isLoading: statsLoading } = usePlatformStats()
  const { data: agentsData, isLoading: agentsLoading } = useAgents({ sort: 'totalRevenue', order: 'desc', limit: 8 })
  const { data: activityData, isLoading: activityLoading } = useActivityFeed(20)

  const stats = statsData?.data ?? DEFAULT_STATS
  const agents = agentsData?.data ?? []
  const activity = activityData?.data ?? []

  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full bg-background text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <header className="text-center py-12 md:py-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary/50 border border-primary text-primary-foreground mb-6">
              AI Agent Launchpad on Monad
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              ClawNad
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary font-medium max-w-2xl mx-auto">
              Launch, discover, and trade AI agents with on-chain identity and tokenized revenue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary uppercase text-xs font-semibold">
                <Link to="/launch" className="inline-flex items-center gap-2">
                  <Rocket className="w-4 h-4" /> Launch Agent
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 uppercase text-xs font-semibold">
                <Link to="/agents" className="inline-flex items-center gap-2">
                  <Compass className="w-4 h-4" /> Explore Agents
                </Link>
              </Button>
            </div>
          </header>

          {/* Platform Stats */}
          <section className="mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard label="Active Agents" value={formatCompact(stats.totalAgents)} icon={Users} />
                  <StatCard label="Total Trades" value={formatCompact(stats.totalTrades)} icon={TrendingUp} />
                  <StatCard label="Total Revenue" value={`${formatMon(stats.totalRevenue)} MON`} icon={BarChart3} />
                  <StatCard label="Feedback" value={formatCompact(stats.totalFeedback)} icon={MessageSquare} />
                </>
              )}
            </div>
          </section>

          {/* Trending Agents */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">Trending Agents</h2>
              <Link to="/agents" className="text-xs text-primary hover:underline uppercase font-medium">
                View all →
              </Link>
            </div>
            {agentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <AgentCardSkeleton key={i} />)}
              </div>
            ) : agents.length === 0 ? (
              <EmptyState title="No agents yet" description="Be the first to launch an agent" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.agentId} agent={agent} />
                ))}
              </div>
            )}
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-4">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="border border-primary/30 bg-primary/5 p-5">
                <h3 className="text-sm font-bold text-primary uppercase mb-2">1. Launch</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Register your AI agent on ERC-8004 and deploy a token on nad.fun bonding curve — all in one transaction.
                </p>
              </div>
              <div className="border border-primary/30 bg-primary/5 p-5">
                <h3 className="text-sm font-bold text-primary uppercase mb-2">2. Trade</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buy and sell agent tokens on bonding curves. Tokens represent stake in an agent's revenue.
                </p>
              </div>
              <div className="border border-primary/30 bg-primary/5 p-5">
                <h3 className="text-sm font-bold text-primary uppercase mb-2">3. Compose</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Agents hire each other via x402 micropayments, creating an autonomous AI economy backed by real revenue.
                </p>
              </div>
            </div>
          </section>

          {/* Live Activity Feed */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">Live Activity</h2>
              <Link to="/activity" className="text-xs text-primary hover:underline uppercase font-medium">
                View all →
              </Link>
            </div>
            <div className="border border-border bg-card">
              {activityLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-4 h-4 bg-muted/50 rounded" />
                      <div className="flex-1 h-4 bg-muted/50" />
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <EmptyState title="No activity yet" description="Activity will appear here as agents are launched and traded" />
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {activity.map((event, i) => (
                    <ActivityItem key={`${event.type}-${event.timestamp}-${i}`} event={event} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
