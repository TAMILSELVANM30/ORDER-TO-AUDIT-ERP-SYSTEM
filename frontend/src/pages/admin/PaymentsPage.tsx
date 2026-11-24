import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Payment, Customer } from '../../types';
import { CreditCard, Plus, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';
import DocumentAttachmentModal from '../../components/common/DocumentAttachmentModal';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outstandingSummary, setOutstandingSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('4000.00');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [refNo, setRefNo] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, oRes] = await Promise.all([
        api.get('/payments'),
        api.get('/customers'),
        api.get('/payments/outstanding'),
      ]);
      setPayments(pRes.data.payments);
      setCustomers(cRes.data.customers);
      setOutstandingSummary(oRes.data.outstanding);
      if (cRes.data.customers.length > 0) setCustomerId(cRes.data.customers[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/payments', {
        customer_id: customerId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: refNo,
        remarks: remarks || 'Customer payment against outstanding invoices',
      });
      setFeedback(`Payment recorded successfully! Payment #${res.data.payment.payment_number}`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Payment #',
      accessor: (row: Payment) => (
        <div>
          <span className="font-semibold text-mainText">{row.payment_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.payment_date}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: Payment) => <span className="font-medium text-mainText">{row.customer_name}</span>,
    },
    {
      header: 'Amount Received',
      accessor: (row: Payment) => (
        <span className="font-bold text-emerald-700">₹{row.amount.toFixed(2)}</span>
      ),
    },
    {
      header: 'Method',
      accessor: (row: Payment) => (
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {row.payment_method}
        </span>
      ),
    },
    {
      header: 'Reference #',
      accessor: (row: Payment) => (
        <span className="font-mono text-xs text-secondaryText">{row.reference_number || 'N/A'}</span>
      ),
    },
    {
      header: 'Invoice Allocation',
      accessor: (row: Payment) => (
        <span className="text-xs">
          {row.allocations?.map((a) => `${a.invoice_number} (₹${a.allocated_amount})`).join(', ') || 'Auto-allocated'}
        </span>
      ),
    },
    {
      header: 'Receipt Proof',
      accessor: (row: Payment) => (
        <button
          onClick={() => {
            setSelectedPayment(row);
            setIsAttachmentOpen(true);
          }}
          className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium border border-indigo-200 transition-colors"
          title="Upload or View Bank Slip / Cheque Deposit Proof"
        >
          <Paperclip className="w-3.5 h-3.5 mr-1" />
          Receipt
        </button>
      ),
    },
  ];

  const totalOutstanding = outstandingSummary.reduce((acc, curr) => acc + curr.total_outstanding, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Payments & Collections"
        subtitle="Record receipts, reconcile against outstanding tax invoices, and track debtor ageing buckets"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Payments' }]}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Payment
          </button>
        }
      />

      {/* Outstanding Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs">
          <p className="text-xs text-secondaryText uppercase tracking-wider font-semibold">Total Outstanding</p>
          <p className="text-xl font-bold text-rose-700 mt-1">₹{totalOutstanding.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">Across all active accounts</p>
        </div>
        {outstandingSummary.slice(0, 3).map((item) => (
          <div key={item.customer_id} className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs">
            <p className="text-xs font-semibold text-mainText truncate">{item.customer_name}</p>
            <p className="text-lg font-bold text-mainText mt-1">₹{item.total_outstanding.toFixed(2)}</p>
            <p className="text-[11px] text-secondaryText mt-0.5">
              0-30d: ₹{item.bucket_0_30.toFixed(0)} • {item.invoice_count} unpaid inv
            </p>
          </div>
        ))}
      </div>

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
        data={payments}
        searchKey="payment_number"
        searchPlaceholder="Search payment # or customer..."
        isLoading={loading}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment Receipt"
        subtitle="Applies collection against oldest unpaid invoices and updates outstanding balance"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} ({c.state})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Amount Received (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs bg-white"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Reference / UTR / Cheque No.</label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="e.g. UTR-2026-99012"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Payment for invoice INV/2026-27/0001"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-borderLine">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-borderLine text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light"
            >
              {actionLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supabase Storage Payment Receipt Modal */}
      {selectedPayment && (
        <DocumentAttachmentModal
          isOpen={isAttachmentOpen}
          onClose={() => {
            setIsAttachmentOpen(false);
            setSelectedPayment(null);
          }}
          referenceId={selectedPayment.id}
          referenceTitle={`Payment Receipt ${selectedPayment.payment_number || selectedPayment.reference_number || ''}`}
          documentType="payment_receipt"
          canUpload={true}
          canDelete={true}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
