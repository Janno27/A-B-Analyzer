'use client';

import React from 'react';
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
  data: Record<string, any>;
  currency?: string;
  locale?: string;
}

export function OutliersCard({ 
  data,
  currency = 'BRL',
  locale = 'pt-BR'
}: OutliersCardProps) {
  const formatCategories = (categories: string[] = []) => {
    if (!categories?.length) return '';
    if (categories.length <= 3) return categories.join(', ');
    return `${categories.slice(0, 3).join(', ')} +${categories.length - 3}`;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'BRL': 'R$',
      'EUR': '€',
      'USD': '$',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  const normalizeNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    
    let stringValue = value;
    const currencySymbol = getCurrencySymbol(currency);
    
    // Supprimer le symbole monétaire et les espaces
    stringValue = stringValue.replace(currencySymbol, '').trim();
    
    // Gérer les différents formats selon la locale
    if (locale === 'pt-BR' || locale === 'fr-FR') {
      // Format: 1.234,56
      return parseFloat(stringValue.replace(/\./g, '').replace(',', '.'));
    } else {
      // Format: 1,234.56
      return parseFloat(stringValue.replace(/,/g, ''));
    }
  };

  const formatRevenue = (revenue: string | number): string => {
    try {
      const numericValue = normalizeNumber(revenue);

      if (isNaN(numericValue)) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency
        }).format(0);
      }

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(numericValue);
    } catch (e) {
      console.error('Error formatting revenue:', revenue, e);
      return `${getCurrencySymbol(currency)} 0,00`;
    }
  };

  // Ignore raw_data
  const relevantData = Object.entries(data).filter(([key]) => key !== 'raw_data');

  if (relevantData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Outlier Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">No transaction data available</div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (categories: string[] = []) => {
    const hasMattress = categories.some(cat => 
      cat.toLowerCase().includes('mattress') || 
      cat.toLowerCase().includes('colchão') ||
      cat.toLowerCase().includes('matelas')
    );
    return hasMattress ? <Bed className="h-6 w-6" /> : <Package className="h-6 w-6" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageIcon className="h-5 w-5" />
          Outlier Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {relevantData.map(([variation, varData]) => {
          if (!varData.highest_transaction && !varData.lowest_transaction) {
            return (
              <div key={variation} className="space-y-4">
                <h3 className="font-medium">
                  {variation.replace(/[\[\]_#included]/g, ' ').trim()}
                </h3>
                <div className="p-4 text-gray-500 text-center">
                  No outlier transactions for this variation
                </div>
              </div>
            );
          }

          return (
            <div key={variation} className="space-y-4">
              <h3 className="font-medium">
                {variation.replace(/[\[\]_#included]/g, ' ').trim()}
              </h3>

              {/* Plus haute transaction */}
              {varData.highest_transaction && (
                <div className="flex items-center space-x-4 p-4 rounded-md bg-muted/50">
                  <div className="flex-shrink-0 text-blue-600">
                    {getIcon(varData.highest_transaction.item_categories)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 mb-1">Highest Transaction</p>
                    <p className="text-sm font-medium truncate">
                      {varData.highest_transaction.main_product}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {varData.highest_transaction.quantity}
                    </p>
                    {varData.highest_transaction.item_categories?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Categories: {formatCategories(varData.highest_transaction.item_categories)}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm font-medium text-blue-600">
                    {formatRevenue(varData.highest_transaction.revenue)}
                  </div>
                </div>
              )}

              {/* Plus basse transaction */}
              {varData.lowest_transaction && (
                <div className="flex items-center space-x-4 p-4 rounded-md bg-muted/50">
                  <div className="flex-shrink-0 text-orange-600">
                    {getIcon(varData.lowest_transaction.item_categories)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-600 mb-1">Lowest Transaction</p>
                    <p className="text-sm font-medium truncate">
                      {varData.lowest_transaction.main_product}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {varData.lowest_transaction.quantity}
                    </p>
                    {varData.lowest_transaction.item_categories?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Categories: {formatCategories(varData.lowest_transaction.item_categories)}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm font-medium text-orange-600">
                    {formatRevenue(varData.lowest_transaction.revenue)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}