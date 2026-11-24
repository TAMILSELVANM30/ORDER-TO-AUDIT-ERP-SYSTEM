import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status ? status.toUpperCase() : 'UNKNOWN';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['APPROVED', 'PAID', 'POSTED', 'DISPATCHED', 'ACTIVE', 'NORMAL'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['SUBMITTED', 'INVOICED', 'PARTIALLY_DISPATCHED', 'PARTIAL'].includes(normalized)) {
    colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (['DRAFT', 'PENDING', 'UNPAID'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['REJECTED', 'CANCELLED', 'OVERDUE', 'SHORTAGE', 'EXCESS'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
