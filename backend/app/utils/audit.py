from app.models.audit_log import AuditLog
from flask import request

def log_audit_event(db, action: str, entity_type: str, entity_id: str, 
                    user_id: str = None, old_values: dict = None, 
                    new_values: dict = None, remarks: str = None):
    ip_addr = None
    try:
        if request:
            ip_addr = request.remote_addr
    except Exception:
        pass
        
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_values=old_values,
        new_values=new_values,
        remarks=remarks,
        ip_address=ip_addr
    )
    db.add(audit_entry)
