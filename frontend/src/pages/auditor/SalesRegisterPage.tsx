import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Download, FileSpreadsheet } from 'lucide-react';

export const SalesRegisterPage: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/sales');
        setSales(res.data.sales);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const res = await api.get(`/reports/export?report_type=sales&format=${format}`, {
        responseType: 'blob',
      });
      const ext = format === 'excel' ? 'xlsx' : 'csv';
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_register_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-mainText">{row.invoice_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.invoice_date}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: any) => (
        <div>
          <span className="font-medium text-mainText">{row.customer_name}</span>
          <span className="block text-[11px] text-secondaryText font-mono">GSTIN: {row.customer_gstin}</span>
        </div>
      ),
    },
    {
      header: 'Place of Supply',
      accessor: (row: any) => <span>{row.place_of_supply}</span>,
    },
    {
      header: 'Product',
      accessor: (row: any) => (
        <div>
          <span className="font-medium">{row.product_name}</span>
          <span className="block text-[11px] text-secondaryText">
            {row.quantity} pkts @ ₹{row.unit_price}
          </span>
        </div>
      ),
    },
    {
      header: 'Taxable Val',
      accessor: (row: any) => <span className="font-medium">₹{row.taxable_amount.toFixed(2)}</span>,
    },
    {
      header: 'CGST',
      accessor: (row: any) => (
        <span className="text-secondaryText">{row.cgst_amount > 0 ? `₹${row.cgst_amount.toFixed(2)}` : '-'}</span>
      ),
    },
    {
      header: 'SGST',
      accessor: (row: any) => (
        <span className="text-secondaryText">{row.sgst_amount > 0 ? `₹${row.sgst_amount.toFixed(2)}` : '-'}</span>
      ),
    },
    {
      header: 'IGST',
      accessor: (row: any) => (
        <span className="text-secondaryText">{row.igst_amount > 0 ? `₹${row.igst_amount.toFixed(2)}` : '-'}</span>
      ),
    },
    {
      header: 'Invoice Total',
      accessor: (row: any) => <span className="font-bold text-mainText">₹{row.total_amount.toFixed(2)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Sales Register"
        subtitle="Itemized outward sales supplies with HSN classifications, taxable valuations and GST tax splits"
        breadcrumbs={[{ label: 'Auditor' }, { label: 'Sales Register' }]}
        action={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-borderLine bg-white text-secondaryText hover:text-mainText text-xs font-semibold shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Excel (.xlsx)
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={sales}
        searchKey="invoice_number"
        searchPlaceholder="Search sales register..."
        isLoading={loading}
      />
    </div>
  );
};

export default SalesRegisterPage;
