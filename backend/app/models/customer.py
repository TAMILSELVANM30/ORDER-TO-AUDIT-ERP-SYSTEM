from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from decimal import Decimal
from app.models.base import Base, TimestampMixin, generate_uuid

class CustomerType:
    RETAILER = 'RETAILER'
    DISTRIBUTOR = 'DISTRIBUTOR'
    ALL = [RETAILER, DISTRIBUTOR]

class Customer(Base, TimestampMixin):
    __tablename__ = 'customers'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(150), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)
    mobile = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    billing_address = Column(Text, nullable=False)
    shipping_address = Column(Text, nullable=False)
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    state_code = Column(String(5), nullable=False, default="33")
    gstin = Column(String(15), nullable=True)
    customer_type = Column(String(20), nullable=False, default=CustomerType.RETAILER)
    assigned_salesman_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    credit_limit = Column(Numeric(12, 2), default=Decimal('50000.00'))
    opening_balance = Column(Numeric(12, 2), default=Decimal('0.00'))
    is_active = Column(Boolean, default=True, nullable=False)
    
    salesman = relationship("User", foreign_keys=[assigned_salesman_id])
    orders = relationship("SalesOrder", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_code': self.customer_code,
            'customer_name': self.customer_name,
            'contact_person': self.contact_person,
            'mobile': self.mobile,
            'email': self.email,
            'billing_address': self.billing_address,
            'shipping_address': self.shipping_address,
            'state': self.state,
            'state_code': self.state_code,
            'gstin': self.gstin,
            'customer_type': self.customer_type,
            'assigned_salesman_id': self.assigned_salesman_id,
            'salesman_name': self.salesman.full_name if self.salesman else None,
            'credit_limit': float(self.credit_limit),
            'opening_balance': float(self.opening_balance),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
