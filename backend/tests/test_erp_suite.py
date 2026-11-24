import pytest
import os
import sys
from decimal import Decimal
from datetime import date

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal, init_db, engine
from app.models.base import Base
from app.models.user import User, Role
from app.models.settings import BusinessSettings
from app.models.product import Product, ProductCategory, Unit
from app.models.material import Material, MaterialType
from app.models.customer import Customer, CustomerType
from app.models.supplier import Supplier
from app.models.bom import BOM, BOMVersion, BOMComponent
from app.models.purchase import Purchase, PurchaseItem
from app.models.production import ProductionRun, ProductionStatus
from app.models.sales_order import SalesOrder, OrderStatus
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.stock_ledger import StockLedger, MovementType, ItemType
from app.services.inventory_service import InventoryService
from app.services.production_service import ProductionService
from app.services.sales_service import SalesService
from app.services.payment_service import PaymentService
from app.services.report_service import ReportService
from app.utils.units import convert_units
from app.utils.financial import to_decimal, number_to_words_inr
from seed.seed_data import seed_master_data, reset_database

@pytest.fixture(scope="module")
def setup_db():
    reset_database()
    seed_master_data()
    yield
    # Keep data for further inspection

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- 1. AUTHENTICATION & ROLES -----------------
def test_valid_user_authentication(setup_db, db_session):
    admin = db_session.query(User).filter_by(email="admin@demo.com").first()
    assert admin is not None
    assert admin.check_password("DemoPassword123!") is True
    assert admin.check_password("WrongPassword") is False
    assert admin.role == Role.ADMIN

def test_user_roles_coverage(setup_db, db_session):
    roles = [u.role for u in db_session.query(User).all()]
    assert Role.ADMIN in roles
    assert Role.SALESMAN in roles
    assert Role.PRODUCTION in roles
    assert Role.AUDITOR in roles
    assert Role.OWNER in roles

# ----------------- 2. UNIT CONVERSION & FINANCIAL -----------------
def test_unit_conversions():
    # Weight: kg to g
    assert convert_units(Decimal('2.5'), 'kg', 'g') == Decimal('2500.0')
    assert convert_units(Decimal('500'), 'g', 'kg') == Decimal('0.5')
    
    # Volume: litre to ml
    assert convert_units(Decimal('1.5'), 'litre', 'ml') == Decimal('1500.0')
    assert convert_units(Decimal('250'), 'ml', 'litre') == Decimal('0.25')
    
    # Packaging: carton to pieces (1 carton = 20 packets)
    assert convert_units(Decimal('3'), 'carton', 'piece') == Decimal('60.0')
    
    # Incompatible units must raise ValueError
    with pytest.raises(ValueError):
        convert_units(Decimal('10'), 'kg', 'litre')
    with pytest.raises(ValueError):
        convert_units(Decimal('5'), 'piece', 'kg')

def test_number_to_words_inr():
    words = number_to_words_inr(Decimal('7875.00'))
    assert "Seven Thousand Eight Hundred and Seventy Five Rupees Only" in words
    words_paise = number_to_words_inr(Decimal('187.50'))
    assert "One Hundred and Eighty Seven Rupees and Fifty Paise Only" in words_paise

# ----------------- 3. INVENTORY & STOCK LEDGER -----------------
def test_negative_stock_prevention(setup_db, db_session):
    flour = db_session.query(Material).filter_by(code='RM-FLOUR').first()
    current_flour = flour.current_stock
    # Requesting more than available must raise ValueError
    with pytest.raises(ValueError) as excinfo:
        InventoryService.record_material_movement(
            db=db_session,
            material_id=flour.id,
            movement_type=MovementType.PRODUCTION_ISSUE,
            quantity_in=Decimal('0.0000'),
            quantity_out=current_flour + Decimal('100.0000'),
            source_doc_type="TEST",
            source_doc_id="TEST-001",
            unit='kg'
        )
    assert "Insufficient stock" in str(excinfo.value)

# ----------------- 4. PRODUCTION & BOM -----------------
def test_bom_planned_consumption_calculation(setup_db, db_session):
    murukku = db_session.query(Product).filter_by(sku='MRK-200G').first()
    bom = db_session.query(BOM).filter_by(product_id=murukku.id).first()
    bom_ver = bom.active_version()
    
    # Calculate for batch size of 200 packets
    plan = ProductionService.calculate_planned_run(db_session, murukku.id, bom_ver.id, Decimal('200.00'))
    assert plan['expected_output'] == 200.0
    
    comp_map = {c['material_code']: c['planned_quantity'] for c in plan['components']}
    assert comp_map['RM-FLOUR'] == 40.0
    assert comp_map['RM-OIL'] == 10.0
    assert comp_map['RM-SPICE'] == 1.2
    assert comp_map['PM-POUCH-200G'] == 200.0
    assert comp_map['PM-CARTON'] == 10.0

