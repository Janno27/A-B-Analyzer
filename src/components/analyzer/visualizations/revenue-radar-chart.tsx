"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface MetricData {
  aov: number
  rpu: number
  transactions: number
  transaction_share: number
  revenue_uplift?: number
  revenue_confidence?: number
  aov_uplift?: number
  aov_confidence?: number
  rpu_uplift?: number
  rpu_confidence?: number
}

interface ChartData {
  range: string
  revenues: Record<string, number>
  transactions: Record<string, number>
  metrics: Record<string, MetricData>
}

interface RevenueRadarChartProps {
  overallData: any[]
  transactionData: any[]
  filters: Record<string, string[]>
  currency: string
  locale: string
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value)
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

function transformDataForChart(data: ChartData[], metric: 'transactions' | 'revenues') {
  if (!data?.length) return []
  
  return data.map(item => ({
    range: item.range,
    ...item[metric]
  }))
}

function MetricValue({ value, uplift, confidence }: { 
  value: number | string
  uplift?: number
  confidence?: number
}) {
  return (
    <div>
      <div className="font-medium">{value}</div>
      {uplift !== undefined && confidence !== undefined && (
        <div className="text-sm text-muted-foreground">
          {uplift >= 0 ? '+' : ''}{formatPercentage(uplift)} ({formatPercentage(confidence)})
        </div>
      )}
    </div>
  )
}

export function RevenueRadarChart({
  overallData,
  transactionData,
  filters,
  currency,
  locale
}: RevenueRadarChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [selectedTab, setSelectedTab] = useState('chart')
  const [selectedMetric, setSelectedMetric] = useState<'revenues' | 'transactions'>('revenues')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ranges = [
          { min: 0, max: 500, label: '€0-500' },
          { min: 501, max: 1000, label: '€501-1000' },
          { min: 1001, max: 2000, label: '€1001-2000' },
          { min: 2001, max: 'Infinity', label: '€2000+' }
        ]

        const response = await fetch('http://localhost:8000/revenue-radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            overall_data: overallData,
            transaction_data: transactionData,
            filters,
            currency,
            ranges
          })
        })

        if (!response.ok) throw new Error('Failed to fetch radar data')
        const result = await response.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching radar data:', error)
      }
    }

    if (overallData && transactionData) {
      fetchData()
    }
  }, [overallData, transactionData, filters, currency])

  if (!data.length) return null

  const variations = Object.keys(data[0].revenues)
  const colors = ['#2563eb', '#dc2626', '#059669'] // blue, red, green
  const controlVariation = variations.find(v => v.toLowerCase().includes('control'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <div className="flex justify-end space-x-2">
              <TabsList>
                <TabsTrigger 
                  value="revenues"
                  onClick={() => setSelectedMetric('revenues')}
                  data-state={selectedMetric === 'revenues' ? 'active' : ''}
                >
                  Revenue
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions"
                  onClick={() => setSelectedMetric('transactions')}
                  data-state={selectedMetric === 'transactions' ? 'active' : ''}
                >
                  Transactions
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={transformDataForChart(data, selectedMetric)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="range" />
                  <PolarRadiusAxis />
                  {variations.map((variation, index) => (
                    <Radar
                      key={variation}
                      name={variation}
                      dataKey={variation}
                      stroke={colors[index]}
                      fill={colors[index]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Tooltip
                    formatter={(value: number) => [
                      selectedMetric === 'revenues'
                        ? formatCurrency(value, currency, locale)
                        : value.toFixed(0),
                      selectedMetric === 'revenues' ? 'Revenue' : 'Transactions'
                    ]}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Range</TableHead>
                    <TableHead>Variation</TableHead>
                    <TableHead className="text-right">AOV</TableHead>
                    <TableHead className="text-right">RPU</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(rangeData => (
                    <>
                      {variations.map(variation => {
                        const metrics = rangeData.metrics[variation]
                        const isControl = variation === controlVariation
                        
                        return (
                          <TableRow key={`${rangeData.range}-${variation}`}>
                            <TableCell>{rangeData.range}</TableCell>
                            <TableCell>
                              {variation}
                              {isControl && (
                                <Badge variant="outline" className="ml-2">Control</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <MetricValue 
                                value={formatCurrency(metrics.aov, currency, locale)}
                                uplift={!isControl ? metrics.aov_uplift : undefined}
                                confidence={!isControl ? metrics.aov_confidence : undefined}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <MetricValue 
                                value={formatCurrency(metrics.rpu, currency, locale)}
                                uplift={!isControl ? metrics.rpu_uplift : undefined}
                                confidence={!isControl ? metrics.rpu_confidence : undefined}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <MetricValue value={metrics.transactions} />
                            </TableCell>
                            <TableCell className="text-right">
                              <MetricValue value={formatPercentage(metrics.transaction_share * 100)} />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
