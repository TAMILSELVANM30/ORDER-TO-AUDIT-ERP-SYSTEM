from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from decimal import Decimal
from datetime import datetime, timezone, date
from app.models.base import Base, TimestampMixin, generate_uuid

class MovementType:
    OPENING_STOCK = 'OPENING_STOCK'
    PURCHASE_RECEIPT = 'PURCHASE_RECEIPT'
    PRODUCTION_ISSUE = 'PRODUCTION_ISSUE'
    PRODUCTION_OUTPUT = 'PRODUCTION_OUTPUT'
    SALES_DISPATCH = 'SALES_DISPATCH'
    SALES_RETURN = 'SALES_RETURN'
    PURCHASE_RETURN = 'PURCHASE_RETURN'
    STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT'
    ALL = [OPENING_STOCK, PURCHASE_RECEIPT, PRODUCTION_ISSUE, PRODUCTION_OUTPUT, SALES_DISPATCH, SALES_RETURN, PURCHASE_RETURN, STOCK_ADJUSTMENT]

class ItemType:
    MATERIAL = 'MATERIAL'
    FINISHED_GOOD = 'FINISHED_GOOD'
    ALL = [MATERIAL, FINISHED_GOOD]

class StockLedger(Base, TimestampMixin):
    __tablename__ = 'stock_ledger'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_type = Column(String(20), nullable=False) # MATERIAL, FINISHED_GOOD
    material_id = Column(String(36), ForeignKey('materials.id'), nullable=True)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=True)
    
    movement_type = Column(String(30), nullable=False) # e.g. PURCHASE_RECEIPT, PRODUCTION_ISSUE...
    quantity_in = Column(Numeric(12, 4), default=Decimal('0.0000'), nullable=False)
    quantity_out = Column(Numeric(12, 4), default=Decimal('0.0000'), nullable=False)
    balance_after = Column(Numeric(12, 4), nullable=False)
    unit = Column(String(20), nullable=False)
    unit_cost = Column(Numeric(12, 4), default=Decimal('0.0000'), nullable=False)
    total_valuation = Column(Numeric(14, 2), default=Decimal('0.00'), nullable=False)
    
    source_doc_type = Column(String(50), nullable=False) # PURCHASE, PRODUCTION_RUN, DISPATCH, OPENING
    source_doc_id = Column(String(100), nullable=False)
    transaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    remarks = Column(Text, nullable=True)
    
    material = relationship("Material")
    product = relationship("Product")
    user = relationship("User")
    
    def to_dict(self):
        item_name = self.material.name if self.material else (self.product.name if self.product else "Unknown")
        item_code = self.material.code if self.material else (self.product.sku if self.product else "")
        return {
            'id': self.id,
            'item_type': self.item_type,
            'material_id': self.material_id,
            'product_id': self.product_id,
            'item_code': item_code,
            'item_name': item_name,
            'movement_type': self.movement_type,
            'quantity_in': float(self.quantity_in),
            'quantity_out': float(self.quantity_out),
            'balance_after': float(self.balance_after),
            'unit': self.unit,
            'unit_cost': float(self.unit_cost),
            'total_valuation': float(self.total_valuation),
            'source_doc_type': self.source_doc_type,
            'source_doc_id': self.source_doc_id,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'user_name': self.user.full_name if self.user else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
