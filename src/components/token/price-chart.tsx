import { useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, AreaSeries, type IChartApi } from 'lightweight-charts'
import { formatEther } from 'viem'
import type { TokenTrade } from '@/types/token'

interface PriceChartProps {
  trades: TokenTrade[]
}

interface ChartPoint {
  time: number
  value: number
}

export function PriceChart({ trades }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const data = useMemo<ChartPoint[]>(() => {
    if (!trades.length) return []

    const sorted = [...trades].sort(
      (a, b) => Number(a.blockTimestamp) - Number(b.blockTimestamp),
    )

    const TOTAL_SUPPLY = 1_000_000_000 // nad.fun token total supply
    const points: ChartPoint[] = []
    for (const t of sorted) {
      const mon = Number(formatEther(BigInt(t.monAmount)))
      const tokens = Number(formatEther(BigInt(t.tokenAmount)))
      if (tokens === 0) continue
      const price = mon / tokens
      const mcap = price * TOTAL_SUPPLY
      const time = Number(t.blockTimestamp)
      points.push({ time, value: mcap })
    }

    // Deduplicate timestamps (lightweight-charts requires unique times)
    const seen = new Set<number>()
    return points.filter((p) => {
      if (seen.has(p.time)) return false
      seen.add(p.time)
      return true
    })
  }, [trades])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#888',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(110,84,255,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(110,84,255,0.3)', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      handleScroll: { vertTouchDrag: false },
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#6E54FF',
      lineWidth: 2,
      topColor: 'rgba(110,84,255,0.4)',
      bottomColor: 'rgba(110,84,255,0.0)',
      crosshairMarkerBackgroundColor: '#6E54FF',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    if (data.length > 0) {
      areaSeries.setData(data as any)
      chart.timeScale().fitContent()
    }

    chartRef.current = chart

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        chart.applyOptions({ width })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [data])

  if (data.length < 2) {
    return (
      <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground border border-border/30">
        Not enough trades to display chart
      </div>
    )
  }

  return <div ref={containerRef} className="h-[300px] w-full" />
}
