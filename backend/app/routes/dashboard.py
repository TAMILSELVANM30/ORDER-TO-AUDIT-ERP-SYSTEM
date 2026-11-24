from flask import Blueprint, jsonify
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import SessionLocal
from app.models.sales_order import SalesOrder, OrderStatus, SalesOrderItem
from app.models.invoice import Invoice
from app.models.production import ProductionRun, ProductionStatus
from app.models.material import Material
from app.models.product import Product
from app.models.purchase import Purchase
from app.models.dispatch import Dispatch
from app.models.customer import Customer
from app.permissions.decorators import roles_required, get_current_user_id
from app.models.user import Role
from app.utils.financial import to_decimal

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/admin', methods=['GET'])
def get_admin_dashboard():
    db = SessionLocal()
    today = date.today()
    try:
        # Today's Orders
        today_orders_count = db.query(SalesOrder).filter(SalesOrder.order_date == today).count()
        # Pending Approvals
        pending_approvals = db.query(SalesOrder).filter(SalesOrder.status == OrderStatus.SUBMITTED).count()
        # Today's Sales
        today_sales_val = db.query(func.coalesce(func.sum(Invoice.grand_total), 0)).filter(
            Invoice.invoice_date == today, Invoice.status != 'CANCELLED'
        ).scalar()
        # Total Finished Goods Stock
        total_fg_stock = db.query(func.coalesce(func.sum(Product.current_stock), 0)).scalar()
        # Total Raw Material Stock Alerts
        raw_mat_alerts = db.query(Material).filter(Material.current_stock <= Material.min_stock_level).count()
        # Pending Dispatches
        pending_dispatches = db.query(SalesOrder).filter(
            SalesOrder.status.in_([OrderStatus.APPROVED, OrderStatus.INVOICED, OrderStatus.PARTIALLY_DISPATCHED])
        ).count()
        # Total Receivables (Outstanding)
        total_receivables = db.query(func.coalesce(func.sum(Invoice.balance_amount), 0)).filter(
            Invoice.status != 'CANCELLED'
        ).scalar()
        # Production Variance Alerts
        var_alerts_runs = db.query(ProductionRun).filter(
            func.abs(ProductionRun.yield_variance_pct) > Decimal('3.00')
        ).all()
        variance_alerts = len(var_alerts_runs)
        
        # Product-wise Sales
        prod_sales = db.query(
            Product.name,
            func.coalesce(func.sum(SalesOrderItem.quantity), 0).label('qty_sold'),
            func.coalesce(func.sum(SalesOrderItem.total_amount), 0).label('revenue')
        ).join(SalesOrderItem, SalesOrderItem.product_id == Product.id)\
         .group_by(Product.name).all()
        
        product_sales_chart = [{'name': r[0], 'qty': float(r[1]), 'revenue': float(r[2])} for r in prod_sales]
        
        # Recent activity
        latest_orders = [o.to_dict() for o in db.query(SalesOrder).order_by(SalesOrder.created_at.desc()).limit(5).all()]
        latest_invoices = [i.to_dict() for i in db.query(Invoice).order_by(Invoice.created_at.desc()).limit(5).all()]
        latest_purchases = [p.to_dict() for p in db.query(Purchase).order_by(Purchase.created_at.desc()).limit(5).all()]
        latest_runs = [r.to_dict() for r in db.query(ProductionRun).order_by(ProductionRun.created_at.desc()).limit(5).all()]
        
        # Low stock items list
        low_stock_materials = [m.to_dict() for m in db.query(Material).filter(Material.current_stock <= Material.min_stock_level).all()]
        
        return jsonify({
            'kpis': {
                'today_orders': today_orders_count,
                'pending_approvals': pending_approvals,
                'today_sales': float(today_sales_val),
                'total_fg_stock': float(total_fg_stock),
                'raw_mat_alerts': raw_mat_alerts,
                'pending_dispatches': pending_dispatches,
                'total_receivables': float(total_receivables),
                'variance_alerts': variance_alerts,
            },
            'charts': {
                'product_sales': product_sales_chart
            },
            'recent_activity': {
                'orders': latest_orders,
                'invoices': latest_invoices,
                'purchases': latest_purchases,
                'production_runs': latest_runs,
            },
            'alerts': {
                'low_stock_materials': low_stock_materials,
                'variance_runs': [r.to_dict() for r in var_alerts_runs]
            }
        }), 200
    finally:
        db.close()

