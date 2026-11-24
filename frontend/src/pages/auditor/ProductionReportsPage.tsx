import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import ChartCard from '../../components/charts/ChartCard'

interface ProductionRun {
  run_id: string
  product_name: string
  batch_size: number
  good_output: number
  waste_qty: number
  start_date: string
  end_date: string
  variance_percent: number
}

export default function ProductionReportsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['production-reports', page],
    queryFn: () =>
      api.get('/reports/production', { params: { page, per_page: 25 } }).then(r => r.data),
  })

  const runs: ProductionRun[] = data?.data?.entries ?? []
  const total = data?.data?.total ?? 0

  const columns = [
    { key: 'run_id', label: 'Run ID', sortable: true },
    { key: 'product_name', label: 'Product', sortable: true },
    { key: 'batch_size', label: 'Batch Size', render: (v: number) => `${v} pkts`, sortable: true },
    { key: 'good_output', label: 'Good Output', render: (v: number) => `${v} pkts`, sortable: true },
    { key: 'waste_qty', label: 'Waste', render: (v: number) => `${v} pkts`, sortable: true },
    {
      key: 'variance_percent',
      label: 'Yield Variance',
      render: (v: number) => (
        <span className={v < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
          {v.toFixed(2)}%
        </span>
      ),
      sortable: true,
    },
    { key: 'start_date', label: 'Start', render: (v: string) => new Date(v).toLocaleDateString('en-IN'), sortable: true },
    { key: 'end_date', label: 'End', render: (v: string) => new Date(v).toLocaleDateString('en-IN'), sortable: true },
  ]

  // Simple chart data – total good vs waste for recent runs (first 10)
  const chartData = runs.slice(0, 10).map(r => ({
    name: r.product_name,
    Good: r.good_output,
    Waste: r.waste_qty,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Reports"
        subtitle="Batch runs with yield variance and waste analysis"
      />

      <ChartCard
        title="Recent Production – Good vs Waste"
        chartType="bar"
        data={chartData}
        xKey="name"
        barKeys={['Good', 'Waste']}
        colors={['#0D9488', '#DC2626']}
      />

      <DataTable
        columns={columns as any}
        data={runs}
        isLoading={isLoading}
        emptyMessage="No production runs found"
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
