import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StockIndicator } from '../../components/common/StockIndicator';
import { Material } from '../../types';
import { Boxes } from 'lucide-react';

export const MaterialStockPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const res = await api.get('/materials');
        setMaterials(res.data.materials);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const columns = [
    {
      header: 'Code & Material Name',
      accessor: (row: Material) => (
        <div>
          <span className="font-semibold text-mainText">{row.name}</span>
          <span className="block text-[11px] text-secondaryText font-mono">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row: Material) => (
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {row.material_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Current Warehouse Stock',
      accessor: (row: Material) => (
        <span className={`font-bold ${row.is_low_stock ? 'text-amber-700' : 'text-mainText'}`}>
          {row.current_stock.toFixed(2)} {row.unit}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Material) => (
        <StockIndicator currentStock={row.current_stock} minStock={row.min_stock_level} unit={row.unit} />
      ),
    },
    {
      header: 'Weighted-Avg Purchase Cost',
      accessor: (row: Material) => (
        <span className="font-semibold text-mainText">₹{row.current_weighted_avg_cost.toFixed(3)} / {row.unit}</span>
      ),
    },
    {
      header: 'Stock Valuation',
      accessor: (row: Material) => (
        <span className="font-bold text-primary">
          ₹{(row.current_stock * row.current_weighted_avg_cost).toFixed(2)}
        </span>
      ),
    },
  ];

  const totalRawMatValuation = materials.reduce(
    (acc, curr) => acc + curr.current_stock * curr.current_weighted_avg_cost,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raw Material & Packaging Inventory"
        subtitle="Stock levels, safety thresholds, and weighted-average valuations for production consumption"
        breadcrumbs={[{ label: 'Production' }, { label: 'Raw Materials' }]}
      />

      {/* Material Valuation Card */}
      <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-xs text-secondaryText font-semibold uppercase tracking-wider">Raw Material Stock Valuation</p>
          <p className="text-2xl font-bold text-primary mt-1">₹{totalRawMatValuation.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">Valued dynamically at weighted-average purchase cost</p>
        </div>
        <div className="p-3 bg-teal-50 text-accent rounded-xl">
          <Boxes className="w-8 h-8" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={materials}
        searchKey="name"
        searchPlaceholder="Search material name or code..."
        isLoading={loading}
      />
    </div>
  );
};

export default MaterialStockPage;
