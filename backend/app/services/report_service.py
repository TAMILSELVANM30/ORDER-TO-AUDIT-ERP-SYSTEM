import io
import csv
from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.invoice import Invoice, InvoiceItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.production import ProductionRun, ProductionMaterialIssue
from app.models.stock_ledger import StockLedger, MovementType, ItemType
from app.models.material import Material
from app.models.product import Product
from app.models.customer import Customer
from app.models.payment import Payment, PaymentAllocation
from app.models.settings import BusinessSettings
from app.utils.financial import to_decimal
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportService:
    @staticmethod
    def get_sales_register(db: Session, start_date: date = None, end_date: date = None) -> list:
        query = db.query(Invoice).order_by(Invoice.invoice_date.desc(), Invoice.invoice_number.desc())
        if start_date:
            query = query.filter(Invoice.invoice_date >= start_date)
        if end_date:
            query = query.filter(Invoice.invoice_date <= end_date)
            
        invoices = query.all()
        rows = []
        for inv in invoices:
            for item in inv.items:
                rows.append({
                    'invoice_number': inv.invoice_number,
                    'invoice_date': inv.invoice_date.isoformat() if inv.invoice_date else '',
                    'customer_name': inv.customer.customer_name if inv.customer else '',
                    'customer_gstin': inv.customer.gstin if (inv.customer and inv.customer.gstin) else 'URP',
                    'place_of_supply': inv.place_of_supply,
                    'is_interstate': inv.is_interstate,
                    'product_name': item.product.name if item.product else '',
                    'hsn_code': item.hsn_code,
                    'quantity': float(item.quantity),
                    'unit_price': float(item.unit_price),
                    'taxable_amount': float(item.taxable_amount),
                    'gst_rate': float(item.gst_rate),
                    'cgst_amount': float(item.cgst_amount),
                    'sgst_amount': float(item.sgst_amount),
                    'igst_amount': float(item.igst_amount),
                    'total_amount': float(item.total_amount),
                    'status': inv.status
                })
        return rows

    @staticmethod
    def get_purchase_register(db: Session, start_date: date = None, end_date: date = None) -> list:
        query = db.query(Purchase).order_by(Purchase.purchase_date.desc())
        if start_date:
            query = query.filter(Purchase.purchase_date >= start_date)
        if end_date:
            query = query.filter(Purchase.purchase_date <= end_date)
            
        purchases = query.all()
        rows = []
        for p in purchases:
            for item in p.items:
                rows.append({
                    'purchase_number': p.purchase_number,
                    'purchase_date': p.purchase_date.isoformat() if p.purchase_date else '',
                    'supplier_name': p.supplier.supplier_name if p.supplier else '',
                    'supplier_invoice_no': p.supplier_invoice_no or '',
                    'material_name': item.material.name if item.material else '',
                    'material_code': item.material.code if item.material else '',
                    'quantity': float(item.quantity),
                    'unit': item.unit,
                    'rate': float(item.rate),
                    'taxable_amount': float(item.taxable_amount),
                    'tax_amount': float(item.tax_amount),
                    'total_amount': float(item.total_amount),
                    'status': p.status
                })
        return rows

    @staticmethod
    def get_gst_summary(db: Session, start_date: date = None, end_date: date = None) -> dict:
        query = db.query(Invoice).filter(Invoice.status != 'CANCELLED')
        if start_date:
            query = query.filter(Invoice.invoice_date >= start_date)
        if end_date:
            query = query.filter(Invoice.invoice_date <= end_date)
            
        invoices = query.all()
        
        intra_taxable = Decimal('0.00')
        intra_cgst = Decimal('0.00')
        intra_sgst = Decimal('0.00')
        inter_taxable = Decimal('0.00')
        inter_igst = Decimal('0.00')
        
        for inv in invoices:
            if inv.is_interstate:
                inter_taxable += to_decimal(inv.taxable_amount, 2)
                inter_igst += to_decimal(inv.igst_amount, 2)
            else:
                intra_taxable += to_decimal(inv.taxable_amount, 2)
                intra_cgst += to_decimal(inv.cgst_amount, 2)
                intra_sgst += to_decimal(inv.sgst_amount, 2)
                
        total_taxable = intra_taxable + inter_taxable
        total_tax = intra_cgst + intra_sgst + inter_igst
        grand_total = total_taxable + total_tax
        
        return {
            'disclaimer': 'Internal management report for tax preparation and review; not a government-filed return.',
            'period': f"{start_date or 'Beginning'} to {end_date or 'Present'}",
            'intra_state_b2b_b2c': {
                'taxable_value': float(intra_taxable),
                'cgst': float(intra_cgst),
                'sgst': float(intra_sgst),
                'total_tax': float(intra_cgst + intra_sgst),
            },
            'inter_state_b2b_b2c': {
                'taxable_value': float(inter_taxable),
                'igst': float(inter_igst),
                'total_tax': float(inter_igst),
            },
            'summary': {
                'total_taxable_value': float(total_taxable),
                'total_cgst': float(intra_cgst),
                'total_sgst': float(intra_sgst),
                'total_igst': float(inter_igst),
                'total_tax': float(total_tax),
                'grand_total': float(grand_total),
                'invoice_count': len(invoices)
            }
        }

    @staticmethod
    def get_stock_summary(db: Session) -> list:
        materials = db.query(Material).all()
        products = db.query(Product).all()
        
        rows = []
        for m in materials:
            # Aggregate movements
            entries = db.query(StockLedger).filter(StockLedger.material_id == m.id).all()
            opening = Decimal('0.0000')
            receipts = Decimal('0.0000')
            issues = Decimal('0.0000')
            adjustments = Decimal('0.0000')
            
            for e in entries:
                if e.movement_type == MovementType.OPENING_STOCK:
                    opening += to_decimal(e.quantity_in, 4)
                elif e.movement_type in [MovementType.PURCHASE_RECEIPT]:
                    receipts += to_decimal(e.quantity_in, 4)
                elif e.movement_type in [MovementType.PRODUCTION_ISSUE]:
                    issues += to_decimal(e.quantity_out, 4)
                elif e.movement_type == MovementType.STOCK_ADJUSTMENT:
                    adjustments += to_decimal(e.quantity_in - e.quantity_out, 4)
                    
            closing = to_decimal(m.current_stock, 4)
            unit_val = to_decimal(m.current_weighted_avg_cost, 4)
            total_val = closing * unit_val
            
            rows.append({
                'item_type': 'MATERIAL',
                'category': m.material_type,
                'code': m.code,
                'name': m.name,
                'unit': m.unit,
                'opening_stock': float(opening),
                'receipts': float(receipts),
                'issues': float(issues),
                'sales': 0.0,
                'adjustments': float(adjustments),
                'closing_stock': float(closing),
                'unit_cost': float(unit_val),
                'stock_value': float(to_decimal(total_val, 2)),
                'is_low_stock': float(closing) <= float(m.min_stock_level)
            })
            
        for p in products:
            entries = db.query(StockLedger).filter(StockLedger.product_id == p.id).all()
            opening = Decimal('0.00')
            prod_output = Decimal('0.00')
            sales_disp = Decimal('0.00')
            adjustments = Decimal('0.00')
            
            for e in entries:
                if e.movement_type == MovementType.OPENING_STOCK:
                    opening += to_decimal(e.quantity_in, 2)
                elif e.movement_type == MovementType.PRODUCTION_OUTPUT:
                    prod_output += to_decimal(e.quantity_in, 2)
                elif e.movement_type == MovementType.SALES_DISPATCH:
                    sales_disp += to_decimal(e.quantity_out, 2)
                elif e.movement_type == MovementType.STOCK_ADJUSTMENT:
                    adjustments += to_decimal(e.quantity_in - e.quantity_out, 2)
                    
            closing = to_decimal(p.current_stock, 2)
            unit_val = to_decimal(p.selling_price, 2) # Finished goods valuation at selling or standard
            total_val = closing * unit_val
            
            rows.append({
                'item_type': 'FINISHED_GOOD',
                'category': 'FINISHED_GOOD',
                'code': p.sku,
                'name': p.name,
                'unit': p.uom,
                'opening_stock': float(opening),
                'receipts': float(prod_output),
                'issues': 0.0,
                'sales': float(sales_disp),
                'adjustments': float(adjustments),
                'closing_stock': float(closing),
                'unit_cost': float(unit_val),
                'stock_value': float(to_decimal(total_val, 2)),
                'is_low_stock': float(closing) <= float(p.min_stock_level)
            })
            
        return rows

    @staticmethod
    def get_stock_ledger(db: Session, item_type: str = None, item_id: str = None, start_date: datetime = None, end_date: datetime = None) -> list:
        query = db.query(StockLedger).order_by(StockLedger.transaction_date.desc())
        if item_type == 'MATERIAL':
            query = query.filter(StockLedger.item_type == ItemType.MATERIAL)
            if item_id:
                query = query.filter(StockLedger.material_id == item_id)
        elif item_type == 'FINISHED_GOOD':
            query = query.filter(StockLedger.item_type == ItemType.FINISHED_GOOD)
            if item_id:
                query = query.filter(StockLedger.product_id == item_id)
                
        if start_date:
            query = query.filter(StockLedger.transaction_date >= start_date)
        if end_date:
            query = query.filter(StockLedger.transaction_date <= end_date)
            
        return [entry.to_dict() for entry in query.all()]

    @staticmethod
    def get_production_report(db: Session, start_date: date = None, end_date: date = None) -> list:
        query = db.query(ProductionRun).order_by(ProductionRun.production_date.desc())
        if start_date:
            query = query.filter(ProductionRun.production_date >= start_date)
        if end_date:
            query = query.filter(ProductionRun.production_date <= end_date)
            
        runs = query.all()
        return [r.to_dict() for r in runs]

    @staticmethod
    def export_to_csv(data: list, fieldnames: list) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for row in data:
            writer.writerow(row)
        return output.getvalue()

    @staticmethod
    def export_to_excel(data: list, title: str = "Report") -> bytes:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = title[:30]
        
        # Styles
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="172554", end_color="172554", fill_type="solid") # Primary Navy
        border = Border(
            left=Side(style='thin', color='E2E8F0'),
            right=Side(style='thin', color='E2E8F0'),
            top=Side(style='thin', color='E2E8F0'),
            bottom=Side(style='thin', color='E2E8F0')
        )
        
        if not data:
            ws.append(["No records found."])
            stream = io.BytesIO()
            wb.save(stream)
            return stream.getvalue()
            
        headers = list(data[0].keys())
        ws.append([h.replace('_', ' ').title() for h in headers])
        
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            
        for row_idx, row in enumerate(data, start=2):
            for col_idx, key in enumerate(headers, start=1):
                val = row.get(key, '')
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.border = border
                if isinstance(val, (int, float)):
                    cell.alignment = Alignment(horizontal="right")
                    
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)
            
        stream = io.BytesIO()
        wb.save(stream)
        return stream.getvalue()
