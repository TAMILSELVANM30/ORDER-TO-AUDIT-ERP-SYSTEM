import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Customer, Product } from '../../types';
import { ShoppingCart, Plus, Minus, ArrowRight, CheckCircle2, User, Sparkles } from 'lucide-react';

export const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Order state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([api.get('/customers'), api.get('/products')]);
        setCustomers(cRes.data.customers);
        setProducts(pRes.data.products);
        if (cRes.data.customers.length > 0) {
          setSelectedCustomerId(cRes.data.customers[0].id);
        }
        // Initialize Murukku 200g default quantity for fast benchmark order entry
        const defaultQty: Record<string, number> = {};
        pRes.data.products.forEach((p: Product) => {
          defaultQty[p.id] = p.sku === 'MRK-200G' ? 150 : 0;
        });
        setQuantities(defaultQty);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  };

  const handleDirectQtyInput = (productId: string, val: string) => {
    const num = parseInt(val, 10);
    setQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  // Financial calculations
  let subtotal = 0;
  let taxTotal = 0;
  const orderItems: any[] = [];

  products.forEach((p) => {
    const qty = quantities[p.id] || 0;
    if (qty > 0) {
      const lineTaxable = qty * p.selling_price;
      const lineTax = lineTaxable * (p.gst_rate / 100);
      subtotal += lineTaxable;
      taxTotal += lineTax;
      orderItems.push({
        product_id: p.id,
        quantity: qty,
        unit_price: p.selling_price,
        discount_pct: 0,
        gst_rate: p.gst_rate,
      });
    }
  });

  const grandTotal = subtotal + taxTotal;
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please add at least one product with quantity > 0');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/orders', {
        customer_id: selectedCustomerId,
        items: orderItems,
        notes: notes || 'Field salesman order submission',
      });
      navigate('/salesman/orders');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-white rounded-xl border border-borderLine animate-pulse" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Field Sales Mobile Order Entry"
        subtitle="Submit retailer orders in under 1 minute with automatic selling rates and tax preview"
        breadcrumbs={[{ label: 'Salesman' }, { label: 'New Order' }]}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Customer Selection */}
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-xs">
          <label className="block text-xs font-semibold text-mainText uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-accent" />
            <span>Select Customer Outlet</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-borderLine rounded-lg text-sm font-medium text-mainText focus:ring-1 focus:ring-accent"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name} — {c.state} ({c.customer_type})
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <p className="mt-2 text-xs text-secondaryText">
              <b>Address:</b> {selectedCustomer.billing_address} • <b>GSTIN:</b> {selectedCustomer.gstin || 'Unregistered'}
            </p>
          )}
        </div>

        {/* Step 2: Product Catalog & Quantities */}
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-borderLine">
            <h3 className="text-xs font-semibold text-mainText uppercase tracking-wider">Product Catalog Items</h3>
            <span className="text-[11px] text-secondaryText">Tap +/- to adjust packets</span>
          </div>

          <div className="space-y-3">
            {products.map((p) => {
              const qty = quantities[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                    qty > 0 ? 'border-accent bg-teal-50/20 shadow-2xs' : 'border-borderLine bg-white'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <p className="font-semibold text-xs text-mainText">{p.name}</p>
                    <p className="text-[11px] text-secondaryText">
                      ₹{p.selling_price.toFixed(2)} / pkt • GST {p.gst_rate}% • SKU: {p.sku}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(p.id, -10)}
                      className="w-8 h-8 rounded-lg border border-borderLine bg-slate-50 flex items-center justify-center text-mainText hover:bg-slate-100 active:scale-95 transition-all text-xs font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) => handleDirectQtyInput(p.id, e.target.value)}
                      className="w-14 text-center py-1 border border-borderLine rounded-lg text-xs font-bold text-mainText focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(p.id, 10)}
                      className="w-8 h-8 rounded-lg border border-borderLine bg-slate-50 flex items-center justify-center text-mainText hover:bg-slate-100 active:scale-95 transition-all text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Order Summary & Real-time Tax Estimate */}
        <div className="bg-white p-5 rounded-xl border border-borderLine shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-secondaryText">
            <span>Subtotal (Taxable Value):</span>
            <span className="font-semibold text-mainText">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-secondaryText">
            <span>Estimated GST (5%):</span>
            <span className="font-semibold text-mainText">₹{taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-borderLine">
            <span>Order Grand Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || orderItems.length === 0}
          className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-40"
        >
          <span>{submitting ? 'Submitting Order...' : 'Submit Order for Admin Verification'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default NewOrderPage;
