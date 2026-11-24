from flask import Blueprint, request, jsonify
from datetime import date
from decimal import Decimal
from app.db import SessionLocal
from app.models.purchase import Purchase, PurchaseItem, PurchaseStatus
from app.models.supplier import Supplier
from app.models.material import Material
from app.models.stock_ledger import MovementType
from app.models.user import Role
from app.permissions.decorators import roles_required, get_current_user_id
from app.services.inventory_service import InventoryService
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

purchases_bp = Blueprint('purchases', __name__, url_prefix='/api/purchases')

@purchases_bp.route('', methods=['GET'])
def get_purchases():
    db = SessionLocal()
    try:
        purchases = db.query(Purchase).order_by(Purchase.purchase_date.desc(), Purchase.created_at.desc()).all()
        return jsonify({'purchases': [p.to_dict() for p in purchases]}), 200
    finally:
        db.close()

@purchases_bp.route('/<purchase_id>', methods=['GET'])
def get_purchase(purchase_id):
    db = SessionLocal()
    try:
        purchase = db.query(Purchase).filter_by(id=purchase_id).first()
        if not purchase:
            return jsonify({'error': 'Purchase not found'}), 404
        return jsonify({'purchase': purchase.to_dict()}), 200
    finally:
        db.close()

@purchases_bp.route('', methods=['POST'])
@roles_required(Role.ADMIN)
def create_purchase():
    data = request.get_json() or {}
    supplier_id = data.get('supplier_id')
    items_data = data.get('items', [])
    purchase_date = data.get('purchase_date')
    supplier_invoice_no = data.get('supplier_invoice_no')
    remarks = data.get('remarks')
    
    if not supplier_id or not items_data:
        return jsonify({'error': 'Supplier ID and at least one item are required'}), 400
        
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        supplier = db.query(Supplier).filter_by(id=supplier_id).first()
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
            
        count = db.query(Purchase).count()
        purchase_number = f"PO-{date.today().year}-{count + 1:04d}"
        
        purchase = Purchase(
            purchase_number=purchase_number,
            supplier_id=supplier_id,
            purchase_date=date.fromisoformat(purchase_date) if purchase_date else date.today(),
            supplier_invoice_no=supplier_invoice_no,
            status=PurchaseStatus.POSTED,
            remarks=remarks,
            created_by_id=current_user_id
        )
        db.add(purchase)
        db.flush()
        
        total_taxable = Decimal('0.00')
        total_tax = Decimal('0.00')
        grand_total = Decimal('0.00')
        
        for item in items_data:
            mat_id = item['material_id']
            qty = to_decimal(item['quantity'], 4)
            rate = to_decimal(item['rate'], 4)
            gst_rate = to_decimal(item.get('gst_rate', Decimal('5.00')), 2)
            unit = item.get('unit', 'kg')
            
            taxable = to_decimal(qty * rate, 2)
            tax = to_decimal(taxable * (gst_rate / Decimal('100.00')), 2)
            line_total = taxable + tax
            
            total_taxable += taxable
            total_tax += tax
            grand_total += line_total
            
            p_item = PurchaseItem(
                purchase_id=purchase.id,
                material_id=mat_id,
                quantity=qty,
                unit=unit,
                rate=rate,
                gst_rate=gst_rate,
                taxable_amount=taxable,
                tax_amount=tax,
                total_amount=line_total,
                batch_number=item.get('batch_number'),
                expiry_date=date.fromisoformat(item['expiry_date']) if item.get('expiry_date') else None
            )
            db.add(p_item)
            
            # Update inventory and stock ledger atomically!
            InventoryService.record_material_movement(
                db=db,
                material_id=mat_id,
                movement_type=MovementType.PURCHASE_RECEIPT,
                quantity_in=qty,
                quantity_out=Decimal('0.0000'),
                source_doc_type="PURCHASE",
                source_doc_id=purchase.purchase_number,
                unit=unit,
                unit_cost=rate,
                user_id=current_user_id,
                remarks=f"Purchase from {supplier.supplier_name} (Inv: {supplier_invoice_no or 'N/A'})"
            )
            
        purchase.total_taxable = total_taxable
        purchase.total_tax = total_tax
        purchase.grand_total = grand_total
        
        log_audit_event(
            db, action="PURCHASE_POSTED", entity_type="Purchase",
            entity_id=purchase.id, user_id=current_user_id,
            new_values={'purchase_number': purchase.purchase_number, 'grand_total': float(grand_total)}
        )
        db.commit()
        return jsonify({'purchase': purchase.to_dict()}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        db.close()
