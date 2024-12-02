"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from './file-upload/file-upload'
import { FiltersSection } from './filters/filters-section'
import { ResultsTable } from './results/results-table'
import { OutliersCard } from './results/outliers-card'
import { RevenueRadarChart } from './visualizations/revenue-radar-chart'
import { RawDataTable } from './results/raw-data-table'
import { CurrencySelect } from './controls/currency-select'
import { BarChart2, Users, Layers, DollarSign, Table, RefreshCcw } from 'lucide-react'

interface FileData {
  name: string
  content: any
}

interface Filter {
  device_category: string[]
  item_category2: string[]
}

export function ABTestInterface() {
  const [overallData, setOverallData] = useState<FileData | null>(null)
  const [transactionData, setTransactionData] = useState<FileData | null>(null)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState('EUR')
  const [filters, setFilters] = useState<Filter>({
    device_category: [],
    item_category2: []
  })
  const [availableFilters, setAvailableFilters] = useState<{
    device_category: string[]
    item_category2: string[]
  }>({
    device_category: [],
    item_category2: []
  })

  // Rest of your existing logic here...

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <CurrencySelect value={currency} onValueChange={setCurrency} />
        <Button variant="outline" onClick={resetAnalysis}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset Analysis
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUpload
          type="overall"
          onUpload={(e) => handleFileUpload(e, 'overall')}
          fileName={overallData?.name}
        />
        <FileUpload
          type="transaction"
          onUpload={(e) => handleFileUpload(e, 'transaction')}
          fileName={transactionData?.name}
        />
      </div>

      {(overallData || transactionData) && (
        <FiltersSection
          availableFilters={availableFilters}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      <Button 
        className="w-full"
        disabled={!overallData || !transactionData}
        onClick={analyzeData}
      >
        Analyze Data
      </Button>

      {results && (
        <Card>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />Overview
              </TabsTrigger>
              <TabsTrigger value="engagement" className="flex items-center gap-2">
                <Users className="h-4 w-4" />Engagement
              </TabsTrigger>
              <TabsTrigger value="funnel" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />Funnel
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />Revenue
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <Table className="h-4 w-4" />Raw Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ResultsTable 
                overallData={overallData}
                transactionData={transactionData}
                filters={filters}
                currency={currency}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RevenueRadarChart 
                  overallData={overallData?.content}
                  transactionData={transactionData?.content}
                  filters={filters}
                  currency={currency}
                  locale={currency === 'EUR' ? 'fr-FR' : 'pt-BR'}
                />
                <OutliersCard 
                  overallData={overallData?.content}
                  transactionData={transactionData?.content}
                  filters={filters}
                  currency={currency}
                />
              </div>
            </TabsContent>

            <TabsContent value="engagement">
              <p className="text-muted-foreground">Engagement analysis coming soon...</p>
            </TabsContent>

            <TabsContent value="funnel">
              <p className="text-muted-foreground">Funnel analysis coming soon...</p>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <RevenueRadarChart 
                overallData={overallData?.content}
                transactionData={transactionData?.content}
                filters={filters}
                currency={currency}
                locale={currency === 'EUR' ? 'fr-FR' : 'pt-BR'}
              />
            </TabsContent>

            <TabsContent value="raw">
              <RawDataTable data={results} />
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  )
}
