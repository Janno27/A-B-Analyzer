'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PackageIcon, Bed, Package } from 'lucide-react'

type TransactionDetail = {
 transaction_id: string;
 revenue: string | number;
 quantity: number;
 main_product: string;
 item_categories: string[];
}

interface OutliersCardProps {
 overallData: any[];
 transactionData: any[];
 filters: {
   device_category: string[];
   item_category2: string[];
 };
 currency: string;
 locale?: string;
}

export function OutliersCard({ 
 overallData,
 transactionData, 
 filters,
 currency = 'EUR',
 locale = 'fr-FR' 
}: OutliersCardProps) {
 const [results, setResults] = useState<any>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
   const fetchData = async () => {
     if (!overallData || !transactionData) return;

     setLoading(true);
     try {
       const response = await fetch('http://localhost:8000/analyze', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           overall_data: overallData,
           transaction_data: transactionData,
           filters,
           currency
         })
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.detail || 'Failed to fetch data');
       }

       const data = await response.json();
       setResults(data);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to load data');
     } finally {
       setLoading(false);
     }
   };

   fetchData();
 }, [overallData, transactionData, filters, currency]);

 const calculateIQR = (data: number[]) => {
   const sorted = data.sort((a, b) => a - b);
   const q1 = sorted[Math.floor(sorted.length * 0.25)];
   const q3 = sorted[Math.floor(sorted.length * 0.75)];
   const iqr = q3 - q1;
   
   return {
     q1,
     q3,
     lowerBound: q1 - 1.5 * iqr,
     upperBound: q3 + 1.5 * iqr
   };
 };

 const getOutliers = (transactions: any[]) => {
   const revenues = transactions.map(t => 
     typeof t.revenue === 'string' ? 
     parseFloat(t.revenue.replace(/[^0-9.-]+/g, '')) : 
     t.revenue
   );

   const { lowerBound, upperBound } = calculateIQR(revenues);
   const outliers = transactions.filter(t => {
     const rev = typeof t.revenue === 'string' ? 
       parseFloat(t.revenue.replace(/[^0-9.-]+/g, '')) : 
       t.revenue;
     return rev < lowerBound || rev > upperBound;
   });

   return {
     outliers,
     percentage: (outliers.length / transactions.length * 100).toFixed(1)
   };
 };

 const calculateOutlierPercentage = (variation: string) => {
   const transactions = results?.raw_data?.raw_data[variation];
   if (!transactions?.length) return '0%';
   
   const { percentage } = getOutliers(transactions);
   return percentage + '%';
 };

 const formatCategories = (categories: string[] = []) => {
   if (!categories?.length) return '';
   if (categories.length <= 3) return categories.join(', ');
   return `${categories.slice(0, 3).join(', ')} +${categories.length - 3}`;
 };

 const formatRevenue = (value: string | number): string => {
   try {
     const numericValue = typeof value === 'string' 
       ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
       : value;

     return new Intl.NumberFormat(locale, {
       style: 'currency',
       currency: currency
     }).format(numericValue);
   } catch {
     return `${currency === 'EUR' ? '€' : 'R$'} 0,00`;
   }
 };

 const getIcon = (categories: string[] = []) => {
   const hasMattress = categories.some(cat => 
     cat.toLowerCase().includes('mattress') || 
     cat.toLowerCase().includes('colchão') ||
     cat.toLowerCase().includes('matelas')
   );
   return hasMattress ? <Bed className="h-6 w-6" /> : <Package className="h-6 w-6" />;
 };

 if (loading) {
   return (
     <Card>
       <CardContent className="flex justify-center items-center h-32">
         <div className="animate-spin">⌛</div>
       </CardContent>
     </Card>
   );
 }

 if (error || !results) {
   return (
     <Card>
       <CardContent className="text-center text-red-500 p-4">
         {error || 'No data available'}
       </CardContent>
     </Card>
   );
 }

 const relevantData = Object.entries(results).filter(([key]) => key !== 'raw_data');

 return (
   <Card>
     <CardHeader>
       <CardTitle className="flex items-center gap-2">
         <PackageIcon className="h-5 w-5" />
         Outlier Transactions
       </CardTitle>
     </CardHeader>
     <CardContent className="space-y-6">
       {relevantData.map(([variation, varData]) => (
         <div key={variation} className="space-y-4">
           <div className="flex justify-between items-center">
             <h3 className="font-medium">
               {variation.split('_').pop()}
             </h3>
             <span className="text-sm text-muted-foreground">
               Outliers: {calculateOutlierPercentage(variation)}
             </span>
           </div>

           {varData.highest_transaction && (
             <div className="flex items-center space-x-4 p-4 rounded-md bg-muted/50">
               <div className="flex-shrink-0 text-blue-600">
                 {getIcon(varData.highest_transaction.item_categories)}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-blue-600">Highest Transaction</p>
                 <p className="text-sm font-medium truncate">{varData.highest_transaction.main_product}</p>
                 <p className="text-xs text-muted-foreground">Quantity: {varData.highest_transaction.quantity}</p>
                 <p className="text-xs text-muted-foreground">
                   Categories: {formatCategories(varData.highest_transaction.item_categories)}
                 </p>
               </div>
               <div className="text-right text-sm font-medium text-blue-600">
                 {formatRevenue(varData.highest_transaction.revenue)}
               </div>
             </div>
           )}

           {varData.lowest_transaction && (
             <div className="flex items-center space-x-4 p-4 rounded-md bg-muted/50">
               <div className="flex-shrink-0 text-orange-600">
                 {getIcon(varData.lowest_transaction.item_categories)}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-orange-600">Lowest Transaction</p>
                 <p className="text-sm font-medium truncate">{varData.lowest_transaction.main_product}</p>
                 <p className="text-xs text-muted-foreground">Quantity: {varData.lowest_transaction.quantity}</p>
                 <p className="text-xs text-muted-foreground">
                   Categories: {formatCategories(varData.lowest_transaction.item_categories)}
                 </p>
               </div>
               <div className="text-right text-sm font-medium text-orange-600">
                 {formatRevenue(varData.lowest_transaction.revenue)}
               </div>
             </div>
           )}
         </div>
       ))}
     </CardContent>
   </Card>
 );
}