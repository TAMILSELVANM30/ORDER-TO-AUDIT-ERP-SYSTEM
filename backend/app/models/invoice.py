from sqlalchemy import Column, String, Numeric, ForeignKey, Date, Text, Boolean
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import date
from app.models.base import Base, TimestampMixin, generate_uuid

class InvoiceStatus:
    POSTED = 'POSTED'
    CANCELLED = 'CANCELLED'
    ALL = [POSTED, CANCELLED]

class Invoice(Base, TimestampMixin):
    __tablename__ = 'invoices'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. INV/2026-27/0001
    financial_year = Column(String(10), nullable=False, default="2026-27")
    sales_order_id = Column(String(36), ForeignKey('sales_orders.id'), nullable=True)
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=False)
    invoice_date = Column(Date, default=date.today, nullable=False)
    
    # GST Place of supply
    place_of_supply = Column(String(100), nullable=False, default="Tamil Nadu")
    is_interstate = Column(Boolean, default=False, nullable=False)
    
    # Financial breakdown
    subtotal = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    discount_total = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    taxable_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    cgst_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    sgst_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    igst_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_tax = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    grand_total = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    
    # Payment tracking
    paid_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    balance_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    
    status = Column(String(20), default=InvoiceStatus.POSTED, nullable=False)
    created_by_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    remarks = Column(Text, nullable=True)
    
    sales_order = relationship("SalesOrder", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    created_by = relationship("User", foreign_keys=[created_by_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    allocations = relationship("PaymentAllocation", back_populates="invoice")
    dispatches = relationship("Dispatch", back_populates="invoice")
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'financial_year': self.financial_year,
            'sales_order_id': self.sales_order_id,
            'order_number': self.sales_order.order_number if self.sales_order else None,
            'customer_id': self.customer_id,
            'customer_name': self.customer.customer_name if self.customer else None,
            'customer_gstin': self.customer.gstin if self.customer else None,
            'customer_address': self.customer.billing_address if self.customer else None,
            'customer_state': self.customer.state if self.customer else None,
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None,
            'place_of_supply': self.place_of_supply,
            'is_interstate': self.is_interstate,
            'subtotal': float(self.subtotal),
            'discount_total': float(self.discount_total),
            'taxable_amount': float(self.taxable_amount),
            'cgst_amount': float(self.cgst_amount),
            'sgst_amount': float(self.sgst_amount),
            'igst_amount': float(self.igst_amount),
            'total_tax': float(self.total_tax),
            'grand_total': float(self.grand_total),
            'paid_amount': float(self.paid_amount),
            'balance_amount': float(self.balance_amount),
            'payment_status': 'PAID' if self.balance_amount == 0 else ('PARTIAL' if self.paid_amount > 0 else 'UNPAID'),
            'status': self.status,
            'created_by': self.created_by.full_name if self.created_by else None,
            'remarks': self.remarks,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class InvoiceItem(Base, TimestampMixin):
    __tablename__ = 'invoice_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=False)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=False)
    hsn_code = Column(String(20), nullable=False, default='1905')
    description = Column(String(200), nullable=True)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), default=Decimal('5.00'), nullable=False)
    cgst_rate = Column(Numeric(5, 2), default=Decimal('2.50'), nullable=False)
    cgst_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    sgst_rate = Column(Numeric(5, 2), default=Decimal('2.50'), nullable=False)
    sgst_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    igst_rate = Column(Numeric(5, 2), default=Decimal('0.00'), nullable=False)
    igst_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'hsn_code': self.hsn_code,
            'description': self.description,
            'quantity': float(self.quantity),
            'unit_price': float(self.unit_price),
            'discount_amount': float(self.discount_amount),
            'taxable_amount': float(self.taxable_amount),
            'gst_rate': float(self.gst_rate),
            'cgst_rate': float(self.cgst_rate),
            'cgst_amount': float(self.cgst_amount),
            'sgst_rate': float(self.sgst_rate),
            'sgst_amount': float(self.sgst_amount),
            'igst_rate': float(self.igst_rate),
            'igst_amount': float(self.igst_amount),
            'total_amount': float(self.total_amount),
        }
