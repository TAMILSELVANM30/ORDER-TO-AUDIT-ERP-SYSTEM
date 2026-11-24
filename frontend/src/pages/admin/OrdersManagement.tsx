import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { SalesOrder } from '../../types';
import { Check, X, FileText, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';

export const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [stockCheckData, setStockCheckData] = useState<any>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCheckStock = async (order: SalesOrder) => {
    setSelectedOrder(order);
    try {
      const res = await api.get(`/orders/${order.id}/check-stock`);
      setStockCheckData(res.data);
      setIsStockModalOpen(true);
    } catch (e: any) {
      setFeedback({ message: 'Failed to verify stock availability', type: 'error' });
    }
  };

  const handleApprove = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${orderId}/approve`);
      setFeedback({ message: 'Order approved successfully.', type: 'success' });
      setIsStockModalOpen(false);
      fetchOrders();
    } catch (e: any) {
      setFeedback({ message: e.response?.data?.error || 'Failed to approve order', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await api.post(`/orders/${selectedOrder.id}/reject`, { reason: rejectReason || 'Stock unavailable' });
      setFeedback({ message: 'Order rejected.', type: 'success' });
      setIsRejectModalOpen(false);
      fetchOrders();
    } catch (e: any) {
      setFeedback({ message: e.response?.data?.error || 'Failed to reject order', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    setActionLoading(true);
    try {
      const res = await api.post('/invoices', { sales_order_id: orderId });
      setFeedback({
        message: `Invoice ${res.data.invoice.invoice_number} generated successfully!`,
        type: 'success',
      });
      fetchOrders();
    } catch (e: any) {
      setFeedback({ message: e.response?.data?.error || 'Failed to generate invoice', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Order #',
      accessor: (row: SalesOrder) => (
        <div>
          <span className="font-semibold text-mainText">{row.order_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.order_date}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: SalesOrder) => (
        <div>
          <span className="font-medium text-mainText">{row.customer_name}</span>
          <span className="block text-[11px] text-secondaryText">{row.customer_state}</span>
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: (row: SalesOrder) => (
        <span className="text-xs">
          {row.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Grand Total',
      accessor: (row: SalesOrder) => (
        <span className="font-bold text-mainText">₹{row.grand_total.toFixed(2)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: SalesOrder) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: SalesOrder) => (
        <div className="flex items-center space-x-2">
          {row.status === 'SUBMITTED' && (
            <>
              <button
                onClick={() => handleCheckStock(row)}
                className="px-2 py-1 rounded bg-teal-50 text-accent hover:bg-teal-100 font-medium text-[11px] border border-teal-200 transition-colors"
              >
                Review & Stock Check
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(row);
                  setIsRejectModalOpen(true);
                }}
                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                title="Reject Order"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => handleGenerateInvoice(row.id)}
              disabled={actionLoading}
              className="inline-flex items-center px-2.5 py-1 rounded bg-primary text-white hover:bg-primary-light font-medium text-[11px] shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Generate GST Invoice
            </button>
          )}

          {['INVOICED', 'DISPATCHED', 'PARTIALLY_DISPATCHED'].includes(row.status) && (
            <span className="text-[11px] text-secondaryText italic">Invoiced</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders & Verification"
        subtitle="Verify submitted salesman orders, check stock availability, enforce approval controls, and generate GST invoices"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Sales Orders' }]}
      />

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={orders}
        searchKey="order_number"
        searchPlaceholder="Search order number or customer..."
        isLoading={loading}
      />

      {/* Stock Availability Verification Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Stock Verification: ${selectedOrder?.order_number}`}
        subtitle={`Customer: ${selectedOrder?.customer_name} (${selectedOrder?.customer_state})`}
        maxWidth="lg"
      >
        {stockCheckData && (
          <div className="space-y-4">
            {stockCheckData.has_shortage ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">INSUFFICIENT FINISHED GOODS STOCK DETECTED</p>
                  <p className="text-[11px] mt-0.5">
                    One or more requested items have a shortage in warehouse inventory. Approval should be delayed or handled via partial production.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">All ordered items are fully in stock and ready for fulfilment.</span>
              </div>
            )}

            <div className="border border-borderLine rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-secondaryText border-b border-borderLine">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Product</th>
                    <th className="px-3 py-2 font-semibold text-right">Requested</th>
                    <th className="px-3 py-2 font-semibold text-right">Available</th>
                    <th className="px-3 py-2 font-semibold text-right">Shortage</th>
                    <th className="px-3 py-2 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLine">
                  {stockCheckData.items?.map((item: any, idx: number) => (
                    <tr key={idx} className={item.shortage_quantity > 0 ? 'bg-amber-50/40' : ''}>
                      <td className="px-3 py-2 font-medium text-mainText">{item.product_name}</td>
                      <td className="px-3 py-2 text-right font-medium">{item.requested_quantity}</td>
                      <td className="px-3 py-2 text-right">{item.available_quantity}</td>
                      <td className="px-3 py-2 text-right font-bold text-rose-600">
                        {item.shortage_quantity > 0 ? `-${item.shortage_quantity}` : '0'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.is_sufficient ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold border border-rose-200">
                            Shortage ({item.shortage_quantity})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-borderLine">
              <button
                type="button"
                onClick={() => {
                  setIsStockModalOpen(false);
                  setIsRejectModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-borderLine text-xs font-semibold text-secondary hover:bg-slate-50"
              >
                Reject Order
              </button>
              <button
                type="button"
                disabled={actionLoading || stockCheckData.has_shortage}
                onClick={() => selectedOrder && handleApprove(selectedOrder.id)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                {stockCheckData.has_shortage ? 'Cannot Approve (Shortage)' : 'Approve Order'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Order Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Sales Order"
        subtitle={`Order: ${selectedOrder?.order_number}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Reason for Rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient warehouse stock; customer credit limit exceeded..."
              className="w-full p-2 border border-borderLine rounded-lg text-xs h-24 focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-borderLine text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersManagement;
