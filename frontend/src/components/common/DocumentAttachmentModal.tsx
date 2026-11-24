import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { Modal } from './Modal';

export interface Attachment {
  id: string;
  document_type: string;
  reference_id: string;
  storage_path: string;
  bucket: string;
  public_url: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by?: string;
  created_at: string;
}

interface DocumentAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceId: string;
  referenceTitle: string; // e.g. "Invoice INV/2026-27/0001" or "Product Murukku 200g"
  documentType:
    | 'invoice'
    | 'purchase_bill'
    | 'payment_receipt'
    | 'production_report'
    | 'dispatch_proof'
    | 'audit_attachment'
    | 'product_image';
  canUpload?: boolean;
  canDelete?: boolean;
}

export const DocumentAttachmentModal: React.FC<DocumentAttachmentModalProps> = ({
  isOpen,
  onClose,
  referenceId,
  referenceTitle,
  documentType,
  canUpload = true,
  canDelete = false,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchAttachments = async () => {
    if (!referenceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/storage/documents/${referenceId}`, {
        params: { document_type: documentType },
      });
      setAttachments(res.data.data || []);
    } catch (err: any) {
      // If storage is unconfigured or 503, show friendly message
      if (err.response?.status === 503) {
        setError('Supabase Storage is not yet configured. Set credentials in .env.');
      } else {
        setError(err.response?.data?.message || 'Failed to load attachments.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && referenceId) {
      fetchAttachments();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, referenceId, documentType]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    const isProductImage = documentType === 'product_image';
    const uploadUrl = isProductImage ? '/storage/product-images' : '/storage/documents';

    if (isProductImage) {
      formData.append('product_id', referenceId);
    } else {
      formData.append('document_type', documentType);
      formData.append('reference_id', referenceId);
    }

    try {
      await api.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });

      setSuccessMsg(`"${file.name}" uploaded successfully!`);
      await fetchAttachments();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Upload failed. Check file type and size.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleViewSignedUrl = async (attachment: Attachment) => {
    if (attachment.public_url) {
      window.open(attachment.public_url, '_blank');
      return;
    }
    try {
      const res = await api.get(`/storage/documents/${attachment.id}/signed-url`);
      const signedUrl = res.data.signed_url;
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not generate secure view link.');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const res = await api.get(`/storage/documents/${attachment.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: attachment.mime_type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Download failed.');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/storage/documents/${attachmentId}`);
      setSuccessMsg('Document deleted successfully.');
      await fetchAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete document.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documents & Attachments — ${referenceTitle}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <div className="flex-1">{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Zone */}
        {canUpload && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragOver
                ? 'border-teal-500 bg-teal-50/50'
                : 'border-slate-200 hover:border-teal-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              id="erp-file-upload-input"
              className="hidden"
              disabled={uploading}
              accept={
                documentType === 'product_image'
                  ? 'image/*'
                  : '.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.csv'
              }
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label
              htmlFor="erp-file-upload-input"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shadow-xs">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {uploading ? 'Uploading to Supabase Storage...' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {documentType === 'product_image'
                    ? 'JPG, PNG, WebP up to 5MB (public bucket)'
                    : 'PDF, Images, Excel up to 20MB (private encrypted bucket)'}
                </p>
              </div>
            </label>

            {uploadProgress !== null && (
              <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Existing Attachments List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Attached Files ({attachments.length})
          </h4>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Fetching attached files...</span>
            </div>
          ) : attachments.length === 0 ? (
            <div className="py-6 text-center border border-slate-100 rounded-lg bg-slate-50/50">
              <FileText className="w-7 h-7 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-500">No attachments found for this record.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {attachments.map((item) => {
                const isImg = item.mime_type.startsWith('image/');
                const sizeKb = Math.round(item.size_bytes / 1024);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {isImg ? (
                          <ImageIcon className="w-4 h-4 text-teal-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                          {item.original_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {sizeKb} KB • {new Date(item.created_at).toLocaleDateString()}
                          {item.uploaded_by ? ` by ${item.uploaded_by}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleViewSignedUrl(item)}
                        title="View with Signed URL"
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        title="Download file"
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Delete file"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DocumentAttachmentModal;
