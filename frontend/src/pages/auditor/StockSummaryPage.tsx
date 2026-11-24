import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, AlertCircle, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StockIndicator from '../../components/common/StockIndicator'

interface StockItem {
  code: string
  name: string
  item_type: 'MATERIAL' | 'PRODUCT'
  unit: string
  closing_stock: number
  unit_cost: number
  stock_value: number
  is_low_stock?: boolean
}

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Item Name', sortable: true },
  { key: 'item_type', label: 'Type', render: (v: string) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      v === 'MATERIAL' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
    }`}>{v === 'MATERIAL' ? 'Raw Material' : 'Finished Good'}</span>
  )},
  { key: 'closing_stock', label: 'Qty', sortable: true, render: (v: number, row: StockItem) => (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{Number(v).toFixed(3)}</span>
      <span className="text-xs text-slate-400">{row.unit}</span>
    </div>
  )},
  { key: 'unit_cost', label: 'Avg Cost', sortable: true, render: (v: number) => (
    <span className="font-mono text-sm">₹{Number(v).toFixed(3)}</span>
  )},
  { key: 'stock_value', label: 'Stock Value', sortable: true, render: (v: number) => (
    <span className="font-mono text-sm font-semibold text-slate-900">
      ₹{Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </span>
  )},
  { key: 'closing_stock', label: 'Status', render: (v: number, row: StockItem) => (
    <StockIndicator currentStock={v} minStock={10} unit={row.unit} />
  )},
]

export default function StockSummaryPage() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MATERIAL' | 'PRODUCT'>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: () => api.get('/inventory/summary').then(r => r.data),
  })

  const items: StockItem[] = data?.data ?? data?.summary ?? []
  const filtered = typeFilter === 'ALL' ? items : items.filter(i => i.item_type === typeFilter)

  const totalValue = items.reduce((s, i) => s + Number(i.stock_value || 0), 0)
  const lowStockCount = items.filter(i => i.is_low_stock).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Summary"
        subtitle="Current inventory snapshot with weighted-average cost valuation"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total SKUs</p>
              <p className="text-2xl font-bold text-slate-900">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Inventory Value</p>
              <p className="text-xl font-bold text-slate-900">
                ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <AlertCircle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Low Stock Alerts</p>
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'MATERIAL', 'PRODUCT'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL' ? 'All Items' : t === 'MATERIAL' ? 'Raw Materials' : 'Finished Goods'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No stock items found"
        searchable
        searchKeys={['item_name', 'item_code']}
      />
    </div>
  )
}
