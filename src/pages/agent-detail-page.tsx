import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { AgentHeader } from '@/components/agent/agent-header'
import { OverviewTab } from '@/components/agent/overview-tab'
import { TryAgentTab } from '@/components/agent/try-agent-tab'
import { TokenTab } from '@/components/token/token-tab'
import { ReputationTab } from '@/components/reputation/reputation-tab'
import { RevenueTab } from '@/components/revenue/revenue-tab'
import { AgentDetailSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useAgent } from '@/hooks/use-agents'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'try' | 'token' | 'reputation' | 'revenue'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'try', label: 'Try Agent' },
  { id: 'token', label: 'Token' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'revenue', label: 'Revenue' },
]

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const { data, isLoading, error } = useAgent(agentId!)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const agent = data?.data

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {isLoading ? (
          <AgentDetailSkeleton />
        ) : error || !agent ? (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <EmptyState
              title="Agent not found"
              description={`No agent found with ID ${agentId}`}
            />
            <div className="text-center mt-4">
              <Link to="/agents" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to agents
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Back link */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
              <Link to="/agents" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3 h-3" />
                Back to agents
              </Link>
            </div>

            <AgentHeader agent={agent} />

            {/* Tab bar */}
            <div className="border-b border-border bg-background sticky top-[60px] z-[10]">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
              {activeTab === 'overview' && <OverviewTab agent={agent} />}
              {activeTab === 'try' && <TryAgentTab agent={agent} />}
              {activeTab === 'token' && <TokenTab agent={agent} />}
              {activeTab === 'reputation' && <ReputationTab agentId={agent.agentId} />}
              {activeTab === 'revenue' && <RevenueTab agentId={agent.agentId} />}
            </div>
          </>
        )}
      </main>
    </>
  )
}