# ----------------- 5. GST TAXATION & INVOICE NUMBERING -----------------
def test_gst_intra_and_inter_state(setup_db, db_session):
    retailer_a = db_session.query(Customer).filter_by(customer_code='CUST-001').first() # Tamil Nadu
    distributor_b = db_session.query(Customer).filter_by(customer_code='CUST-002').first() # Karnataka
    salesman_a = db_session.query(User).filter_by(email='salesman.a@demo.com').first()
    murukku = db_session.query(Product).filter_by(sku='MRK-200G').first()
    
    # Create intra-state order (Tamil Nadu)
    order_intra = SalesService.create_sales_order(
        db=db_session,
        customer_id=retailer_a.id,
        salesman_id=salesman_a.id,
        items_data=[{'product_id': murukku.id, 'quantity': Decimal('100.00'), 'unit_price': Decimal('50.00')}]
    )
    order_intra = SalesService.approve_order(db_session, order_intra.id)
    inv_intra = SalesService.generate_invoice(db_session, order_intra.id)
    
    # Intra-state: 100 * ₹50 = ₹5,000. CGST 2.5% = ₹125, SGST 2.5% = ₹125, IGST = 0
    assert inv_intra.is_interstate is False
    assert to_decimal(inv_intra.taxable_amount, 2) == Decimal('5000.00')
    assert to_decimal(inv_intra.cgst_amount, 2) == Decimal('125.00')
    assert to_decimal(inv_intra.sgst_amount, 2) == Decimal('125.00')
    assert to_decimal(inv_intra.igst_amount, 2) == Decimal('0.00')
    assert to_decimal(inv_intra.grand_total, 2) == Decimal('5250.00')
    
    # Create inter-state order (Karnataka)
    order_inter = SalesService.create_sales_order(
        db=db_session,
        customer_id=distributor_b.id,
        salesman_id=salesman_a.id,
        items_data=[{'product_id': murukku.id, 'quantity': Decimal('100.00'), 'unit_price': Decimal('50.00')}]
    )
    order_inter = SalesService.approve_order(db_session, order_inter.id)
    inv_inter = SalesService.generate_invoice(db_session, order_inter.id)
    
    # Inter-state: 100 * ₹50 = ₹5,000. CGST = 0, SGST = 0, IGST 5.0% = ₹250
    assert inv_inter.is_interstate is True
    assert to_decimal(inv_inter.taxable_amount, 2) == Decimal('5000.00')
    assert to_decimal(inv_inter.cgst_amount, 2) == Decimal('0.00')
    assert to_decimal(inv_inter.sgst_amount, 2) == Decimal('0.00')
    assert to_decimal(inv_inter.igst_amount, 2) == Decimal('250.00')
    assert to_decimal(inv_inter.grand_total, 2) == Decimal('5250.00')

# ----------------- 6. PAYMENTS & OUTSTANDING -----------------
def test_payment_and_outstanding(setup_db, db_session):
    retailer_a = db_session.query(Customer).filter_by(customer_code='CUST-001').first()
    unpaid_inv = db_session.query(Invoice).filter(
        Invoice.customer_id == retailer_a.id,
        Invoice.balance_amount > Decimal('0.00')
    ).first()
    
    if unpaid_inv:
        original_bal = unpaid_inv.balance_amount
        pay_amt = Decimal('1000.00')
        pay = PaymentService.record_payment(
            db=db_session,
            customer_id=retailer_a.id,
            amount=pay_amt,
            payment_method='UPI',
            invoice_allocations=[{'invoice_id': unpaid_inv.id, 'amount': pay_amt}]
        )
        db_session.refresh(unpaid_inv)
        assert unpaid_inv.balance_amount == original_bal - pay_amt
        
        # Over-allocation must be prevented
        with pytest.raises(ValueError):
            PaymentService.record_payment(
                db=db_session,
                customer_id=retailer_a.id,
                amount=Decimal('999999.00'),
                payment_method='CASH',
                invoice_allocations=[{'invoice_id': unpaid_inv.id, 'amount': Decimal('999999.00')}]
            )

# ----------------- 7. COMPLETE BENCHMARK SCENARIO TEST -----------------
def test_full_benchmark_scenario():
    """Runs the exact mandatory benchmark and asserts all closing values match to the decimal."""
    reset_database()
    seed_master_data()
    from seed.seed_data import run_benchmark_scenario
    # Must run without exceptions and satisfy all assertions
    run_benchmark_scenario()
