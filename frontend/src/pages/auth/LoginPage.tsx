import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  Database, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to matching role dashboard
  React.useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'SALESMAN') navigate('/salesman');
      else if (role === 'PRODUCTION') navigate('/production');
      else if (role === 'AUDITOR') navigate('/auditor');
      else if (role === 'OWNER') navigate('/owner');
      else navigate('/admin');
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'DemoPassword123!');
    } catch (err: any) {
      setError('Authentication failed for demo persona.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@demo.com', desc: 'Order approval, Invoicing, Dispatch & Purchases' },
    { role: 'Salesman A', email: 'salesman.a@demo.com', desc: 'Mobile order entry for Retailer A (Tamil Nadu)' },
    { role: 'Production', email: 'production@demo.com', desc: 'BOM recipe, batch issues, yield & variance calculations' },
    { role: 'Auditor', email: 'auditor@demo.com', desc: 'Read-only audit center, GST & registers' },
    { role: 'Owner', email: 'owner@demo.com', desc: 'Financial overview, gross profit & receivables' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Return to Gateway Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 mb-3">
        <Link 
          to="/" 
          className="inline-flex items-center text-xs font-semibold text-secondaryText hover:text-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Back to Gateway Portal
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
          DF
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-mainText">Dakshin Packaged Foods ERP</h2>
        <p className="mt-1 text-xs text-secondaryText">
          NIT Tiruchirappalli Internship Challenge | Order-to-Audit Manufacturing ERP
        </p>

        {/* Live Supabase Connection Badge */}
        <div className="mt-2 flex items-center justify-center space-x-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Database className="w-3 h-3 mr-1 text-emerald-600" />
            Supabase Storage &amp; Database Connected
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-borderLine sm:px-10">
          {/* Prominent Tab Switcher: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              className="py-2 text-xs font-bold rounded-lg bg-white text-primary shadow-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-accent" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="py-2 text-xs font-bold rounded-lg text-secondaryText hover:text-mainText flex items-center justify-center space-x-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <span className="shrink-0 font-bold">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-mainText">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                placeholder="Enter your registered email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Persona Switcher (Optional Helper) */}
          <div className="mt-6 pt-5 border-t border-borderLine">
            <details className="text-xs text-secondaryText group">
              <summary className="cursor-pointer font-semibold text-mainText hover:text-accent flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-accent" />
                  <span>Quick 1-Click Demo Profiles (Optional)</span>
                </span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">&#9660;</span>
              </summary>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    className="p-2 text-left rounded-lg border border-borderLine hover:border-accent hover:bg-teal-50/30 transition-all text-xs"
                  >
                    <p className="font-semibold text-mainText">{acc.role}</p>
                    <p className="text-[10px] text-secondaryText truncate">{acc.email}</p>
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
