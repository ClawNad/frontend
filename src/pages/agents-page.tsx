import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Navbar } from '../components/navbar'
import { AgentCard } from '../components/agent/agent-card'
import { FilterSidebar } from '../components/filter-sidebar'
import { AgentCardSkeleton } from '../components/shared/loading-skeleton'
import { EmptyState } from '../components/shared/empty-state'
import { Button } from '../components/ui/button'
import { useAgents } from '@/hooks/use-agents'

const SORT_OPTIONS = [
  { value: 'launchedAt', label: 'Recently Launched' },
  { value: 'totalRevenue', label: 'Revenue' },
  { value: 'totalFeedback', label: 'Most Rated' },
  { value: 'agentId', label: 'Agent ID' },
]

export default function AgentsPage() {
  const [sort, setSort] = useState('launchedAt')
  const [order] = useState('desc')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const limit = 20

  const { data, isLoading } = useAgents({ limit, offset, sort, order, active: activeFilter })

  const agents = data?.data ?? []
  const pagination = data?.pagination

  const filtered = searchQuery.trim()
    ? agents.filter((a) => {
        const q = searchQuery.toLowerCase()
        return (
          (a.tokenName?.toLowerCase().includes(q)) ||
          (a.tokenSymbol?.toLowerCase().includes(q)) ||
          a.agentId.includes(q) ||
          a.creator.toLowerCase().includes(q)
        )
      })
    : agents

  return (
    <>
      <Navbar />
      <main className="flex w-full min-w-0 h-screen">
        <div className="hidden lg:block shrink-0">
          <FilterSidebar
            selectedCategoryId={sort}
            onCategoryChange={(id) => {
              setSort(id)
              setOffset(0)
            }}
            onSearchChange={setSearchQuery}
            categories={SORT_OPTIONS.map((o) => ({ id: o.value, label: o.label, count: 0 }))}
            statusOptions={[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
            ]}
            onStatusChange={(v) => {
              setActiveFilter(v === 'active' ? true : undefined)
              setOffset(0)
            }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-custom">
            <div className="w-full min-w-0 px-4 sm:px-6 pt-6 pb-8">
              <div className="flex items-center justify-between gap-4 mb-4 lg:hidden">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Browse Agents</h2>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="inline-flex items-center gap-2 h-10 px-3 bg-muted/50 border border-border text-foreground text-sm font-medium outline-none focus:border-primary transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <AgentCardSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No agents found"
                  description={searchQuery ? 'Try a different search term' : 'No agents have been launched yet'}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full min-w-0">
                    {filtered.map((agent) => (
                      <AgentCard key={agent.agentId} agent={agent} />
                    ))}
                  </div>

                  {pagination && (
                    <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground">
                      <span>
                        Showing {offset + 1}-{Math.min(offset + limit, pagination.total)} of {pagination.total}
                      </span>
                      <div className="flex gap-2">
                        {offset > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setOffset((o) => Math.max(0, o - limit))}>
                            Previous
                          </Button>
                        )}
                        {pagination.hasMore && (
                          <Button variant="outline" size="sm" onClick={() => setOffset((o) => o + limit)}>
                            Load More
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {filterOpen && (
        <>
          <div className="fixed inset-0 z-[999] bg-black/50" aria-hidden onClick={() => setFilterOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-[1000] w-[280px] max-w-[85vw] bg-background border-r border-border shadow-lg flex flex-col">
            <FilterSidebar
              selectedCategoryId={sort}
              onCategoryChange={(id) => {
                setSort(id)
                setOffset(0)
              }}
              onSearchChange={setSearchQuery}
              onClose={() => setFilterOpen(false)}
              categories={SORT_OPTIONS.map((o) => ({ id: o.value, label: o.label, count: 0 }))}
              statusOptions={[
                { value: '', label: 'All' },
                { value: 'active', label: 'Active' },
              ]}
              onStatusChange={(v) => {
                setActiveFilter(v === 'active' ? true : undefined)
                setOffset(0)
              }}
            />
          </div>
        </>
      )}
    </>
  )
}
