import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardMetricCard } from '../../components/common/DashboardMetricCard';
import {
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  PieChart as PieIcon,
  BarChart2,
  FileSpreadsheet,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const OwnerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerDashboard = async () => {
      try {
        const res = await api.get('/dashboard/owner');
        setData(res.data);
      } catch (e) {
        console.error('Failed to load owner dashboard', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const monthlyRevenue = data?.monthly_revenue || [];
  const topProducts = data?.top_products || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive & Financial Overview"
        subtitle="Dakshin Packaged Foods Pvt Ltd — Strategic performance, gross margins, and working capital"
      />

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Total Revenue"
          value={`₹${(kpis.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="All invoiced revenue"
          icon={DollarSign}
        />
        <DashboardMetricCard
          title="Production Cost"
          value={`₹${(kpis.production_expenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Materials & processing costs"
          icon={BarChart2}
        />
        <DashboardMetricCard
          title="Gross Profit"
          value={`₹${(kpis.approx_gross_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Revenue - Production Cost"
          icon={TrendingUp}
        />
        <DashboardMetricCard
          title="Receivables"
          value={`₹${(kpis.receivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Outstanding customer balance"
          icon={CreditCard}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Inventory Valuation</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ₹{(kpis.inventory_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Raw materials + Finished goods</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Finished Goods Stock</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">
            {kpis.finished_goods_packets || 0} pkts
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Packaged ready for dispatch</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Customer Orders</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {kpis.pending_orders || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting review or dispatch</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Revenue Trend (₹)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#FFF', borderColor: '#E2E8F0', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Selling Products</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11, fill: '#64748B' }} width={120} />
                <Tooltip
                  formatter={(val: any) => [`${val} pkts`, 'Quantity Sold']}
                  contentStyle={{ backgroundColor: '#FFF', borderColor: '#E2E8F0', borderRadius: '8px' }}
                />
                <Bar dataKey="quantity" fill="#172554" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
