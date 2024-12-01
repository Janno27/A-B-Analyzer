import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface RawDataTableProps {
  data: Record<string, any>
}

export const RawDataTable = ({ data }: RawDataTableProps) => {
  const [isAggregated, setIsAggregated] = useState(false)
  
  // Récupérer les variations depuis la structure de données
  const variations = Object.keys(data)

  const columns = isAggregated ? [
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'main_product', label: 'Products' },
    { key: 'item_categories', label: 'Categories' },
    { key: 'quantity', label: 'Total Quantity' },
    { key: 'revenue', label: 'Total Revenue' }
  ] : [
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'main_product', label: 'Product' },
    { key: 'item_categories', label: 'Categories' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'revenue', label: 'Revenue' }
  ]

  const formatValue = (value: any) => {
    if (!value) return '-'
    if (Array.isArray(value)) return value.join(', ')
    return value.toString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Raw Data</CardTitle>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="view-mode"
                checked={isAggregated}
                onCheckedChange={setIsAggregated}
              />
              <Label htmlFor="view-mode">
                {isAggregated ? 'Aggregated' : 'Raw'} View
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={variations[0]}>
          <div className="flex justify-end mb-4">
            <TabsList>
              {variations.map((variation) => (
                <TabsTrigger key={variation} value={variation}>
                  {variation.replace(/[\[\]_#included]/g, ' ').trim()}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {variations.map((variation) => (
            <TabsContent key={variation} value={variation}>
              <ScrollArea className="h-[600px] rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAggregated ? (
                      <TableRow>
                        {columns.map((col) => (
                          <TableCell key={col.key}>
                            {formatValue(data[variation]?.highest_transaction?.[col.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ) : (
                      [
                        data[variation]?.highest_transaction,
                        data[variation]?.lowest_transaction
                      ].filter(Boolean).map((transaction, index) => (
                        <TableRow key={index}>
                          {columns.map((col) => (
                            <TableCell key={col.key}>
                              {formatValue(transaction[col.key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default RawDataTable