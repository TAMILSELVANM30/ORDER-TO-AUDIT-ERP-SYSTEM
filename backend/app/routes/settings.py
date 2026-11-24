from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models.settings import BusinessSettings
from app.models.user import Role
from app.permissions.decorators import roles_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    db = SessionLocal()
    try:
        settings = db.query(BusinessSettings).first()
        if not settings:
            settings = BusinessSettings()
            db.add(settings)
            db.commit()
        return jsonify({'settings': settings.to_dict()}), 200
    finally:
        db.close()

@settings_bp.route('', methods=['PUT'])
@roles_required(Role.ADMIN)
def update_settings():
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        settings = db.query(BusinessSettings).first()
        if not settings:
            settings = BusinessSettings()
            db.add(settings)
            
        for key in ['company_name', 'address', 'gstin', 'state', 'state_code', 'phone', 'email', 'current_financial_year']:
            if key in data:
                setattr(settings, key, data[key])
        if 'default_variance_tolerance' in data:
            settings.default_variance_tolerance = data['default_variance_tolerance']
            
        db.commit()
        return jsonify({'settings': settings.to_dict()}), 200
    finally:
        db.close()
