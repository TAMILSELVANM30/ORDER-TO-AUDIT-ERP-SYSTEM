"""
FileAttachment model — stores metadata for every file uploaded to Supabase Storage.
Linked to invoices, purchases, payments, production runs, dispatches, and products.
"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin, generate_uuid


class FileAttachment(Base, TimestampMixin):
    """
    Records every file uploaded to Supabase Storage.
    One logical record ↔ many attachments (e.g. a purchase can have multiple invoice scans).
    """
    __tablename__ = "file_attachments"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    # What kind of ERP record this file belongs to
    document_type   = Column(String(50),  nullable=False, index=True)
    # ID of the linked ERP record (invoice_id, purchase_id, payment_id, …)
    reference_id    = Column(String(36),  nullable=False, index=True)
    # Supabase storage path (e.g. "invoice/abc123/file_uuid.pdf")
    storage_path    = Column(String(500), nullable=False)
    bucket          = Column(String(100), nullable=False)
    # Publicly accessible URL (only for product images in the public bucket)
    public_url      = Column(Text,        nullable=True)
    original_name   = Column(String(255), nullable=False)
    mime_type       = Column(String(100), nullable=False)
    size_bytes      = Column(Integer,     nullable=False, default=0)
    # Soft-delete flag
    is_deleted      = Column(Boolean,     default=False, nullable=False)
    # Who uploaded
    uploaded_by_id  = Column(String(36),  ForeignKey("users.id"), nullable=True)

    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])

    def to_dict(self):
        return {
            "id":            self.id,
            "document_type": self.document_type,
            "reference_id":  self.reference_id,
            "storage_path":  self.storage_path,
            "bucket":        self.bucket,
            "public_url":    self.public_url,
            "original_name": self.original_name,
            "mime_type":     self.mime_type,
            "size_bytes":    self.size_bytes,
            "is_deleted":    self.is_deleted,
            "uploaded_by":   self.uploaded_by.full_name if self.uploaded_by else None,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
        }
