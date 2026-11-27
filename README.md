# ORDER-TO-AUDIT ERP SYSTEM👇👇
### Complete Integrated Manufacturing, Sales, Inventory & Audit ERP with Supabase Storage
**NIT Tiruchirappalli Internship Evaluation Challenge | Small Food Manufacturer**

---

## 📌 Executive Summary
**Company:** Dakshin Packaged Foods Pvt Ltd  
**Location:** Tiruchirappalli, Tamil Nadu (State Code: 33)  
**Products:** Packaged Indian snacks (Murukku 200g, Mixture, Chips, Sweets)  

This ERP system manages end-to-end operations:
Salesman Order → Admin Verification → GST Tax Invoice → Warehouse Dispatch → Raw Material Purchase → BOM Formulation → Production Run & Variance → Perpetual Weighted-Average Costing → Customer Payment Reconciliation → Monthly Audit Registers & Export Center.

---

## 🔗 Repository & Deployment Information

- **GitHub Repository:** [https://github.com/TAMILSELVANM30/ORDER-TO-AUDIT-ERP-SYSTEM](https://github.com/TAMILSELVANM30/ORDER-TO-AUDIT-ERP-SYSTEM) (Branch: `main`)
- **Local Web Application (Frontend):** `http://localhost:5173`
- **Local API Service (Backend):** `http://localhost:5000/api`
- **Supabase Cloud Project Reference:** `https://uvsxdgaxvfpsirrblnwh.supabase.co`
- **Production Cloud Deployment:** Currently configured for local host execution (Vite + Flask development WSGI) and Docker deployment. Cloud hosted URL is not yet bound to a public domain.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Browser / Mobile Client (React + Vite + TypeScript)"]
    
    subgraph "Frontend Layer"
        Client --> Gateway["Enterprise Security Gateway (/ or /login /signup)"]
        Gateway --> RoleDash["Role-Based Portals (Admin, Sales, Production, Auditor, Owner)"]
        RoleDash --> DocModal["DocumentAttachmentModal (Upload/Preview)"]
    end
    
    subgraph "Backend API Layer (Flask on port 5000)"
        DocModal -->|Bearer JWT + Multipart/JSON| FlaskAPI["Flask App (/api)"]
        RoleDash -->|REST API Requests| FlaskAPI
        FlaskAPI --> AuthBP["Auth & RBAC Middleware (/api/auth)"]
        FlaskAPI --> StorageBP["Storage Blueprint (/api/storage)"]
        FlaskAPI --> SupabaseBP["Supabase Client (/api/supabase)"]
        FlaskAPI --> ERPBlueprints["ERP Business Modules (Orders, Invoices, BOM, Production, Payments)"]
    end
    
    subgraph "Persistence & Cloud Storage Layer"
        ERPBlueprints -->|SQLAlchemy ORM| DB[("Database: SQLite (dev) / PostgreSQL (prod)")]
        StorageBP -->|Signed URLs / Upload / Delete| PrivateBucket[("Supabase Private Bucket: erp-documents (10 MB)")]
        StorageBP -->|Public Image CDN URLs| PublicBucket[("Supabase Public Bucket: erp-product-images (5 MB)")]
        StorageBP -->|File Metadata| DB
    end
```

---

## 📁 Project Folder Structure

```
ORDER-TO-AUDIT-ERP-SYSTEM/
├── .env.example                     # Environment template (includes Supabase and DB keys)
├── .gitignore                       # Ensures .env, caches, and node_modules are excluded
├── README.md                        # Complete project documentation
├── backend/                         # Flask Backend Application
│   ├── run.py                       # Application runner entrypoint (port 5000)
│   ├── config.py                    # Environment-driven configuration (SQLite/PostgreSQL, Supabase)
│   ├── requirements.txt             # Python dependencies (Flask, SQLAlchemy, Supabase, pytest, etc.)
│   ├── app/
│   │   ├── __init__.py              # App factory, CORS, JWT error handlers, blueprint registration
│   │   ├── db.py                    # SQLAlchemy engine, scoped sessions, Base metadata
│   │   ├── models/                  # SQLAlchemy ORM entity models
│   │   │   ├── user.py              # User and Role definitions
│   │   │   ├── customer.py          # Customer accounts and balances
│   │   │   ├── supplier.py          # Vendor profiles
│   │   │   ├── product.py           # Finished goods catalog and image URLs
│   │   │   ├── material.py          # Raw materials and stock levels
│   │   │   ├── bom.py               # Bill of Materials recipes and recipe items
│   │   │   ├── sales_order.py       # Sales orders and order items
│   │   │   ├── invoice.py           # GST tax invoices and items
│   │   │   ├── dispatch.py          # Warehouse dispatch notes and tracking
│   │   │   ├── purchase.py          # Inward raw material purchase bills
│   │   │   ├── production.py        # Production batch runs and material consumptions
│   │   │   ├── payment.py           # Inward customer payments
│   │   │   ├── stock_ledger.py      # Perpetual stock ledger (weighted average cost)
│   │   │   ├── file_attachment.py   # Supabase file metadata tracking
│   │   │   ├── audit_log.py         # Immutable operational audit log
│   │   │   └── settings.py          # Company configuration and GST parameters
│   │   ├── permissions/             # Role-based access control decorators (@roles_required)
│   │   ├── routes/                  # Modular Flask blueprints
│   │   │   ├── auth.py              # /api/auth (Login, Register/Sign Up, Profile)
│   │   │   ├── storage.py           # /api/storage (Supabase document and image endpoints)
│   │   │   ├── supabase_client.py   # /api/supabase (Live connection status probe)
│   │   │   ├── orders.py            # /api/orders (Sales order workflows)
│   │   │   ├── invoices.py          # /api/invoices (GST invoice creation and status)
│   │   │   ├── dispatches.py        # /api/dispatches (Shipment execution)
│   │   │   ├── purchases.py         # /api/purchases (Raw material bills)
│   │   │   ├── production.py        # /api/production (Batch runs and variances)
│   │   │   ├── inventory.py         # /api/inventory (Live stock and ledger)
│   │   │   ├── payments.py          # /api/payments (Collections and reconciliation)
│   │   │   ├── reports.py           # /api/reports (GSTR-1, registers, costing exports)
│   │   │   ├── dashboard.py         # /api/dashboard (Role-specific metrics)
│   │   │   ├── products.py          # /api/products (Catalogue management)
│   │   │   ├── customers.py         # /api/customers (Debtor master)
│   │   │   ├── suppliers.py         # /api/suppliers (Creditor master)
│   │   │   ├── materials.py         # /api/materials (Raw material master)
│   │   │   ├── boms.py              # /api/boms (BOM formulation)
│   │   │   ├── users.py             # /api/users (Staff management)
│   │   │   └── settings.py          # /api/settings (Tax and company settings)
│   │   ├── services/                # Business logic engines (Inventory, Sales, Costing, Storage)
│   │   └── utils/                   # GST math, number-to-words currency formatters, audit logging
│   ├── seed/                        # Data seeding scripts (Benchmark scenario test data)
│   └── tests/                       # Pytest automated test suites
├── frontend/                        # React + Vite + TypeScript Frontend Application
│   ├── index.html                   # HTML entrypoint
│   ├── package.json                 # Node dependencies (React 18, Tailwind, Lucide, Recharts)
│   ├── vite.config.ts               # Vite configuration (proxying API calls to backend)
│   └── src/
│       ├── layouts/AppLayout.tsx    # Responsive shell, role navigation, sign out modal
│       ├── routes/index.tsx         # Lazy-loaded router with Gateway portal and role redirects
│       ├── context/AuthContext.tsx  # JWT authentication state and persona switcher
│       ├── services/api.ts          # Axios client with automatic Bearer token interceptor
│       ├── components/              # Shared UI components (DataTable, Modal, DocumentAttachmentModal)
│       └── pages/                   # Role dashboards and workflow screens
│           ├── auth/                # AuthGatewayPage, LoginPage, RegisterPage
│           ├── admin/               # Invoices, Orders, Dispatches, Purchases, Inventory, Settings
│           ├── salesman/            # Mobile New Order entry (<1 min), Order tracking
│           ├── production/          # Batch execution wizard, BOM formulation, Stock overview
│           ├── auditor/             # Sales/Purchase registers, GSTR-1, Ageing, Export center
│           └── owner/               # Strategic executive gross margins and KPIs
```

---

## ☁️ Supabase Storage Integration

The ERP integrates two dedicated buckets via the Python Supabase SDK on the Flask backend:

### 1. `erp-documents` (Private Bucket)
- **Bucket Visibility:** Private (Row Level Security active, anonymous public access disabled).
- **File Size Ceiling:** **10 MB** (Configured in both the Supabase dashboard and verified in `MAX_FILE_SIZES["default"]` in `storage_service.py`).
- **Allowed MIME Types:**
  - *Standard Documents (Invoices, Purchase Bills, Payment Receipts, Dispatch Proofs):*
    - `application/pdf` (`.pdf`)
    - `image/jpeg` (`.jpg`, `.jpeg`)
    - `image/png` (`.png`)
    - `image/webp` (`.webp`)
  - *Analytical & Production Attachments (Production Reports, Audit Attachments):*
    - `application/pdf` (`.pdf`)
    - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`)
    - `text/csv` (`.csv`)
    - `image/jpeg` (`.jpg`)
    - `image/png` (`.png`)
    - `image/webp` (`.webp`)
