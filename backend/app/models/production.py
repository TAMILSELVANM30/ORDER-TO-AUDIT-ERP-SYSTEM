from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Text, Date, Boolean
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import datetime, timezone, date
from app.models.base import Base, TimestampMixin, generate_uuid

class ProductionStatus:
    DRAFT = 'DRAFT'
    POSTED = 'POSTED'
    CANCELLED = 'CANCELLED'
    ALL = [DRAFT, POSTED, CANCELLED]

class ProductionRun(Base, TimestampMixin):
    __tablename__ = 'production_runs'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_number = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=False)
    bom_version_id = Column(String(36), ForeignKey('bom_versions.id'), nullable=False)
    production_date = Column(Date, default=date.today, nullable=False)
    batch_size = Column(Numeric(12, 2), nullable=False, default=Decimal('200'))
    expected_output = Column(Numeric(12, 2), nullable=False, default=Decimal('200'))
    actual_good_output = Column(Numeric(12, 2), nullable=False, default=Decimal('0'))
    damaged_output = Column(Numeric(12, 2), nullable=False, default=Decimal('0'))
    scrap_quantity = Column(Numeric(12, 2), nullable=False, default=Decimal('0'))
    
    # Overheads
    labour_cost = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    gas_cost = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    electricity_cost = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    other_overheads = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_overhead = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    
    # Valuations and costs
    total_material_cost = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_packaging_cost = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_production_cost = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    cost_per_packet = Column(Numeric(12, 4), default=Decimal('0.0000'), nullable=False)
    yield_variance_pct = Column(Numeric(8, 2), default=Decimal('0.00'), nullable=False)
    
    status = Column(String(20), default=ProductionStatus.DRAFT, nullable=False)
    supervisor_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    created_by_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    posted_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    
    product = relationship("Product")
    bom_version = relationship("BOMVersion")
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    material_issues = relationship("ProductionMaterialIssue", back_populates="production_run", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'run_number': self.run_number,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'bom_version_id': self.bom_version_id,
            'bom_version_number': self.bom_version.version_number if self.bom_version else None,
            'production_date': self.production_date.isoformat() if self.production_date else None,
            'batch_size': float(self.batch_size),
            'expected_output': float(self.expected_output),
            'actual_good_output': float(self.actual_good_output),
            'damaged_output': float(self.damaged_output),
            'scrap_quantity': float(self.scrap_quantity),
            'labour_cost': float(self.labour_cost),
            'gas_cost': float(self.gas_cost),
            'electricity_cost': float(self.electricity_cost),
            'other_overheads': float(self.other_overheads),
            'total_overhead': float(self.total_overhead),
            'total_material_cost': float(self.total_material_cost),
            'total_packaging_cost': float(self.total_packaging_cost),
            'total_production_cost': float(self.total_production_cost),
            'cost_per_packet': round(float(self.cost_per_packet), 2),
            'cost_per_packet_exact': float(self.cost_per_packet),
            'yield_variance_pct': float(self.yield_variance_pct),
            'has_yield_warning': abs(float(self.yield_variance_pct)) > 3.0,
            'status': self.status,
            'supervisor_name': self.supervisor.full_name if self.supervisor else None,
            'created_by': self.created_by.full_name if self.created_by else None,
            'posted_at': self.posted_at.isoformat() if self.posted_at else None,
            'remarks': self.remarks,
            'material_issues': [m.to_dict() for m in self.material_issues],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class ProductionMaterialIssue(Base, TimestampMixin):
    __tablename__ = 'production_material_issues'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    production_run_id = Column(String(36), ForeignKey('production_runs.id'), nullable=False)
    material_id = Column(String(36), ForeignKey('materials.id'), nullable=False)
    planned_quantity = Column(Numeric(12, 4), nullable=False)
    actual_quantity = Column(Numeric(12, 4), nullable=False)
    unit = Column(String(20), nullable=False)
    unit_cost = Column(Numeric(12, 4), nullable=False, default=Decimal('0.0000'))
    total_cost = Column(Numeric(12, 2), nullable=False, default=Decimal('0.00'))
    variance_qty = Column(Numeric(12, 4), nullable=False, default=Decimal('0.0000'))
    variance_pct = Column(Numeric(8, 2), nullable=False, default=Decimal('0.00'))
    is_excess = Column(Boolean, default=False, nullable=False)
    component_type = Column(String(30), nullable=False, default='RAW_MATERIAL') # RAW_MATERIAL, PACKAGING
    
    production_run = relationship("ProductionRun", back_populates="material_issues")
    material = relationship("Material")
    
    def to_dict(self):
        return {
            'id': self.id,
            'production_run_id': self.production_run_id,
            'material_id': self.material_id,
            'material_code': self.material.code if self.material else None,
            'material_name': self.material.name if self.material else None,
            'component_type': self.component_type,
            'planned_quantity': float(self.planned_quantity),
            'actual_quantity': float(self.actual_quantity),
            'unit': self.unit,
            'unit_cost': float(self.unit_cost),
            'total_cost': float(self.total_cost),
            'variance_qty': float(self.variance_qty),
            'variance_pct': float(self.variance_pct),
            'is_excess': self.is_excess,
            'has_variance_warning': abs(float(self.variance_pct)) > 3.0,
        }