@dashboard_bp.route('/owner', methods=['GET'])
def get_owner_dashboard():
    db = SessionLocal()
    try:
        # Total Revenue
        total_revenue = db.query(func.coalesce(func.sum(Invoice.taxable_amount), 0)).filter(
            Invoice.status != 'CANCELLED'
        ).scalar()
        # Production Expenses
        prod_expenses = db.query(func.coalesce(func.sum(ProductionRun.total_production_cost), 0)).filter(
            ProductionRun.status == ProductionStatus.POSTED
        ).scalar()
        # Approximate Gross Profit
        gross_profit = float(total_revenue) - float(prod_expenses)
        
        # Total Inventory Value
        mat_stock = db.query(func.coalesce(func.sum(Material.current_stock * Material.current_weighted_avg_cost), 0)).scalar()
        prod_stock = db.query(func.coalesce(func.sum(Product.current_stock * Product.selling_price), 0)).scalar()
        total_inventory_val = float(mat_stock or 0) + float(prod_stock or 0)
        
        # Receivables
        total_receivables = db.query(func.coalesce(func.sum(Invoice.balance_amount), 0)).filter(
            Invoice.status != 'CANCELLED'
        ).scalar()
        
        return jsonify({
            'kpis': {
                'total_revenue': float(total_revenue),
                'production_expenses': float(prod_expenses),
                'approx_gross_profit': round(gross_profit, 2),
                'inventory_valuation': round(total_inventory_val, 2),
                'total_receivables': float(total_receivables)
            }
        }), 200
    finally:
        db.close()

@dashboard_bp.route('/salesman', methods=['GET'])
def get_salesman_dashboard():
    db = SessionLocal()
    current_user_id = get_current_user_id()
    try:
        assigned_customers = db.query(Customer).filter_by(assigned_salesman_id=current_user_id).count() if current_user_id else 0
        total_orders = db.query(SalesOrder).filter_by(salesman_id=current_user_id).count() if current_user_id else 0
        total_sales_booked = db.query(func.coalesce(func.sum(SalesOrder.grand_total), 0)).filter_by(salesman_id=current_user_id).scalar() if current_user_id else 0
        
        my_recent_orders = [o.to_dict() for o in db.query(SalesOrder).filter_by(salesman_id=current_user_id).order_by(SalesOrder.created_at.desc()).limit(5).all()] if current_user_id else []
        
        return jsonify({
            'kpis': {
                'assigned_customers': assigned_customers,
                'total_orders': total_orders,
                'total_sales_booked': float(total_sales_booked),
            },
            'recent_orders': my_recent_orders
        }), 200
    finally:
        db.close()

@dashboard_bp.route('/production', methods=['GET'])
def get_production_dashboard():
    db = SessionLocal()
    try:
        active_runs_count = db.query(ProductionRun).filter_by(status=ProductionStatus.DRAFT).count()
        completed_runs_count = db.query(ProductionRun).filter_by(status=ProductionStatus.POSTED).count()
        total_good_produced = db.query(func.coalesce(func.sum(ProductionRun.actual_good_output), 0)).filter_by(status=ProductionStatus.POSTED).scalar()
        
        low_materials = [m.to_dict() for m in db.query(Material).filter(Material.current_stock <= Material.min_stock_level).all()]
        recent_runs = [r.to_dict() for r in db.query(ProductionRun).order_by(ProductionRun.created_at.desc()).limit(5).all()]
        
        return jsonify({
            'kpis': {
                'active_draft_runs': active_runs_count,
                'completed_runs': completed_runs_count,
                'total_packets_produced': float(total_good_produced),
                'material_alerts': len(low_materials)
            },
            'low_stock_materials': low_materials,
            'recent_runs': recent_runs
        }), 200
    finally:
        db.close()
