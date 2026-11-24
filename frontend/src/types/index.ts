export type Role = 'ADMIN' | 'SALESMAN' | 'PRODUCTION' | 'AUDITOR' | 'OWNER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at?: string;
}

export interface BusinessSettings {
  id: string;
  company_name: string;
  address: string;
  gstin: string;
  state: string;
  state_code: string;
  phone: string;
  email: string;
  default_variance_tolerance: number;
  current_financial_year: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  pack_size: number;
  pack_unit: string;
  uom: string;
  hsn_code: string;
  selling_price: number;
  gst_rate: number;
  min_stock_level: number;
  current_stock: number;
  is_active: boolean;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  material_type: 'RAW_MATERIAL' | 'PACKAGING';
  unit: string;
  min_stock_level: number;
  current_stock: number;
  current_weighted_avg_cost: number;
  last_purchase_rate: number;
  hsn_code?: string;
  gst_rate: number;
  is_active: boolean;
  is_low_stock: boolean;
}

export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  contact_person?: string;
  mobile: string;
  email?: string;
  billing_address: string;
  shipping_address: string;
  state: string;
  state_code: string;
  gstin?: string;
  customer_type: 'RETAILER' | 'DISTRIBUTOR';
  assigned_salesman_id?: string;
  salesman_name?: string;
  credit_limit: number;
  opening_balance: number;
  is_active: boolean;
}

export interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  contact_details?: string;
  gstin?: string;
  address: string;
  state: string;
  payment_terms: string;
  is_active: boolean;
}

export interface BOMComponent {
  id: string;
  material_id: string;
  material_code?: string;
  material_name?: string;
  standard_quantity: number;
  unit: string;
  component_type: string;
}

export interface BOMVersion {
  id: string;
  bom_id: string;
  version_number: number;
  batch_size: number;
  expected_yield: number;
  yield_unit: string;
  effective_date: string;
  is_active: boolean;
  components: BOMComponent[];
}

export interface BOM {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  is_active: boolean;
  active_version?: BOMVersion;
  versions?: BOMVersion[];
}

export interface ProductionMaterialIssue {
  id: string;
  material_id: string;
  material_code?: string;
  material_name?: string;
  component_type: string;
  planned_quantity: number;
  actual_quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  variance_qty: number;
  variance_pct: number;
  is_excess: boolean;
  has_variance_warning: boolean;
}

export interface ProductionRun {
  id: string;
  run_number: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  bom_version_id: string;
  production_date: string;
  batch_size: number;
  expected_output: number;
  actual_good_output: number;
  damaged_output: number;
  scrap_quantity: number;
  labour_cost: number;
  gas_cost: number;
  electricity_cost: number;
  other_overheads: number;
  total_overhead: number;
  total_material_cost: number;
  total_packaging_cost: number;
  total_production_cost: number;
  cost_per_packet: number;
  cost_per_packet_exact?: number;
  yield_variance_pct: number;
  has_yield_warning: boolean;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  supervisor_name?: string;
  created_by?: string;
  posted_at?: string;
  remarks?: string;
  material_issues: ProductionMaterialIssue[];
}

export interface SalesOrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  current_stock?: number;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  gst_rate: number;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  dispatched_quantity: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  salesman_id: string;
  salesman_name?: string;
  customer_id: string;
  customer_name?: string;
  customer_state?: string;
  order_date: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INVOICED' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 'CANCELLED';
  rejection_reason?: string;
  notes?: string;
  items: SalesOrderItem[];
  created_at?: string;
}

export interface InvoiceItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  hsn_code: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  financial_year: string;
  sales_order_id?: string;
  order_number?: string;
  customer_id: string;
  customer_name?: string;
  customer_gstin?: string;
  customer_address?: string;
  customer_state?: string;
  invoice_date: string;
  place_of_supply: string;
  is_interstate: boolean;
  subtotal: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'POSTED' | 'CANCELLED';
  created_by?: string;
  remarks?: string;
  items: InvoiceItem[];
  created_at?: string;
}

export interface DispatchItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
}

export interface Dispatch {
  id: string;
  dispatch_number: string;
  sales_order_id?: string;
  order_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_name?: string;
  dispatch_date: string;
  vehicle_no?: string;
  delivery_notes?: string;
  created_by?: string;
  items: DispatchItem[];
  created_at?: string;
}

export interface PaymentAllocation {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  allocated_amount: number;
}

export interface Payment {
  id: string;
  payment_number: string;
  customer_id: string;
  customer_name?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  remarks?: string;
  created_by?: string;
  allocations: PaymentAllocation[];
  created_at?: string;
}

export interface StockSummaryItem {
  item_type: 'MATERIAL' | 'FINISHED_GOOD';
  category: string;
  code: string;
  name: string;
  unit: string;
  opening_stock: number;
  receipts: number;
  issues: number;
  sales: number;
  adjustments: number;
  closing_stock: number;
  unit_cost: number;
  stock_value: number;
  is_low_stock: boolean;
}

export interface StockLedgerEntry {
  id: string;
  item_type: string;
  item_code: string;
  item_name: string;
  movement_type: string;
  quantity_in: number;
  quantity_out: number;
  balance_after: number;
  unit: string;
  unit_cost: number;
  total_valuation: number;
  source_doc_type: string;
  source_doc_id: string;
  transaction_date: string;
  user_name?: string;
  remarks?: string;
}

export interface CustomerOutstanding {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  customer_type: string;
  state: string;
  total_outstanding: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_above_90: number;
  invoice_count: number;
}
