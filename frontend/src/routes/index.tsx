import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'

// Auth
const AuthGatewayPage = lazy(() => import('../pages/auth/AuthGatewayPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))

// Admin
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const OrdersManagement = lazy(() => import('../pages/admin/OrdersManagement'))
const InvoicesPage = lazy(() => import('../pages/admin/InvoicesPage'))
const DispatchesPage = lazy(() => import('../pages/admin/DispatchesPage'))
const ProductsPage = lazy(() => import('../pages/admin/ProductsPage'))
const CustomersPage = lazy(() => import('../pages/admin/CustomersPage'))
const SuppliersPage = lazy(() => import('../pages/admin/SuppliersPage'))
const PurchasesPage = lazy(() => import('../pages/admin/PurchasesPage'))
const BOMPage = lazy(() => import('../pages/admin/BOMPage'))
const InventoryPage = lazy(() => import('../pages/admin/InventoryPage'))
const PaymentsPage = lazy(() => import('../pages/admin/PaymentsPage'))
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage'))

// Salesman
const SalesmanDashboard = lazy(() => import('../pages/salesman/SalesmanDashboard'))
const NewOrderPage = lazy(() => import('../pages/salesman/NewOrderPage'))
const MyOrdersPage = lazy(() => import('../pages/salesman/MyOrdersPage'))
const MyCustomersPage = lazy(() => import('../pages/salesman/MyCustomersPage'))

// Production
const ProductionDashboard = lazy(() => import('../pages/production/ProductionDashboard'))
const ProductionRunsPage = lazy(() => import('../pages/production/ProductionRunsPage'))
const MaterialStockPage = lazy(() => import('../pages/production/MaterialStockPage'))
const ProductionBOMPage = lazy(() => import('../pages/production/ProductionBOMPage'))

// Auditor
const AuditorOverview = lazy(() => import('../pages/auditor/AuditorOverview'))
const SalesRegisterPage = lazy(() => import('../pages/auditor/SalesRegisterPage'))
const PurchaseRegisterPage = lazy(() => import('../pages/auditor/PurchaseRegisterPage'))
const GSTReportPage = lazy(() => import('../pages/auditor/GSTReportPage'))
const StockSummaryPage = lazy(() => import('../pages/auditor/StockSummaryPage'))
const StockLedgerPage = lazy(() => import('../pages/auditor/StockLedgerPage'))
const ProductionReportsPage = lazy(() => import('../pages/auditor/ProductionReportsPage'))
const OutstandingPage = lazy(() => import('../pages/auditor/OutstandingPage'))
const ExportCenterPage = lazy(() => import('../pages/auditor/ExportCenterPage'))

// Owner
const OwnerDashboard = lazy(() => import('../pages/owner/OwnerDashboard'))

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  </div>
)

// Protected route wrapper
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Role home redirect
function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const roleMap: Record<string, string> = {
    ADMIN: '/admin',
    SALESMAN: '/salesman',
    PRODUCTION: '/production',
    AUDITOR: '/auditor',
    OWNER: '/owner',
  }
  return <Navigate to={roleMap[user.role] ?? '/admin'} replace />
}

// Gateway entry: shows welcome portal if unauthenticated, or redirects to dashboard if authenticated
function RootGatewayOrRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated) {
    return <RoleRedirect />
  }
  return <AuthGatewayPage />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public & Gateway */}
        <Route path="/" element={<RootGatewayOrRedirect />} />
        <Route path="/gateway" element={<AuthGatewayPage />} />
        <Route path="/auth" element={<AuthGatewayPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="dispatches" element={<DispatchesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="boms" element={<BOMPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Salesman */}
        <Route
          path="/salesman"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<SalesmanDashboard />} />
          <Route path="new-order" element={<NewOrderPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="customers" element={<MyCustomersPage />} />
        </Route>

        {/* Production */}
        <Route
          path="/production"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ProductionDashboard />} />
          <Route path="runs" element={<ProductionRunsPage />} />
          <Route path="boms" element={<ProductionBOMPage />} />
          <Route path="stock" element={<MaterialStockPage />} />
        </Route>

        {/* Auditor */}
        <Route
          path="/auditor"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AuditorOverview />} />
          <Route path="sales-register" element={<SalesRegisterPage />} />
          <Route path="purchase-register" element={<PurchaseRegisterPage />} />
          <Route path="gst-reports" element={<GSTReportPage />} />
          <Route path="stock-summary" element={<StockSummaryPage />} />
          <Route path="stock-ledger" element={<StockLedgerPage />} />
          <Route path="production-reports" element={<ProductionReportsPage />} />
          <Route path="outstanding" element={<OutstandingPage />} />
          <Route path="export" element={<ExportCenterPage />} />
        </Route>

        {/* Owner */}
        <Route
          path="/owner"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<OwnerDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
