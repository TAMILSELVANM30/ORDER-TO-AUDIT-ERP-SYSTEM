from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal
from app.db import SessionLocal
from app.models.payment import Payment, PaymentMethod
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.payment_service import PaymentService
from app.utils.financial import to_decimal

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('', methods=['GET'])
def get_payments():
    db = SessionLocal()
    try:
        customer_id = request.args.get('customer_id')
        query = db.query(Payment)
        if customer_id:
            query = query.filter_by(customer_id=customer_id)
        payments = query.order_by(Payment.payment_date.desc(), Payment.created_at.desc()).all()
        return jsonify({'payments': [p.to_dict() for p in payments]}), 200
    finally:
        db.close()

@payments_bp.route('/outstanding', methods=['GET'])
def get_outstanding():
    db = SessionLocal()
    try:
        customer_id = request.args.get('customer_id')
        summary = PaymentService.get_customer_outstanding_summary(db, customer_id)
        return jsonify({'outstanding': summary}), 200
    finally:
        db.close()

@payments_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def record_payment():
    data = request.get_json() or {}
    customer_id = data.get('customer_id')
    amount = to_decimal(data.get('amount', 0.0), 2)
    method = data.get('payment_method', PaymentMethod.BANK_TRANSFER)
    ref_no = data.get('reference_number')
    remarks = data.get('remarks')
    allocations = data.get('allocations') # optional explicit allocations
    pay_date = date.fromisoformat(data['payment_date']) if data.get('payment_date') else date.today()
    
    if not customer_id or amount <= Decimal('0.00'):
        return jsonify({'error': 'Customer ID and positive amount are required'}), 400
        
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        payment = PaymentService.record_payment(
            db=db,
            customer_id=customer_id,
            amount=amount,
            payment_method=method,
            invoice_allocations=allocations,
            payment_date=pay_date,
            reference_number=ref_no,
            remarks=remarks,
            user_id=current_user_id
        )
        return jsonify({'payment': payment.to_dict(), 'message': 'Payment recorded and applied successfully'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()
