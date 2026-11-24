import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Invoice } from '../../types';
import { Download, Truck, Eye, FileText, CheckCircle2, Paperclip } from 'lucide-react';
import DocumentAttachmentModal from '../../components/common/DocumentAttachmentModal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentInvoice, setAttachmentInvoice] = useState<Invoice | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const res = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number.replace(/\//g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download invoice PDF');
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setActionLoading(true);
    try {
      const res = await api.post('/dispatches', {
        invoice_id: selectedInvoice.id,
        vehicle_no: vehicleNo,
        delivery_notes: deliveryNotes,
      });
      setFeedback(`Dispatched successfully! Stock deducted. Dispatch #${res.data.dispatch.dispatch_number}`);
      setIsDispatchModalOpen(false);
      setVehicleNo('');
      setDeliveryNotes('');
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Dispatch failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: (row: Invoice) => (
        <div>
          <span className="font-semibold text-mainText">{row.invoice_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.invoice_date}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: Invoice) => (
        <div>
          <span className="font-medium text-mainText">{row.customer_name}</span>
          <span className="block text-[11px] text-secondaryText">
            {row.place_of_supply} {row.is_interstate ? '(Inter-State IGST)' : '(Intra-State CGST+SGST)'}
          </span>
        </div>
      ),
    },
    {
      header: 'Taxable Val',
      accessor: (row: Invoice) => (
        <span className="font-medium text-mainText">₹{row.taxable_amount.toFixed(2)}</span>
      ),
    },
    {
      header: 'Taxes Breakdown',
      accessor: (row: Invoice) => (
        <div className="text-[11px] text-secondaryText">
          {row.is_interstate ? (
            <span>IGST: ₹{row.igst_amount.toFixed(2)}</span>
          ) : (
            <span>CGST: ₹{row.cgst_amount.toFixed(2)} | SGST: ₹{row.sgst_amount.toFixed(2)}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Grand Total',
      accessor: (row: Invoice) => (
        <div>
          <span className="font-bold text-mainText">₹{row.grand_total.toFixed(2)}</span>
          <span className="block text-[10px] text-secondaryText">Bal: ₹{row.balance_amount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      accessor: (row: Invoice) => <StatusBadge status={row.payment_status} />,
    },
    {
      header: 'Actions',
      accessor: (row: Invoice) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownloadPdf(row)}
            className="inline-flex items-center px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-secondary text-[11px] font-medium border border-borderLine transition-colors"
            title="Download Tax Invoice PDF"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            PDF
          </button>
          <button
            onClick={() => {
              setAttachmentInvoice(row);
              setIsAttachmentModalOpen(true);
            }}
            className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium border border-indigo-200 transition-colors"
            title="Upload/View Signed Invoices & POD"
          >
            <Paperclip className="w-3.5 h-3.5 mr-1" />
            Docs
          </button>
          <button
            onClick={() => {
              setSelectedInvoice(row);
              setIsDispatchModalOpen(true);
            }}
            className="inline-flex items-center px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-accent text-[11px] font-medium border border-teal-200 transition-colors"
          >
            <Truck className="w-3.5 h-3.5 mr-1" />
            Dispatch
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Tax Invoices & Dispatches"
        subtitle="Sequential tax invoices by financial year with intra-state and inter-state GST rules, ReportLab PDF generation and warehouse dispatches"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Invoices' }]}
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
        data={invoices}
        searchKey="invoice_number"
        searchPlaceholder="Search invoice # or customer..."
        isLoading={loading}
      />

      {/* Dispatch Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title={`Warehouse Dispatch: ${selectedInvoice?.invoice_number}`}
        subtitle={`Customer: ${selectedInvoice?.customer_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleDispatch} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-borderLine text-xs">
            <p className="font-semibold text-mainText">Dispatched Items:</p>
            {selectedInvoice?.items?.map((it, idx) => (
              <p key={idx} className="text-secondaryText mt-1">
                • {it.product_name} — <span className="font-bold text-mainText">{it.quantity} packets</span>
              </p>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Vehicle / Courier Tracking No.</label>
            <input
              type="text"
              required
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. TN-45-AQ-1234 or DTDC Air 8912"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Delivery Notes / Remarks</label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Standard packaging dispatch from Thuvakudi warehouse..."
              className="w-full p-2 border border-borderLine rounded-lg text-xs h-20 focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-borderLine">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-borderLine text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light disabled:opacity-50 shadow-2xs"
            >
              {actionLoading ? 'Processing...' : 'Confirm Dispatch & Deduct Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supabase Storage Attachment Modal */}
      {attachmentInvoice && (
        <DocumentAttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={() => {
            setIsAttachmentModalOpen(false);
            setAttachmentInvoice(null);
          }}
          referenceId={attachmentInvoice.id}
          referenceTitle={`Invoice ${attachmentInvoice.invoice_number}`}
          documentType="invoice"
          canUpload={true}
          canDelete={true}
        />
      )}
    </div>
  );
};

export default InvoicesPage;
