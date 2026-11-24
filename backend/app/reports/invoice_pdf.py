import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.utils.financial import number_to_words_inr

def generate_invoice_pdf(invoice, settings) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#172554'), # Primary Navy
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#64748B'),
        leading=12
    )
    header_right_style = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#0D9488'), # Accent Teal
        alignment=2
    )
    normal_style = ParagraphStyle(
        'Norm',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor('#0F172A'),
        leading=11
    )
    bold_style = ParagraphStyle(
        'BoldNorm',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        textColor=colors.HexColor('#0F172A'),
        leading=11
    )
    table_header_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        textColor=colors.white,
        alignment=1
    )
    
    elements = []
    
    # 1. Header: Company Info on Left, TAX INVOICE on Right
    comp_name = settings.company_name if settings else "Dakshin Packaged Foods Pvt Ltd"
    comp_addr = settings.address if settings else "12/4 Industrial Estate, Thuvakudi, Tiruchirappalli, Tamil Nadu - 620015"
    comp_gstin = settings.gstin if settings else "33AAAAA0000A1Z5"
    
    header_left = f"<b>{comp_name}</b><br/>{comp_addr}<br/><b>GSTIN:</b> {comp_gstin}<br/><b>State:</b> Tamil Nadu (Code 33)"
    header_right = f"<b>TAX INVOICE</b><br/><font size=9 color='#64748B'>ORIGINAL FOR RECIPIENT</font><br/><br/><b>Invoice No:</b> {invoice.invoice_number}<br/><b>Date:</b> {invoice.invoice_date.strftime('%d-%b-%Y') if invoice.invoice_date else ''}"
    
    header_table = Table(
        [[Paragraph(header_left, subtitle_style), Paragraph(header_right, header_right_style)]],
        colWidths=[320, 215]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    
    # 2. Bill To & Ship To
    cust = invoice.customer
    bill_to_text = f"<b>BILL TO:</b><br/><b>{cust.customer_name if cust else ''}</b><br/>{cust.billing_address if cust else ''}<br/><b>State:</b> {cust.state if cust else ''} (Code: {cust.state_code if cust else ''})<br/><b>GSTIN:</b> {cust.gstin or 'Unregistered / Consumer'}"
    ship_to_text = f"<b>SHIP TO:</b><br/><b>{cust.customer_name if cust else ''}</b><br/>{cust.shipping_address if cust else ''}<br/><b>Place of Supply:</b> {invoice.place_of_supply}<br/><b>Supply Type:</b> {'Inter-State (IGST)' if invoice.is_interstate else 'Intra-State (CGST + SGST)'}"
    
    bill_table = Table(
        [[Paragraph(bill_to_text, normal_style), Paragraph(ship_to_text, normal_style)]],
        colWidths=[267, 268]
    )
    bill_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(bill_table)
    elements.append(Spacer(1, 15))
    
    # 3. Items Table
    item_headers = [
        Paragraph("<b>#</b>", table_header_style),
        Paragraph("<b>Item Description</b>", table_header_style),
        Paragraph("<b>HSN</b>", table_header_style),
        Paragraph("<b>Qty</b>", table_header_style),
        Paragraph("<b>Rate (₹)</b>", table_header_style),
        Paragraph("<b>Taxable (₹)</b>", table_header_style),
    ]
    if invoice.is_interstate:
        item_headers.extend([
            Paragraph("<b>IGST (₹)</b>", table_header_style),
            Paragraph("<b>Total (₹)</b>", table_header_style)
        ])
        col_widths = [20, 180, 50, 45, 55, 65, 60, 60]
    else:
        item_headers.extend([
            Paragraph("<b>CGST (₹)</b>", table_header_style),
            Paragraph("<b>SGST (₹)</b>", table_header_style),
            Paragraph("<b>Total (₹)</b>", table_header_style)
        ])
        col_widths = [20, 160, 45, 40, 50, 60, 55, 55, 50]
        
    table_data = [item_headers]
    for idx, item in enumerate(invoice.items, start=1):
        row = [
            Paragraph(str(idx), normal_style),
            Paragraph(item.product.name if item.product else item.description, normal_style),
            Paragraph(item.hsn_code, normal_style),
            Paragraph(f"{float(item.quantity):.0f}", normal_style),
            Paragraph(f"{float(item.unit_price):.2f}", normal_style),
            Paragraph(f"{float(item.taxable_amount):.2f}", normal_style),
        ]
        if invoice.is_interstate:
            row.extend([
                Paragraph(f"{float(item.igst_amount):.2f} ({float(item.igst_rate):.1f}%)", normal_style),
                Paragraph(f"{float(item.total_amount):.2f}", bold_style)
            ])
        else:
            row.extend([
                Paragraph(f"{float(item.cgst_amount):.2f}", normal_style),
                Paragraph(f"{float(item.sgst_amount):.2f}", normal_style),
                Paragraph(f"{float(item.total_amount):.2f}", bold_style)
            ])
        table_data.append(row)
        
    # Totals Row
    empty_cols = len(col_widths) - 4 if invoice.is_interstate else len(col_widths) - 5
    summary_row = [Paragraph("<b>Total</b>", bold_style)] + [Paragraph("", normal_style)] * (empty_cols - 1)
    summary_row.append(Paragraph(f"<b>₹{float(invoice.taxable_amount):.2f}</b>", bold_style))
    if invoice.is_interstate:
        summary_row.append(Paragraph(f"<b>₹{float(invoice.igst_amount):.2f}</b>", bold_style))
    else:
        summary_row.append(Paragraph(f"<b>₹{float(invoice.cgst_amount):.2f}</b>", bold_style))
        summary_row.append(Paragraph(f"<b>₹{float(invoice.sgst_amount):.2f}</b>", bold_style))
    summary_row.append(Paragraph(f"<b>₹{float(invoice.grand_total):.2f}</b>", bold_style))
    table_data.append(summary_row)
    
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F1F5F9')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))
    
    # 4. Words & Final Summary
    words_text = f"<b>Amount in Words:</b><br/><i>{number_to_words_inr(invoice.grand_total)}</i>"
    fin_summary_text = (
        f"<b>Taxable Value:</b> ₹{float(invoice.taxable_amount):.2f}<br/>"
        f"<b>Total Tax:</b> ₹{float(invoice.total_tax):.2f}<br/>"
        f"<font size=10><b>Invoice Total:</b> ₹{float(invoice.grand_total):.2f}</font><br/>"
        f"<b>Paid:</b> ₹{float(invoice.paid_amount):.2f}<br/>"
        f"<b>Balance Due:</b> ₹{float(invoice.balance_amount):.2f}"
    )
    
    bottom_table = Table(
        [[Paragraph(words_text, normal_style), Paragraph(fin_summary_text, normal_style)]],
        colWidths=[335, 200]
    )
    bottom_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(bottom_table)
    elements.append(Spacer(1, 30))
    
    # 5. Signature Section
    sig_text = f"For <b>{comp_name}</b><br/><br/><br/><br/>Authorized Signatory"
    sig_table = Table(
        [[Paragraph("<b>Terms & Conditions:</b><br/>1. Goods once sold will not be taken back.<br/>2. Subject to Tiruchirappalli jurisdiction.", subtitle_style),
          Paragraph(sig_text, ParagraphStyle('Sig', parent=subtitle_style, alignment=2))]],
        colWidths=[335, 200]
    )
    elements.append(sig_table)
    
    doc.build(elements)
    return buffer.getvalue()
