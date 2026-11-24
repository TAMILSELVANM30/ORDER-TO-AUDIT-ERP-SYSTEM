from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.db import SessionLocal
from app.models.user import User
from app.utils.audit import log_audit_event

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
        
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated. Please contact admin.'}), 403
            
        token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role, 'full_name': user.full_name}
        )
        
        log_audit_event(
            db, action="USER_LOGIN", entity_type="User",
            entity_id=user.id, user_id=user.id,
            remarks=f"User {user.email} logged in with role {user.role}"
        )
        db.commit()
        
        return jsonify({
            'access_token': token,
            'user': user.to_dict()
        }), 200
    finally:
        db.close()

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'user': user.to_dict()}), 200
    finally:
        db.close()

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
