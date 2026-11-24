from sqlalchemy import Column, String, Numeric, Boolean, Text
from decimal import Decimal
from app.models.base import Base, TimestampMixin, generate_uuid

class MaterialType:
    RAW_MATERIAL = 'RAW_MATERIAL'
    PACKAGING = 'PACKAGING'
    
    ALL = [RAW_MATERIAL, PACKAGING]

class Material(Base, TimestampMixin):
    __tablename__ = 'materials'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    material_type = Column(String(30), nullable=False, default=MaterialType.RAW_MATERIAL)
    unit = Column(String(20), nullable=False, default='kg')  # kg, litre, piece
    min_stock_level = Column(Numeric(12, 2), default=Decimal('10.00'))
    current_stock = Column(Numeric(12, 4), default=Decimal('0.0000'))
    current_weighted_avg_cost = Column(Numeric(12, 4), default=Decimal('0.0000'))
    last_purchase_rate = Column(Numeric(12, 4), default=Decimal('0.0000'))
    hsn_code = Column(String(20), nullable=True)
    gst_rate = Column(Numeric(5, 2), default=Decimal('5.00'))
    is_active = Column(Boolean, default=True, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'material_type': self.material_type,
            'unit': self.unit,
            'min_stock_level': float(self.min_stock_level),
            'current_stock': float(self.current_stock),
            'current_weighted_avg_cost': float(self.current_weighted_avg_cost),
            'last_purchase_rate': float(self.last_purchase_rate),
            'hsn_code': self.hsn_code,
            'gst_rate': float(self.gst_rate),
            'is_active': self.is_active,
            'is_low_stock': self.current_stock <= self.min_stock_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
