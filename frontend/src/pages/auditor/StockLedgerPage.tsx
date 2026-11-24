import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ArrowDownLeft, Minus } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

const MOVEMENT_TYPES = [
  'ALL', 'PURCHASE_IN', 'PRODUCTION_CONSUME', 'PRODUCTION_OUTPUT',
  'SALE_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN_IN', 'DAMAGE_OUT',
]

const movementIcon = (type: string) => {
  if (type.endsWith('_IN') || type === 'PRODUCTION_OUTPUT') return (
    <ArrowDownLeft className="w-4 h-4 text-green-600" />
  )
  if (type.endsWith('_OUT') || type === 'PRODUCTION_CONSUME' || type === 'SALE_OUT') return (
    <ArrowUpRight className="w-4 h-4 text-red-600" />
  )
  return <Minus className="w-4 h-4 text-slate-400" />
}

export default function StockLedgerPage() {
  const [itemType, setItemType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL')
  const [movementFilter, setMovementFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-ledger', itemType, movementFilter, page],
    queryFn: () =>
      api.get('/inventory/ledger', {
        params: {
          item_type: itemType,
          movement_type: movementFilter !== 'ALL' ? movementFilter : undefined,
          page,
          per_page: 25,
        },
      }).then(r => r.data),
  })

  const ledger = data?.data?.entries ?? []
  const total = data?.data?.total ?? 0

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (v: string) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'item_name',
      label: 'Item',
      render: (_: any, row: any) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.item_name}</p>
          <p className="text-xs text-slate-400">{row.item_code}</p>
        </div>
      ),
    },
    {
      key: 'movement_type',
      label: 'Movement',
      render: (v: string) => (
        <div className="flex items-center gap-1.5">
          {movementIcon(v)}
          <span className="text-xs font-medium text-slate-700">{v.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'quantity_in',
      label: 'In',
      render: (v: number) => v ? (
        <span className="text-green-700 font-mono text-sm">+{Number(v).toFixed(3)}</span>
      ) : '—',
    },
    {
      key: 'quantity_out',
      label: 'Out',
      render: (v: number) => v ? (
        <span className="text-red-700 font-mono text-sm">-{Number(v).toFixed(3)}</span>
      ) : '—',
    },
    {
      key: 'balance_after',
      label: 'Balance',
      render: (v: number, row: any) => (
        <span className="font-mono text-sm font-semibold text-slate-900">
          {Number(v).toFixed(3)} {row.unit}
        </span>
      ),
    },
    {
      key: 'unit_cost',
      label: 'Unit Cost',
      render: (v: number) => v ? <span className="font-mono text-xs">₹{Number(v).toFixed(3)}</span> : '—',
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (v: string) => <span className="text-xs text-slate-500 font-mono">{v || '—'}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Ledger"
        subtitle="Complete movement trail for every inventory item — purchases, production, sales, adjustments"
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div>
          <label className="form-label">Item Type</label>
          <div className="flex gap-2">
            {(['MATERIAL', 'PRODUCT'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setItemType(t); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  itemType === t ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'MATERIAL' ? 'Raw Material' : 'Finished Good'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Movement Type</label>
          <select
            value={movementFilter}
            onChange={e => { setMovementFilter(e.target.value); setPage(1) }}
            className="form-select w-52"
          >
            {MOVEMENT_TYPES.map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Movements' : t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={ledger}
        isLoading={isLoading}
        emptyMessage="No ledger entries found"
        pagination={{
          page,
          perPage: 25,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
