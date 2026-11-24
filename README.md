# ORDER-TO-AUDIT ERP SYSTEM
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

## ☁️ Supabase Storage Integration

The ERP integrates two dedicated buckets via the Python Supabase SDK on the Flask backend:

### 1. `erp-documents` (Private Bucket)
- **Security:** Private access. Files are never publicly accessible.
- **Documents:** Signed customer invoices, vendor purchase bills, payment deposit slips, dispatch POD receipts, production batch run records, and audit attachments.
- **Access Flow:** Authorized users request short-lived (1-hour) signed URLs generated securely by the backend (`GET /api/storage/documents/<id>/signed-url`), or stream downloads directly through the Flask backend (`GET /api/storage/documents/<id>/download`).

### 2. `erp-product-images` (Public Bucket)
- **Security:** Public bucket for serving high-performance web images.
- **Documents:** Finished goods product catalogue pictures.
- **Access Flow:** Direct public URLs (`GET /api/storage/product-images/<product_id>`) displayed seamlessly in the React catalogue.

### 🛡️ Security Protections
- **Backend-only keys:** `SUPABASE_SERVICE_ROLE_KEY` is exclusively consumed in Python. It is never exposed in the Vite frontend build or to the browser.
- **File Validation:** Enforces strict MIME-type whitelists (PDF, JPG, PNG, WebP, XLSX, CSV) and size ceilings (5MB for images, 20MB for documents).
- **Collision & Injection Prevention:** User filenames are sanitized into collision-proof UUID paths (`{category}/{reference_id}/{safe_hint}_{uuid}.ext`).
- **Audit Trail & Soft Deletion:** Metadata for every uploaded attachment is logged in the `file_attachments` database table.

---

## ⚙️ Configuration & Environment Setup

Copy `.env.example` to `.env` in the root directory:

```bash
# Application
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-32-chars-minimum
JWT_SECRET_KEY=your-jwt-secret-key-minimum

# Database (PostgreSQL or SQLite for local dev)
DATABASE_URL=sqlite:///order_to_audit.db

# Supabase Storage Configuration (Backend Only)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

### Creating the Supabase Storage Buckets:
In your Supabase Dashboard:
1. Navigate to **Storage** -> **New Bucket**.
2. Create Bucket 1: Name `erp-documents`, set **Public Bucket: OFF** (Private).
3. Create Bucket 2: Name `erp-product-images`, set **Public Bucket: ON** (Public).

---

## 🚀 Running the Application

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed/seed_data.py --reset --benchmark
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

### 3. Run Backend Test Suite
```bash
cd backend
python -m pytest tests/ -v
```

---

## 🔑 Demo Personas & Credentials

All test accounts use password: `DemoPassword123!`

| Role | Email | Responsibilities |
|---|---|---|
| **ADMIN** | `admin@demo.com` | Full operational control, order verification, invoice dispatch, document upload & deletion. |
| **SALESMAN** | `salesman.a@demo.com` | Fast field order booking (<1 min), personal accounts & sales history. |
| **PRODUCTION** | `production@demo.com` | Batch execution wizard, BOM formulation, yield/variance monitoring, production doc attachments. |
| **AUDITOR** | `auditor@demo.com` | Read-only audit control, GSTR-1 summaries, signed document inspection, CSV/Excel export. |
| **OWNER** | `owner@demo.com` | Strategic analytics, executive gross margins, revenue charts, working capital summary. |
