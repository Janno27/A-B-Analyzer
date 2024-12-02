'use client';

import React, { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { VARIATION_COLORS } from '@/lib/constants';

// Ajout des fonctions utilitaires
const formatCurrency = (value: number, currency: string, locale: string) => 
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number, locale: string) => 
  new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

// Event emitter pour la communication entre composants
export const tooltipEventEmitter = {
  listeners: new Set<Function>(),
  emit(data: any) {
    this.listeners.forEach((listener) => listener(data));
  },
  subscribe(listener: Function) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

type Range = {
  min: number;
  max: number;
  label: string;
};

type Props = {
  overallData: any[];
  transactionData: any[];
  filters: {
    device_category: string[];
    item_category2: string[];
  };
  currency: string;
  locale: string;
  customRanges?: Range[];  // Optionnel : pour permettre des ranges personnalisés
};

export const RevenueRadarChart = ({ 
  overallData, 
  transactionData, 
  filters,
  currency,
  locale,
  customRanges
}: Props) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [variations, setVariations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction utilitaire pour arrondir les nombres de manière intelligente
  const smartRound = (value: number): number => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    let rounded: number;

    if (normalized < 2) rounded = Math.round(normalized * 2) / 2;
    else if (normalized < 5) rounded = Math.round(normalized);
    else rounded = Math.ceil(normalized / 5) * 5;

    return rounded * magnitude;
  };

  // Calcul intelligent des ranges
  const calculateSmartRanges = (transactions: any[]): Range[] => {
    // Extraire et trier les revenus
    const revenues = transactions
      .map(t => typeof t.revenue === 'string' ? parseFloat(t.revenue.replace(/[^0-9.-]+/g, '')) : t.revenue)
      .filter(r => !isNaN(r) && r > 0)
      .sort((a, b) => a - b);

    if (revenues.length === 0) {
      return [
        { min: 0, max: 500, label: '0-500' },
        { min: 501, max: 1000, label: '501-1000' },
        { min: 1001, max: 2000, label: '1001-2000' },
        { min: 2000, max: Infinity, label: '2000+' }
      ];
    }

    // Calculer les percentiles pour une distribution plus équilibrée
    const getPercentile = (arr: number[], percentile: number) => {
      const index = Math.ceil((percentile / 100) * arr.length) - 1;
      return arr[index];
    };

    const p25 = getPercentile(revenues, 25);
    const p50 = getPercentile(revenues, 50);
    const p75 = getPercentile(revenues, 75);
    const p90 = getPercentile(revenues, 90);

    // Arrondir les valeurs pour des ranges plus "propres"
    const r25 = smartRound(p25);
    const r50 = smartRound(p50);
    const r75 = smartRound(p75);
    const r90 = smartRound(p90);

    // Créer les ranges avec des labels formatés
    const formatLabel = (min: number, max: number | string = 'inf') => {
      if (max === 'inf') return `${formatCurrency(min, currency, locale)}+`;
      return `${formatCurrency(min, currency, locale)} - ${formatCurrency(max as number, currency, locale)}`;
    };

    return [
      { min: 0, max: r25, label: formatLabel(0, r25) },
      { min: r25, max: r50, label: formatLabel(r25, r50) },
      { min: r50, max: r75, label: formatLabel(r50, r75) },
      { min: r75, max: r90, label: formatLabel(r75, r90) },
      { min: r90, max: Infinity, label: formatLabel(r90) }
    ];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!overallData || !transactionData) return;

      setLoading(true);
      try {
        // Convertir Infinity en string pour la sérialisation JSON
        const ranges = (customRanges || calculateSmartRanges(transactionData))
          .map(range => ({
            ...range,
            max: range.max === Infinity ? "Infinity" : range.max
          }));

        const response = await fetch('http://localhost:8000/revenue-radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            overall_data: overallData,
            transaction_data: transactionData,
            filters: filters || {},
            currency: currency || 'EUR',
            ranges: ranges
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch revenue radar data');

        const result = await response.json();
        console.log("Received data:", result);

        if (result.data && result.data.length > 0) {
          const uniqueVariations = Object.keys(result.data[0].revenues || {});
          setVariations(uniqueVariations);
          setChartData(result.data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [overallData, transactionData, filters, currency, customRanges, locale]);

  const CustomTooltip = ({ active, payload, coordinate }: { 
    active?: boolean, 
    payload?: any[], 
    coordinate?: { x: number, y: number } 
  }) => {
    if (!active || !payload || !payload.length || !coordinate) return null;

    const data = payload[0].payload;
    
    // Identifier la variation de contrôle
    const controlVariation = Object.keys(data.metrics).find(v => v.toLowerCase().includes('control'));

    // Trier les variations pour avoir Control en premier
    const sortedVariations = Object.entries(data.metrics).sort(([varA], [varB]) => {
      if (varA.toLowerCase().includes('control')) return -1;
      if (varB.toLowerCase().includes('control')) return 1;
      return varA.localeCompare(varB);
    });

    return (
      <div 
        className="bg-white p-4 rounded-lg shadow-lg border min-w-[600px] absolute pointer-events-none"
        style={{ 
          left: coordinate.x,
          top: coordinate.y,
          transform: 'translate(16px, -100%)'
        }}
      >
        <h3 className="font-medium text-lg mb-2">{data.range}</h3>
        <div className="space-y-4">
          {sortedVariations.map(([variation, metrics]: [string, any], index) => (
            <div key={variation} className="space-y-1">
              <h4 className="font-medium text-sm" style={{ color: VARIATION_COLORS[index].stroke }}>
                {variation.split('_').pop()}
              </h4>
              <div className="grid grid-cols-[100px_1fr] gap-x-4 text-sm">
                <span>Transactions:</span>
                <span>{metrics.transactions} ({formatPercent(metrics.transaction_share, locale)})</span>

                <span>Revenue:</span>
                <div className="whitespace-nowrap">
                  {formatCurrency(data.revenues[variation], currency, locale)}
                  {variation !== controlVariation && (
                    <>
                      <span className={metrics.revenue_uplift >= 0 ? "text-green-600" : "text-red-600"}>
                        {' '}({formatPercent(metrics.revenue_uplift/100, locale)})
                      </span>
                      <span className="text-gray-500">
                        {' '}| {formatPercent(metrics.revenue_confidence/100, locale)} conf.
                      </span>
                    </>
                  )}
                </div>

                <span>AOV:</span>
                <div className="whitespace-nowrap">
                  {formatCurrency(metrics.aov, currency, locale)}
                  {variation !== controlVariation && (
                    <>
                      <span className={metrics.aov_uplift >= 0 ? "text-green-600" : "text-red-600"}>
                        {' '}({formatPercent(metrics.aov_uplift/100, locale)})
                      </span>
                      <span className="text-gray-500">
                        {' '}| {formatPercent(metrics.aov_confidence/100, locale)} conf.
                      </span>
                    </>
                  )}
                </div>

                <span>RPU:</span>
                <div className="whitespace-nowrap">
                  {formatCurrency(metrics.rpu, currency, locale)}
                  {variation !== controlVariation && (
                    <>
                      <span className={metrics.rpu_uplift >= 0 ? "text-green-600" : "text-red-600"}>
                        {' '}({formatPercent(metrics.rpu_uplift/100, locale)})
                      </span>
                      <span className="text-gray-500">
                        {' '}| {formatPercent(metrics.rpu_confidence/100, locale)} conf.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full h-[400px]">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-[400px]">
        <CardContent className="flex items-center justify-center h-full text-sm text-red-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle>Revenue Distribution by Range</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            data={chartData} 
            onMouseLeave={() => tooltipEventEmitter.emit(null)}
          >
            <PolarGrid gridType="circle" />
            <PolarAngleAxis 
              dataKey="range"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90}
              tickFormatter={() => ''}
              tick={{ fontSize: 10 }}
            />
            {variations.map((variation, index) => (
              <Radar
                key={variation}
                name={variation.split('_').pop()}
                dataKey={`revenues.${variation}`}
                stroke={VARIATION_COLORS[index].stroke}
                fill={VARIATION_COLORS[index].fill}
                fillOpacity={0.3}
              />
            ))}
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={false}  // Désactive le curseur par défaut
              position={{ x: 0, y: 0 }}  // Position initiale
            />
            <Legend height={20} wrapperStyle={{ fontSize: '10px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};