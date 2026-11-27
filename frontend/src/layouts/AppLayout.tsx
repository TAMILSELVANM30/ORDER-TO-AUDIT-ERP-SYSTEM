import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  FileText,
  Truck,
  Package,
  Users,
  Building2,
  Receipt,
  BookOpen,
  Factory,
  Boxes,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldAlert,
  Download,
  AlertCircle,
  UserCheck,
  Database,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, role, logout, quickSwitchRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Role navigation items based on PART 3.3
  const getNavLinks = () => {
    switch (role) {
      case 'SALESMAN':
        return [
          { name: 'Dashboard', path: '/salesman', icon: LayoutDashboard },
          { name: 'New Order', path: '/salesman/new-order', icon: PlusCircle, highlight: true },
          { name: 'My Orders', path: '/salesman/orders', icon: ShoppingCart },
          { name: 'My Customers', path: '/salesman/customers', icon: Users },
        ];
      case 'PRODUCTION':
        return [
          { name: 'Production Dashboard', path: '/production', icon: LayoutDashboard },
          { name: 'Production Runs', path: '/production/runs', icon: Factory },
          { name: 'BOM & Recipes', path: '/production/boms', icon: BookOpen },
          { name: 'Raw Material Stock', path: '/production/stock', icon: Boxes },
        ];
      case 'AUDITOR':
        return [
          { name: 'Audit Overview', path: '/auditor', icon: LayoutDashboard },
          { name: 'Sales Register', path: '/auditor/sales-register', icon: FileText },
          { name: 'Purchase Register', path: '/auditor/purchase-register', icon: Receipt },
          { name: 'GST Reports', path: '/auditor/gst-reports', icon: ShieldAlert },
          { name: 'Stock Summary', path: '/auditor/stock-summary', icon: Boxes },
          { name: 'Stock Ledger', path: '/auditor/stock-ledger', icon: BarChart3 },
          { name: 'Production Reports', path: '/auditor/production-reports', icon: Factory },
          { name: 'Outstanding & Ageing', path: '/auditor/outstanding', icon: CreditCard },
          { name: 'Export Center', path: '/auditor/export', icon: Download },
        ];
      case 'OWNER':
        return [
          { name: 'Business Overview', path: '/owner', icon: LayoutDashboard },
          { name: 'Sales & Revenue', path: '/auditor/sales-register', icon: FileText },
          { name: 'Production Costing', path: '/auditor/production-reports', icon: Factory },
          { name: 'Inventory Valuation', path: '/auditor/stock-summary', icon: Boxes },
          { name: 'Receivables', path: '/auditor/outstanding', icon: CreditCard },
        ];
      case 'ADMIN':
      default:
        return [
          { name: 'Overview', path: '/admin', icon: LayoutDashboard },
          { name: 'Sales & Orders', path: '/admin/orders', icon: ShoppingCart },
          { name: 'GST Invoices', path: '/admin/invoices', icon: FileText },
          { name: 'Dispatches', path: '/admin/dispatches', icon: Truck },
          { name: 'Products', path: '/admin/products', icon: Package },
          { name: 'Customers', path: '/admin/customers', icon: Users },
          { name: 'Purchases', path: '/admin/purchases', icon: Receipt },
          { name: 'Suppliers', path: '/admin/suppliers', icon: Building2 },
          { name: 'BOM & Recipes', path: '/admin/boms', icon: BookOpen },
          { name: 'Production', path: '/admin/production', icon: Factory },
          { name: 'Inventory & Ledger', path: '/admin/inventory', icon: Boxes },
          { name: 'Customer Payments', path: '/admin/payments', icon: CreditCard },
          { name: 'Audit Reports', path: '/auditor', icon: BarChart3 },
          { name: 'Business Settings', path: '/admin/settings', icon: Settings },
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleRoleSwitch = async (targetRole: Role) => {
    setRoleSwitcherOpen(false);
    await quickSwitchRole(targetRole);
    // Navigate to role landing page
    if (targetRole === 'SALESMAN') navigate('/salesman');
    else if (targetRole === 'PRODUCTION') navigate('/production');
    else if (targetRole === 'AUDITOR') navigate('/auditor');
    else if (targetRole === 'OWNER') navigate('/owner');
    else navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-borderLine px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-secondary hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm">
              DF
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm text-primary tracking-tight">DAKSHIN FOODS</span>
              <span className="text-[10px] text-accent font-semibold ml-1.5 px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200">
                ERP v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Role Switcher & User Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Role Switcher for Interview Demonstration */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-borderLine bg-slate-50 hover:bg-slate-100 text-mainText transition-colors shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline text-secondaryText">Role:</span>
              <span className="text-primary font-bold">{role}</span>
              <ChevronDown className="w-3 h-3 text-secondaryText" />
            </button>

            {roleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-borderLine py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-borderLine text-[11px] font-semibold text-secondaryText uppercase tracking-wider">
                  Switch Role Persona
                </div>
                {(['ADMIN', 'SALESMAN', 'PRODUCTION', 'AUDITOR', 'OWNER'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      role === r ? 'font-bold text-accent bg-teal-50/50' : 'text-mainText'
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Supabase Status Indicator */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-medium">
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Supabase Connected</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2 pl-2 border-l border-borderLine">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-semibold text-mainText leading-none">{user?.full_name}</p>
              <p className="text-[10px] text-secondaryText mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
              className="p-1.5 rounded-lg text-secondaryText hover:text-danger hover:bg-rose-50 transition-colors flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline text-xs text-rose-600 font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed md:static inset-y-14 md:inset-y-0 left-0 z-30 w-60 bg-white border-r border-borderLine flex flex-col transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Sidebar Nav Items */}
          <div className="p-3 flex-1 overflow-y-auto space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-secondaryText uppercase tracking-wider">
              {role} Navigation
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin' || item.path === '/salesman' || item.path === '/production' || item.path === '/auditor' || item.path === '/owner'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : item.highlight
                        ? 'bg-teal-50 text-accent font-semibold hover:bg-teal-100'
                        : 'text-secondary hover:bg-slate-100 hover:text-mainText'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Demo Watermark Footer */}
          <div className="p-3 border-t border-borderLine bg-slate-50/50 text-[11px] text-secondaryText">
            <p className="font-semibold text-mainText">NIT Trichy ERP Challenge</p>
            <p className="text-[10px] mt-0.5">Order-to-Audit Integrated System</p>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-20 md:hidden"
          />
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-borderLine animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                <LogOut className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-mainText">Confirm Sign Out</h3>
                <p className="text-xs text-secondaryText">End your current session</p>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed mb-5">
              Are you sure you want to sign out from <strong>Dakshin Packaged Foods ERP</strong>? You will need to sign in again to access the dashboard.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-borderLine">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-borderLine text-xs font-semibold text-mainText hover:bg-slate-50 transition-colors"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
