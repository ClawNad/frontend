import { useState } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

export interface CategoryItem {
  id: string
  label: string
  count: number
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'launchedAt', label: 'Recently Launched', count: 0 },
  { id: 'totalRevenue', label: 'Revenue', count: 0 },
  { id: 'totalFeedback', label: 'Most Rated', count: 0 },
  { id: 'agentId', label: 'Agent ID', count: 0 },
]

const DEFAULT_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
]

export interface FilterSidebarProps {
  categories?: CategoryItem[]
  selectedCategoryId?: string
  onCategoryChange?: (id: string) => void
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  statusOptions?: { value: string; label: string }[]
  onStatusChange?: (value: string) => void
  onClose?: () => void
}

export function FilterSidebar({
  categories = DEFAULT_CATEGORIES,
  selectedCategoryId = 'launchedAt',
  onCategoryChange,
  searchPlaceholder = 'Search agents...',
  onSearchChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  onStatusChange,
  onClose,
}: FilterSidebarProps) {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]?.value ?? '')
  const [statusOpen, setStatusOpen] = useState(false)

  const currentStatusLabel = statusOptions.find((o) => o.value === selectedStatus)?.label ?? 'All'

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearch(v)
    onSearchChange?.(v)
  }

  const handleStatusSelect = (value: string) => {
    setSelectedStatus(value)
    setStatusOpen(false)
    onStatusChange?.(value)
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
              Status: <span className="font-medium">{currentStatusLabel}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusOpen && (
            <>
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border shadow-lg max-h-60 overflow-y-auto">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusSelect(opt.value)}
                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="fixed inset-0 z-[5]" aria-hidden onClick={() => setStatusOpen(false)} />
            </>
          )}
        </div>

        {/* Sort by */}
        <div className="pt-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Sort By</h3>
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
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
