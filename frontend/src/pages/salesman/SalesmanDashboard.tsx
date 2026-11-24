import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardMetricCard } from '../../components/common/DashboardMetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PlusCircle, ShoppingCart, Users, DollarSign, ArrowRight } from 'lucide-react';

export const SalesmanDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/salesman');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpis = data?.kpis || {};
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Sales Dashboard"
        subtitle="Manage assigned retail accounts, capture field orders, and track fulfilment"
        breadcrumbs={[{ label: 'Salesman' }, { label: 'Dashboard' }]}
        action={
          <Link
            to="/salesman/new-order"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-dark shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            New Order (&lt; 1 Min)
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardMetricCard
          title="Assigned Outlets"
          value={kpis.assigned_customers ?? 0}
          subtitle="Active retail & distributor accounts"
          icon={Users}
        />
        <DashboardMetricCard
          title="Total Orders"
          value={kpis.total_orders ?? 0}
          subtitle="Orders logged in system"
          icon={ShoppingCart}
        />
        <DashboardMetricCard
          title="Total Booked Sales"
          value={`₹${(kpis.total_sales_booked || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Cumulative order value"
          icon={DollarSign}
        />
      </div>

      <div className="bg-white rounded-xl border border-borderLine p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-mainText">My Recent Orders</h3>
          <Link to="/salesman/orders" className="text-xs font-semibold text-accent hover:underline">
            View All Orders
          </Link>
        </div>

        <div className="divide-y divide-borderLine">
          {recentOrders.length > 0 ? (
            recentOrders.map((order: any) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-mainText">{order.order_number}</p>
                  <p className="text-secondaryText text-[11px]">{order.customer_name} • {order.order_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-mainText">₹{order.grand_total.toFixed(2)}</p>
                  <StatusBadge status={order.status} className="mt-0.5" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-secondaryText py-6 text-center">No orders submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesmanDashboard;
