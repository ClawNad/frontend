import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Navbar } from '../components/navbar'
import { AuctionCard } from '../components/auction-card'
import { FilterSidebar } from '../components/filter-sidebar'

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1676299085922-a816e6b32b6e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
]

const AUCTION_CARDS: Array<{
  title: string
  tags: string[]
  progress: number
  fullPrice: string
  startFrom: number
  startFromTotal: number
  badge: string
  statusLabel: string
  statusSubtext: string
  description: string
  typeTag: string
  endTime: string
  footerBadge?: string
}> = [
  { title: 'Neural Canvas #042', tags: ['AI', 'Art'], progress: 72, fullPrice: '0.25 ETH', startFrom: 18, startFromTotal: 25, badge: 'Live', statusLabel: 'Live', statusSubtext: '2h left', description: 'AI-generated art drop. Real-time natural events from neural canvas — collectibles, auctions.', typeTag: 'AUCTION', endTime: 'Ends in 2h', footerBadge: '8004' },
  { title: 'Code Genesis', tags: ['Dev', 'NFT'], progress: 45, fullPrice: '120 USDC', startFrom: 9, startFromTotal: 20, badge: 'New', statusLabel: 'Live', statusSubtext: '5h left', description: 'Developer NFT collection. Code-based assets and utility.', typeTag: 'AUCTION', endTime: 'Ends in 5h', footerBadge: '8005' },
  { title: 'Agent Protocol', tags: ['AI', 'Agent'], progress: 88, fullPrice: '0.5 ETH', startFrom: 44, startFromTotal: 50, badge: 'Hot', statusLabel: 'Live', statusSubtext: '45m left', description: 'Agent protocol access. AI/ML endpoints and rate limits.', typeTag: 'FIXED', endTime: '60/min · 10 burst', footerBadge: '8006' },
  { title: 'Monad Node', tags: ['L1', 'Node'], progress: 30, fullPrice: '89 USDC', startFrom: 3, startFromTotal: 10, badge: 'Soon', statusLabel: 'Upcoming', statusSubtext: 'Starts in 1d', description: 'Monad L1 node slot. Run a validator node.', typeTag: 'AUCTION', endTime: 'Starts in 1d' },
  { title: 'Chip Series Alpha', tags: ['Hardware'], progress: 100, fullPrice: '200 USDC', startFrom: 100, startFromTotal: 100, badge: 'Done', statusLabel: 'Ended', statusSubtext: 'Sold out', description: 'Hardware chip series. Limited alpha run.', typeTag: 'FIXED', endTime: '—' },
  { title: 'Data Stream #77', tags: ['Data', 'AI'], progress: 55, fullPrice: '75 USDC', startFrom: 11, startFromTotal: 20, badge: 'Live', statusLabel: 'Live', statusSubtext: '8h left', description: 'Data stream access. Real-time events and APIs.', typeTag: 'AUCTION', endTime: 'Ends in 8h' },
  { title: 'Model Weights v2', tags: ['ML', 'AI'], progress: 12, fullPrice: '1.2 ETH', startFrom: 1, startFromTotal: 8, badge: 'Early', statusLabel: 'Live', statusSubtext: '3d left', description: 'ML model weights. Inference and fine-tuning.', typeTag: 'AUCTION', endTime: 'Ends in 3d' },
  { title: 'Digital Mesh', tags: ['3D', 'Art'], progress: 66, fullPrice: '45 USDC', startFrom: 33, startFromTotal: 50, badge: 'Live', statusLabel: 'Live', statusSubtext: '12h left', description: '3D digital art. Meshes and collectibles.', typeTag: 'AUCTION', endTime: 'Ends in 12h' },
  { title: 'Smart Contract Pack', tags: ['Solidity', 'Dev'], progress: 40, fullPrice: '180 USDC', startFrom: 4, startFromTotal: 10, badge: 'New', statusLabel: 'Live', statusSubtext: '1d left', description: 'Solidity templates and dev tools.', typeTag: 'FIXED', endTime: 'Ends in 1d' },
  { title: 'Dev Workspace', tags: ['Code', 'Tool'], progress: 90, fullPrice: '55 USDC', startFrom: 45, startFromTotal: 50, badge: 'Hot', statusLabel: 'Live', statusSubtext: '30m left', description: 'Developer workspace access. IDE and tooling.', typeTag: 'AUCTION', endTime: 'Ends in 30m' },
]

export default function AgentPage() {
  const [categoryId, setCategoryId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const filteredCards = AUCTION_CARDS.filter((card) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return card.title.toLowerCase().includes(q) || card.tags.some((t) => t.toLowerCase().includes(q))
  })

  return (
    <>
      <Navbar />
      <main className="flex w-full min-w-0 h-screen">
        <div className="hidden lg:block shrink-0">
          <FilterSidebar
            selectedCategoryId={categoryId}
            onCategoryChange={setCategoryId}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-custom">
            <div className="w-full min-w-0 px-4 sm:px-6 pt-6 pb-8">
              <div className="flex items-center justify-between gap-4 mb-4 lg:hidden">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Browse</h2>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="inline-flex items-center gap-2 h-10 px-3 bg-muted/50 border border-border text-foreground text-sm font-medium outline-none focus:border-primary transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full min-w-0">
                {filteredCards.map((card, i) => (
                  <AuctionCard
                    key={i}
                    imageSrc={UNSPLASH_IMAGES[AUCTION_CARDS.indexOf(card)]}
                    imageAlt={card.title}
                    imageBadge={card.badge}
                    title={card.title}
                    statusLabel={card.statusLabel}
                    statusSubtext={card.statusSubtext}
                    description={card.description}
                    typeTag={card.typeTag}
                    endTime={card.endTime}
                    tags={card.tags}
                    progressPercent={card.progress}
                    progressLabel="Progress"
                    progressValue={`${card.progress}%`}
                    fullPrice={card.fullPrice}
                    startFrom={card.startFrom}
                    startFromTotal={card.startFromTotal}
                    footerBadge={card.footerBadge}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {filterOpen && (
        <>
          <div
            className="fixed inset-0 z-[999] bg-black/50"
            aria-hidden
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[1000] w-[280px] max-w-[85vw] bg-background border-r border-border shadow-lg flex flex-col">
            <FilterSidebar
              selectedCategoryId={categoryId}
              onCategoryChange={setCategoryId}
              onSearchChange={setSearchQuery}
              onClose={() => setFilterOpen(false)}
            />
          </div>
        </>
      )}
    </>
  )
}
