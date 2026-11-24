import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-borderLine pb-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-xs text-secondaryText mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-mainText' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-mainText">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-secondaryText mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center space-x-3">{action}</div>}
    </div>
  );
};

export default PageHeader;
