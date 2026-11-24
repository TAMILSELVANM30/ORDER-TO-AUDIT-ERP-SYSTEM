from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import datetime, timezone, date
from app.models.base import Base, TimestampMixin, generate_uuid

class PurchaseStatus:
    DRAFT = 'DRAFT'
    POSTED = 'POSTED'
    CANCELLED = 'CANCELLED'
    ALL = [DRAFT, POSTED, CANCELLED]

class Purchase(Base, TimestampMixin):
    __tablename__ = 'purchases'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    purchase_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey('suppliers.id'), nullable=False)
    purchase_date = Column(Date, default=date.today, nullable=False)
    supplier_invoice_no = Column(String(100), nullable=True)
    total_taxable = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_tax = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    grand_total = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    status = Column(String(20), default=PurchaseStatus.POSTED, nullable=False)
    remarks = Column(Text, nullable=True)
    created_by_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    
    supplier = relationship("Supplier", back_populates="purchases")
    created_by = relationship("User", foreign_keys=[created_by_id])
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'purchase_number': self.purchase_number,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.supplier_name if self.supplier else None,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'supplier_invoice_no': self.supplier_invoice_no,
            'total_taxable': float(self.total_taxable),
            'total_tax': float(self.total_tax),
            'grand_total': float(self.grand_total),
            'status': self.status,
            'remarks': self.remarks,
            'created_by': self.created_by.full_name if self.created_by else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class PurchaseItem(Base, TimestampMixin):
    __tablename__ = 'purchase_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    purchase_id = Column(String(36), ForeignKey('purchases.id'), nullable=False)
    material_id = Column(String(36), ForeignKey('materials.id'), nullable=False)
    quantity = Column(Numeric(12, 4), nullable=False)
    unit = Column(String(20), nullable=False)
    rate = Column(Numeric(12, 4), nullable=False)
    gst_rate = Column(Numeric(5, 2), default=Decimal('5.00'), nullable=False)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    batch_number = Column(String(50), nullable=True)
    expiry_date = Column(Date, nullable=True)
    
    purchase = relationship("Purchase", back_populates="items")
    material = relationship("Material")
    
    def to_dict(self):
        return {
            'id': self.id,
            'purchase_id': self.purchase_id,
            'material_id': self.material_id,
            'material_code': self.material.code if self.material else None,
            'material_name': self.material.name if self.material else None,
            'quantity': float(self.quantity),
            'unit': self.unit,
            'rate': float(self.rate),
            'gst_rate': float(self.gst_rate),
            'taxable_amount': float(self.taxable_amount),
            'tax_amount': float(self.tax_amount),
            'total_amount': float(self.total_amount),
            'batch_number': self.batch_number,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
        }
