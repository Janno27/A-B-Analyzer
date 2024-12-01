// components/test/StatCell.tsx
import { cn } from "@/lib/utils"

interface MetricResult {
  absolute: string
  rate?: string
  uplift?: string
  confidence?: string
  isPositive?: boolean
}

export const StatCell = ({ data }: { data: MetricResult }) => {
  if (!data) return null
  
  return (
    <div className="flex justify-between items-center">
      <div className="text-left">
        <div className="text-sm text-gray-500">{data.absolute}</div>
        {data.rate && <div className="font-medium">{data.rate}</div>}
      </div>
      {data.uplift && (
        <div className="text-right ml-4">
          <div className={cn(
            "text-sm",
            data.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {data.uplift}
          </div>
          {data.confidence && (
            <div className="text-xs text-gray-500">
              ({data.confidence}%)
            </div>
          )}
        </div>
      )}
    </div>
  )
}