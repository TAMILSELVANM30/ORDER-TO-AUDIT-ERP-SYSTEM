from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.stock_ledger import StockLedger, MovementType, ItemType
from app.models.material import Material
from app.models.product import Product
from app.utils.financial import to_decimal
from app.utils.units import convert_units

class InventoryService:
    @staticmethod
    def get_material_stock(db: Session, material_id: str) -> Decimal:
        mat = db.query(Material).filter_by(id=material_id).first()
        return to_decimal(mat.current_stock, 4) if mat else Decimal('0.0000')

    @staticmethod
    def get_product_stock(db: Session, product_id: str) -> Decimal:
        prod = db.query(Product).filter_by(id=product_id).first()
        return to_decimal(prod.current_stock, 2) if prod else Decimal('0.00')

    @staticmethod
    def record_material_movement(
        db: Session,
        material_id: str,
        movement_type: str,
        quantity_in: Decimal,
        quantity_out: Decimal,
        source_doc_type: str,
        source_doc_id: str,
        unit: str,
        unit_cost: Decimal = Decimal('0.0000'),
        user_id: str = None,
        remarks: str = None
    ) -> StockLedger:
        material = db.query(Material).filter_by(id=material_id).with_for_update().first()
        if not material:
            raise ValueError(f"Material with ID '{material_id}' not found.")
            
        current_balance = to_decimal(material.current_stock, 4)
        qty_in = to_decimal(quantity_in, 4)
        qty_out = to_decimal(quantity_out, 4)
        
        # Check negative stock
        new_balance = current_balance + qty_in - qty_out
        if new_balance < Decimal('0.0000'):
            raise ValueError(
                f"Insufficient stock for material '{material.name}' (Code: {material.code}). "
                f"Available: {current_balance} {material.unit}, Required: {qty_out} {material.unit}."
            )
            
        # Update material weighted-average cost if receipt
        if qty_in > Decimal('0.0000') and unit_cost > Decimal('0.0000'):
            total_current_val = current_balance * to_decimal(material.current_weighted_avg_cost, 4)
            new_receipt_val = qty_in * to_decimal(unit_cost, 4)
            total_available_qty = current_balance + qty_in
            if total_available_qty > Decimal('0.0000'):
                new_avg_cost = (total_current_val + new_receipt_val) / total_available_qty
                material.current_weighted_avg_cost = to_decimal(new_avg_cost, 4)
                material.last_purchase_rate = to_decimal(unit_cost, 4)
        
        material.current_stock = new_balance
        db.add(material)
        
        # Record ledger entry
        total_val = (qty_in or qty_out) * to_decimal(unit_cost or material.current_weighted_avg_cost, 4)
        ledger_entry = StockLedger(
            item_type=ItemType.MATERIAL,
            material_id=material.id,
            movement_type=movement_type,
            quantity_in=qty_in,
            quantity_out=qty_out,
            balance_after=new_balance,
            unit=unit or material.unit,
            unit_cost=to_decimal(unit_cost or material.current_weighted_avg_cost, 4),
            total_valuation=to_decimal(total_val, 2),
            source_doc_type=source_doc_type,
            source_doc_id=str(source_doc_id),
            user_id=user_id,
            remarks=remarks
        )
        db.add(ledger_entry)
        return ledger_entry

    @staticmethod
    def record_product_movement(
        db: Session,
        product_id: str,
        movement_type: str,
        quantity_in: Decimal,
        quantity_out: Decimal,
        source_doc_type: str,
        source_doc_id: str,
        unit: str,
        unit_cost: Decimal = Decimal('0.00'),
        user_id: str = None,
        remarks: str = None
    ) -> StockLedger:
        product = db.query(Product).filter_by(id=product_id).with_for_update().first()
        if not product:
            raise ValueError(f"Product with ID '{product_id}' not found.")
            
        current_balance = to_decimal(product.current_stock, 2)
        qty_in = to_decimal(quantity_in, 2)
        qty_out = to_decimal(quantity_out, 2)
        
        new_balance = current_balance + qty_in - qty_out
        if new_balance < Decimal('0.00'):
            raise ValueError(
                f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                f"Available: {current_balance} {product.uom}, Requested: {qty_out} {product.uom}."
            )
            
        product.current_stock = new_balance
        db.add(product)
        
        total_val = (qty_in or qty_out) * to_decimal(unit_cost or product.selling_price, 2)
        ledger_entry = StockLedger(
            item_type=ItemType.FINISHED_GOOD,
            product_id=product.id,
            movement_type=movement_type,
            quantity_in=qty_in,
            quantity_out=qty_out,
            balance_after=new_balance,
            unit=unit or product.uom,
            unit_cost=to_decimal(unit_cost, 4),
            total_valuation=to_decimal(total_val, 2),
            source_doc_type=source_doc_type,
            source_doc_id=str(source_doc_id),
            user_id=user_id,
            remarks=remarks
        )
        db.add(ledger_entry)
        return ledger_entry
