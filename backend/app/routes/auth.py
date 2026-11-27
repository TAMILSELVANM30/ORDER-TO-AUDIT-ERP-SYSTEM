import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.db import SessionLocal
from app.models.user import User
from app.utils.audit import log_audit_event

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate that password meets enterprise security standards."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r'[a-zA-Z]', password):
        return False, "Password must contain at least one letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number."
    return True, ""

@auth_bp.route('/register', methods=['POST'])
@auth_bp.route('/signup', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    role = data.get('role', 'SALESMAN').upper().strip()
    
    if not email or not password or not full_name:
        return jsonify({'error': 'Full name, email address, and password are required'}), 400
        
    if not EMAIL_REGEX.match(email):
        return jsonify({'error': 'Invalid email address format (e.g. user@dakshin.com)'}), 400
        
    is_valid_pwd, pwd_error = validate_password_strength(password)
    if not is_valid_pwd:
        return jsonify({'error': pwd_error}), 400
        
    from app.models.user import Role
    if role not in Role.ALL:
        role = Role.SALESMAN
        
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'An account with this email address is already registered'}), 409
            
        new_user = User(
            email=email,
            full_name=full_name,
            role=role,
            is_active=True
        )
        new_user.set_password(password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Dual-sync to Supabase Auth if client is configured
        try:
            from app.routes.supabase_client import get_supabase_instance
            sb = get_supabase_instance()
            if sb:
                sb.auth.sign_up({
                    "email": email,
                    "password": password,
                    "options": {
                        "data": {
                            "full_name": full_name,
                            "role": role
                        }
                    }
                })
        except Exception:
            pass
            
        log_audit_event(
            db, action="USER_REGISTER", entity_type="User",
            entity_id=new_user.id, user_id=new_user.id,
            remarks=f"Secure user registered: {new_user.email} (Role: {new_user.role})"
        )
        db.commit()
        
        token = create_access_token(
            identity=new_user.id,
            additional_claims={'role': new_user.role, 'full_name': new_user.full_name}
        )
        
        return jsonify({
            'message': 'Account created and authenticated successfully',
            'access_token': token,
            'user': new_user.to_dict()
        }), 201
    finally:
        db.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email address and password are required'}), 400
        
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not user.check_password(password):
            log_audit_event(
                db, action="LOGIN_FAILED", entity_type="User",
                entity_id=user.id if user else "UNKNOWN",
                user_id=user.id if user else None,
                remarks=f"Failed login attempt for email: {email}"
            )
            db.commit()
            return jsonify({'error': 'Invalid email address or password. Please verify credentials.'}), 401
            
        if not user.is_active:
            return jsonify({'error': 'Account has been deactivated. Please contact your system administrator.'}), 403
            
        token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role, 'full_name': user.full_name}
        )
        
        log_audit_event(
            db, action="USER_LOGIN", entity_type="User",
            entity_id=user.id, user_id=user.id,
            remarks=f"User {user.email} successfully authenticated with role {user.role}"
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