- **Access Flow:** Authorized users request short-lived (1-hour / 3600-second) signed URLs generated securely by the backend (`GET /api/storage/documents/<id>/signed-url`), or stream downloads directly through the Flask backend (`GET /api/storage/documents/<id>/download`).

### 2. `erp-product-images` (Public Bucket)
- **Bucket Visibility:** Public (Read-only public CDN access enabled for fast web rendering).
- **File Size Ceiling:** **5 MB** (Configured in the Supabase dashboard and enforced in `MAX_FILE_SIZES["product_image"]`).
- **Allowed MIME Types:**
  - `image/jpeg` (`.jpg`, `.jpeg`)
  - `image/png` (`.png`)
  - `image/webp` (`.webp`)
  - `image/gif` (`.gif`)
- **Access Flow:** Direct public URLs (`GET /api/storage/product-images/<product_id>`) displayed directly in the React finished goods product catalogue.

### 🛡️ Security Protections
- **Backend-only keys:** `SUPABASE_SERVICE_ROLE_KEY` is exclusively consumed in Python. It is never exposed in the Vite frontend build or transmitted to client browsers.
- **Path Sanitization & Injection Prevention:** Filenames are never trusted directly from clients; they are converted into unique UUID paths (`{category}/{reference_id}/{safe_hint}_{uuid}.ext`).
- **Audit Logging & Metadata Storage:** Every uploaded attachment writes an immutable metadata record into the `file_attachments` database table.

