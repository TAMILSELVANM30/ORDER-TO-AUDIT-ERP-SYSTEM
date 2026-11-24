from sqlalchemy import Column, String, Boolean
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.base import Base, TimestampMixin, generate_uuid

class Role:
    ADMIN = 'ADMIN'
    SALESMAN = 'SALESMAN'
    PRODUCTION = 'PRODUCTION'
    AUDITOR = 'AUDITOR'
    OWNER = 'OWNER'
    
    ALL = [ADMIN, SALESMAN, PRODUCTION, AUDITOR, OWNER]

class User(Base, TimestampMixin):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(20), nullable=False, default=Role.SALESMAN)
    is_active = Column(Boolean, default=True, nullable=False)
    
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
