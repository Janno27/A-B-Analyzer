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
import { Loader2 } from "lucide-react";

interface ResultsTableProps {
  overallData: { content?: any[] } | any[];
  transactionData: { content?: any[] } | any[];
  filters: {
    device_category: string[];
    item_category2: string[];
  };
  currency: string;
}

export function ResultsTable({ overallData, transactionData, filters, currency }: ResultsTableProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const processedOverallData = Array.isArray(overallData) 
        ? overallData 
        : overallData?.content || [];
      
      const processedTransactionData = Array.isArray(transactionData)
        ? transactionData
        : transactionData?.content || [];

      if (!processedOverallData.length || !processedTransactionData.length) return;

      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            overall_data: processedOverallData.filter(item => item.item_category2 === '((Total))'),
            transaction_data: processedTransactionData,
            filters,
            currency
          })
        });

        const data = await response.json();
        console.log('Received results:', data);
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to fetch data');
        }

        setResults(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [overallData, transactionData, filters, currency]);

  if (loading) return <div className="w-full text-center p-4"><Loader2 className="h-8 w-8 animate-spin inline" /></div>;
  if (error) return <div className="w-full text-center p-4 text-red-500">{error}</div>;
  if (!results) return null;

  const variations = Object.keys(results).filter(key => key !== 'raw_data');
  const controlVariation = variations.find(v => v.toLowerCase().includes('control'));

  const getBestValue = (metric: string) => {
    return Math.max(...variations.map(v => {
      const value = results[v][metric];
      return parseFloat(value?.toString().replace(/[^0-9.-]+/g, '')) || 0;
    }));
  };

  const isBestValue = (value: string | number, bestValue: number) => {
    const cleanValue = value?.toString().replace(/[^0-9.-]+/g, '');
    return parseFloat(cleanValue || '0') === bestValue;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Variation</TableHead>
          <TableHead className="text-right">Users</TableHead>
          <TableHead className="text-right">Add to Cart</TableHead>
          <TableHead className="text-right">Transaction</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {variations.map(variation => {
          const bestUsers = getBestValue('users');
          const bestAddToCart = getBestValue('add_to_cart_rate');
          const bestTransaction = getBestValue('transaction_rate');
          const bestRevenue = getBestValue('revenue');

          return (
            <TableRow key={variation}>
              <TableCell className="font-medium">{variation.split('_').pop()}</TableCell>
              
              <TableCell className="text-right">
                <div className={isBestValue(results[variation].users, bestUsers) ? 'font-bold text-black' : ''}>
                  {results[variation].users}
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className={isBestValue(results[variation].add_to_cart_rate, bestAddToCart) ? 'font-bold text-black' : ''}>
                  {results[variation].add_to_cart_rate}
                </div>
                {variation !== controlVariation && (
                  <>
                    <div className="text-sm">
                      <span className={`${results[variation].add_to_cart_rate_uplift?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {results[variation].add_to_cart_rate_uplift}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results[variation].add_to_cart_rate_confidence}% conf.
                    </div>
                  </>
                )}
              </TableCell>
              
              <TableCell className="text-right">
                <div className={isBestValue(results[variation].transaction_rate, bestTransaction) ? 'font-bold text-black' : ''}>
                  {results[variation].transaction_rate}
                </div>
                {variation !== controlVariation && (
                  <>
                    <div className="text-sm">
                      <span className={`${results[variation].transaction_rate_uplift?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {results[variation].transaction_rate_uplift}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results[variation].transaction_rate_confidence}% conf.
                    </div>
                  </>
                )}
              </TableCell>
              
              <TableCell className="text-right">
                <div className={isBestValue(results[variation].revenue, bestRevenue) ? 'font-bold text-black' : 'text-gray-600'}>
                  {results[variation].revenue}
                </div>
                {variation !== controlVariation && (
                  <>
                    <div className="text-sm">
                      <span className={`${results[variation].revenue_uplift?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {results[variation].revenue_uplift}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results[variation].revenue_confidence}% conf.
                    </div>
                  </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}