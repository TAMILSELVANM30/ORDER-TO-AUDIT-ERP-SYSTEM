import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

interface Outstanding {
  customer_name: string
  invoice_number: string
  due_date: string
  days_overdue: number
  amount_due: number
  age_bucket: string
}

const ageBuckets = ['0-30', '31-60', '61-90', '>90'] as const

export default function OutstandingPage() {
  const [bucket, setBucket] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['outstanding', bucket],
    queryFn: () =>
      api.get('/reports/outstanding', { params: { bucket: bucket !== 'ALL' ? bucket : undefined } }).then(r => r.data),
  })

  const rows: Outstanding[] = data?.data ?? []

  const columns = [
    { key: 'customer_name', label: 'Customer', sortable: true },
    { key: 'invoice_number', label: 'Invoice #', sortable: true },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (v: string) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      sortable: true,
    },
    { key: 'days_overdue', label: 'Days Overdue', sortable: true },
    {
      key: 'amount_due',
      label: 'Amount Due',
      render: (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      sortable: true,
    },
    { key: 'age_bucket', label: 'Age Bucket', sortable: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outstanding Receivables"
        subtitle="Ageing analysis of unpaid invoices — filter by bucket to focus on overdue risk"
      />

      {/* Filter buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setBucket('ALL')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${bucket === 'ALL' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >All</button>
        {ageBuckets.map(b => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${bucket === b ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >{b} days</button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={rows}
        isLoading={isLoading}
        emptyMessage="No outstanding invoices"
        searchable
        searchKeys={['customer_name', 'invoice_number']}
        pagination={{
          page: 1,
          perPage: 25,
          total: rows.length,
          onPageChange: () => {}, // placeholder – backend supports pagination; UI can be enhanced later
        }}
      />
    </div>
  )
}
