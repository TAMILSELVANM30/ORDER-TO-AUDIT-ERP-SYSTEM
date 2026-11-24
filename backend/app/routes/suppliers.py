from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.supplier import Supplier
from app.models.material import Material, MaterialType
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')
materials_bp = Blueprint('materials', __name__, url_prefix='/api/materials')

# ----------------- Suppliers -----------------
@suppliers_bp.route('', methods=['GET'])
def get_suppliers():
    db = SessionLocal()
    try:
        suppliers = db.query(Supplier).order_by(Supplier.supplier_name.asc()).all()
        return jsonify({'suppliers': [s.to_dict() for s in suppliers]}), 200
    finally:
        db.close()

@suppliers_bp.route('/<supplier_id>', methods=['GET'])
def get_supplier(supplier_id):
    db = SessionLocal()
    try:
        supplier = db.query(Supplier).filter_by(id=supplier_id).first()
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        data = supplier.to_dict()
        data['purchases'] = [p.to_dict() for p in supplier.purchases]
        return jsonify({'supplier': data}), 200
    finally:
        db.close()

@suppliers_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_supplier():
    data = request.get_json() or {}
    name = data.get('supplier_name', '').strip()
    if not name:
        return jsonify({'error': 'Supplier name is required'}), 400
        
    db = SessionLocal()
    try:
        count = db.query(Supplier).count()
        code = f"SUP-{count + 1:04d}"
        supplier = Supplier(
            supplier_code=code,
            supplier_name=name,
            contact_details=data.get('contact_details'),
            gstin=data.get('gstin'),
            address=data.get('address', 'Thuvakudi, Tiruchirappalli'),
            state=data.get('state', 'Tamil Nadu'),
            payment_terms=data.get('payment_terms', '30 Days Net'),
            is_active=bool(data.get('is_active', True))
        )
        db.add(supplier)
        db.commit()
        return jsonify({'supplier': supplier.to_dict()}), 201
    finally:
        db.close()

# ----------------- Materials -----------------
@materials_bp.route('', methods=['GET'])
def get_materials():
    db = SessionLocal()
    try:
        m_type = request.args.get('material_type')
        query = db.query(Material)
        if m_type:
            query = query.filter(Material.material_type == m_type)
        materials = query.order_by(Material.material_type.asc(), Material.name.asc()).all()
        return jsonify({'materials': [m.to_dict() for m in materials]}), 200
    finally:
        db.close()

@materials_bp.route('/<material_id>', methods=['GET'])
def get_material(material_id):
    db = SessionLocal()
    try:
        mat = db.query(Material).filter_by(id=material_id).first()
        if not mat:
            return jsonify({'error': 'Material not found'}), 404
        return jsonify({'material': mat.to_dict()}), 200
    finally:
        db.close()

@materials_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_material():
    data = request.get_json() or {}
    code = data.get('code', '').strip()
    name = data.get('name', '').strip()
    if not code or not name:
        return jsonify({'error': 'Code and Name are required'}), 400
        
    db = SessionLocal()
    try:
        mat = Material(
            code=code,
            name=name,
            material_type=data.get('material_type', MaterialType.RAW_MATERIAL),
            unit=data.get('unit', 'kg'),
            min_stock_level=to_decimal(data.get('min_stock_level', 10.0), 2),
            current_stock=Decimal('0.0000'),
            current_weighted_avg_cost=to_decimal(data.get('current_weighted_avg_cost', 0.0), 4),
            hsn_code=data.get('hsn_code'),
            gst_rate=to_decimal(data.get('gst_rate', 5.0), 2),
            is_active=bool(data.get('is_active', True))
        )
        db.add(mat)
        db.commit()
        return jsonify({'material': mat.to_dict()}), 201
    finally:
        db.close()
