import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { AgentCard } from '@/components/agent/agent-card'
import { AgentCardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { AddressDisplay } from '@/components/shared/address-display'
import { useAgents } from '@/hooks/use-agents'

export default function CreatorPage() {
  const { address } = useParams<{ address: string }>()
  const { data, isLoading } = useAgents({ creator: address })

  const agents = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Link to="/agents" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors mb-6">
            <ArrowLeft className="w-3 h-3" />
            Back to agents
          </Link>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-white uppercase tracking-wide mb-2">Creator Profile</h1>
            <div className="flex items-center gap-3 text-sm">
              <AddressDisplay address={address || ''} showCopy showExplorer />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {total} agent{total !== 1 ? 's' : ''} launched
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AgentCardSkeleton key={i} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <EmptyState title="No agents found" description="This address hasn't launched any agents yet" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.agentId} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
