import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  header?: string;
  label?: string; // Compatibility
  key?: string; // Compatibility
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (value: any, row: T) => React.ReactNode; // Compatibility
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchKeys?: string[];
  searchable?: boolean;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
  filterSlot?: React.ReactNode;
  pageSize?: number;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data = [],
  searchKey,
  searchKeys,
  searchable = true,
  searchPlaceholder = 'Search records...',
  isLoading = false,
  emptyMessage = 'No records found.',
  actions,
  filterSlot,
  pageSize = 10,
  pagination,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = (data || []).filter((row) => {
    if (!searchTerm) return true;
    if (searchKey && row[searchKey]) {
      return String(row[searchKey]).toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (searchKeys && searchKeys.length > 0) {
      return searchKeys.some(
        (key) => row[key] && String(row[key]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const effectivePageSize = pagination ? pagination.perPage : pageSize;
  const totalPages = pagination
    ? Math.ceil(pagination.total / effectivePageSize) || 1
    : Math.ceil(filteredData.length / effectivePageSize) || 1;

  const currentActivePage = pagination ? pagination.page : currentPage;
  const paginatedData = pagination
    ? filteredData
    : filteredData.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  const handlePageChange = (newPage: number) => {
    if (pagination) {
      pagination.onPageChange(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      {(searchable !== false || actions || filterSlot) && (
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-3 flex-1 max-w-md">
            {searchable !== false && (
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!pagination) setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 text-slate-800"
                />
              </div>
            )}
            {filterSlot}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 font-semibold text-slate-600 tracking-wider uppercase text-[11px] ${
                    col.className || ''
                  }`}
                >
                  {col.header || col.label || ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-x-1">
                    <Inbox className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">{emptyMessage}</p>
                    {searchTerm && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try modifying search query or filters.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/75 transition-colors">
                  {columns.map((col, colIdx) => {
                    let cellContent: React.ReactNode = null;
                    if (col.render) {
                      const val = col.key ? row[col.key] : col.accessor && typeof col.accessor === 'string' ? row[col.accessor] : undefined;
                      cellContent = col.render(val, row);
                    } else if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(row);
                    } else if (col.accessor) {
                      cellContent = row[col.accessor] as unknown as React.ReactNode;
                    } else if (col.key) {
                      cellContent = row[col.key] as unknown as React.ReactNode;
                    }

                    return (
                      <td key={colIdx} className={`px-4 py-3 text-slate-700 ${col.className || ''}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {filteredData.length === 0 ? 0 : (currentActivePage - 1) * effectivePageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(
                currentActivePage * effectivePageSize,
                pagination ? pagination.total : filteredData.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {pagination ? pagination.total : filteredData.length}
            </span>{' '}
            results
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(1, currentActivePage - 1))}
              disabled={currentActivePage <= 1}
              className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentActivePage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentActivePage + 1))}
              disabled={currentActivePage >= totalPages}
              className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
