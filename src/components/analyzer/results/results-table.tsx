import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ResultsTableProps {
  overallData: any
  transactionData: any
  filters: any
  currency: string
}

export function ResultsTable({ overallData, transactionData, filters, currency }: ResultsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Variation</TableHead>
              <TableHead>
                Users
                <span className="block text-xs font-normal text-muted-foreground">Uplift & Conf.</span>
              </TableHead>
              <TableHead>
                Add to Cart Rate
                <span className="block text-xs font-normal text-muted-foreground">Uplift & Conf.</span>
              </TableHead>
              <TableHead>
                Transaction Rate
                <span className="block text-xs font-normal text-muted-foreground">Uplift & Conf.</span>
              </TableHead>
              <TableHead className="text-right">
                Revenue
                <span className="block text-xs font-normal text-muted-foreground">Uplift & Conf.</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results && Object.entries(results).map(([variation, data]: [string, any]) => {
              if (variation === 'raw_data') return null;
              const isControl = variation.toLowerCase().includes('control');
              
              return (
                <TableRow key={variation}>
                  <TableCell className="font-medium">
                    {variation}
                    {isControl && <Badge variant="outline" className="ml-2">Control</Badge>}
                  </TableCell>
                  <TableCell>
                    <div>{data.users}</div>
                    {!isControl && (
                      <div className="text-sm text-muted-foreground">
                        {data.users_uplift} ({data.users_confidence}%)
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{data.add_to_cart_rate}</div>
                    {!isControl && (
                      <div className="text-sm text-muted-foreground">
                        {data.add_to_cart_rate_uplift} ({data.add_to_cart_rate_confidence}%)
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{data.transaction_rate}</div>
                    {!isControl && (
                      <div className="text-sm text-muted-foreground">
                        {data.transaction_rate_uplift} ({data.transaction_rate_confidence}%)
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>{data.revenue}</div>
                    {!isControl && (
                      <div className="text-sm text-muted-foreground">
                        {data.revenue_uplift} ({data.revenue_confidence}%)
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
