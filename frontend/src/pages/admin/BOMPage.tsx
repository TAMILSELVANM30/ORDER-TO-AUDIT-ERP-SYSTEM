import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { BOM } from '../../types';
import { BookOpen, Calculator, Layers, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const BOMPage: React.FC = () => {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBom, setSelectedBom] = useState<BOM | null>(null);
  const [calcBatchSize, setCalcBatchSize] = useState('200');
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchBoms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/boms');
      setBoms(res.data.boms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoms();
  }, []);

  const handleOpenCalculator = (bom: BOM) => {
    setSelectedBom(bom);
    setCalcBatchSize(String(bom.active_version?.batch_size || 200));
    setCalculationResult(null);
    setIsCalcModalOpen(true);
  };

  const handleCalculate = async () => {
    if (!selectedBom) return;
    setCalcLoading(true);
    try {
      const res = await api.post(`/boms/${selectedBom.id}/calculate`, {
        batch_size: parseFloat(calcBatchSize) || 200,
        version_id: selectedBom.active_version?.id,
      });
      setCalculationResult(res.data.calculation);
    } catch (e) {
      alert('Failed to calculate batch requirements');
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill of Materials (BOM) & Recipes"
        subtitle="Standard manufacturing ingredient formulations, packaging requirements, batch yields and dynamic consumption calculation"
        breadcrumbs={[{ label: 'Admin' }, { label: 'BOM' }]}
      />

      {loading ? (
        <div className="h-48 bg-white rounded-xl border border-borderLine animate-pulse" />
      ) : (
        <div className="space-y-6">
          {boms.map((bom) => {
            const activeVer = bom.active_version;
            return (
              <div key={bom.id} className="bg-white rounded-xl border border-borderLine p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-borderLine gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-mainText">{bom.product_name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-accent font-semibold border border-teal-200">
                        Version {activeVer?.version_number} (Active)
                      </span>
                    </div>
                    <p className="text-xs text-secondaryText mt-0.5">
                      Batch Size: <span className="font-semibold text-mainText">{activeVer?.batch_size} packets</span> • Expected Yield: <span className="font-semibold text-mainText">{activeVer?.expected_yield} packets</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCalculator(bom)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-borderLine bg-slate-50 hover:bg-slate-100 text-mainText text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Calculator className="w-4 h-4 mr-1.5 text-accent" />
                    Simulate Batch Run
                  </button>
                </div>

                {/* Recipe Formulation Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-secondaryText border-b border-borderLine">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Component Code</th>
                        <th className="px-4 py-2 font-semibold">Material / Ingredient</th>
                        <th className="px-4 py-2 font-semibold">Type</th>
                        <th className="px-4 py-2 font-semibold text-right">Standard Quantity</th>
                        <th className="px-4 py-2 font-semibold text-right">Per Packet Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderLine">
                      {activeVer?.components?.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-mono text-secondaryText">{c.material_code}</td>
                          <td className="px-4 py-2.5 font-medium text-mainText">{c.material_name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              c.component_type === 'RAW_MATERIAL' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                            }`}>
                              {c.component_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-mainText">
                            {c.standard_quantity} {c.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right text-secondaryText">
                            {(c.standard_quantity / (activeVer?.batch_size || 200)).toFixed(4)} {c.unit}/pkt
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Batch Simulation Modal */}
      <Modal
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        title={`Batch Consumption Simulation: ${selectedBom?.product_name}`}
        subtitle="Calculates required raw material and packaging quantities based on proportional BOM multipliers"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-mainText mb-1">Target Production Batch Size (packets)</label>
              <input
                type="number"
                value={calcBatchSize}
                onChange={(e) => setCalcBatchSize(e.target.value)}
                placeholder="200"
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <button
              onClick={handleCalculate}
              disabled={calcLoading}
              className="mt-5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light"
            >
              {calcLoading ? 'Calculating...' : 'Calculate Requirements'}
            </button>
          </div>

          {calculationResult && (
            <div className="space-y-3 pt-3 border-t border-borderLine animate-in fade-in">
              <div className="flex justify-between items-center text-xs p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-900">
                <span>Expected Good Output: <b>{calculationResult.expected_output} packets</b></span>
                <span>BOM Yield Factor: 100%</span>
              </div>

              <table className="w-full text-left text-xs border border-borderLine rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-secondaryText border-b border-borderLine">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Material</th>
                    <th className="px-3 py-2 font-semibold text-right">Planned Qty</th>
                    <th className="px-3 py-2 font-semibold text-right">In Stock</th>
                    <th className="px-3 py-2 font-semibold text-right">Est. Cost</th>
                    <th className="px-3 py-2 font-semibold text-center">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLine">
                  {calculationResult.components?.map((c: any, idx: number) => (
                    <tr key={idx} className={!c.is_stock_sufficient ? 'bg-rose-50/30' : ''}>
                      <td className="px-3 py-2 font-medium">{c.material_name}</td>
                      <td className="px-3 py-2 text-right font-bold">{c.planned_quantity} {c.unit}</td>
                      <td className="px-3 py-2 text-right text-secondaryText">{c.available_stock} {c.unit}</td>
                      <td className="px-3 py-2 text-right">₹{c.estimated_cost.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        {c.is_stock_sufficient ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                            Sufficient
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">
                            Shortage
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BOMPage;
