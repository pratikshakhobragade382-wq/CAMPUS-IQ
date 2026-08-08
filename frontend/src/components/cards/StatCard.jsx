/**
 * Stat Card Component
 * Displays statistics with icons and trends
 */

import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50',
    purple: 'bg-purple-50',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  const isTrendingUp = trend === 'up';

  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-100 p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {isTrendingUp ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={isTrendingUp ? 'text-green-600' : 'text-red-600'}>
                {trendValue}
              </span>
              <span className="text-xs text-gray-600">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-3 rounded-lg', iconColorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
