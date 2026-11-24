from decimal import Decimal
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from app.models.payment import Payment, PaymentAllocation, PaymentMethod
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

class PaymentService:
    @staticmethod
    def record_payment(
        db: Session,
        customer_id: str,
        amount: Decimal,
        payment_method: str = PaymentMethod.BANK_TRANSFER,
        invoice_allocations: list = None, # [{'invoice_id': str, 'amount': Decimal}]
        payment_date: date = None,
        reference_number: str = None,
        remarks: str = None,
        user_id: str = None
    ) -> Payment:
        customer = db.query(Customer).filter_by(id=customer_id).first()
        if not customer:
            raise ValueError("Customer not found.")
            
        total_paid = to_decimal(amount, 2)
        if total_paid <= Decimal('0.00'):
            raise ValueError("Payment amount must be greater than zero.")
            
        count = db.query(Payment).count()
        pay_number = f"PAY-{date.today().year}-{count + 1:04d}"
        
        payment = Payment(
            payment_number=pay_number,
            customer_id=customer_id,
            payment_date=payment_date or date.today(),
            amount=total_paid,
            payment_method=payment_method,
            reference_number=reference_number,
            remarks=remarks,
            created_by_id=user_id
        )
        db.add(payment)
        db.flush()
        
        allocated_sum = Decimal('0.00')
        
        if invoice_allocations:
            for alloc in invoice_allocations:
                inv_id = alloc['invoice_id']
                alloc_amt = to_decimal(alloc['amount'], 2)
                
                invoice = db.query(Invoice).filter_by(id=inv_id, customer_id=customer_id).with_for_update().first()
                if not invoice:
                    raise ValueError(f"Invoice '{inv_id}' not found for customer.")
                    
                cur_bal = to_decimal(invoice.balance_amount, 2)
                if alloc_amt > cur_bal:
                    raise ValueError(
                        f"Allocation amount ₹{alloc_amt} exceeds invoice balance ₹{cur_bal} for invoice '{invoice.invoice_number}'."
                    )
                    
                allocated_sum += alloc_amt
                if allocated_sum > total_paid:
                    raise ValueError("Total allocated amount exceeds the recorded payment amount.")
                    
                invoice.paid_amount = to_decimal(invoice.paid_amount + alloc_amt, 2)
                invoice.balance_amount = to_decimal(invoice.balance_amount - alloc_amt, 2)
                
                pa = PaymentAllocation(
                    payment_id=payment.id,
                    invoice_id=inv_id,
                    allocated_amount=alloc_amt
                )
                db.add(pa)
        else:
            # Auto-allocate to unpaid customer invoices in FIFO order
            unpaid_invoices = db.query(Invoice).filter(
                Invoice.customer_id == customer_id,
                Invoice.balance_amount > Decimal('0.00')
            ).order_by(Invoice.invoice_date.asc()).with_for_update().all()
            
            remaining_to_allocate = total_paid
            for inv in unpaid_invoices:
                if remaining_to_allocate <= Decimal('0.00'):
                    break
                bal = to_decimal(inv.balance_amount, 2)
                alloc_amt = min(bal, remaining_to_allocate)
                
                inv.paid_amount = to_decimal(inv.paid_amount + alloc_amt, 2)
                inv.balance_amount = to_decimal(inv.balance_amount - alloc_amt, 2)
                remaining_to_allocate -= alloc_amt
                allocated_sum += alloc_amt
                
                pa = PaymentAllocation(
                    payment_id=payment.id,
                    invoice_id=inv.id,
                    allocated_amount=alloc_amt
                )
                db.add(pa)
                
        log_audit_event(
            db, action="PAYMENT_RECORDED", entity_type="Payment",
            entity_id=payment.id, user_id=user_id,
            new_values={'payment_number': payment.payment_number, 'amount': float(payment.amount)}
        )
        db.commit()
        return payment

    @staticmethod
    def get_customer_outstanding_summary(db: Session, customer_id: str = None) -> list:
        today = date.today()
        query = db.query(Customer)
        if customer_id:
            query = query.filter_by(id=customer_id)
        customers = query.all()
        
        results = []
        for cust in customers:
            unpaid_invoices = db.query(Invoice).filter(
                Invoice.customer_id == cust.id,
                Invoice.balance_amount > Decimal('0.00')
            ).all()
            
            bucket_0_30 = Decimal('0.00')
            bucket_31_60 = Decimal('0.00')
            bucket_61_90 = Decimal('0.00')
            bucket_above_90 = Decimal('0.00')
            total_outstanding = Decimal('0.00')
            
            for inv in unpaid_invoices:
                bal = to_decimal(inv.balance_amount, 2)
                total_outstanding += bal
                age_days = (today - inv.invoice_date).days if inv.invoice_date else 0
                if age_days <= 30:
                    bucket_0_30 += bal
                elif age_days <= 60:
                    bucket_31_60 += bal
                elif age_days <= 90:
                    bucket_61_90 += bal
                else:
                    bucket_above_90 += bal
                    
            results.append({
                'customer_id': cust.id,
                'customer_code': cust.customer_code,
                'customer_name': cust.customer_name,
                'customer_type': cust.customer_type,
                'state': cust.state,
                'total_outstanding': float(total_outstanding),
                'bucket_0_30': float(bucket_0_30),
                'bucket_31_60': float(bucket_31_60),
                'bucket_61_90': float(bucket_61_90),
                'bucket_above_90': float(bucket_above_90),
                'invoice_count': len(unpaid_invoices)
            })
            
        return results
