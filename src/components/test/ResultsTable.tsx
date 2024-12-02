'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ResultsTableProps {
  overallData: any[];
  transactionData: any[];
  filters: {
    device_category: string[];
    item_category2: string[];
  };
  currency: string;
}

const metrics = [
  { key: 'users', label: 'Users' },
  { key: 'add_to_cart_rate', label: 'Add to Cart Rate' },
  { key: 'transaction_rate', label: 'Transaction Rate' },
  { key: 'revenue', label: 'Revenue' }
];

export function ResultsTable({ 
  overallData,
  transactionData,
  filters,
  currency
}: ResultsTableProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!overallData || !transactionData) return;

      setLoading(true);
      try {
        // Transformer les données overall en liste si nécessaire
        const processedOverallData = Array.isArray(overallData) 
          ? overallData 
          : overallData.content || [];

        const requestData = {
          overall_data: processedOverallData,
          transaction_data: transactionData,
          filters: {
            device_category: Array.isArray(filters?.device_category) ? filters.device_category : [],
            item_category2: Array.isArray(filters?.item_category2) ? filters.item_category2 : []
          },
          currency: currency || 'EUR'
        };

        console.log("Sending request data:", requestData);

        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error response:", errorData);
          throw new Error(errorData.detail || 'Failed to fetch metrics data');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Error details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [overallData, transactionData, filters, currency]);

  if (loading) {
    return <div className="rounded-md border p-4 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md border p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!results) return null;

  // Trouver la variation de contrôle
  const controlVariation = Object.keys(results).find(key => 
    key.toLowerCase().includes('control')
  );

  if (!controlVariation) return <div>No control variation found in data</div>;

  // Déterminer la couleur de l'uplift
  const getUpliftColor = (upliftStr: string): string => {
    const upliftValue = parseFloat(upliftStr);
    if (upliftValue > 0) return 'text-green-600';
    if (upliftValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Trouver la valeur la plus élevée pour un metric donné
  const findHighestValue = (metric: string): number => {
    let maxValue = -Infinity;
    Object.entries(results).forEach(([variation, data]: [string, any]) => {
      if (variation !== 'raw_data') {
        const value = parseFloat(data[metric].toString().replace(/[^0-9.-]+/g, ''));
        if (!isNaN(value) && value > maxValue) {
          maxValue = value;
        }
      }
    });
    return maxValue;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Metric</TableHead>
            {Object.keys(results)
              .filter(variation => variation !== 'raw_data')
              .map(variation => (
                <TableHead key={variation} className="text-center">
                  {variation}
                </TableHead>
              ))
            }
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map(({ key, label }) => {
            const highestValue = findHighestValue(key);
            
            return (
              <TableRow key={key}>
                <TableCell className="font-medium">{label}</TableCell>
                {Object.entries(results)
                  .filter(([variation]) => variation !== 'raw_data')
                  .map(([variation, data]: [string, any]) => {
                    const value = data[key];
                    const numericalValue = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
                    const isHighest = !isNaN(numericalValue) && numericalValue === highestValue;
                    const isControlVariation = variation === controlVariation;

                    return (
                      <TableCell key={variation} className="relative">
                        <div className="flex flex-col items-center">
                          {/* Valeur principale centrée */}
                          <div className={cn(
                            "text-center",
                            isHighest && "font-semibold"
                          )}>
                            {value}
                          </div>

                          {/* Uplift et confiance statistique alignés à droite */}
                          {!isControlVariation && (
                            <div className="flex flex-col items-end w-full">
                              <div className={cn(
                                "text-right",
                                getUpliftColor(data[`${key}_uplift`])
                              )}>
                                {data[`${key}_uplift`]}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                {data[`${key}_confidence`] && `${data[`${key}_confidence`]}% confidence`}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}