---

## 🗄️ Database Architecture & ORM Models

The application models 15 primary relational tables using SQLAlchemy ORM (`backend/app/models/`):

| Model / Table Name | Key Attributes | Core Relationships |
|---|---|---|
| `users` | `id`, `email`, `password_hash`, `full_name`, `role`, `is_active` | Created sales orders, dispatches, and audit entries |
| `customers` | `id`, `name`, `gstin`, `state`, `state_code`, `credit_limit`, `balance` | 1-to-many with `sales_orders`, `invoices`, and `payments` |
| `suppliers` | `id`, `name`, `gstin`, `state`, `state_code`, `phone`, `email` | 1-to-many with inward `purchase_bills` |
| `products` | `id`, `name`, `sku`, `hsn_code`, `uom`, `gst_rate`, `unit_price`, `current_stock`, `image_url` | Referenced in `boms`, `sales_order_items`, `invoice_items` |
| `materials` | `id`, `name`, `sku`, `uom`, `current_stock`, `min_stock`, `standard_cost` | Referenced in `bom_items`, `purchase_bill_items`, `production_run_materials` |
| `boms` / `bom_items` | `id`, `product_id`, `output_quantity`, `material_id`, `quantity` | Defines the recipe formulations linking finished goods to raw materials |
| `sales_orders` / `items` | `id`, `order_number`, `customer_id`, `salesman_id`, `total_amount`, `status` | Converts to `invoices` upon approval; tracks item quantities and rates |
| `invoices` / `items` | `id`, `invoice_number`, `order_id`, `customer_id`, `cgst_amount`, `sgst_amount`, `igst_amount`, `total_amount`, `status` | Parent to `dispatches` and `payments`; enforces GST rules |
| `dispatches` / `items` | `id`, `dispatch_number`, `invoice_id`, `transporter`, `vehicle_no`, `lr_number`, `status` | Deducts finished goods inventory upon dispatch completion |
| `purchase_bills` / `items`| `id`, `bill_number`, `supplier_id`, `subtotal`, `tax_amount`, `total_amount` | Increases raw material stock and updates weighted-average unit cost |
| `production_runs` / `materials` | `id`, `batch_number`, `bom_id`, `product_id`, `planned_quantity`, `actual_yield`, `variance_percent` | Consumes raw materials; yields finished goods into stock |
| `payments` | `id`, `payment_number`, `invoice_id`, `customer_id`, `amount`, `payment_mode`, `reference_no` | Reconciles invoice balance and updates customer outstanding balances |
| `stock_ledger` | `id`, `transaction_type`, `item_type`, `item_id`, `quantity`, `unit_cost`, `running_balance`, `running_cost` | Perpetual inventory log for valuation and audit tracking |
| `file_attachments` | `id`, `document_type`, `reference_id`, `bucket_name`, `storage_path`, `file_name`, `file_size_bytes`, `mime_type`, `uploaded_by` | Links Supabase storage files to invoices, bills, receipts, or runs |
| `audit_logs` | `id`, `action`, `entity_type`, `entity_id`, `user_id`, `remarks`, `created_at` | Immutable security log tracking logins, approvals, and state changes |

