import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ListOrdered, Settings } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

interface BOMComponent {
  component_code: string
  component_name: string
  quantity_per_pack: number
  unit: string
}

interface BOM {
  product_code: string
  product_name: string
  version: number
  components: BOMComponent[]
}

export default function ProductionBOMPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['production', 'bom-list'],
    queryFn: () => api.get('/boms').then(r => r.data),
  })

  const boms: BOM[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill of Materials"
        subtitle="Read‑only view of product recipes for production planning"
      />

      {boms.length === 0 && !isLoading && (
        <div className="p-8 text-center text-slate-500">No BOMs defined.</div>
      )}

      {boms.map(bom => (
        <div key={bom.product_code} className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <ListOrdered className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-slate-900">{bom.product_name} (v{bom.version})</h3>
          </div>
          <DataTable
            columns={[
              { key: 'component_code', label: 'Code', sortable: true },
              { key: 'component_name', label: 'Material', sortable: true },
              {
                key: 'quantity_per_pack',
                label: 'Qty per Pack',
                render: (v: number, row: any) => (
                  <span className="font-mono text-sm">{Number(v).toFixed(3)} {row.unit}</span>
                ),
                sortable: true,
              },
            ] as any}
            data={bom.components}
            isLoading={isLoading}
            emptyMessage="No components"
            searchable={false}
          />
        </div>
      ))}
    </div>
  )
}
