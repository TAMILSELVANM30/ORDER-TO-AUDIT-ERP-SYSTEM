from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.db import init_db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # JWT Manager
    jwt = JWTManager(app)
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token required', 'message': error}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid authorization token', 'message': error}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Authorization token expired', 'message': 'Please login again'}), 401

    # Initialize database tables
    with app.app_context():
        init_db()
        
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.products import products_bp
    from app.routes.customers import customers_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.materials import materials_bp
    from app.routes.boms import boms_bp
    from app.routes.purchases import purchases_bp
    from app.routes.production import production_bp
    from app.routes.orders import orders_bp
    from app.routes.invoices import invoices_bp
    from app.routes.dispatches import dispatches_bp
    from app.routes.payments import payments_bp
    from app.routes.inventory import inventory_bp
    from app.routes.reports import reports_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.settings import settings_bp
    from app.routes.storage import storage_bp
    from app.routes.supabase_client import supabase_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(materials_bp)
    app.register_blueprint(boms_bp)
    app.register_blueprint(purchases_bp)
    app.register_blueprint(production_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(invoices_bp)
    app.register_blueprint(dispatches_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(supabase_bp)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'Order-to-Audit ERP API', 'version': '1.0.0'}), 200
        
    return app
