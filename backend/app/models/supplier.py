from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin, generate_uuid

class Supplier(Base, TimestampMixin):
    __tablename__ = 'suppliers'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    supplier_code = Column(String(50), unique=True, nullable=False, index=True)
    supplier_name = Column(String(150), nullable=False, index=True)
    contact_details = Column(String(200), nullable=True)
    gstin = Column(String(15), nullable=True)
    address = Column(Text, nullable=False)
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    payment_terms = Column(String(100), default="30 Days Net")
    is_active = Column(Boolean, default=True, nullable=False)
    
    purchases = relationship("Purchase", back_populates="supplier")
    
    def to_dict(self):
        return {
            'id': self.id,
            'supplier_code': self.supplier_code,
            'supplier_name': self.supplier_name,
            'contact_details': self.contact_details,
            'gstin': self.gstin,
            'address': self.address,
            'state': self.state,
            'payment_terms': self.payment_terms,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
