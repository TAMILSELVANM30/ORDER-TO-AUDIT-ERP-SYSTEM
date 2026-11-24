import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { VarianceIndicator } from '../../components/common/VarianceIndicator';
import { Modal } from '../../components/common/Modal';
import { ProductionRun, Product, BOM, Material } from '../../types';
import { Plus, Factory, CheckCircle2, AlertTriangle, Eye, ArrowRight, Layers } from 'lucide-react';

export const ProductionRunsPage: React.FC = () => {
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<ProductionRun | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Production Run Wizard Form State
  const [productId, setProductId] = useState('');
  const [bomVersionId, setBomVersionId] = useState('');
  const [batchSize, setBatchSize] = useState('200');
  const [actualGoodOutput, setActualGoodOutput] = useState('188');
  const [damagedOutput, setDamagedOutput] = useState('6');
  const [labourCost, setLabourCost] = useState('1200.00');
  const [gasCost, setGasCost] = useState('600.00');
  const [remarks, setRemarks] = useState('Benchmark batch run');

  // Benchmark default material issues:
  // Flour: 40 kg, Oil: 10.5 L, Spice: 1.2 kg, Pouches: 194 pcs (188 good + 6 damaged), Cartons: 9 pcs
  const [materialIssues, setMaterialIssues] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, pRes, mRes, bRes] = await Promise.all([
        api.get('/production/runs'),
        api.get('/products'),
        api.get('/materials'),
        api.get('/boms'),
      ]);
      setRuns(rRes.data.runs);
      setProducts(pRes.data.products);
      setMaterials(mRes.data.materials);
      setBoms(bRes.data.boms);

      if (pRes.data.products.length > 0) {
        const firstProd = pRes.data.products[0];
        setProductId(firstProd.id);
        const matchingBom = bRes.data.boms.find((b: BOM) => b.product_id === firstProd.id);
        if (matchingBom && matchingBom.active_version) {
          setBomVersionId(matchingBom.active_version.id);
        }
      }

      // Initialize material issues state with benchmark defaults
      const issuesMap: Record<string, string> = {};
      mRes.data.materials.forEach((m: Material) => {
        if (m.code === 'RM-FLOUR') issuesMap[m.id] = '40.0';
        else if (m.code === 'RM-OIL') issuesMap[m.id] = '10.5';
        else if (m.code === 'RM-SPICE') issuesMap[m.id] = '1.2';
        else if (m.code === 'PM-POUCH-200G') issuesMap[m.id] = '194.0';
        else if (m.code === 'PM-CARTON') issuesMap[m.id] = '9.0';
        else issuesMap[m.id] = '0.0';
      });
      setMaterialIssues(issuesMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostRun = async (runId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/production/runs/${runId}/post`);
      setFeedback('Production run posted! Raw materials deducted, finished goods increased, and ledger updated.');
      setIsDetailsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post production run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const issuesPayload = Object.entries(materialIssues).map(([matId, qtyStr]) => {
        const mat = materials.find((m) => m.id === matId);
        return {
          material_id: matId,
          actual_quantity: parseFloat(qtyStr) || 0,
          unit: mat?.unit || 'kg',
          component_type: mat?.material_type || 'RAW_MATERIAL',
        };
      }).filter((it) => it.actual_quantity > 0);

      const res = await api.post('/production/runs', {
        product_id: productId,
        bom_version_id: bomVersionId,
        batch_size: parseFloat(batchSize) || 200,
        actual_good_output: parseFloat(actualGoodOutput) || 0,
        damaged_output: parseFloat(damagedOutput) || 0,
        materials_issued: issuesPayload,
        labour_cost: parseFloat(labourCost) || 0,
        gas_cost: parseFloat(gasCost) || 0,
        remarks,
        auto_post: true, // Post immediately to update inventory for benchmark
      });

      setFeedback(`Batch ${res.data.run.run_number} created and posted successfully! Cost per packet: ₹${res.data.run.cost_per_packet.toFixed(2)}`);
      setIsNewRunModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create production run');
    } finally {
      setActionLoading(false);
    }
  };

  // Yield variance preview
  const expYield = parseFloat(batchSize) || 200;
  const actGood = parseFloat(actualGoodOutput) || 0;
  const yieldVarPreview = expYield > 0 ? ((actGood - expYield) / expYield) * 100 : 0;

  const columns = [
    {
      header: 'Run #',
      accessor: (row: ProductionRun) => (
        <div>
          <span className="font-semibold text-mainText">{row.run_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.production_date}</span>
        </div>
      ),
    },
    {
      header: 'Product',
      accessor: (row: ProductionRun) => (
        <div>
          <span className="font-medium text-mainText">{row.product_name}</span>
          <span className="block text-[11px] text-secondaryText">BOM Ver {(row as any).bom_version_number || 1}</span>
        </div>
      ),
    },
    {
      header: 'Expected / Actual',
      accessor: (row: ProductionRun) => (
        <div>
          <span className="font-bold text-mainText">{row.actual_good_output} pkts</span>
          <span className="block text-[11px] text-secondaryText">Exp: {row.expected_output} pkts</span>
        </div>
      ),
    },
    {
      header: 'Yield Variance',
      accessor: (row: ProductionRun) => <VarianceIndicator value={row.yield_variance_pct} />,
    },
    {
      header: 'Damaged / Waste',
      accessor: (row: ProductionRun) => (
        <span className="text-xs text-rose-700 font-medium">{row.damaged_output} pouches</span>
      ),
    },
    {
      header: 'Total Cost',
      accessor: (row: ProductionRun) => (
        <span className="font-bold text-mainText">₹{row.total_production_cost.toFixed(2)}</span>
      ),
    },
    {
      header: 'Cost / Packet',
      accessor: (row: ProductionRun) => (
        <span className="font-bold text-accent">₹{row.cost_per_packet.toFixed(2)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: ProductionRun) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: ProductionRun) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedRun(row);
              setIsDetailsModalOpen(true);
            }}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-secondary"
            title="Inspect Run Breakdown"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'DRAFT' && (
            <button
              onClick={() => handlePostRun(row.id)}
              disabled={actionLoading}
              className="px-2 py-1 rounded bg-emerald-600 text-white font-medium text-[11px] hover:bg-emerald-700 shadow-2xs"
            >
              Post to Inventory
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Runs & Batch Execution"
        subtitle="Manage shopfloor batches, record material consumption, track yield and ingredient variances, and compute unit manufacturing cost"
        breadcrumbs={[{ label: 'Production' }, { label: 'Batches' }]}
        action={
          <button
            onClick={() => setIsNewRunModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Production Run
          </button>
        }
      />

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={runs}
        searchKey="run_number"
        searchPlaceholder="Search run # or product..."
        isLoading={loading}
      />

      {/* New Production Run Modal Wizard */}
      <Modal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        title="Execute New Manufacturing Batch Run"
        subtitle="Calculates planned BOM consumption, records actual material issues, flags variances and computes packet unit costing"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateRun} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Product SKU</label>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const b = boms.find((item) => item.product_id === e.target.value);
                  if (b && b.active_version) setBomVersionId(b.active_version.id);
                }}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Target Batch Size (packets)</label>
              <input
                type="number"
                required
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Actual Outputs & Wastage */}
          <div className="p-3 bg-slate-50 rounded-xl border border-borderLine space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mainText uppercase tracking-wider">
                Actual Output & Wastage
              </span>
              <VarianceIndicator value={yieldVarPreview} label="Yield Variance" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-mainText mb-1">Actual Good Output (Packets)</label>
                <input
                  type="number"
                  required
                  value={actualGoodOutput}
                  onChange={(e) => setActualGoodOutput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-bold text-mainText"
                />
                <p className="text-[10px] text-secondaryText mt-0.5">Benchmark: 188 packets (Planned 200 → -6% variance)</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-mainText mb-1">Damaged Pouches / Scrap</label>
                <input
                  type="number"
                  value={damagedOutput}
                  onChange={(e) => setDamagedOutput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs text-rose-700 font-semibold"
                />
                <p className="text-[10px] text-secondaryText mt-0.5">Benchmark: 6 damaged pouches during heat sealing</p>
              </div>
            </div>
          </div>

          {/* Actual Material Issued */}
          <div>
            <label className="block text-xs font-semibold text-mainText uppercase tracking-wider mb-2">
              Actual Material Issued to Production Line
            </label>
            <div className="border border-borderLine rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-secondaryText border-b border-borderLine">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Material</th>
                    <th className="px-3 py-2 font-semibold">Planned</th>
                    <th className="px-3 py-2 font-semibold">Actual Issued</th>
                    <th className="px-3 py-2 font-semibold text-right">Variance Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLine">
                  {materials.map((m) => {
                    const actVal = parseFloat(materialIssues[m.id] || '0');
                    let plannedVal = 0;
                    if (m.code === 'RM-FLOUR') plannedVal = 40.0;
                    else if (m.code === 'RM-OIL') plannedVal = 10.0;
                    else if (m.code === 'RM-SPICE') plannedVal = 1.2;
                    else if (m.code === 'PM-POUCH-200G') plannedVal = 200.0;
                    else if (m.code === 'PM-CARTON') plannedVal = 10.0;

                    const varPct = plannedVal > 0 ? ((actVal - plannedVal) / plannedVal) * 100 : 0;

                    return (
                      <tr key={m.id}>
                        <td className="px-3 py-2 font-medium">{m.name}</td>
                        <td className="px-3 py-2 text-secondaryText">
                          {plannedVal} {m.unit}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={materialIssues[m.id] || '0'}
                            onChange={(e) =>
                              setMaterialIssues({ ...materialIssues, [m.id]: e.target.value })
                            }
                            className="w-24 px-2 py-1 border border-borderLine rounded text-xs font-bold"
                          />{' '}
                          <span className="text-[11px] text-secondaryText">{m.unit}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <VarianceIndicator value={varPct} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overheads */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Labour Expense (₹)</label>
              <input
                type="number"
                step="0.01"
                value={labourCost}
                onChange={(e) => setLabourCost(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Gas / Power Overheads (₹)</label>
              <input
                type="number"
                step="0.01"
                value={gasCost}
                onChange={(e) => setGasCost(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-borderLine">
            <button
              type="button"
              onClick={() => setIsNewRunModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-borderLine text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light disabled:opacity-50 shadow-2xs"
            >
              {actionLoading ? 'Posting...' : 'Execute Batch & Post to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Run Inspection Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Production Run Details: ${selectedRun?.run_number}`}
        subtitle={`Product: ${selectedRun?.product_name}`}
        maxWidth="lg"
      >
        {selectedRun && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-borderLine text-xs">
              <div>
                <p className="text-secondaryText">Expected Yield</p>
                <p className="font-bold text-mainText">{selectedRun.expected_output} pkts</p>
              </div>
              <div>
                <p className="text-secondaryText">Actual Good Output</p>
                <p className="font-bold text-emerald-700">{selectedRun.actual_good_output} pkts</p>
              </div>
              <div>
                <p className="text-secondaryText">Yield Variance</p>
                <VarianceIndicator value={selectedRun.yield_variance_pct} />
              </div>
              <div>
                <p className="text-secondaryText">Cost Per Packet</p>
                <p className="font-bold text-accent text-sm">₹{selectedRun.cost_per_packet.toFixed(2)}</p>
              </div>
            </div>

            <div className="border border-borderLine rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-100 border-b border-borderLine text-xs font-semibold text-mainText">
                Consumed Material Breakdown & Variances:
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-secondaryText border-b border-borderLine">
                  <tr>
                    <th className="px-3 py-2">Material</th>
                    <th className="px-3 py-2 text-right">Planned</th>
                    <th className="px-3 py-2 text-right">Actual Issued</th>
                    <th className="px-3 py-2 text-right">Unit Rate</th>
                    <th className="px-3 py-2 text-right">Total Cost</th>
                    <th className="px-3 py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLine">
                  {selectedRun.material_issues?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">{it.material_name}</td>
                      <td className="px-3 py-2 text-right">{it.planned_quantity} {it.unit}</td>
                      <td className="px-3 py-2 text-right font-bold">{it.actual_quantity} {it.unit}</td>
                      <td className="px-3 py-2 text-right">₹{it.unit_cost.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right font-medium">₹{it.total_cost.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <VarianceIndicator value={it.variance_pct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-borderLine text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-secondaryText">Material Cost:</span>
                <span className="font-medium">₹{selectedRun.total_material_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondaryText">Packaging Cost:</span>
                <span className="font-medium">₹{selectedRun.total_packaging_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondaryText">Overheads (Labour & Gas):</span>
                <span className="font-medium">₹{selectedRun.total_overhead.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-borderLine font-bold text-mainText text-sm">
                <span>Total Production Batch Cost:</span>
                <span>₹{selectedRun.total_production_cost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionRunsPage;
