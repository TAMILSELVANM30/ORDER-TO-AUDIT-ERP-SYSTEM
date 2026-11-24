import React from 'react';

interface StockIndicatorProps {
  currentStock: number;
  minStock: number;
  unit?: string;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  currentStock,
  minStock,
  unit = '',
}) => {
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock <= minStock && !isOutOfStock;

  if (isOutOfStock) {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
        Out of Stock (0 {unit})
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300">
        Low Stock: {currentStock.toFixed(1)} {unit} (Min: {minStock.toFixed(1)})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
      {currentStock.toFixed(1)} {unit}
    </span>
  );
};

export default StockIndicator;
