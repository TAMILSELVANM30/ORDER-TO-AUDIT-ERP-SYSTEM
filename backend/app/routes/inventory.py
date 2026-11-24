from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.services.report_service import ReportService
from app.models.stock_ledger import StockLedger

inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

@inventory_bp.route('/summary', methods=['GET'])
def get_inventory_summary():
    db = SessionLocal()
    try:
        summary = ReportService.get_stock_summary(db)
        return jsonify({'summary': summary, 'data': summary}), 200
    finally:
        db.close()

@inventory_bp.route('/ledger', methods=['GET'])
def get_inventory_ledger():
    db = SessionLocal()
    try:
        item_type = request.args.get('item_type')
        item_id = request.args.get('item_id')
        ledger = ReportService.get_stock_ledger(db, item_type=item_type, item_id=item_id)
        return jsonify({'ledger': ledger, 'data': {'entries': ledger, 'total': len(ledger)}}), 200
    finally:
        db.close()
