import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Supplier, Material } from '../../types';
import { Plus, Receipt, CheckCircle2, Paperclip } from 'lucide-react';
import DocumentAttachmentModal from '../../components/common/DocumentAttachmentModal';

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('60');
  const [rate, setRate] = useState('45');
  const [gstRate, setGstRate] = useState('5');
  const [remarks, setRemarks] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, mRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/materials'),
      ]);
      setPurchases(pRes.data.purchases);
      setSuppliers(sRes.data.suppliers);
      setMaterials(mRes.data.materials);
      if (sRes.data.suppliers.length > 0) setSupplierId(sRes.data.suppliers[0].id);
      if (mRes.data.materials.length > 0) setMaterialId(mRes.data.materials[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const qtyNum = parseFloat(quantity) || 0;
  const rateNum = parseFloat(rate) || 0;
  const gstNum = parseFloat(gstRate) || 0;
  const taxableVal = qtyNum * rateNum;
  const taxVal = taxableVal * (gstNum / 100);
  const grandTotalVal = taxableVal + taxVal;

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/purchases', {
        supplier_id: supplierId,
        supplier_invoice_no: supplierInvoiceNo,
        items: [
          {
            material_id: materialId,
            quantity: qtyNum,
            rate: rateNum,
            gst_rate: gstNum,
            unit: selectedMaterial?.unit || 'kg',
          },
        ],
        remarks: remarks || `Purchase of ${selectedMaterial?.name}`,
      });
      setFeedback(`Purchase recorded! Stock updated & weighted-average cost recalculated for ${selectedMaterial?.name}.`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record purchase');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Purchase #',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-mainText">{row.purchase_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.purchase_date}</span>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessor: (row: any) => (
        <div>
          <span className="font-medium text-mainText">{row.supplier_name}</span>
          {row.supplier_invoice_no && (
            <span className="block text-[11px] text-secondaryText">Inv: {row.supplier_invoice_no}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Material Supplied',
      accessor: (row: any) => (
        <span className="text-xs">
          {row.items?.map((it: any) => `${it.material_name} (${it.quantity} ${it.unit} @ ₹${it.rate})`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Taxable Val',
      accessor: (row: any) => <span className="font-medium text-mainText">₹{row.total_taxable.toFixed(2)}</span>,
    },
    {
      header: 'Tax (5%)',
      accessor: (row: any) => <span className="text-xs text-secondaryText">₹{row.total_tax.toFixed(2)}</span>,
    },
    {
      header: 'Grand Total',
      accessor: (row: any) => <span className="font-bold text-mainText">₹{row.grand_total.toFixed(2)}</span>,
    },
    {
      header: 'Bill / Docs',
      accessor: (row: any) => (
        <button
          onClick={() => {
            setSelectedPurchase(row);
            setIsAttachmentOpen(true);
          }}
          className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium border border-indigo-200 transition-colors"
          title="Attach or View Vendor Tax Invoices"
        >
          <Paperclip className="w-3.5 h-3.5 mr-1" />
          Bill Docs
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raw Material & Packaging Purchases"
        subtitle="Record inward goods receipts with automatic weighted-average inventory cost revaluation and stock ledger entry"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Purchases' }]}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Purchase
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
        data={purchases}
        searchKey="purchase_number"
        searchPlaceholder="Search purchase # or supplier..."
        isLoading={loading}
      />

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Raw Material Purchase"
        subtitle="Posts stock directly to inventory ledger and re-computes weighted-average unit cost"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs bg-white focus:ring-1 focus:ring-accent"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplier_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Supplier Invoice Number</label>
              <input
                type="text"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                placeholder="e.g. SUP-INV-2026-901"
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Material / Packaging</label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs bg-white focus:ring-1 focus:ring-accent"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText mb-1">
                Quantity ({selectedMaterial?.unit || 'unit'})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Rate per {selectedMaterial?.unit || 'unit'} (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          <div className="p-3 bg-slate-50 rounded-lg border border-borderLine text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-secondaryText">Taxable Value:</span>
              <span className="font-semibold text-mainText">₹{taxableVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondaryText">GST (5%):</span>
              <span className="font-semibold text-mainText">₹{taxVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-borderLine text-sm font-bold text-primary">
              <span>Grand Total:</span>
              <span>₹{grandTotalVal.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Purchase of 60 kg Flour for batch production"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-borderLine">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-borderLine text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light disabled:opacity-50 shadow-2xs"
            >
              {actionLoading ? 'Posting...' : 'Post Purchase & Update Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supabase Storage Vendor Bill Modal */}
      {selectedPurchase && (
        <DocumentAttachmentModal
          isOpen={isAttachmentOpen}
          onClose={() => {
            setIsAttachmentOpen(false);
            setSelectedPurchase(null);
          }}
          referenceId={selectedPurchase.id}
          referenceTitle={`Purchase Bill ${selectedPurchase.purchase_number || selectedPurchase.supplier_invoice_no || ''}`}
          documentType="purchase_bill"
          canUpload={true}
          canDelete={true}
        />
      )}
    </div>
  );
};

export default PurchasesPage;
