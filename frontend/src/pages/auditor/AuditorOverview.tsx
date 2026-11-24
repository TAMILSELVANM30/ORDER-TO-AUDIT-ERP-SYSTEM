import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, FileText, ShoppingCart, Package, TrendingUp,
  Download, BarChart2, ArrowRight, AlertCircle
} from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'

interface QuickLink {
  label: string
  to: string
  icon: React.ElementType
  color: string
  bg: string
  description: string
}

const quickLinks: QuickLink[] = [
  { label: 'Sales Register', to: '/auditor/sales-register', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', description: 'All approved invoices with GST breakdown' },
  { label: 'Purchase Register', to: '/auditor/purchase-register', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', description: 'Raw material purchases from suppliers' },
  { label: 'GST Reports', to: '/auditor/gst-reports', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', description: 'GSTR-1 summary table (not a filed return)' },
  { label: 'Stock Summary', to: '/auditor/stock-summary', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', description: 'Current inventory valuation snapshot' },
  { label: 'Stock Ledger', to: '/auditor/stock-ledger', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', description: 'Full movement trail for any item' },
  { label: 'Production Reports', to: '/auditor/production-reports', icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50', description: 'Batch runs, yield variance, wastage' },
  { label: 'Outstanding / Ageing', to: '/auditor/outstanding', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', description: 'Overdue customer balances by bucket' },
  { label: 'Export Centre', to: '/auditor/export', icon: Download, color: 'text-green-600', bg: 'bg-green-50', description: 'Download CSV / Excel for all reports' },
]

export default function AuditorOverview() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', 'auditor'],
    queryFn: () => api.get('/dashboard/auditor').then(r => r.data),
  })

  const stats = dashboard?.data ?? {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Overview"
        subtitle="Read-only audit centre — view, filter and export all business registers"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: stats.total_invoices ?? '—' },
          { label: 'Total Revenue', value: stats.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—' },
          { label: 'Outstanding', value: stats.total_outstanding ? `₹${Number(stats.total_outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—' },
          { label: 'Production Runs', value: stats.total_production_runs ?? '—' },
        ].map(card => (
          <div key={card.label} className="card p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Navigate to Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-4 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-lg ${link.bg} flex items-center justify-center mb-3`}>
                <link.icon className={`w-5 h-5 ${link.color}`} />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{link.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 mt-0.5 flex-shrink-0 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-4 border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Auditor — Read-Only Access</p>
            <p className="text-xs text-amber-700 mt-1">
              You can view and export all registers. You cannot create, modify or delete any business records.
              All reports are generated from live database data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
