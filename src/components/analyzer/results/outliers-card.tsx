import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PackageIcon, TrendingDown, TrendingUp } from "lucide-react"

interface Transaction {
  transaction_id: string
  revenue: string
  quantity: number
  main_product: string
  item_categories: string[]
}

interface OutliersCardProps {
  overallData: any
  transactionData: any
  filters: any
  currency: string
}

function TransactionDetails({ title, transaction, icon: Icon }: { 
  title: string 
  transaction: Transaction | null
  icon: React.ElementType
}) {
  if (!transaction) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <div className="space-y-2">
        <p className="text-xl font-bold">{transaction.revenue}</p>
        <div className="flex items-center gap-2">
          <PackageIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{transaction.main_product}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {transaction.item_categories.map((category) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Order #{transaction.transaction_id} · {transaction.quantity} items
        </p>
      </div>
    </div>
  )
}

export function OutliersCard({ overallData, transactionData, filters, currency }: OutliersCardProps) {
  const variations = Object.entries(results || {}).filter(([key]) => key !== 'raw_data');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Extremes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {variations.map(([variation, data]: [string, any]) => (
            <div key={variation} className="space-y-4">
              <h2 className="text-lg font-semibold">{variation}</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <TransactionDetails
                  title="Highest Transaction"
                  transaction={data.highest_transaction}
                  icon={TrendingUp}
                />
                <TransactionDetails
                  title="Lowest Transaction"
                  transaction={data.lowest_transaction}
                  icon={TrendingDown}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
