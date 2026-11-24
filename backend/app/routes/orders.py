from flask import Blueprint, request, jsonify
from datetime import date
from app.db import SessionLocal
from app.models.sales_order import SalesOrder, OrderStatus
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.sales_service import SalesService
from app.utils.financial import to_decimal

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@orders_bp.route('', methods=['GET'])
def get_orders():
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        query = db.query(SalesOrder).order_by(SalesOrder.order_date.desc(), SalesOrder.created_at.desc())
        
        # Role permission: salesman sees only their own orders!
        status_filter = request.args.get('status')
        salesman_id = request.args.get('salesman_id')
        customer_id = request.args.get('customer_id')
        
        if status_filter:
            query = query.filter(SalesOrder.status == status_filter)
        if salesman_id:
            query = query.filter(SalesOrder.salesman_id == salesman_id)
        if customer_id:
            query = query.filter(SalesOrder.customer_id == customer_id)
            
        orders = query.all()
        return jsonify({'orders': [o.to_dict() for o in orders]}), 200
    finally:
        db.close()

@orders_bp.route('/<order_id>', methods=['GET'])
def get_order(order_id):
    db = SessionLocal()
    try:
        order = db.query(SalesOrder).filter_by(id=order_id).first()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        return jsonify({'order': order.to_dict()}), 200
    finally:
        db.close()

@orders_bp.route('/<order_id>/check-stock', methods=['GET'])
def check_order_stock(order_id):
    db = SessionLocal()
    try:
        result = SalesService.check_order_stock_availability(db, order_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()

@orders_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN, Role.SALESMAN)
def create_order():
    data = request.get_json() or {}
    customer_id = data.get('customer_id')
    items = data.get('items', [])
    notes = data.get('notes')
    order_date = date.fromisoformat(data['order_date']) if data.get('order_date') else date.today()
    
    current_user_id = get_current_user_id()
    salesman_id = data.get('salesman_id') or current_user_id
    
    if not customer_id or not items:
        return jsonify({'error': 'Customer and at least one item are required'}), 400
        
    db = SessionLocal()
    try:
        order = SalesService.create_sales_order(
            db=db,
            customer_id=customer_id,
            salesman_id=salesman_id,
            items_data=items,
            order_date=order_date,
            notes=notes
        )
        return jsonify({'order': order.to_dict()}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()

@orders_bp.route('/<order_id>/approve', methods=['POST'])
@roles_required(Role.ADMIN)
def approve_order(order_id):
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        order = SalesService.approve_order(db, order_id, current_user_id)
        return jsonify({'order': order.to_dict(), 'message': 'Order approved successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()

@orders_bp.route('/<order_id>/reject', methods=['POST'])
@roles_required(Role.ADMIN)
def reject_order(order_id):
    data = request.get_json() or {}
    reason = data.get('reason', 'Rejected by Administrator')
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        order = SalesService.reject_order(db, order_id, reason, current_user_id)
        return jsonify({'order': order.to_dict(), 'message': 'Order rejected'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()
