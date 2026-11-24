from sqlalchemy import Column, String, Numeric, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import date
from app.models.base import Base, TimestampMixin, generate_uuid

class Dispatch(Base, TimestampMixin):
    __tablename__ = 'dispatches'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispatch_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. DSP-2026-0001
    sales_order_id = Column(String(36), ForeignKey('sales_orders.id'), nullable=True)
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=True)
    dispatch_date = Column(Date, default=date.today, nullable=False)
    vehicle_no = Column(String(50), nullable=True)
    delivery_notes = Column(Text, nullable=True)
    created_by_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    
    sales_order = relationship("SalesOrder", back_populates="dispatches")
    invoice = relationship("Invoice", back_populates="dispatches")
    created_by = relationship("User", foreign_keys=[created_by_id])
    items = relationship("DispatchItem", back_populates="dispatch", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'dispatch_number': self.dispatch_number,
            'sales_order_id': self.sales_order_id,
            'order_number': self.sales_order.order_number if self.sales_order else None,
            'invoice_id': self.invoice_id,
            'invoice_number': self.invoice.invoice_number if self.invoice else None,
            'customer_name': self.invoice.customer.customer_name if (self.invoice and self.invoice.customer) else (self.sales_order.customer.customer_name if (self.sales_order and self.sales_order.customer) else None),
            'dispatch_date': self.dispatch_date.isoformat() if self.dispatch_date else None,
            'vehicle_no': self.vehicle_no,
            'delivery_notes': self.delivery_notes,
            'created_by': self.created_by.full_name if self.created_by else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class DispatchItem(Base, TimestampMixin):
    __tablename__ = 'dispatch_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    dispatch_id = Column(String(36), ForeignKey('dispatches.id'), nullable=False)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    
    dispatch = relationship("Dispatch", back_populates="items")
    product = relationship("Product")
    
    def to_dict(self):
        return {
            'id': self.id,
            'dispatch_id': self.dispatch_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'quantity': float(self.quantity),
        }
