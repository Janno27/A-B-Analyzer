'use client';

import React, { useEffect, useState } from 'react';
import { tooltipEventEmitter } from './RevenueRadarChart';
import { VARIATION_COLORS } from '@/lib/constants';

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
  }).format(value / 100);

export const RemoteTooltip = ({ currency, locale }: { currency: string; locale: string }) => {
  const [tooltipData, setTooltipData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = tooltipEventEmitter.subscribe((data: any) => {
      setTooltipData(data);
    });

    return unsubscribe;
  }, []);

  if (!tooltipData) return null;

  const { range, data } = tooltipData;
  const controlVariation = Object.keys(data.metrics).find(v => v.toLowerCase().includes('control'));

  return (
    <div className="tooltip-overlay">
      <div className="tooltip-arrow"></div>
      <h3 className="font-medium text-lg mb-2">{range}</h3>
      <div className="space-y-4">
        {Object.entries(data.metrics).map(([variation, metrics]: [string, any], index) => (
          <div key={variation} className="space-y-1">
            <h4 className="font-medium text-sm" style={{ color: VARIATION_COLORS[index].stroke }}>
              {variation.split('_').pop()}
            </h4>
            <div className="grid grid-cols-2 gap-x-2 text-sm">
              <span>Transactions:</span>
              <span>{metrics.transactions} ({formatPercent(metrics.transaction_share, locale)})</span>

              <span>Revenue:</span>
              <div>
                {formatCurrency(data.revenues[variation], currency, locale)}
                {variation !== controlVariation && (
                  <span className={metrics.revenue_uplift >= 0 ? "text-green-600" : "text-red-600"}>
                    {' '}({formatPercent(metrics.revenue_uplift/100, locale)} | 
                    {formatPercent(metrics.revenue_confidence/100, locale)} conf.)
                  </span>
                )}
              </div>

              <span>AOV:</span>
              <div>
                {formatCurrency(metrics.aov, currency, locale)}
                {variation !== controlVariation && (
                  <span className={metrics.aov_uplift >= 0 ? "text-green-600" : "text-red-600"}>
                    {' '}({formatPercent(metrics.aov_uplift/100, locale)} | 
                    {formatPercent(metrics.aov_confidence/100, locale)} conf.)
                  </span>
                )}
              </div>

              <span>RPU:</span>
              <div>
                {formatCurrency(metrics.rpu, currency, locale)}
                {variation !== controlVariation && (
                  <span className={metrics.rpu_uplift >= 0 ? "text-green-600" : "text-red-600"}>
                    {' '}({formatPercent(metrics.rpu_uplift/100, locale)} | 
                    {formatPercent(metrics.rpu_confidence/100, locale)} conf.)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};