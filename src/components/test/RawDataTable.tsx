'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

type DataItem = {
  variation: string;
  device_category: string;
  transaction_id: string;
  item_category2: string;
  item_name: string;
  item_bundle: string;
  item_name_simple: string;
  quantity: string;
  revenue: string | number;
  f0_: string;
}

interface RawDataTableProps {
  data: {
    raw_data: {
      raw_data: {
        [key: string]: DataItem[];
      }
    }
  };
  currency?: string;
  locale?: string;
}

export function RawDataTable({ 
  data, 
  currency = 'BRL',
  locale = 'pt-BR'
}: RawDataTableProps) {
  const [isAggregated, setIsAggregated] = React.useState(true);
  
  // Extraire les données brutes
  const rawData = data?.raw_data?.raw_data;
  
  if (!rawData) {
    return <div className="p-4 text-center">Aucune donnée disponible</div>;
  }

  // Get unique variations
  const variations = Object.keys(rawData);

  if (variations.length === 0) {
    return <div className="p-4 text-center">Aucune variation trouvée dans les données</div>;
  }

  // Group by transaction_id within each variation
  const groupByTransaction = (items: DataItem[]) => {
    return items.reduce<Record<string, DataItem[]>>((acc, item) => {
      if (!acc[item.transaction_id]) {
        acc[item.transaction_id] = [];
      }
      acc[item.transaction_id].push(item);
      return acc;
    }, {});
  };

  const normalizeNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    
    // Détecter le format
    const hasCommaDecimal = value.includes(',') && value.indexOf(',') > value.indexOf('.');
    const hasDotDecimal = value.includes('.') && value.indexOf('.') > value.indexOf(',');
    
    // Nettoyer la chaîne
    let cleanValue = value.replace(/[^0-9.,]/g, '');
    
    if (hasCommaDecimal) {
      // Format européen/brésilien (1.234,56)
      cleanValue = cleanValue.replace('.', '').replace(',', '.');
    } else if (hasDotDecimal) {
      // Format anglais (1,234.56)
      cleanValue = cleanValue.replace(',', '');
    } else if (cleanValue.includes(',')) {
      // Si seule virgule, supposer format européen/brésilien
      cleanValue = cleanValue.replace(',', '.');
    }
    
    const number = parseFloat(cleanValue);
    return isNaN(number) ? 0 : number;
  };

  const formatRevenue = (revenue: string | number): string => {
    try {
      const numericValue = normalizeNumber(revenue);
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericValue);
    } catch (e) {
      // Fournir un format par défaut basé sur la devise
      const defaultFormat = {
        'BRL': 'R$ 0,00',
        'EUR': '€0,00',
        'USD': '$0.00'
      }[currency] || '0.00';
      
      return defaultFormat;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2">
        <button
          role="switch"
          id="aggregation-mode"
          aria-checked={isAggregated}
          onClick={() => setIsAggregated(!isAggregated)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-offset-white
            ${isAggregated ? 'bg-blue-600' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              ${isAggregated ? 'translate-x-6' : 'translate-x-1'}
              inline-block h-4 w-4 transform rounded-full
              bg-white transition-transform
            `}
          />
        </button>
        <Label htmlFor="aggregation-mode">
          {isAggregated ? 'Données agrégées par transaction' : 'Données brutes'}
        </Label>
      </div>

      <Tabs defaultValue={variations[0]} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${variations.length}, 1fr)` }}>
          {variations.map((variation) => (
            <TabsTrigger key={variation} value={variation}>
              {variation}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {variations.map((variation) => {
          const transactionGroups = groupByTransaction(rawData[variation]);
          
          return (
            <TabsContent key={variation} value={variation}>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Transaction ID</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAggregated ? (
                      Object.entries(transactionGroups).map(([transactionId, items]) => {
                        const totalRevenue = items.reduce((sum, item) => 
                          sum + normalizeNumber(item.revenue), 0);
                        
                        const totalQuantity = items.reduce((sum, item) => 
                          sum + parseInt(item.quantity || '0'), 0);
                        
                        return (
                          <TableRow key={transactionId}>
                            <TableCell className="font-medium">{transactionId}</TableCell>
                            <TableCell>{items[0].device_category}</TableCell>
                            <TableCell>
                              {[...new Set(items.map(item => item.item_category2))].join(', ')}
                            </TableCell>
                            <TableCell>
                              <ul className="list-disc list-inside">
                                {items.map((item, idx) => (
                                  <li key={idx}>
                                    {item.item_name_simple} {item.item_bundle && `(${item.item_bundle})`}
                                  </li>
                                ))}
                              </ul>
                            </TableCell>
                            <TableCell>{totalQuantity}</TableCell>
                            <TableCell>{formatRevenue(totalRevenue)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      rawData[variation].map((item, index) => (
                        <TableRow key={`${item.transaction_id}-${index}`}>
                          <TableCell className="font-medium">{item.transaction_id}</TableCell>
                          <TableCell>{item.device_category}</TableCell>
                          <TableCell>{item.item_category2}</TableCell>
                          <TableCell>{item.item_name_simple}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatRevenue(item.revenue)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}