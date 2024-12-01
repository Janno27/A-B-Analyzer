import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

interface MetricData {
  value: string
  rate?: string
  raw?: number // pour les comparaisons
}

interface ResultsTableProps {
  results: Record<string, Record<string, any>>
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  const variations = Object.keys(results)
  const controlVariation = variations.find(v => v.toLowerCase().includes('control'))

  const calculateUplift = (controlValue: number, variationValue: number): string => {
    const uplift = ((variationValue - controlValue) / controlValue) * 100
    return uplift > 0 ? `+${uplift.toFixed(2)}%` : `${uplift.toFixed(2)}%`
  }

  const getWinningMetric = (metric: string): string | undefined => {
    if (metric === 'users') return undefined // Pas de gagnant pour users
    
    let maxValue = -Infinity
    let winner = undefined
    
    variations.forEach(variation => {
      const value = parseFloat(results[variation][metric]?.replace(/[^0-9.-]+/g, ''))
      if (!isNaN(value) && value > maxValue) {
        maxValue = value
        winner = variation
      }
    })
    return winner
  }

  const getConfidence = (metric: string, variation: string): number => {
    // Simulation de calcul de confiance - À remplacer par vos vrais calculs
    const method = metric === 'revenue' ? 'Mann-Whitney' : 'T-Test'
    return Math.random() * 100 // Exemple - à remplacer par votre vrai calcul
  }

  const getConfidenceInterval = (metric: string, variation: string): string => {
    // Simulation d'intervalle - À remplacer par vos vrais calculs
    const value = parseFloat(results[variation][metric]?.replace(/[^0-9.-]+/g, ''))
    const margin = value * 0.05 // 5% de marge pour l'exemple
    return `[${(value - margin).toFixed(2)} - ${(value + margin).toFixed(2)}]`
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-4">Metric</th>
          {variations.map(variation => (
            <th key={variation} className="text-center p-4">
              {variation.replace(/[\[\]_#included]/g, ' ').trim()}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {['users', 'add_to_carts', 'transactions', 'revenue'].map(metric => {
          const winningVariation = getWinningMetric(metric)
          return (
            <tr key={metric} className="border-b hover:bg-muted/50">
              <td className="p-4 font-medium capitalize">
                {metric.replace(/_/g, ' ')}
              </td>
              {variations.map(variation => {
                const value = results[variation][metric]
                const isControl = variation === controlVariation
                const isWinner = variation === winningVariation
                
                return (
                  <td key={`${variation}-${metric}`} className="p-4">
                    <Tooltip content={getConfidenceInterval(metric, variation)}>
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "min-w-[80px]",
                          isWinner && metric !== 'users' && "font-semibold"
                        )}>
                          {value}
                        </span>
                        
                        {!isControl && metric !== 'users' && (
                          <div className="flex flex-col items-end text-xs">
                            <div className={cn(
                              value > results[controlVariation][metric] ? "text-green-600" : "text-red-600"
                            )}>
                              {calculateUplift(
                                parseFloat(results[controlVariation][metric].replace(/[^0-9.-]+/g, '')),
                                parseFloat(value.replace(/[^0-9.-]+/g, ''))
                              )}
                            </div>
                            <div className="text-gray-500">
                              {`${getConfidence(metric, variation).toFixed(1)}%`}
                            </div>
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}