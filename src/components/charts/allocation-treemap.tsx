'use client'

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'

interface TreemapDataItem {
  name: string
  ticker?: string
  value: number
  percent: number
  gainLossPercent?: number
  children?: TreemapDataItem[]
}

interface AllocationTreemapProps {
  data: TreemapDataItem[]
  height?: number
  className?: string
}

// Sophisticated dark palette — no garish reds/greens
const PALETTE = [
  '#1A73E8', // Electric blue
  '#0D9488', // Teal
  '#7C3AED', // Violet
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber dark
  '#4F46E5', // Indigo
  '#0891B2', // Cyan
  '#7C2D12', // Dark orange
  '#6D28D9', // Purple
]

function getCellColor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? '#1A73E8'
}

const CustomContent = (props: any) => {
  const { x, y, width, height, name, ticker, percent, index } = props
  const label = ticker || name || ''
  const fill = getCellColor(index)
  const gap = 1 // 1px gap between cells

  // Tiny cells — solid color only
  if (width < 36 || height < 28) {
    return (
      <g>
        <rect x={x + gap} y={y + gap} width={Math.max(width - gap * 2, 0)} height={Math.max(height - gap * 2, 0)}
          fill={fill} rx={2} />
      </g>
    )
  }

  // Small cells — ticker only
  if (width < 65 || height < 40) {
    return (
      <g>
        <rect x={x + gap} y={y + gap} width={Math.max(width - gap * 2, 0)} height={Math.max(height - gap * 2, 0)}
          fill={fill} rx={2} />
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={9} fontWeight={700} fontFamily="system-ui, sans-serif">
          {label.length > 6 ? label.slice(0, 5) : label}
        </text>
      </g>
    )
  }

  // Medium cells — ticker + percent
  if (width < 95 || height < 55) {
    return (
      <g>
        <rect x={x + gap} y={y + gap} width={Math.max(width - gap * 2, 0)} height={Math.max(height - gap * 2, 0)}
          fill={fill} rx={3} />
        <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle"
          fill="white" fontSize={11} fontWeight={700} fontFamily="system-ui, sans-serif">
          {label}
        </text>
        <text x={x + width / 2} y={y + height / 2 + 9} textAnchor="middle"
          fill="rgba(255,255,255,0.7)" fontSize={9} fontFamily="ui-monospace, monospace">
          {(percent ?? 0).toFixed(1)}%
        </text>
      </g>
    )
  }

  // Large cells — full detail
  return (
    <g>
      <rect x={x + gap} y={y + gap} width={Math.max(width - gap * 2, 0)} height={Math.max(height - gap * 2, 0)}
        fill={fill} rx={4} />
      <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle"
        fill="white" fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">
        {label}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 8} textAnchor="middle"
        fill="rgba(255,255,255,0.75)" fontSize={10} fontFamily="ui-monospace, monospace">
        {(percent ?? 0).toFixed(1)}%
      </text>
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const gainLossPercent = data.gainLossPercent

    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg px-3 py-2 shadow-[var(--shadow-overlay)] text-sm">
        <p className="font-bold">{data.ticker || data.name}</p>
        {data.ticker && <p className="text-[11px] text-[var(--text-3)]">{data.name}</p>}
        <p className="font-bold font-mono mt-1">
          {formatCurrency(data.value)}
        </p>
        <p className="text-[var(--text-2)] text-xs">
          {(data.percent ?? 0).toFixed(1)}% da carteira
        </p>
        {gainLossPercent !== undefined && (
          <p className={cn(
            'text-xs font-mono mt-0.5',
            gainLossPercent >= 0 ? 'text-teal' : 'text-red'
          )}>
            {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
          </p>
        )}
      </div>
    )
  }
  return null
}

export function AllocationTreemap({
  data,
  height = 400,
  className,
}: AllocationTreemapProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center bg-[var(--surface-2)] rounded-[var(--radius)]', className)} style={{ height }}>
        <p className="text-[var(--text-2)] text-sm">Sem posições na carteira</p>
      </div>
    )
  }

  return (
    <div className={cn('w-full rounded-lg overflow-hidden', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="none"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
