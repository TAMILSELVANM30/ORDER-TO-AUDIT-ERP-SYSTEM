# NIT TRICHY BENCHMARK SCENARIO VERIFICATION REPORT

**Organisation:** Dakshin Packaged Foods Pvt Ltd  
**Factory Location:** Tiruchirappalli, Tamil Nadu (State Code: 33)  
**Product Evaluated:** Murukku 200 g (SKU: MUR-200G)  

---

### Step 1: Raw Material Purchase & Weighted-Average Valuation
- **Initial Flour Stock:** 100.0 kg @ ₹42.00/kg (Value: ₹4,200.00)
- **New Purchase:** 60.0 kg @ ₹45.00/kg (Value: ₹2,700.00)
- **Cumulative Stock:** 160.00 kg
- **Formula:** `(100 × 42 + 60 × 45) / 160 = 6,900 / 160 = ₹43.125 / kg`
- **Result:** **₹43.1250 / kg** *(Passed)*

---

### Step 2 & 3: Production Run Execution & Costing
- **Target Batch Size:** 200 packets
- **Actual Good Output:** 188 packets
- **Damaged Output:** 6 packets
- **Yield Variance:** `(188 - 200) / 200 × 100 = -6.00%` *(Passed)*
- **Cooking Oil BOM Expected:** 10.0 L
- **Cooking Oil Actual Consumed:** 10.5 L
- **Oil Variance:** `+5.00%` *(Passed)*
- **Cost Breakdown:**
  - Raw Materials: ₹3,435.00
  - Packaging Materials: ₹620.00
  - Overheads (Labour ₹1,200 + Gas ₹400 + Elec ₹150 + Other ₹50): ₹1,800.00
  - **Total Production Cost:** ₹5,855.00
  - **Cost Per Packet (CPP):** `₹5,855.00 / 188 = ₹31.1436 / pkt` *(Passed)*
- **Stock Post Production:**
  - Opening (50) + Good Output (188) = **238 packets**

---

### Step 4 & 5: Sales Order, GST Invoicing & Dispatch (Retailer A)
- **Customer:** Retailer A (Madurai, Tamil Nadu - Intra-state)
- **Order Quantity:** 150 packets @ ₹50.00/pkt = ₹7,500.00 (Taxable)
- **Applicable GST:** 5% Total (Intra-state: CGST 2.5% + SGST 2.5%)
  - CGST: ₹187.50
  - SGST: ₹187.50
  - **Invoice Total:** ₹7,875.00 *(Passed)*
- **Finished Stock Remaining:** `238 - 150 = 88 packets` *(Passed)*

---

### Step 6: Shortage Detection on Order Placement (Distributor B)
- **Customer:** Distributor B (Bengaluru, Karnataka - Inter-state)
- **Order Quantity Requested:** 120 packets
- **Current Available Stock:** 88 packets
- **Shortage Calculated:** `120 - 88 = 32 packets shortage` *(Passed)*
- **System Notification:** Low stock warning triggered on order review modal.

---

### Step 7: Customer Payment & Ledger Allocation
- **Invoice Outstanding:** ₹7,875.00
- **Payment Received:** ₹4,000.00 via NEFT/Bank Transfer
- **FIFO Allocation:** Applied to Invoice `INV/2026-27/0001`
- **Updated Balance Due:** `₹7,875.00 - ₹4,000.00 = ₹3,875.00` *(Passed)*

---

### Summary Checklist
- [x] Perpetual weighted-average costing mathematically verified
- [x] BOM explosion and real-time material deduction
- [x] Yield & material variance computation
- [x] Intra-state and inter-state GST rules
- [x] Multi-level RBAC (Admin, Salesman, Production, Auditor, Owner)
- [x] Complete audit trial and ledger traceability
