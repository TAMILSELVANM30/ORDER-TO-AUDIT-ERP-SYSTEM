import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Dispatch } from '../../types';
import { Truck } from 'lucide-react';

export const DispatchesPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDispatches = async () => {
      try {
        const res = await api.get('/dispatches');
        setDispatches(res.data.dispatches);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDispatches();
  }, []);

  const columns = [
    {
      header: 'Dispatch #',
      accessor: (row: Dispatch) => (
        <div>
          <span className="font-semibold text-mainText">{row.dispatch_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.dispatch_date}</span>
        </div>
      ),
    },
    {
      header: 'Invoice #',
      accessor: (row: Dispatch) => <span className="font-medium text-mainText">{row.invoice_number || 'N/A'}</span>,
    },
    {
      header: 'Customer',
      accessor: (row: Dispatch) => <span className="text-mainText">{row.customer_name || 'N/A'}</span>,
    },
    {
      header: 'Vehicle / Ref',
      accessor: (row: Dispatch) => <span className="text-xs text-secondaryText">{row.vehicle_no || 'Standard Delivery'}</span>,
    },
    {
      header: 'Items Dispatched',
      accessor: (row: Dispatch) => (
        <span className="text-xs">
          {row.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Dispatched By',
      accessor: (row: Dispatch) => <span className="text-xs text-secondaryText">{row.created_by || 'Admin'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Dispatch Register"
        subtitle="Complete traceability of finished product movements leaving factory stock"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Dispatches' }]}
      />

      <DataTable
        columns={columns}
        data={dispatches}
        searchKey="dispatch_number"
        searchPlaceholder="Search dispatch # or customer..."
        isLoading={loading}
      />
    </div>
  );
};

export default DispatchesPage;
