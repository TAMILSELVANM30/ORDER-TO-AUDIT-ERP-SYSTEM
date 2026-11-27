import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Shield, ArrowRight, UserCheck, CheckCircle2, Database, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('DemoPassword123!');
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
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
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
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@demo.com', desc: 'Order approval, Invoicing, Dispatch & Purchases' },
    { role: 'Salesman A', email: 'salesman.a@demo.com', desc: 'Mobile order entry for Retailer A (Tamil Nadu)' },
    { role: 'Salesman B', email: 'salesman.b@demo.com', desc: 'Order entry for Distributor B (Karnataka shortage test)' },
    { role: 'Production', email: 'production@demo.com', desc: 'BOM recipe, batch issues, yield & variance calculations' },
    { role: 'Auditor', email: 'auditor@demo.com', desc: 'Read-only audit center, GST & registers' },
    { role: 'Owner', email: 'owner@demo.com', desc: 'Financial overview, gross profit & receivables' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
            Supabase Project Connected
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-borderLine sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
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
                placeholder="name@demo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </button>
          </form>

          {/* New Account Sign Up Link */}
          <div className="mt-4 pt-3 border-t border-borderLine text-center">
            <p className="text-xs text-secondaryText">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-accent hover:underline inline-flex items-center">
                <UserPlus className="w-3.5 h-3.5 mr-1 inline" />
                Sign Up / Register
              </Link>
            </p>
          </div>

          {/* Quick Demo Persona Switcher */}
          <div className="mt-6 pt-6 border-t border-borderLine">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-secondaryText mb-3">
              <UserCheck className="w-4 h-4 text-accent" />
              <span>1-Click Evaluator Demo Personas:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className="p-2 text-left rounded-lg border border-borderLine hover:border-accent hover:bg-teal-50/30 transition-all text-xs group"
                >
                  <p className="font-semibold text-mainText group-hover:text-accent">{acc.role}</p>
                  <p className="text-[10px] text-secondaryText truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
