from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.user import User, Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.utils.audit import log_audit_event

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
@roles_required(Role.ADMIN, Role.OWNER)
def get_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return jsonify({'users': [u.to_dict() for u in users]}), 200
    finally:
        db.close()

@users_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_user():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    role = data.get('role', Role.SALESMAN)
    
    if not email or not password or not full_name:
        return jsonify({'error': 'Email, password and full name are required'}), 400
        
    if role not in Role.ALL:
        return jsonify({'error': f'Invalid role: {role}'}), 400
        
    db = SessionLocal()
    try:
        existing = db.query(User).filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'Email already registered'}), 400
            
        user = User(email=email, full_name=full_name, role=role)
        user.set_password(password)
        db.add(user)
        db.commit()
        
        current_user_id = get_current_user_id()
        log_audit_event(
            db, action="USER_CREATED", entity_type="User",
            entity_id=user.id, user_id=current_user_id,
            new_values={'email': user.email, 'role': user.role}
        )
        db.commit()
        return jsonify({'user': user.to_dict()}), 201
    finally:
        db.close()

@users_bp.route('/<user_id>', methods=['PUT'])
@roles_required(Role.ADMIN)
def update_user(user_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'role' in data and data['role'] in Role.ALL:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        if 'password' in data and data['password']:
            user.set_password(data['password'])
            
        db.commit()
        return jsonify({'user': user.to_dict()}), 200
    finally:
        db.close()
