'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from './FileUpload'
import { FiltersSection } from './FiltersSection'
import { ResultsTable } from './ResultsTable'
import { OutliersCard } from './OutliersCard'
import { RevenueRadarChart } from './RevenueRadarChart'
import { RawDataTable } from './RawDataTable'
import { RefreshCcw, BarChart2, Users, Layers, DollarSign, Table } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FileData {
  name: string
  content: any
}

interface Filter {
  device_category: string[]
  item_category2: string[]
}

export default function ABTestInterface() {
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
  const [radarData, setRadarData] = useState<any[]>([])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'overall' | 'transaction') => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (type === 'overall') {
        setOverallData({ name: file.name, content: data })
        updateAvailableFilters(data, transactionData?.content || [])
      } else {
        setTransactionData({ name: file.name, content: data })
        updateAvailableFilters(overallData?.content || [], data)
      }
      
      setError(null)
    } catch (err: any) {
      setError(`Erreur lors du chargement du fichier: ${err.message}`)
    }
  }

  const updateAvailableFilters = (overallData: any[], transactionData: any[]) => {
    const deviceCategories = new Set(transactionData.map(item => item.device_category))
    const itemCategories = new Set(overallData.map(item => item.item_category2))

    setAvailableFilters({
      device_category: Array.from(deviceCategories),
      item_category2: Array.from(itemCategories)
    })
  }

  const handleFilterChange = (filterType: keyof Filter, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [filterType]: newValues
      }
    })
  }

  const resetAnalysis = () => {
    setOverallData(null)
    setTransactionData(null)
    setResults(null)
    setError(null)
    setFilters({
      device_category: [],
      item_category2: []
    })
  }

  const analyzeData = async () => {
    if (!overallData || !transactionData) {
      setError('Veuillez charger les deux fichiers avant l\'analyse')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overall_data: overallData.content,
          transaction_data: transactionData.content,
          currency,
          filters
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const results = await response.json()
      setResults(results)
      if (results.radar_data) {
        setRadarData(results.radar_data)
      }
      setError(null)
    } catch (err: any) {
      setError(`Erreur lors de l'analyse: ${err.message}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analyse A/B Test</h1>
        <div className="flex gap-4">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner devise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">Euro (€)</SelectItem>
              <SelectItem value="BRL">Real brésilien (R$)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetAnalysis}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        className="w-full mb-6"
        disabled={!overallData || !transactionData}
        onClick={analyzeData}
      >
        Analyser les données
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
                <Table className="h-4 w-4" />Raw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="mb-6">
                <CardContent>
                <ResultsTable 
                  overallData={overallData}
                  transactionData={transactionData}
                  filters={filters}
                  currency={currency}
                />
                </CardContent>
              </Card>

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
              Engagement content
            </TabsContent>

            <TabsContent value="funnel">
              Funnel content
            </TabsContent>

            <TabsContent value="revenue">
              <div className="space-y-6">
                <RevenueRadarChart 
                  overallData={overallData?.content}
                  transactionData={transactionData?.content}
                  filters={filters}
                  currency={currency}
                  locale={currency === 'EUR' ? 'fr-FR' : 'pt-BR'}
                />
                {/* Vous pouvez ajouter d'autres composants liés aux revenus ici */}
              </div>
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