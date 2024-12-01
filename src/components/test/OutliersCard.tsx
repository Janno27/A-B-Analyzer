// src/components/test/OutliersCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PackageIcon, TrendingDown, TrendingUp, Bed, Package } from 'lucide-react'

interface TransactionDetail {
  transaction_id: string
  main_product: string
  quantity: number
  revenue: string
  item_categories: string[]
  category: string
}

interface OutliersCardProps {
  data: Record<string, {
    highest_transaction: TransactionDetail
    lowest_transaction: TransactionDetail
  }>
}

export const OutliersCard = ({ data }: OutliersCardProps) => {
  const formatCategories = (categories: string[] = []) => {
    if (!categories?.length) return '';
    if (categories.length <= 3) return categories.join(', ');
    return `${categories.slice(0, 3).join(', ')} +${categories.length - 3}`;
  };

  const getIcon = (category?: string) => {
    switch(category?.toLowerCase()) {
      case 'mattress':
        return <Bed className="h-6 w-6" />;
      default:
        return <Package className="h-6 w-6" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageIcon className="h-5 w-5" />
          Outlier Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(data).map(([variation, metrics]) => (
          <div key={variation} className="space-y-4">
            <h3 className="font-medium">
              {variation.replace(/[\[\]_#included]/g, ' ').trim()}
            </h3>
            
            {/* Highest Revenue Transaction */}
            <div className="flex items-center space-x-4 p-4 rounded-md bg-muted/50">
              <div className="flex-shrink-0">
                {getIcon(metrics.highest_transaction?.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {metrics.highest_transaction?.main_product ?? 'Best'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Quantity: {metrics.highest_transaction?.quantity ?? 0}
                  {metrics.highest_transaction?.item_categories && (
                    <span className="ml-2">
                      • {formatCategories(metrics.highest_transaction.item_categories)}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right text-sm font-medium">
                {metrics.highest_transaction?.revenue ?? 'Best'}
              </div>
            </div>

            {/* Lowest Revenue Transaction */}
            <div className="flex items-center space-x-4 p-4 rounded-md bg-muted/50">
              <div className="flex-shrink-0">
                {getIcon(metrics.lowest_transaction?.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {metrics.lowest_transaction?.main_product ?? 'Worst'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Quantity: {metrics.lowest_transaction?.quantity ?? 0}
                  {metrics.lowest_transaction?.item_categories && (
                    <span className="ml-2">
                      • {formatCategories(metrics.lowest_transaction.item_categories)}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right text-sm font-medium">
                {metrics.lowest_transaction?.revenue ?? 'Worst'}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}