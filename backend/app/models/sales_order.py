from sqlalchemy import Column, String, Numeric, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import date
from app.models.base import Base, TimestampMixin, generate_uuid

class OrderStatus:
    DRAFT = 'DRAFT'
    SUBMITTED = 'SUBMITTED'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    INVOICED = 'INVOICED'
    PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED'
    DISPATCHED = 'DISPATCHED'
    CANCELLED = 'CANCELLED'
    ALL = [DRAFT, SUBMITTED, APPROVED, REJECTED, INVOICED, PARTIALLY_DISPATCHED, DISPATCHED, CANCELLED]

class SalesOrder(Base, TimestampMixin):
    __tablename__ = 'sales_orders'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    salesman_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=False)
    order_date = Column(Date, default=date.today, nullable=False)
    subtotal = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    tax_total = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    grand_total = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    status = Column(String(30), default=OrderStatus.SUBMITTED, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    salesman = relationship("User", foreign_keys=[salesman_id])
    customer = relationship("Customer", back_populates="orders")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="sales_order")
    dispatches = relationship("Dispatch", back_populates="sales_order")
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'salesman_id': self.salesman_id,
            'salesman_name': self.salesman.full_name if self.salesman else None,
            'customer_id': self.customer_id,
            'customer_name': self.customer.customer_name if self.customer else None,
            'customer_state': self.customer.state if self.customer else None,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'subtotal': float(self.subtotal),
            'tax_total': float(self.tax_total),
            'grand_total': float(self.grand_total),
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class SalesOrderItem(Base, TimestampMixin):
    __tablename__ = 'sales_order_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    sales_order_id = Column(String(36), ForeignKey('sales_orders.id'), nullable=False)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_pct = Column(Numeric(5, 2), default=Decimal('0.00'), nullable=False)
    gst_rate = Column(Numeric(5, 2), default=Decimal('5.00'), nullable=False)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    dispatched_quantity = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    
    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product")
    
    def to_dict(self):
        return {
            'id': self.id,
            'sales_order_id': self.sales_order_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'current_stock': float(self.product.current_stock) if self.product else 0.0,
            'quantity': float(self.quantity),
            'unit_price': float(self.unit_price),
            'discount_pct': float(self.discount_pct),
            'gst_rate': float(self.gst_rate),
            'taxable_amount': float(self.taxable_amount),
            'tax_amount': float(self.tax_amount),
            'total_amount': float(self.total_amount),
            'dispatched_quantity': float(self.dispatched_quantity),
        }
