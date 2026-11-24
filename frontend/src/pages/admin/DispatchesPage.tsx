import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Dispatch } from '../../types';
import { Truck, Paperclip } from 'lucide-react';
import DocumentAttachmentModal from '../../components/common/DocumentAttachmentModal';

export const DispatchesPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);

  useEffect(() => {
    const fetchDispatches = async () => {
      try {
        const res = await api.get('/dispatches');
        setDispatches(res.data.dispatches);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDispatches();
  }, []);

  const columns = [
    {
      header: 'Dispatch #',
      accessor: (row: Dispatch) => (
        <div>
          <span className="font-semibold text-mainText">{row.dispatch_number}</span>
          <span className="block text-[11px] text-secondaryText">{row.dispatch_date}</span>
        </div>
      ),
    },
    {
      header: 'Invoice #',
      accessor: (row: Dispatch) => <span className="font-medium text-mainText">{row.invoice_number || 'N/A'}</span>,
    },
    {
      header: 'Customer',
      accessor: (row: Dispatch) => <span className="text-mainText">{row.customer_name || 'N/A'}</span>,
    },
    {
      header: 'Vehicle / Ref',
      accessor: (row: Dispatch) => <span className="text-xs text-secondaryText">{row.vehicle_no || 'Standard Delivery'}</span>,
    },
    {
      header: 'Items Dispatched',
      accessor: (row: Dispatch) => (
        <span className="text-xs">
          {row.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Dispatched By',
      accessor: (row: Dispatch) => <span className="text-xs text-secondaryText">{row.created_by || 'Admin'}</span>,
    },
    {
      header: 'POD / Docs',
      accessor: (row: Dispatch) => (
        <button
          onClick={() => {
            setSelectedDispatch(row);
            setIsAttachmentOpen(true);
          }}
          className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium border border-indigo-200 transition-colors"
          title="Upload or View Proof of Delivery / Lorry Receipt (LR)"
        >
          <Paperclip className="w-3.5 h-3.5 mr-1" />
          POD Proof
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Dispatch Register"
        subtitle="Complete traceability of finished product movements leaving factory stock"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Dispatches' }]}
      />

      <DataTable
        columns={columns}
        data={dispatches}
        searchKey="dispatch_number"
        searchPlaceholder="Search dispatch # or customer..."
        isLoading={loading}
      />

      {/* Supabase Storage Dispatch POD Modal */}
      {selectedDispatch && (
        <DocumentAttachmentModal
          isOpen={isAttachmentOpen}
          onClose={() => {
            setIsAttachmentOpen(false);
            setSelectedDispatch(null);
          }}
          referenceId={selectedDispatch.id}
          referenceTitle={`Dispatch POD ${selectedDispatch.dispatch_number}`}
          documentType="dispatch_proof"
          canUpload={true}
          canDelete={true}
        />
      )}
    </div>
  );
};

export default DispatchesPage;
