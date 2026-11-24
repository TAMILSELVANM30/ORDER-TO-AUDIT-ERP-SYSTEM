import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

export default function MyCustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-customers'],
    queryFn: () => api.get('/customers/assigned').then(r => r.data),
  })

  const customers = data?.data ?? []

  const columns = [
    { key: 'customer_code', label: 'Code', sortable: true },
    { key: 'customer_name', label: 'Name', sortable: true },
    { key: 'contact_person', label: 'Contact', sortable: true },
    { key: 'mobile', label: 'Mobile', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'credit_limit', label: 'Credit Limit', render: (v:any)=>`₹${Number(v).toLocaleString('en-IN', {minimumFractionDigits:2})}` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Customers"
        subtitle="Read‑only list of customers assigned to you – view contact details and credit limits"
      />
      <DataTable
        columns={columns as any}
        data={customers}
        isLoading={isLoading}
        emptyMessage="No customers assigned"
        searchable
        searchKeys={['customer_name','customer_code','contact_person']}
      />
    </div>
  )
}
