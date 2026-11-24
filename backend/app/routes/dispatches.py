from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.dispatch import Dispatch
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.sales_service import SalesService

dispatches_bp = Blueprint('dispatches', __name__, url_prefix='/api/dispatches')

@dispatches_bp.route('', methods=['GET'])
def get_dispatches():
    db = SessionLocal()
    try:
        dispatches = db.query(Dispatch).order_by(Dispatch.dispatch_date.desc(), Dispatch.created_at.desc()).all()
        return jsonify({'dispatches': [d.to_dict() for d in dispatches]}), 200
    finally:
        db.close()

@dispatches_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_dispatch():
    data = request.get_json() or {}
    invoice_id = data.get('invoice_id')
    items = data.get('items') # optional partial items
    vehicle_no = data.get('vehicle_no')
    delivery_notes = data.get('delivery_notes')
    
    if not invoice_id:
        return jsonify({'error': 'Invoice ID is required'}), 400
        
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        dispatch = SalesService.create_dispatch(
            db=db,
            invoice_id=invoice_id,
            items_to_dispatch=items,
            vehicle_no=vehicle_no,
            delivery_notes=delivery_notes,
            user_id=current_user_id
        )
        return jsonify({'dispatch': dispatch.to_dict(), 'message': 'Goods dispatched and finished stock updated'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()
