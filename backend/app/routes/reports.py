from flask import Blueprint, request, jsonify, Response
from datetime import date
from app.db import SessionLocal
from app.services.report_service import ReportService
from app.services.payment_service import PaymentService

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/sales', methods=['GET'])
def sales_report():
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(request.args['start_date']) if request.args.get('start_date') else None
        end_date = date.fromisoformat(request.args['end_date']) if request.args.get('end_date') else None
        data = ReportService.get_sales_register(db, start_date, end_date)
        return jsonify({'sales': data}), 200
    finally:
        db.close()

@reports_bp.route('/purchases', methods=['GET'])
def purchases_report():
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(request.args['start_date']) if request.args.get('start_date') else None
        end_date = date.fromisoformat(request.args['end_date']) if request.args.get('end_date') else None
        data = ReportService.get_purchase_register(db, start_date, end_date)
        return jsonify({'purchases': data}), 200
    finally:
        db.close()

@reports_bp.route('/gst', methods=['GET'])
def gst_report():
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(request.args['start_date']) if request.args.get('start_date') else None
        end_date = date.fromisoformat(request.args['end_date']) if request.args.get('end_date') else None
        data = ReportService.get_gst_summary(db, start_date, end_date)
        return jsonify(data), 200
    finally:
        db.close()

@reports_bp.route('/stock', methods=['GET'])
def stock_report():
    db = SessionLocal()
    try:
        data = ReportService.get_stock_summary(db)
        return jsonify({'stock': data}), 200
    finally:
        db.close()

@reports_bp.route('/production', methods=['GET'])
def production_report():
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(request.args['start_date']) if request.args.get('start_date') else None
        end_date = date.fromisoformat(request.args['end_date']) if request.args.get('end_date') else None
        data = ReportService.get_production_report(db, start_date, end_date)
        return jsonify({'production': data}), 200
    finally:
        db.close()

@reports_bp.route('/outstanding', methods=['GET'])
def outstanding_report():
    db = SessionLocal()
    try:
        data = PaymentService.get_customer_outstanding_summary(db)
        return jsonify({'outstanding': data}), 200
    finally:
        db.close()

@reports_bp.route('/export', methods=['GET'])
def export_report():
    report_type = request.args.get('report_type', 'sales') # sales, purchases, stock, production, outstanding
    export_format = request.args.get('format', 'csv').lower() # csv, excel
    
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(request.args['start_date']) if request.args.get('start_date') else None
        end_date = date.fromisoformat(request.args['end_date']) if request.args.get('end_date') else None
        
        if report_type == 'sales':
            data = ReportService.get_sales_register(db, start_date, end_date)
            title = "Sales Register"
        elif report_type == 'purchases':
            data = ReportService.get_purchase_register(db, start_date, end_date)
            title = "Purchase Register"
        elif report_type == 'stock':
            data = ReportService.get_stock_summary(db)
            title = "Stock Summary"
        elif report_type == 'production':
            data = ReportService.get_production_report(db, start_date, end_date)
            title = "Production Report"
        elif report_type == 'outstanding':
            data = PaymentService.get_customer_outstanding_summary(db)
            title = "Outstanding and Ageing"
        else:
            return jsonify({'error': f'Unsupported report type: {report_type}'}), 400
            
        if export_format == 'excel':
            excel_bytes = ReportService.export_to_excel(data, title)
            filename = f"{report_type}_report_{date.today().isoformat()}.xlsx"
            return Response(
                excel_bytes,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={'Content-Disposition': f'attachment; filename="{filename}"'}
            )
        else:
            if not data:
                csv_content = "No data"
            else:
                fieldnames = list(data[0].keys())
                csv_content = ReportService.export_to_csv(data, fieldnames)
            filename = f"{report_type}_report_{date.today().isoformat()}.csv"
            return Response(
                csv_content,
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; filename="{filename}"'}
            )
    finally:
        db.close()
