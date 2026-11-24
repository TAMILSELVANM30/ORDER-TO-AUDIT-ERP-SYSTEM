import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardMetricCard } from '../../components/common/DashboardMetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShoppingCart,
  Clock,
  DollarSign,
  Package,
  AlertTriangle,
  Truck,
  CreditCard,
  Factory,
  ArrowRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (e) {
        console.error('Failed to load admin dashboard', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recent = data?.recent_activity || {};
  const alerts = data?.alerts || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations & Executive Overview"
        subtitle="Real-time production, order fulfilment, inventory valuation, and tax accounting metrics"
        breadcrumbs={[{ label: 'Dakshin ERP' }, { label: 'Admin Overview' }]}
        action={
          <Link
            to="/admin/orders"
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-light shadow-xs transition-colors"
          >
            Review Orders
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Today's Orders"
          value={kpis.today_orders ?? 0}
          subtitle="Orders logged today"
          icon={ShoppingCart}
        />
        <DashboardMetricCard
          title="Pending Approvals"
          value={kpis.pending_approvals ?? 0}
          subtitle="Awaiting admin stock review"
          icon={Clock}
          isAlert={kpis.pending_approvals > 0}
        />
        <DashboardMetricCard
          title="Today's Sales"
          value={`₹${(kpis.today_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Invoiced outward supply"
          icon={DollarSign}
        />
        <DashboardMetricCard
          title="Finished Goods Stock"
          value={`${kpis.total_fg_stock ?? 0} pkts`}
          subtitle="Available for dispatch"
          icon={Package}
        />
        <DashboardMetricCard
          title="Pending Dispatches"
          value={kpis.pending_dispatches ?? 0}
          subtitle="Invoiced orders in warehouse"
          icon={Truck}
        />
        <DashboardMetricCard
          title="Total Receivables"
          value={`₹${(kpis.total_receivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Outstanding customer balances"
          icon={CreditCard}
        />
        <DashboardMetricCard
          title="Raw Material Alerts"
          value={kpis.raw_mat_alerts ?? 0}
          subtitle="Items below safety threshold"
          icon={AlertTriangle}
          isAlert={kpis.raw_mat_alerts > 0}
        />
        <DashboardMetricCard
          title="Production Variance Alerts"
          value={kpis.variance_alerts ?? 0}
          subtitle="Runs exceeding 3% tolerance"
          icon={Factory}
          isAlert={kpis.variance_alerts > 0}
        />
      </div>

      {/* Alerts Section if Any */}
      {alerts.low_stock_materials?.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Safety Threshold Alert:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.low_stock_materials.map((m: any) => (
              <span
                key={m.id}
                className="text-xs px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 font-medium"
              >
                {m.name}: <span className="font-bold">{m.current_stock} {m.unit}</span> (Min: {m.min_stock_level})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-borderLine p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-mainText">Product-wise Sales Revenue</h3>
              <p className="text-xs text-secondaryText">Revenue generated by finished goods</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {charts.product_sales?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.product_sales} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-secondaryText">
                No sales data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Links & Info */}
        <div className="bg-white rounded-xl border border-borderLine p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-mainText mb-1">NIT Trichy Benchmark Scenario</h3>
            <p className="text-xs text-secondaryText mb-4">
              Integrated ERP workflow tracking: Murukku 200g batch, Flour purchase, -6% Yield variance, +5% Oil variance, Retailer A GST invoice (₹7,875), and Distributor B shortage detection.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-borderLine">
                <span className="text-secondaryText">Murukku Selling Price:</span>
                <span className="font-semibold text-mainText">₹50.00 / pkt</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderLine">
                <span className="text-secondaryText">Standard GST Rate:</span>
                <span className="font-semibold text-mainText">5.0%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderLine">
                <span className="text-secondaryText">Factory Location:</span>
                <span className="font-semibold text-mainText">Tamil Nadu (33)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-borderLine">
                <span className="text-secondaryText">Target Cost per Packet:</span>
                <span className="font-semibold text-accent">≈ ₹31.14</span>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-borderLine">
            <Link
              to="/auditor/gst-reports"
              className="w-full inline-flex items-center justify-center py-2 px-3 rounded-lg border border-borderLine text-xs font-semibold text-mainText hover:bg-slate-50 transition-colors"
            >
              View GSTR-1 & 3B Summary
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Production Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-borderLine p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-mainText">Recent Sales Orders</h3>
            <Link to="/admin/orders" className="text-xs font-semibold text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-borderLine">
            {recent.orders?.length > 0 ? (
              recent.orders.slice(0, 4).map((order: any) => (
                <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
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
              <p className="text-xs text-secondaryText py-4 text-center">No orders recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Production Runs */}
        <div className="bg-white rounded-xl border border-borderLine p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-mainText">Recent Production Batches</h3>
            <Link to="/admin/production" className="text-xs font-semibold text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-borderLine">
            {recent.production_runs?.length > 0 ? (
              recent.production_runs.slice(0, 4).map((run: any) => (
                <div key={run.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-mainText">{run.run_number} ({run.product_name})</p>
                    <p className="text-secondaryText text-[11px]">
                      Yield: {run.actual_good_output} pkts (Var: {run.yield_variance_pct}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-mainText">₹{run.cost_per_packet.toFixed(2)}/pkt</p>
                    <StatusBadge status={run.status} className="mt-0.5" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-secondaryText py-4 text-center">No production runs recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
