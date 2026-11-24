from sqlalchemy import Column, String, Numeric, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import date
from app.models.base import Base, TimestampMixin, generate_uuid

class PaymentMethod:
    CASH = 'CASH'
    UPI = 'UPI'
    BANK_TRANSFER = 'BANK_TRANSFER'
    CHEQUE = 'CHEQUE'
    ALL = [CASH, UPI, BANK_TRANSFER, CHEQUE]

class Payment(Base, TimestampMixin):
    __tablename__ = 'payments'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    payment_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. PAY-2026-0001
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=False)
    payment_date = Column(Date, default=date.today, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(30), nullable=False, default=PaymentMethod.BANK_TRANSFER)
    reference_number = Column(String(100), nullable=True) # Cheque no, UPI ref, Bank ref
    remarks = Column(Text, nullable=True)
    created_by_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    
    customer = relationship("Customer", back_populates="payments")
    created_by = relationship("User", foreign_keys=[created_by_id])
    allocations = relationship("PaymentAllocation", back_populates="payment", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'payment_number': self.payment_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer.customer_name if self.customer else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'amount': float(self.amount),
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'remarks': self.remarks,
            'created_by': self.created_by.full_name if self.created_by else None,
            'allocations': [a.to_dict() for a in self.allocations],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class PaymentAllocation(Base, TimestampMixin):
    __tablename__ = 'payment_allocations'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    payment_id = Column(String(36), ForeignKey('payments.id'), nullable=False)
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    
    payment = relationship("Payment", back_populates="allocations")
    invoice = relationship("Invoice", back_populates="allocations")
    
    def to_dict(self):
        return {
            'id': self.id,
            'payment_id': self.payment_id,
            'invoice_id': self.invoice_id,
            'invoice_number': self.invoice.invoice_number if self.invoice else None,
            'allocated_amount': float(self.allocated_amount),
        }
