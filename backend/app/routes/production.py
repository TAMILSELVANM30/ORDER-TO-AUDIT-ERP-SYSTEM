from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal
from app.db import SessionLocal
from app.models.production import ProductionRun, ProductionStatus
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.production_service import ProductionService
from app.utils.financial import to_decimal

production_bp = Blueprint('production', __name__, url_prefix='/api/production')

@production_bp.route('/runs', methods=['GET'])
def get_production_runs():
    db = SessionLocal()
    try:
        runs = db.query(ProductionRun).order_by(ProductionRun.production_date.desc(), ProductionRun.created_at.desc()).all()
        return jsonify({'runs': [r.to_dict() for r in runs]}), 200
    finally:
        db.close()

@production_bp.route('/runs/<run_id>', methods=['GET'])
def get_production_run(run_id):
    db = SessionLocal()
    try:
        run = db.query(ProductionRun).filter_by(id=run_id).first()
        if not run:
            return jsonify({'error': 'Production run not found'}), 404
        return jsonify({'run': run.to_dict()}), 200
    finally:
        db.close()

@production_bp.route('/runs', methods=['POST'])
@roles_required(Role.ADMIN, Role.PRODUCTION)
def create_production_run():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    bom_version_id = data.get('bom_version_id')
    batch_size = to_decimal(data.get('batch_size', 200.0), 2)
    prod_date = date.fromisoformat(data['production_date']) if data.get('production_date') else date.today()
    actual_good = to_decimal(data.get('actual_good_output', 0.0), 2)
    damaged = to_decimal(data.get('damaged_output', 0.0), 2)
    materials = data.get('materials_issued', [])
    labour = to_decimal(data.get('labour_cost', 0.0), 2)
    gas = to_decimal(data.get('gas_cost', 0.0), 2)
    electricity = to_decimal(data.get('electricity_cost', 0.0), 2)
    other = to_decimal(data.get('other_overheads', 0.0), 2)
    supervisor_id = data.get('supervisor_id')
    remarks = data.get('remarks')
    auto_post = bool(data.get('auto_post', False))
    
    if not product_id or not bom_version_id:
        return jsonify({'error': 'Product ID and BOM Version ID are required'}), 400
        
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        run = ProductionService.create_production_run(
            db=db,
            product_id=product_id,
            bom_version_id=bom_version_id,
            batch_size=batch_size,
            production_date=prod_date,
            actual_good_output=actual_good,
            damaged_output=damaged,
            materials_issued=materials,
            labour_cost=labour,
            gas_cost=gas,
            electricity_cost=electricity,
            other_overheads=other,
            supervisor_id=supervisor_id,
            user_id=current_user_id,
            remarks=remarks
        )
        if auto_post:
            run = ProductionService.post_production_run(db, run.id, current_user_id)
            
        return jsonify({'run': run.to_dict()}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()

@production_bp.route('/runs/<run_id>/post', methods=['POST'])
@roles_required(Role.ADMIN, Role.PRODUCTION)
def post_production_run(run_id):
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        run = ProductionService.post_production_run(db, run_id, current_user_id)
        return jsonify({'run': run.to_dict(), 'message': 'Production run posted successfully. Inventory updated.'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()
