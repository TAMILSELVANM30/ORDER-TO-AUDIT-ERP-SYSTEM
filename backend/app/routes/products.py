from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.product import Product, ProductCategory
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

@products_bp.route('', methods=['GET'])
def get_products():
    db = SessionLocal()
    try:
        query = db.query(Product)
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id')
        is_active = request.args.get('is_active')
        
        if search:
            query = query.filter(Product.name.ilike(f'%{search}%') | Product.sku.ilike(f'%{search}%'))
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if is_active is not None and is_active != '':
            query = query.filter(Product.is_active == (is_active.lower() == 'true'))
            
        products = query.order_by(Product.name.asc()).all()
        categories = db.query(ProductCategory).all()
        return jsonify({
            'products': [p.to_dict() for p in products],
            'categories': [c.to_dict() for c in categories]
        }), 200
    finally:
        db.close()

@products_bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    db = SessionLocal()
    try:
        product = db.query(Product).filter_by(id=product_id).first()
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify({'product': product.to_dict()}), 200
    finally:
        db.close()

@products_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_product():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    sku = data.get('sku', '').strip()
    
    if not name or not sku:
        return jsonify({'error': 'Product name and SKU are required'}), 400
        
    db = SessionLocal()
    try:
        existing = db.query(Product).filter_by(sku=sku).first()
        if existing:
            return jsonify({'error': f'Product with SKU {sku} already exists'}), 400
            
        product = Product(
            name=name,
            sku=sku,
            category_id=data.get('category_id'),
            description=data.get('description'),
            pack_size=to_decimal(data.get('pack_size', 200), 2),
            pack_unit=data.get('pack_unit', 'g'),
            uom=data.get('uom', 'packet'),
            hsn_code=data.get('hsn_code', '1905'),
            selling_price=to_decimal(data.get('selling_price', 50.0), 2),
            gst_rate=to_decimal(data.get('gst_rate', 5.0), 2),
            min_stock_level=to_decimal(data.get('min_stock_level', 20.0), 2),
            is_active=bool(data.get('is_active', True))
        )
        db.add(product)
        db.commit()
        
        current_user_id = get_current_user_id()
        log_audit_event(
            db, action="PRODUCT_CREATED", entity_type="Product",
            entity_id=product.id, user_id=current_user_id,
            new_values={'name': product.name, 'sku': product.sku}
        )
        db.commit()
        return jsonify({'product': product.to_dict()}), 201
    finally:
        db.close()

@products_bp.route('/<product_id>', methods=['PUT'])
@roles_required(Role.ADMIN)
def update_product(product_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        product = db.query(Product).filter_by(id=product_id).first()
        if not product:
            return jsonify({'error': 'Product not found'}), 404
            
        if 'name' in data:
            product.name = data['name']
        if 'category_id' in data:
            product.category_id = data['category_id']
        if 'description' in data:
            product.description = data['description']
        if 'pack_size' in data:
            product.pack_size = to_decimal(data['pack_size'], 2)
        if 'pack_unit' in data:
            product.pack_unit = data['pack_unit']
        if 'uom' in data:
            product.uom = data['uom']
        if 'hsn_code' in data:
            product.hsn_code = data['hsn_code']
        if 'selling_price' in data:
            product.selling_price = to_decimal(data['selling_price'], 2)
        if 'gst_rate' in data:
            product.gst_rate = to_decimal(data['gst_rate'], 2)
        if 'min_stock_level' in data:
            product.min_stock_level = to_decimal(data['min_stock_level'], 2)
        if 'is_active' in data:
            product.is_active = bool(data['is_active'])
            
        db.commit()
        return jsonify({'product': product.to_dict()}), 200
    finally:
        db.close()
