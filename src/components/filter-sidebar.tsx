import { useState } from 'react'
import { Search, ChevronDown, Heart, X } from 'lucide-react'

export interface CategoryItem {
  id: string
  label: string
  count: number
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', count: 83 },
  { id: 'ai', label: 'AI/ML', count: 12 },
  { id: 'dev', label: 'Developer Tools', count: 8 },
  { id: 'defi', label: 'DeFi', count: 15 },
  { id: 'nft', label: 'NFT', count: 6 },
  { id: 'art', label: 'Art', count: 9 },
  { id: 'data', label: 'Data', count: 7 },
  { id: 'tech', label: 'Tech Trends', count: 11 },
  { id: 'finance', label: 'Finance', count: 5 },
  { id: 'security', label: 'Security', count: 4 },
  { id: 'gaming', label: 'Gaming', count: 6 },
]

const STATUS_OPTIONS = ['All Status', 'Live', 'Ended', 'Upcoming']

export interface FilterSidebarProps {
  categories?: CategoryItem[]
  selectedCategoryId?: string
  onCategoryChange?: (id: string) => void
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  onStatusChange?: (value: string) => void
  onFavoritesClick?: () => void
  /** When provided, sidebar is in drawer mode; show close button and call on close */
  onClose?: () => void
}

export function FilterSidebar({
  categories = DEFAULT_CATEGORIES,
  selectedCategoryId = 'all',
  onCategoryChange,
  searchPlaceholder = 'Search agents...',
  onSearchChange,
  onStatusChange,
  onFavoritesClick,
  onClose,
}: FilterSidebarProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(STATUS_OPTIONS[0])
  const [statusOpen, setStatusOpen] = useState(false)
  const [favorites, setFavorites] = useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearch(v)
    onSearchChange?.(v)
  }

  const handleStatusSelect = (option: string) => {
    setStatus(option)
    setStatusOpen(false)
    onStatusChange?.(option)
  }

  const handleFavorites = () => {
    setFavorites((x) => !x)
    onFavoritesClick?.()
  }

  return (
    <aside className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col border-r border-border bg-background h-full overflow-y-auto">
      <div className="p-4 space-y-4 sticky top-0">
        {/* Drawer mode: close button */}
        {onClose != null && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Filters</span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-muted-foreground hover:text-foreground outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={handleSearch}
            className="w-full h-10 pl-9 pr-3 bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((o) => !o)}
            className="w-full h-10 px-3 flex items-center justify-between bg-muted/50 border border-border text-foreground text-sm outline-none focus:border-primary transition-colors"
          >
            <span>
              Status: <span className="font-medium">{status}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusOpen && (
            <>
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border shadow-lg max-h-60 overflow-y-auto">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleStatusSelect(opt)}
                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div
                className="fixed inset-0 z-[5]"
                aria-hidden
                onClick={() => setStatusOpen(false)}
              />
            </>
          )}
        </div>

        {/* Favorites */}
        <button
          type="button"
          onClick={handleFavorites}
          className={`w-full h-10 px-3 flex items-center justify-center gap-2 bg-muted/50 border text-sm outline-none focus:border-primary transition-colors ${favorites ? 'border-primary text-primary' : 'border-border text-foreground'}`}
        >
          <Heart className={`w-4 h-4 ${favorites ? 'fill-primary' : ''}`} />
          Favorites
        </button>

        {/* Browse by Category */}
        <div className="pt-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Browse by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange?.(cat.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border transition-colors ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted/50 border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`min-w-[1.25rem] px-1.5 py-0.5 text-xs ${
                      isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
