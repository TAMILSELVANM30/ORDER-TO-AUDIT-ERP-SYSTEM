import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, Table } from 'lucide-react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'

interface ExportItem {
  name: string
  endpoint: string // API path returning CSV/Excel
  description: string
}

const exports: ExportItem[] = [
  { name: 'Sales Register', endpoint: '/reports/sales', description: 'All sales invoices with GST details' },
  { name: 'Purchase Register', endpoint: '/reports/purchases', description: 'Raw material purchases and costs' },
  { name: 'GST Summary', endpoint: '/reports/gst', description: 'GSTR‑1 style summary (not filed)' },
  { name: 'Stock Summary', endpoint: '/reports/stock-summary', description: 'Current inventory valuation snapshot' },
  { name: 'Production Runs', endpoint: '/reports/production', description: 'Batch runs, yields, material variance' },
]

export default function ExportCenterPage() {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv')

  const handleExport = async (item: ExportItem) => {
    try {
      const res = await api.get(item.endpoint, {
        params: { format },
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.name.replace(/\s+/g, '_')}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error', e)
      // UI can show toast – omitted for brevity
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Centre"
        subtitle="Download any business register in CSV or Excel format for external analysis"
      />

      <div className="flex items-center gap-4">
        <label className="form-label" htmlFor="format-select">File format</label>
        <select
          id="format-select"
          className="form-select w-32"
          value={format}
          onChange={e => setFormat(e.target.value as any)}
        >
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map(item => (
          <div key={item.name} className="card p-4 flex items-start gap-3">
            <FileText className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500 mb-2">{item.description}</p>
              <button
                className="btn-primary"
                onClick={() => handleExport(item)}
              >
                <Download className="w-4 h-4" /> Export {format.toUpperCase()}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
