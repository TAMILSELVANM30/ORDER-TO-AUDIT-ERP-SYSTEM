from decimal import Decimal
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from app.models.sales_order import SalesOrder, SalesOrderItem, OrderStatus
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.dispatch import Dispatch, DispatchItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.settings import BusinessSettings
from app.services.inventory_service import InventoryService
from app.models.stock_ledger import MovementType
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

class SalesService:
    @staticmethod
    def create_sales_order(
        db: Session,
        customer_id: str,
        salesman_id: str,
        items_data: list, # [{'product_id': str, 'quantity': Decimal, 'unit_price': Decimal, 'discount_pct': Decimal}]
        order_date: date = None,
        notes: str = None
    ) -> SalesOrder:
        customer = db.query(Customer).filter_by(id=customer_id).first()
        if not customer:
            raise ValueError("Customer not found.")
            
        settings = db.query(BusinessSettings).first()
        fy = settings.current_financial_year if settings else "2026-27"
        
        count = db.query(SalesOrder).count()
        order_number = f"SO-{date.today().year}-{count + 1:04d}"
        
        order = SalesOrder(
            order_number=order_number,
            salesman_id=salesman_id,
            customer_id=customer_id,
            order_date=order_date or date.today(),
            status=OrderStatus.SUBMITTED,
            notes=notes
        )
        db.add(order)
        db.flush()
        
        subtotal = Decimal('0.00')
        tax_total = Decimal('0.00')
        grand_total = Decimal('0.00')
        
        for item in items_data:
            prod_id = item['product_id']
            qty = to_decimal(item['quantity'], 2)
            product = db.query(Product).filter_by(id=prod_id).first()
            if not product:
                raise ValueError(f"Product with ID '{prod_id}' not found.")
                
            unit_price = to_decimal(item.get('unit_price', product.selling_price), 2)
            discount_pct = to_decimal(item.get('discount_pct', Decimal('0.00')), 2)
            gst_rate = to_decimal(product.gst_rate, 2)
            
            gross = qty * unit_price
            discount_val = gross * (discount_pct / Decimal('100.00'))
            taxable = gross - discount_val
            tax_val = taxable * (gst_rate / Decimal('100.00'))
            item_total = taxable + tax_val
            
            subtotal += taxable
            tax_total += tax_val
            grand_total += item_total
            
            so_item = SalesOrderItem(
                sales_order_id=order.id,
                product_id=prod_id,
                quantity=qty,
                unit_price=unit_price,
                discount_pct=discount_pct,
                gst_rate=gst_rate,
                taxable_amount=to_decimal(taxable, 2),
                tax_amount=to_decimal(tax_val, 2),
                total_amount=to_decimal(item_total, 2)
            )
            db.add(so_item)
            
        order.subtotal = to_decimal(subtotal, 2)
        order.tax_total = to_decimal(tax_total, 2)
        order.grand_total = to_decimal(grand_total, 2)
        
        log_audit_event(
            db, action="SALES_ORDER_CREATED", entity_type="SalesOrder",
            entity_id=order.id, user_id=salesman_id,
            new_values={'order_number': order.order_number, 'grand_total': float(order.grand_total)}
        )
        db.commit()
        return order

    @staticmethod
    def check_order_stock_availability(db: Session, order_id: str) -> dict:
        order = db.query(SalesOrder).filter_by(id=order_id).first()
        if not order:
            raise ValueError("Sales order not found.")
            
        items_availability = []
        has_any_shortage = False
        
        for item in order.items:
            product = item.product
            available_stock = to_decimal(product.current_stock, 2) if product else Decimal('0.00')
            requested_qty = to_decimal(item.quantity, 2)
            shortage = max(Decimal('0.00'), requested_qty - available_stock)
            is_sufficient = available_stock >= requested_qty
            if not is_sufficient:
                has_any_shortage = True
                
            items_availability.append({
                'product_id': item.product_id,
                'product_name': product.name if product else '',
                'product_sku': product.sku if product else '',
                'requested_quantity': float(requested_qty),
                'available_quantity': float(available_stock),
                'shortage_quantity': float(shortage),
                'is_sufficient': is_sufficient
            })
            
        return {
            'order_id': order.id,
            'order_number': order.order_number,
            'has_shortage': has_any_shortage,
            'items': items_availability
        }

    @staticmethod
    def approve_order(db: Session, order_id: str, user_id: str = None) -> SalesOrder:
        order = db.query(SalesOrder).filter_by(id=order_id).with_for_update().first()
        if not order:
            raise ValueError("Sales order not found.")
        if order.status not in [OrderStatus.SUBMITTED, OrderStatus.DRAFT]:
            raise ValueError(f"Cannot approve order in status '{order.status}'.")
            
        order.status = OrderStatus.APPROVED
        log_audit_event(
            db, action="SALES_ORDER_APPROVED", entity_type="SalesOrder",
            entity_id=order.id, user_id=user_id,
            new_values={'status': OrderStatus.APPROVED}
        )
        db.commit()
        return order

    @staticmethod
    def reject_order(db: Session, order_id: str, reason: str, user_id: str = None) -> SalesOrder:
        order = db.query(SalesOrder).filter_by(id=order_id).with_for_update().first()
        if not order:
            raise ValueError("Sales order not found.")
        order.status = OrderStatus.REJECTED
        order.rejection_reason = reason
        log_audit_event(
            db, action="SALES_ORDER_REJECTED", entity_type="SalesOrder",
            entity_id=order.id, user_id=user_id,
            new_values={'status': OrderStatus.REJECTED, 'reason': reason}
        )
        db.commit()
        return order

    @staticmethod
    def generate_invoice(db: Session, order_id: str, user_id: str = None) -> Invoice:
        order = db.query(SalesOrder).filter_by(id=order_id).with_for_update().first()
        if not order:
            raise ValueError("Sales order not found.")
        if order.status not in [OrderStatus.APPROVED, OrderStatus.PARTIALLY_DISPATCHED]:
            raise ValueError(f"Order must be APPROVED to generate invoice (current status: {order.status}).")
            
        settings = db.query(BusinessSettings).first()
        fy = settings.current_financial_year if settings else "2026-27"
        factory_state = settings.state if settings else "Tamil Nadu"
        
        customer = order.customer
        if not customer:
            raise ValueError("Customer not found for this order.")
            
        # Determine intra-state vs inter-state
        # Benchmark: Factory in Tamil Nadu. If customer state == Tamil Nadu -> intra-state (CGST + SGST).
        # If Karnataka -> inter-state (IGST).
        is_interstate = (customer.state.strip().lower() != factory_state.strip().lower())
        place_of_supply = customer.state
        
        # Sequential invoice number by financial year: INV/2026-27/0001
        inv_count = db.query(Invoice).filter(Invoice.financial_year == fy).count()
        invoice_number = f"INV/{fy}/{inv_count + 1:04d}"
        
        invoice = Invoice(
            invoice_number=invoice_number,
            financial_year=fy,
            sales_order_id=order.id,
            customer_id=customer.id,
            invoice_date=date.today(),
            place_of_supply=place_of_supply,
            is_interstate=is_interstate,
            status=InvoiceStatus.POSTED,
            created_by_id=user_id
        )
        db.add(invoice)
        db.flush()
        
        subtotal = Decimal('0.00')
        total_cgst = Decimal('0.00')
        total_sgst = Decimal('0.00')
        total_igst = Decimal('0.00')
        
        for item in order.items:
            product = item.product
            qty = to_decimal(item.quantity, 2)
            unit_price = to_decimal(item.unit_price, 2)
            taxable = to_decimal(qty * unit_price, 2)
            gst_rate = to_decimal(item.gst_rate, 2)
            
            if is_interstate:
                cgst_rate = Decimal('0.00')
                cgst_amount = Decimal('0.00')
                sgst_rate = Decimal('0.00')
                sgst_amount = Decimal('0.00')
                igst_rate = gst_rate
                igst_amount = to_decimal(taxable * (igst_rate / Decimal('100.00')), 2)
            else:
                half_rate = to_decimal(gst_rate / Decimal('2.0'), 2)
                cgst_rate = half_rate
                cgst_amount = to_decimal(taxable * (cgst_rate / Decimal('100.00')), 2)
                sgst_rate = half_rate
                sgst_amount = to_decimal(taxable * (sgst_rate / Decimal('100.00')), 2)
                igst_rate = Decimal('0.00')
                igst_amount = Decimal('0.00')
                
            item_total = taxable + cgst_amount + sgst_amount + igst_amount
            
            subtotal += taxable
            total_cgst += cgst_amount
            total_sgst += sgst_amount
            total_igst += igst_amount
            
            inv_item = InvoiceItem(
                invoice_id=invoice.id,
                product_id=item.product_id,
                hsn_code=product.hsn_code if product else '1905',
                description=product.name if product else 'Packaged Food',
                quantity=qty,
                unit_price=unit_price,
                taxable_amount=taxable,
                gst_rate=gst_rate,
                cgst_rate=cgst_rate,
                cgst_amount=cgst_amount,
                sgst_rate=sgst_rate,
                sgst_amount=sgst_amount,
                igst_rate=igst_rate,
                igst_amount=igst_amount,
                total_amount=item_total
            )
            db.add(inv_item)
            
        grand_total = subtotal + total_cgst + total_sgst + total_igst
        invoice.subtotal = subtotal
        invoice.taxable_amount = subtotal
        invoice.cgst_amount = total_cgst
        invoice.sgst_amount = total_sgst
        invoice.igst_amount = total_igst
        invoice.total_tax = total_cgst + total_sgst + total_igst
        invoice.grand_total = grand_total
        invoice.paid_amount = Decimal('0.00')
        invoice.balance_amount = grand_total
        
        order.status = OrderStatus.INVOICED
        
        log_audit_event(
            db, action="INVOICE_GENERATED", entity_type="Invoice",
            entity_id=invoice.id, user_id=user_id,
            new_values={'invoice_number': invoice.invoice_number, 'grand_total': float(grand_total)}
        )
        db.commit()
        return invoice

    @staticmethod
    def create_dispatch(
        db: Session,
        invoice_id: str,
        items_to_dispatch: list = None, # [{'product_id': str, 'quantity': Decimal}]
        vehicle_no: str = None,
        delivery_notes: str = None,
        user_id: str = None
    ) -> Dispatch:
        invoice = db.query(Invoice).filter_by(id=invoice_id).with_for_update().first()
        if not invoice:
            raise ValueError("Invoice not found.")
        order = invoice.sales_order
        
        # Check stock availability for all items first
        if not items_to_dispatch:
            # Dispatch full invoice quantity
            items_to_dispatch = [{'product_id': item.product_id, 'quantity': item.quantity} for item in invoice.items]
            
        count = db.query(Dispatch).count()
        dispatch_number = f"DSP-{date.today().year}-{count + 1:04d}"
        
        dispatch = Dispatch(
            dispatch_number=dispatch_number,
            sales_order_id=order.id if order else None,
            invoice_id=invoice.id,
            dispatch_date=date.today(),
            vehicle_no=vehicle_no,
            delivery_notes=delivery_notes,
            created_by_id=user_id
        )
        db.add(dispatch)
        db.flush()
        
        for d_item in items_to_dispatch:
            prod_id = d_item['product_id']
            qty = to_decimal(d_item['quantity'], 2)
            
            product = db.query(Product).filter_by(id=prod_id).first()
            if not product:
                raise ValueError(f"Product with ID '{prod_id}' not found.")
                
            # Deduct finished goods stock & create stock ledger entry atomically
            InventoryService.record_product_movement(
                db=db,
                product_id=prod_id,
                movement_type=MovementType.SALES_DISPATCH,
                quantity_in=Decimal('0.00'),
                quantity_out=qty,
                source_doc_type="DISPATCH",
                source_doc_id=dispatch.dispatch_number,
                unit=product.uom,
                unit_cost=to_decimal(product.selling_price, 2),
                user_id=user_id,
                remarks=f"Sales dispatch against Invoice {invoice.invoice_number}"
            )
            
            # Update order item dispatched quantity
            if order:
                for so_item in order.items:
                    if so_item.product_id == prod_id:
                        so_item.dispatched_quantity = to_decimal(so_item.dispatched_quantity + qty, 2)
                        
            disp_item = DispatchItem(
                dispatch_id=dispatch.id,
                product_id=prod_id,
                quantity=qty
            )
            db.add(disp_item)
            
        if order:
            all_dispatched = all(so_item.dispatched_quantity >= so_item.quantity for so_item in order.items)
            order.status = OrderStatus.DISPATCHED if all_dispatched else OrderStatus.PARTIALLY_DISPATCHED
            
        log_audit_event(
            db, action="SALES_DISPATCHED", entity_type="Dispatch",
            entity_id=dispatch.id, user_id=user_id,
            new_values={'dispatch_number': dispatch.dispatch_number, 'invoice_id': invoice.id}
        )
        db.commit()
        return dispatch
