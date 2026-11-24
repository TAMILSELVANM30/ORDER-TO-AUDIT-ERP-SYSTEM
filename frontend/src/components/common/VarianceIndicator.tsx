import React from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface VarianceIndicatorProps {
  value: number; // Percentage
  tolerance?: number;
  label?: string;
  unit?: string;
}

export const VarianceIndicator: React.FC<VarianceIndicatorProps> = ({
  value,
  tolerance = 3.0,
  label,
  unit = '%',
}) => {
  const isNormal = Math.abs(value) <= tolerance;
  const isPositive = value > 0;

  if (isNormal) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5 mr-1" />
        {isPositive ? `+${value.toFixed(1)}` : value.toFixed(1)}{unit} {label && `(${label})`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
      {isPositive ? `+${value.toFixed(1)}` : value.toFixed(1)}{unit}
      <span className="ml-1 text-[10px] text-amber-700 font-normal">
        {isPositive ? 'Excess' : 'Shortfall'}
      </span>
    </span>
  );
};
