from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, Integer, DateTime
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import datetime, timezone
from app.models.base import Base, TimestampMixin, generate_uuid

class BOM(Base, TimestampMixin):
    __tablename__ = 'boms'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    product = relationship("Product", back_populates="boms")
    versions = relationship("BOMVersion", back_populates="bom", cascade="all, delete-orphan", order_by="desc(BOMVersion.version_number)")
    
    def active_version(self):
        for v in self.versions:
            if v.is_active:
                return v
        return self.versions[0] if self.versions else None

    def to_dict(self):
        active_ver = self.active_version()
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'is_active': self.is_active,
            'active_version': active_ver.to_dict() if active_ver else None,
            'total_versions': len(self.versions),
            'versions': [v.to_dict() for v in self.versions],
        }

class BOMVersion(Base, TimestampMixin):
    __tablename__ = 'bom_versions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bom_id = Column(String(36), ForeignKey('boms.id'), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    batch_size = Column(Numeric(12, 2), nullable=False, default=Decimal('200')) # e.g. 200 packets
    expected_yield = Column(Numeric(12, 2), nullable=False, default=Decimal('200'))
    yield_unit = Column(String(20), nullable=False, default='packet')
    effective_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    bom = relationship("BOM", back_populates="versions")
    components = relationship("BOMComponent", back_populates="bom_version", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'bom_id': self.bom_id,
            'version_number': self.version_number,
            'batch_size': float(self.batch_size),
            'expected_yield': float(self.expected_yield),
            'yield_unit': self.yield_unit,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'is_active': self.is_active,
            'components': [c.to_dict() for c in self.components],
        }

class BOMComponent(Base, TimestampMixin):
    __tablename__ = 'bom_components'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bom_version_id = Column(String(36), ForeignKey('bom_versions.id'), nullable=False)
    material_id = Column(String(36), ForeignKey('materials.id'), nullable=False)
    standard_quantity = Column(Numeric(12, 4), nullable=False)
    unit = Column(String(20), nullable=False) # kg, litre, piece
    component_type = Column(String(30), nullable=False) # RAW_MATERIAL, PACKAGING
    
    bom_version = relationship("BOMVersion", back_populates="components")
    material = relationship("Material")
    
    def to_dict(self):
        return {
            'id': self.id,
            'bom_version_id': self.bom_version_id,
            'material_id': self.material_id,
            'material_code': self.material.code if self.material else None,
            'material_name': self.material.name if self.material else None,
            'standard_quantity': float(self.standard_quantity),
            'unit': self.unit,
            'component_type': self.component_type,
        }
