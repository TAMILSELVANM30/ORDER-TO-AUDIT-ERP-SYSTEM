import os
from datetime import timedelta
from dotenv import load_dotenv

# Load root .env or backend .env
basedir = os.path.abspath(os.path.dirname(__file__))
root_env = os.path.abspath(os.path.join(basedir, '..', '.env'))
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key-32-chars-long')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-32-chars-long')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    
    # Database URL
    DATABASE_URL = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(basedir, 'order_to_audit.db')}")
    # Handle postgres:// vs postgresql:// for SQLAlchemy compatibility
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Reports output directory
    REPORTS_DIR = os.path.join(basedir, 'generated_reports')
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # Supabase Storage
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
    SUPABASE_SERVICE_ROLE_KEY = (
        os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
        or os.environ.get('SUPABASE_KEY', '')
        or os.environ.get('SUPABASE_PUBLISHABLE_KEY', '')
    )