---

## 🔌 API Route Groups & Endpoints

All backend endpoints are prefixed with `/api` and defined across modular Flask blueprints:

- **Authentication & Gateway (`/api/auth`)**:
  - `POST /register`, `POST /signup`: Register a new verified staff user profile with role assignment.
  - `POST /login`: Verify credentials against bcrypt hash and issue 8-hour JWT access tokens.
  - `GET /me`: Retrieve the authenticated user profile.
  - `POST /logout`: Log out and record audit event.
- **Supabase Integration & Health (`/api/supabase` & `/api/storage`)**:
  - `GET /api/supabase/status`: Returns live connection state and active project URL.
  - `GET /api/storage/status`: Health probe validating storage configuration and bucket limits.
  - `POST /api/storage/documents`: Secure multipart upload for private ERP documents.
  - `GET /api/storage/documents/<ref_id>`: List all attached documents for a given business entity.
  - `GET /api/storage/documents/<id>/signed-url`: Generate a 1-hour signed access URL.
  - `GET /api/storage/documents/<id>/download`: Stream document bytes directly through the backend.
  - `DELETE /api/storage/documents/<id>`: Delete document from Supabase and remove metadata row.
  - `POST /api/storage/product-images`: Upload finished goods catalogue image to the public bucket.
  - `GET /api/storage/product-images/<product_id>`: Retrieve public image CDN URL.
- **Sales & Orders (`/api/orders`)**:
  - `GET /api/orders`: List sales orders (filterable by salesman or status).
  - `POST /api/orders`: Fast order booking (<1 minute) with customer balance validation.
  - `POST /api/orders/<id>/approve`: Admin approval of booked orders.
- **Invoices & Taxation (`/api/invoices`)**:
  - `GET /api/invoices`: List tax invoices with payment states (`UNPAID`, `PARTIAL`, `PAID`).
  - `POST /api/invoices`: Generate tax invoice; auto-calculates CGST/SGST (intra-state 33) or IGST (inter-state).
- **Warehouse & Dispatch (`/api/dispatches`)**:
  - `GET /api/dispatches`: List shipments with dispatch notes and transport details.
  - `POST /api/dispatches`: Execute dispatch and decrease finished stock in perpetual ledger.
- **Purchasing & Creditors (`/api/purchases`)**:
  - `GET /api/purchases`, `POST /api/purchases`: Log inward raw material vendor bills and update weighted costs.
- **Manufacturing & Recipes (`/api/boms` & `/api/production`)**:
  - `GET /api/boms`, `POST /api/boms`: Recipe definitions and material requirements.
  - `GET /api/production/runs`, `POST /api/production/runs`: Launch production batch, auto-calculate variance and consumption.
- **Inventory & Valuation (`/api/inventory`)**:
  - `GET /api/inventory/summary`: Real-time stock counts and valuation.
  - `GET /api/inventory/ledger`: Transaction-by-transaction movement ledger.
- **Collections & Accounts (`/api/payments`)**:
  - `GET /api/payments`, `POST /api/payments`: Record payment receipts and reconcile accounts receivable.
- **Auditor & Compliance (`/api/reports`)**:
  - `GET /api/reports/sales-register`: Monthly sales register with tax breakdowns.
  - `GET /api/reports/purchase-register`: Inward material tax breakdown.
  - `GET /api/reports/gstr1`: Formatted GSTR-1 summary for statutory filing.
  - `GET /api/reports/outstanding`: Accounts receivable ageing breakdown.
  - `GET /api/reports/export`: CSV and Excel downloadable exports.

---

## ⚙️ Configuration & Environment Setup

Copy `.env.example` to `.env` in the root directory:

```bash
# Application Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-32-chars-minimum
JWT_SECRET_KEY=your-jwt-secret-key-minimum

# Database Selection (SQLite vs. PostgreSQL)
DATABASE_URL=sqlite:///order_to_audit.db

# Supabase Storage Configuration (Backend Only)
SUPABASE_URL=https://uvsxdgaxvfpsirrblnwh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
SUPABASE_PUBLISHABLE_KEY=sb_publishable_FW00PPG9jv8Xh-50IfhhnQ_9gUs0WbJ
```

