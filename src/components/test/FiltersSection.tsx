import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface FiltersSectionProps {
  availableFilters: {
    device_category: string[]
    item_category2: string[]
  }
  selectedFilters: {
    device_category: string[]
    item_category2: string[]
  }
  onFilterChange: (filterType: 'device_category' | 'item_category2', value: string) => void
}

export const FiltersSection = ({
  availableFilters,
  selectedFilters,
  onFilterChange
}: FiltersSectionProps) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-lg">Filtres</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Device Category</h3>
          <div className="space-y-2">
            {availableFilters.device_category.map(device => (
              <div key={device} className="flex items-center space-x-2">
                <Checkbox
                  id={`device-${device}`}
                  checked={selectedFilters.device_category.includes(device)}
                  onCheckedChange={() => onFilterChange('device_category', device)}
                />
                <Label htmlFor={`device-${device}`}>{device}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Item Category</h3>
          <div className="space-y-2">
            {availableFilters.item_category2.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedFilters.item_category2.includes(category)}
                  onCheckedChange={() => onFilterChange('item_category2', category)}
                />
                <Label htmlFor={`category-${category}`}>{category}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)