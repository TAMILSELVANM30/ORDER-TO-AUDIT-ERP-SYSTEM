from sqlalchemy import Column, String, Numeric
from app.models.base import Base, TimestampMixin, generate_uuid
from decimal import Decimal

class BusinessSettings(Base, TimestampMixin):
    __tablename__ = 'business_settings'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_name = Column(String(200), nullable=False, default="Dakshin Packaged Foods Pvt Ltd")
    address = Column(String(300), nullable=False, default="12/4 Industrial Estate, Thuvakudi, Tiruchirappalli, Tamil Nadu - 620015")
    gstin = Column(String(15), nullable=False, default="33AAAAA0000A1Z5")
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    state_code = Column(String(5), nullable=False, default="33")
    phone = Column(String(20), nullable=False, default="+91 431 2500000")
    email = Column(String(100), nullable=False, default="contact@dakshinfoods.com")
    default_variance_tolerance = Column(Numeric(5, 2), default=Decimal('3.00')) # 3% default
    current_financial_year = Column(String(10), default="2026-27")
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'address': self.address,
            'gstin': self.gstin,
            'state': self.state,
            'state_code': self.state_code,
            'phone': self.phone,
            'email': self.email,
            'default_variance_tolerance': float(self.default_variance_tolerance) if self.default_variance_tolerance is not None else 3.0,
            'current_financial_year': self.current_financial_year,
        }
