import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  isAlert?: boolean;
  className?: string;
}

export const DashboardMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isAlert = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${
        isAlert ? 'border-amber-300 bg-amber-50/20' : 'border-borderLine'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-secondaryText">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 text-secondary">
            <Icon className="w-5 h-5 text-secondary" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-2xl font-bold tracking-tight text-mainText">{value}</p>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-secondaryText">{subtitle}</p>}
    </div>
  );
};
