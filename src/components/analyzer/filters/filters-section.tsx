import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FiltersSectionProps {
  availableFilters: {
    device_category: string[]
    item_category2: string[]
  }
  selectedFilters: {
    device_category: string[]
    item_category2: string[]
  }
  onFilterChange: (filterType: "device_category" | "item_category2", value: string) => void
}

export function FiltersSection({
  availableFilters,
  selectedFilters,
  onFilterChange,
}: FiltersSectionProps) {
  const renderFilterGroup = (title: string, type: "device_category" | "item_category2") => {
    const filters = availableFilters[type]
    if (!filters.length) return null

    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={selectedFilters[type].includes(filter) ? "secondary" : "outline"}
              size="sm"
              onClick={() => onFilterChange(type, filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderFilterGroup("Device Category", "device_category")}
        {renderFilterGroup("Product Category", "item_category2")}
      </CardContent>
    </Card>
  )
}
