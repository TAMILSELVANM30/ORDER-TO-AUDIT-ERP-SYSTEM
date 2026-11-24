import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SalesOrder } from '../../types';
import { PlusCircle } from 'lucide-react';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/orders');
        setOrders(res.data.orders);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const columns = [
    {
      header: 'Order #',
      accessor: (row: SalesOrder) => (
        <div>
          <span className="font-semibold text-mainText">{row.order_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.order_date}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: SalesOrder) => (
        <div>
          <span className="font-medium text-mainText">{row.customer_name}</span>
          <span className="block text-[11px] text-secondaryText">{row.customer_state}</span>
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: (row: SalesOrder) => (
        <span className="text-xs">
          {row.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Grand Total',
      accessor: (row: SalesOrder) => (
        <span className="font-bold text-mainText">₹{row.grand_total.toFixed(2)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: SalesOrder) => (
        <div>
          <StatusBadge status={row.status} />
          {row.rejection_reason && (
            <span className="block text-[10px] text-rose-600 mt-1 max-w-xs">{row.rejection_reason}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Sales Orders"
        subtitle="Track submitted orders through verification, approval, invoicing, and warehouse dispatch"
        breadcrumbs={[{ label: 'Salesman' }, { label: 'My Orders' }]}
        action={
          <Link
            to="/salesman/new-order"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Place New Order
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={orders}
        searchKey="order_number"
        searchPlaceholder="Search order number or customer..."
        isLoading={loading}
      />
    </div>
  );
};

export default MyOrdersPage;
