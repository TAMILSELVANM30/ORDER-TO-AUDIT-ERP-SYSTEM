from flask import Blueprint, request, jsonify, Response
from app.db import SessionLocal
from app.models.invoice import Invoice
from app.models.settings import BusinessSettings
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.sales_service import SalesService
from app.reports.invoice_pdf import generate_invoice_pdf

invoices_bp = Blueprint('invoices', __name__, url_prefix='/api/invoices')

@invoices_bp.route('', methods=['GET'])
def get_invoices():
    db = SessionLocal()
    try:
        invoices = db.query(Invoice).order_by(Invoice.invoice_date.desc(), Invoice.created_at.desc()).all()
        return jsonify({'invoices': [i.to_dict() for i in invoices]}), 200
    finally:
        db.close()

@invoices_bp.route('/<invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    db = SessionLocal()
    try:
        invoice = db.query(Invoice).filter_by(id=invoice_id).first()
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        return jsonify({'invoice': invoice.to_dict()}), 200
    finally:
        db.close()

@invoices_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_invoice():
    data = request.get_json() or {}
    order_id = data.get('sales_order_id')
    if not order_id:
        return jsonify({'error': 'Sales order ID is required'}), 400
        
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        invoice = SalesService.generate_invoice(db, order_id, current_user_id)
        return jsonify({'invoice': invoice.to_dict(), 'message': 'GST invoice generated successfully'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()

@invoices_bp.route('/<invoice_id>/pdf', methods=['GET'])
def download_invoice_pdf(invoice_id):
    db = SessionLocal()
    try:
        invoice = db.query(Invoice).filter_by(id=invoice_id).first()
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
            
        settings = db.query(BusinessSettings).first()
        pdf_bytes = generate_invoice_pdf(invoice, settings)
        
        filename = f"{invoice.invoice_number.replace('/', '_')}.pdf"
        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
    finally:
        db.close()
