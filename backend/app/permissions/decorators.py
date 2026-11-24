from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models.user import User, Role
from app.db import SessionLocal

def roles_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({'error': 'Unauthorized', 'message': str(e)}), 401
                
            jwt_claims = get_jwt()
            user_role = jwt_claims.get('role')
            user_id = get_jwt_identity()
            
            if not user_role:
                db = SessionLocal()
                try:
                    user = db.query(User).filter_by(id=user_id, is_active=True).first()
                    if not user:
                        return jsonify({'error': 'User not found or deactivated'}), 401
                    user_role = user.role
                finally:
                    db.close()
                    
            if allowed_roles and user_role not in allowed_roles:
                return jsonify({
                    'error': 'Forbidden',
                    'message': f'Access denied. Role {user_role} is not permitted to perform this action.'
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user_id():
    try:
        verify_jwt_in_request()
        return get_jwt_identity()
    except Exception:
        return None