### Database Configuration: SQLite vs. Production PostgreSQL
Based on `backend/config.py`, the backend automatically handles your environment:
1. **Local Development (Default - SQLite):**
   - If `DATABASE_URL` is omitted or set to `sqlite:///order_to_audit.db`, the database engine creates a self-contained local SQLite file in `backend/order_to_audit.db`.
   - Requires zero external services to run.
2. **Production Deployment (PostgreSQL):**
   - Set `DATABASE_URL=postgresql://user:password@host:5432/dbname`.
   - The application automatically replaces legacy `postgres://` prefixes with `postgresql://` to ensure compatibility with SQLAlchemy 2.0+.
   - Uses connection pooling with `pool_pre_ping=True` to eliminate stale connections during production restarts.

---

## 🚀 Running the Application

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Seed initial benchmark scenario & accounts:
python seed/seed_data.py --reset --benchmark

# Start Flask server:
python run.py
```
Backend runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🔑 Demo Personas & Credentials

> ⚠️ **SECURITY WARNING:** The accounts below are seeded exclusively for local evaluation, grading, and testing. Do not use these accounts or passwords in any live or public production deployment. Production instances should register genuine administrator accounts via the Gateway Sign Up page.

All demo accounts share the evaluation password: `DemoPassword123!`

| Role | Email | Responsibilities & Access Scope |
|---|---|---|
| **ADMIN** | `admin@demo.com` | Full operational control, order approval, invoice dispatch, document upload & deletion. |
| **SALESMAN** | `salesman.a@demo.com` | Fast mobile order booking (<1 min), personal accounts, and customer balance tracking. |
| **PRODUCTION** | `production@demo.com` | Batch execution wizard, BOM formulation, yield/variance monitoring, production doc attachments. |
| **AUDITOR** | `auditor@demo.com` | Read-only audit control, GSTR-1 summaries, signed document inspection, CSV/Excel export. |
| **OWNER** | `owner@demo.com` | Strategic analytics, executive gross margins, revenue charts, working capital summary. |

---

## 🧪 Testing Results & Verification Walkthrough

The backend features an automated test suite executed via `pytest`:

```bash
cd backend
python -m pytest tests/test_erp_suite.py tests/test_storage.py -v
```

### Verified Test Matrix (100% Pass Rate):
- `tests/test_erp_suite.py::test_valid_user_authentication` ✅ PASSED
- `tests/test_erp_suite.py::test_user_roles_coverage` ✅ PASSED
- `tests/test_erp_suite.py::test_unit_conversions` ✅ PASSED
- `tests/test_erp_suite.py::test_number_to_words_inr` ✅ PASSED
- `tests/test_erp_suite.py::test_negative_stock_prevention` ✅ PASSED
- `tests/test_erp_suite.py::test_bom_planned_consumption_calculation` ✅ PASSED
- `tests/test_erp_suite.py::test_gst_intra_and_inter_state` ✅ PASSED
- `tests/test_erp_suite.py::test_payment_and_outstanding` ✅ PASSED
- `tests/test_erp_suite.py::test_full_benchmark_scenario` ✅ PASSED
- `tests/test_storage.py::test_file_validation_allowed_and_disallowed` ✅ PASSED
- `tests/test_storage.py::test_safe_storage_path_sanitization` ✅ PASSED
- `tests/test_storage.py::test_supabase_upload_and_signed_url_mocked` ✅ PASSED
- `tests/test_storage.py::test_storage_api_status_endpoint` ✅ PASSED
- `tests/test_live_storage.py::test_configured_bucket_limits` ✅ PASSED

### User Interface Flow & Screens:
1. **Security Gateway (`/`):** Enterprise landing screen offering distinct **Sign In** and **Sign Up** gateways with real-time Supabase verification.
2. **Strict Sign In (`/login`):** Requires exact verified credentials with password visibility toggles and optional demo persona selector.
3. **Staff Sign Up (`/signup`):** Allows instant registration with RFC email validation, password complexity checklist, and dual-sync with Supabase.
4. **Document Attachment Modal:** Seamless drag-and-drop file upload with live progress bar, file-type validation, and 1-hour signed URL viewing on Invoices, Purchases, and Production screens.
5. **Safe Sign Out:** Header profile features a confirmation modal preventing accidental session terminations.
