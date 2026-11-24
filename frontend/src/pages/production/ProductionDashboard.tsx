import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardMetricCard } from '../../components/common/DashboardMetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { VarianceIndicator } from '../../components/common/VarianceIndicator';
import { Factory, CheckCircle2, AlertTriangle, Plus, Boxes, ArrowRight } from 'lucide-react';

export const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/production');
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
  const recentRuns = data?.recent_runs || [];
  const lowMaterials = data?.low_stock_materials || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturing & Batch Production"
        subtitle="Batch run execution, BOM formulation adherence, yield variances, wastage recording, and unit manufacturing cost"
        breadcrumbs={[{ label: 'Production' }, { label: 'Dashboard' }]}
        action={
          <Link
            to="/production/runs"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Production Run
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Active Draft Runs"
          value={kpis.active_draft_runs ?? 0}
          subtitle="Batches in progress"
          icon={Factory}
        />
        <DashboardMetricCard
          title="Completed Batches"
          value={kpis.completed_runs ?? 0}
          subtitle="Posted to finished stock"
          icon={CheckCircle2}
        />
        <DashboardMetricCard
          title="Total Packets Produced"
          value={`${kpis.total_packets_produced ?? 0} pkts`}
          subtitle="Good finished product output"
          icon={Boxes}
        />
        <DashboardMetricCard
          title="Material Alerts"
          value={kpis.material_alerts ?? 0}
          subtitle="Raw materials below minimum stock"
          icon={AlertTriangle}
          isAlert={kpis.material_alerts > 0}
        />
      </div>

      {/* Low Stock Alert Banner */}
      {lowMaterials.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Raw Material Low Stock Warning:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowMaterials.map((m: any) => (
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

      {/* Recent Production Runs */}
      <div className="bg-white rounded-xl border border-borderLine p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-mainText">Recent Production Batches</h3>
            <p className="text-xs text-secondaryText">Yield variances, material issues and packet unit costing</p>
          </div>
          <Link to="/production/runs" className="text-xs font-semibold text-accent hover:underline flex items-center">
            <span>Manage All Runs</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="divide-y divide-borderLine">
          {recentRuns.length > 0 ? (
            recentRuns.map((run: any) => (
              <div key={run.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-mainText">{run.run_number}</span>
                    <span className="text-secondaryText">• {run.product_name}</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-secondaryText text-[11px] mt-0.5">
                    Batch Size: {run.batch_size} pkts | Good Output: <b>{run.actual_good_output} pkts</b> | Damaged: {run.damaged_output}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-secondaryText text-[11px]">Yield Variance</p>
                    <VarianceIndicator value={run.yield_variance_pct} />
                  </div>
                  <div className="text-right pl-3 border-l border-borderLine">
                    <p className="text-secondaryText text-[11px]">Cost / Packet</p>
                    <p className="font-bold text-primary text-sm">₹{run.cost_per_packet.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-secondaryText py-6 text-center">No production runs recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;
