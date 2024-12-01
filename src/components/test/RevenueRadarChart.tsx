// src/components/test/RevenueRadarChart.tsx
'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

const ResponsiveRadar = dynamic(() => import('@nivo/radar').then(mod => mod.ResponsiveRadar), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] flex items-center justify-center">
      Chargement du graphique...
    </div>
  )
})

interface RevenueDistributionProps {
  data: any;
  currency?: 'EUR' | 'BRL';
}

export const RevenueRadarChart = ({ data, currency = 'EUR' }: RevenueDistributionProps) => {
  const currencySymbol = currency === 'EUR' ? '€' : 'R$';

  const transformData = () => {
    const ranges = ['0-500', '501-1000', '1001-2000', '2000+'];
    
    // Créer la structure de données pour le radar chart
    return ranges.map(range => {
      // Retirer la devise du range pour la recherche dans les données
      const rangeKey = range;
      
      // Créer un objet avec le range et les valeurs pour chaque variation
      const rangeData: any = {
        range: `${range} ${currencySymbol}`
      };
      
      // Ajouter les données pour chaque variation
      Object.keys(data).forEach(variation => {
        const cleanVariationName = variation.replace(/[\[\]_#included]/g, ' ').trim();
        rangeData[cleanVariationName] = data[variation]?.revenue_distribution?.[rangeKey]?.count || 0;
      });
      
      return rangeData;
    });
  };

  const getRangeStats = (range: string, variation: string) => {
    // Retirer le symbole de devise pour obtenir la clé correcte
    const rangeKey = range.replace(` ${currencySymbol}`, '');
    const rangeData = data[variation]?.revenue_distribution?.[rangeKey];
    
    if (!rangeData) return null;
    
    // Calcul du total des transactions pour cette variation
    const totalTransactions = Object.values(data[variation].revenue_distribution)
      .reduce((sum: any, dist: any) => sum + (dist.count || 0), 0);
    
    // Trouver la variation de contrôle
    const controlVar = Object.keys(data).find(k => k.toLowerCase().includes('control'));
    const controlData = controlVar ? data[controlVar].revenue_distribution?.[rangeKey] : null;
    
    // Calcul de l'uplift
    const uplift = controlData?.count ? 
      ((rangeData.count - controlData.count) / controlData.count * 100) : 0;
    
    return {
      basicMetrics: {
        transactions: rangeData.count,
        transactionsPercentage: (rangeData.count / totalTransactions * 100),
        revenue: rangeData.total_revenue,
        aov: rangeData.aov
      },
      comparison: !variation.toLowerCase().includes('control') ? {
        uplift,
        diffFromControl: rangeData.count - (controlData?.count || 0)
      } : null,
      categories: Object.entries(rangeData.categories || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
    };
  };

  console.log('Revenue Distribution Data:', {
    originalData: data,
    transformedData: transformData(),
    sampleVariation: data[Object.keys(data)[0]]
  });

  // Mise à jour du rendu du tooltip pour utiliser la nouvelle structure
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Revenue Distribution</CardTitle>
      </CardHeader>
      <div className="h-[320px]">
        <ResponsiveRadar
          data={transformData()}
          keys={Object.keys(data).map(k => k.replace(/[\[\]_#included]/g, ' ').trim())}
          indexBy="range"
          maxValue="auto"
          margin={{ top: 50, right: 80, bottom: 60, left: 80 }}
          curve="linearClosed"
          borderWidth={2}
          borderColor={{ from: 'color' }}
          gridLevels={5}
          gridShape="circular"
          gridLabelOffset={36}
          enableDots={true}
          dotSize={10}
          dotColor={{ theme: 'background' }}
          dotBorderWidth={2}
          dotBorderColor={{ from: 'color' }}
          colors={['#60a5fa', '#4ade80', '#a78bfa']}
          fillOpacity={0.25}
          blendMode="multiply"
          motionConfig="gentle"
          tooltip={({ index, data: pointData }) => {
            const range = index.replace(` ${currencySymbol}`, '');
            return (
              <div className="bg-white p-4 rounded-lg shadow-lg border text-sm min-w-[350px]">
                <div className="font-semibold mb-3 pb-2 border-b">
                  Revenue Range: {index}
                </div>
                
                {Object.keys(data).map(variation => {
                  const varName = variation.replace(/[\[\]_#included]/g, ' ').trim();
                  const stats = getRangeStats(range, variation);
                  if (!stats) return null;

                  const {basicMetrics, comparison} = stats;

                  return (
                    <div key={variation} className="mb-4 last:mb-0">
                      <div className="font-medium mb-2">{varName}</div>
                      
                      {/* Métriques de base */}
                      <div className="space-y-2 text-sm">
                        {/* Transactions */}
                        <div className="grid grid-cols-2 items-center">
                          <span className="text-gray-600">Transactions</span>
                          <span className="text-right">
                            {basicMetrics.transactions.toLocaleString()}
                            <span className="text-gray-500 ml-1">
                              ({basicMetrics.transactionsPercentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>

                        {/* Revenue */}
                        <div className="grid grid-cols-2 items-center">
                          <span className="text-gray-600">Revenue</span>
                          <span className="text-right">{basicMetrics.revenue}</span>
                        </div>

                        {/* AOV */}
                        <div className="grid grid-cols-2 items-center">
                          <span className="text-gray-600">AOV</span>
                          <span className="text-right">{basicMetrics.aov}</span>
                        </div>

                        {/* Comparaisons (seulement pour les non-Control) */}
                        {comparison && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="grid grid-cols-2 items-center">
                              <span className="text-gray-600">vs Control</span>
                              <div className="text-right">
                                <span className={comparison.uplift >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {comparison.uplift > 0 ? '+' : ''}{comparison.uplift.toFixed(1)}%
                                </span>
                                <br />
                                <span className="text-gray-500">
                                  ({comparison.diffFromControl > 0 ? '+' : ''}
                                  {comparison.diffFromControl} transactions)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Catégories */}
                        {stats.categories.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-gray-600 mb-1">Top Categories:</div>
                            {stats.categories.map(([cat, count]) => (
                              <div key={cat} className="grid grid-cols-2 text-sm">
                                <span className="truncate">{cat}</span>
                                <span className="text-right">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 50,
              itemWidth: 120,
              itemHeight: 20,
              itemTextColor: '#333',
              symbolSize: 12,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000',
                    itemBackground: 'rgba(0, 0, 0, .03)'
                  }
                }
              ]
            }
          ]}
        />
      </div>
    </Card>
  )
}