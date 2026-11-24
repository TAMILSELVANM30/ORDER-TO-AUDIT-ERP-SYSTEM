from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.customer import Customer, CustomerType
from app.models.user import Role, User
from app.permissions.decorators import roles_required, get_current_user_id
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customers_bp.route('', methods=['GET'])
def get_customers():
    db = SessionLocal()
    try:
        query = db.query(Customer)
        search = request.args.get('search', '').strip()
        customer_type = request.args.get('customer_type')
        salesman_id = request.args.get('salesman_id')
        
        if search:
            query = query.filter(
                Customer.customer_name.ilike(f'%{search}%') |
                Customer.customer_code.ilike(f'%{search}%') |
                Customer.mobile.ilike(f'%{search}%')
            )
        if customer_type:
            query = query.filter(Customer.customer_type == customer_type)
        if salesman_id:
            query = query.filter(Customer.assigned_salesman_id == salesman_id)
            
        customers = query.order_by(Customer.customer_name.asc()).all()
        return jsonify({'customers': [c.to_dict() for c in customers]}), 200
    finally:
        db.close()

@customers_bp.route('/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter_by(id=customer_id).first()
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
            
        data = customer.to_dict()
        data['orders'] = [o.to_dict() for o in customer.orders]
        data['invoices'] = [i.to_dict() for i in customer.invoices]
        data['payments'] = [p.to_dict() for p in customer.payments]
        return jsonify({'customer': data}), 200
    finally:
        db.close()

@customers_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN, Role.SALESMAN)
def create_customer():
    data = request.get_json() or {}
    name = data.get('customer_name', '').strip()
    mobile = data.get('mobile', '').strip()
    
    if not name or not mobile:
        return jsonify({'error': 'Customer name and mobile are required'}), 400
        
    db = SessionLocal()
    try:
        count = db.query(Customer).count()
        code = f"CUST-{count + 1:04d}"
        
        customer = Customer(
            customer_code=code,
            customer_name=name,
            contact_person=data.get('contact_person'),
            mobile=mobile,
            email=data.get('email'),
            billing_address=data.get('billing_address', 'Tiruchirappalli, Tamil Nadu'),
            shipping_address=data.get('shipping_address', data.get('billing_address', 'Tiruchirappalli, Tamil Nadu')),
            state=data.get('state', 'Tamil Nadu'),
            state_code=data.get('state_code', '33'),
            gstin=data.get('gstin'),
            customer_type=data.get('customer_type', CustomerType.RETAILER),
            assigned_salesman_id=data.get('assigned_salesman_id'),
            credit_limit=to_decimal(data.get('credit_limit', 50000.0), 2),
            opening_balance=to_decimal(data.get('opening_balance', 0.0), 2),
            is_active=bool(data.get('is_active', True))
        )
        db.add(customer)
        db.commit()
        
        current_user_id = get_current_user_id()
        log_audit_event(
            db, action="CUSTOMER_CREATED", entity_type="Customer",
            entity_id=customer.id, user_id=current_user_id,
            new_values={'customer_code': customer.customer_code, 'name': customer.customer_name}
        )
        db.commit()
        return jsonify({'customer': customer.to_dict()}), 201
    finally:
        db.close()
