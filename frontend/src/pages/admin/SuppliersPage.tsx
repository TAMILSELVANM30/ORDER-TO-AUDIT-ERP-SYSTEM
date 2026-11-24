import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Supplier } from '../../types';
import { Building2 } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/suppliers');
        setSuppliers(res.data.suppliers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const columns = [
    {
      header: 'Code & Name',
      accessor: (row: Supplier) => (
        <div>
          <span className="font-semibold text-mainText">{row.supplier_name}</span>
          <span className="block text-[11px] text-secondaryText font-mono">{row.supplier_code}</span>
        </div>
      ),
    },
    {
      header: 'GSTIN',
      accessor: (row: Supplier) => <span className="font-mono text-xs">{row.gstin || 'N/A'}</span>,
    },
    {
      header: 'Location',
      accessor: (row: Supplier) => <span>{row.address}, {row.state}</span>,
    },
    {
      header: 'Payment Terms',
      accessor: (row: Supplier) => (
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {row.payment_terms}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Directory"
        subtitle="Raw material and packaging suppliers with GST compliance and credit terms"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Suppliers' }]}
      />

      <DataTable
        columns={columns}
        data={suppliers}
        searchKey="supplier_name"
        searchPlaceholder="Search supplier name or code..."
        isLoading={loading}
      />
    </div>
  );
};

export default SuppliersPage;
