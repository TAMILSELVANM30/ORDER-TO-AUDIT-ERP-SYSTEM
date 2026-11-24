from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.bom import BOM, BOMVersion, BOMComponent
from app.models.product import Product
from app.models.material import Material
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.production_service import ProductionService
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

boms_bp = Blueprint('boms', __name__, url_prefix='/api/boms')

@boms_bp.route('', methods=['GET'])
def get_boms():
    db = SessionLocal()
    try:
        boms = db.query(BOM).all()
        return jsonify({'boms': [b.to_dict() for b in boms]}), 200
    finally:
        db.close()

@boms_bp.route('/<bom_id>', methods=['GET'])
def get_bom(bom_id):
    db = SessionLocal()
    try:
        bom = db.query(BOM).filter_by(id=bom_id).first()
        if not bom:
            return jsonify({'error': 'BOM not found'}), 404
        return jsonify({'bom': bom.to_dict()}), 200
    finally:
        db.close()

@boms_bp.route('/product/<product_id>', methods=['GET'])
def get_bom_by_product(product_id):
    db = SessionLocal()
    try:
        bom = db.query(BOM).filter_by(product_id=product_id).first()
        if not bom:
            return jsonify({'error': 'BOM not found for this product'}), 404
        return jsonify({'bom': bom.to_dict()}), 200
    finally:
        db.close()

@boms_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN, Role.PRODUCTION)
def create_bom():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    batch_size = to_decimal(data.get('batch_size', 200.0), 2)
    expected_yield = to_decimal(data.get('expected_yield', 200.0), 2)
    yield_unit = data.get('yield_unit', 'packet')
    components_data = data.get('components', [])
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    if not components_data:
        return jsonify({'error': 'At least one component is required'}), 400
        
    db = SessionLocal()
    try:
        existing = db.query(BOM).filter_by(product_id=product_id).first()
        if existing:
            return jsonify({'error': 'BOM already exists for this product. Use version creation to update.'}), 400
            
        bom = BOM(product_id=product_id, is_active=True)
        db.add(bom)
        db.flush()
        
        bom_version = BOMVersion(
            bom_id=bom.id,
            version_number=1,
            batch_size=batch_size,
            expected_yield=expected_yield,
            yield_unit=yield_unit,
            is_active=True
        )
        db.add(bom_version)
        db.flush()
        
        for c in components_data:
            comp = BOMComponent(
                bom_version_id=bom_version.id,
                material_id=c['material_id'],
                standard_quantity=to_decimal(c['standard_quantity'], 4),
                unit=c.get('unit', 'kg'),
                component_type=c.get('component_type', 'RAW_MATERIAL')
            )
            db.add(comp)
            
        db.commit()
        return jsonify({'bom': bom.to_dict()}), 201
    finally:
        db.close()

@boms_bp.route('/<bom_id>/calculate', methods=['POST'])
def calculate_bom(bom_id):
    data = request.get_json() or {}
    batch_size = to_decimal(data.get('batch_size', 200.0), 2)
    version_id = data.get('version_id')
    
    db = SessionLocal()
    try:
        bom = db.query(BOM).filter_by(id=bom_id).first()
        if not bom:
            return jsonify({'error': 'BOM not found'}), 404
            
        if not version_id:
            active_v = bom.active_version()
            version_id = active_v.id if active_v else None
            
        if not version_id:
            return jsonify({'error': 'No active BOM version found'}), 400
            
        result = ProductionService.calculate_planned_run(
            db=db,
            product_id=bom.product_id,
            bom_version_id=version_id,
            batch_size=batch_size
        )
        return jsonify({'calculation': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()
