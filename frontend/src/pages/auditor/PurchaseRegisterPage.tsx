import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Download, FileSpreadsheet } from 'lucide-react';

export const PurchaseRegisterPage: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/purchases');
        setPurchases(res.data.purchases);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const res = await api.get(`/reports/export?report_type=purchases&format=${format}`, {
        responseType: 'blob',
      });
      const ext = format === 'excel' ? 'xlsx' : 'csv';
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase_register_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const columns = [
    {
      header: 'Purchase #',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-mainText">{row.purchase_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.purchase_date}</span>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessor: (row: any) => (
        <div>
          <span className="font-medium text-mainText">{row.supplier_name}</span>
          {row.supplier_invoice_no && (
            <span className="block text-[11px] text-secondaryText">Inv: {row.supplier_invoice_no}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Material / Ingredient',
      accessor: (row: any) => (
        <div>
          <span className="font-medium">{row.material_name}</span>
          <span className="block text-[11px] text-secondaryText">
            {row.quantity} {row.unit} @ ₹{row.rate}/{row.unit}
          </span>
        </div>
      ),
    },
    {
      header: 'Taxable Val',
      accessor: (row: any) => <span className="font-medium">₹{row.taxable_amount.toFixed(2)}</span>,
    },
    {
      header: 'Tax (5%)',
      accessor: (row: any) => <span className="text-secondaryText">₹{row.tax_amount.toFixed(2)}</span>,
    },
    {
      header: 'Total Value',
      accessor: (row: any) => <span className="font-bold text-mainText">₹{row.total_amount.toFixed(2)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inward Purchase Register"
        subtitle="Raw material and packaging procurement register with supplier invoices and input tax credits"
        breadcrumbs={[{ label: 'Auditor' }, { label: 'Purchase Register' }]}
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
        data={purchases}
        searchKey="supplier_name"
        searchPlaceholder="Search purchase register..."
        isLoading={loading}
      />
    </div>
  );
};

export default PurchaseRegisterPage;
