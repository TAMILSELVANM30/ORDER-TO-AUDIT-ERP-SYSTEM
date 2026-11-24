import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StockSummaryItem, StockLedgerEntry } from '../../types';
import { Boxes, History, Layers } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'ledger'>('summary');
  const [summary, setSummary] = useState<StockSummaryItem[]>([]);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [sRes, lRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/inventory/ledger'),
      ]);
      setSummary(sRes.data.summary);
      setLedger(lRes.data.ledger);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const summaryColumns = [
    {
      header: 'Item Code & Name',
      accessor: (row: StockSummaryItem) => (
        <div>
          <span className="font-semibold text-mainText">{row.name}</span>
          <span className="block text-[11px] text-secondaryText font-mono">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row: StockSummaryItem) => (
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Opening',
      accessor: (row: StockSummaryItem) => <span>{row.opening_stock} {row.unit}</span>,
    },
    {
      header: 'Receipts / In',
      accessor: (row: StockSummaryItem) => (
        <span className="font-medium text-emerald-700">+{row.receipts}</span>
      ),
    },
    {
      header: 'Issues / Sales',
      accessor: (row: StockSummaryItem) => (
        <span className="font-medium text-rose-700">
          -{row.issues || row.sales} {row.unit}
        </span>
      ),
    },
    {
      header: 'Closing Balance',
      accessor: (row: StockSummaryItem) => (
        <span className={`font-bold ${row.is_low_stock ? 'text-amber-700' : 'text-mainText'}`}>
          {row.closing_stock} {row.unit}
        </span>
      ),
    },
    {
      header: 'Unit Rate',
      accessor: (row: StockSummaryItem) => <span>₹{row.unit_cost.toFixed(2)}</span>,
    },
    {
      header: 'Total Valuation',
      accessor: (row: StockSummaryItem) => (
        <span className="font-bold text-mainText">₹{row.stock_value.toFixed(2)}</span>
      ),
    },
  ];

  const ledgerColumns = [
    {
      header: 'Date & Time',
      accessor: (row: StockLedgerEntry) => (
        <span className="text-[11px] text-secondaryText">{row.transaction_date?.slice(0, 19).replace('T', ' ')}</span>
      ),
    },
    {
      header: 'Item',
      accessor: (row: StockLedgerEntry) => (
        <div>
          <span className="font-medium text-mainText">{row.item_name}</span>
          <span className="block text-[10px] text-secondaryText font-mono">{row.item_code}</span>
        </div>
      ),
    },
    {
      header: 'Movement Type',
      accessor: (row: StockLedgerEntry) => (
        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-800">
          {row.movement_type}
        </span>
      ),
    },
    {
      header: 'Qty In',
      accessor: (row: StockLedgerEntry) => (
        <span className="font-semibold text-emerald-700">{row.quantity_in > 0 ? `+${row.quantity_in}` : '-'}</span>
      ),
    },
    {
      header: 'Qty Out',
      accessor: (row: StockLedgerEntry) => (
        <span className="font-semibold text-rose-700">{row.quantity_out > 0 ? `-${row.quantity_out}` : '-'}</span>
      ),
    },
    {
      header: 'Balance After',
      accessor: (row: StockLedgerEntry) => (
        <span className="font-bold text-mainText">{row.balance_after} {row.unit}</span>
      ),
    },
    {
      header: 'Source Doc',
      accessor: (row: StockLedgerEntry) => (
        <div>
          <span className="font-mono text-xs text-primary">{row.source_doc_id}</span>
          <span className="block text-[10px] text-secondaryText">{row.source_doc_type}</span>
        </div>
      ),
    },
    {
      header: 'Remarks',
      accessor: (row: StockLedgerEntry) => (
        <span className="text-[11px] text-secondaryText truncate max-w-xs block">{row.remarks || '-'}</span>
      ),
    },
  ];

  const totalValuation = summary.reduce((acc, curr) => acc + curr.stock_value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Engine & Stock Ledger"
        subtitle="Ledger-based atomic inventory tracking with weighted-average valuation, negative stock prevention, and transaction traceability"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Inventory' }]}
        action={
          <div className="flex rounded-lg border border-borderLine p-1 bg-slate-100">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'summary' ? 'bg-white text-mainText shadow-xs' : 'text-secondaryText hover:text-mainText'
              }`}
            >
              Stock Summary
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'ledger' ? 'bg-white text-mainText shadow-xs' : 'text-secondaryText hover:text-mainText'
              }`}
            >
              Stock Ledger Trail
            </button>
          </div>
        }
      />

      {/* Valuation Header Card */}
      <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-xs text-secondaryText font-semibold uppercase tracking-wider">Total Warehouse Inventory Value</p>
          <p className="text-2xl font-bold text-primary mt-1">₹{totalValuation.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">
            Valued at weighted-average purchase cost for materials and selling rates for finished goods
          </p>
        </div>
        <div className="p-3 bg-teal-50 text-accent rounded-xl">
          <Boxes className="w-8 h-8" />
        </div>
      </div>

      {activeTab === 'summary' ? (
        <DataTable
          columns={summaryColumns}
          data={summary}
          searchKey="name"
          searchPlaceholder="Search material or finished product..."
          isLoading={loading}
        />
      ) : (
        <DataTable
          columns={ledgerColumns}
          data={ledger}
          searchKey="item_name"
          searchPlaceholder="Search ledger by item or document..."
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default InventoryPage;
