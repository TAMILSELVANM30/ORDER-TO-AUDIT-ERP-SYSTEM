from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from decimal import Decimal
from app.models.base import Base, TimestampMixin, generate_uuid

class ProductCategory(Base, TimestampMixin):
    __tablename__ = 'product_categories'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    products = relationship("Product", back_populates="category")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
        }

class Unit(Base, TimestampMixin):
    __tablename__ = 'units'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(20), unique=True, nullable=False)  # kg, g, litre, ml, piece, packet, carton
    name = Column(String(50), nullable=False)
    base_type = Column(String(20), nullable=False)  # WEIGHT, VOLUME, COUNT
    conversion_factor = Column(Numeric(12, 4), default=Decimal('1.0000')) # Factor to base unit (g, ml, piece)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'base_type': self.base_type,
            'conversion_factor': float(self.conversion_factor),
        }

class Product(Base, TimestampMixin):
    __tablename__ = 'products'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    category_id = Column(String(36), ForeignKey('product_categories.id'), nullable=True)
    description = Column(Text, nullable=True)
    pack_size = Column(Numeric(10, 2), nullable=False, default=Decimal('200'))
    pack_unit = Column(String(20), nullable=False, default='g')  # g, kg, ml, piece
    uom = Column(String(20), nullable=False, default='packet')  # Selling unit: packet, piece
    hsn_code = Column(String(20), nullable=False, default='1905')
    selling_price = Column(Numeric(12, 2), nullable=False, default=Decimal('50.00'))
    gst_rate = Column(Numeric(5, 2), nullable=False, default=Decimal('5.00')) # 5% default
    min_stock_level = Column(Numeric(12, 2), default=Decimal('20.00'))
    current_stock = Column(Numeric(12, 2), default=Decimal('0.00'))
    is_active = Column(Boolean, default=True, nullable=False)
    
    category = relationship("ProductCategory", back_populates="products")
    boms = relationship("BOM", back_populates="product", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'description': self.description,
            'pack_size': float(self.pack_size),
            'pack_unit': self.pack_unit,
            'uom': self.uom,
            'hsn_code': self.hsn_code,
            'selling_price': float(self.selling_price),
            'gst_rate': float(self.gst_rate),
            'min_stock_level': float(self.min_stock_level),
            'current_stock': float(self.current_stock),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
