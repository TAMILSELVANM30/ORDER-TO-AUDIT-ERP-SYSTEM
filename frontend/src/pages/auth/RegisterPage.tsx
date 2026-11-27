import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { ArrowRight, UserPlus, Database, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('SALESMAN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  // Check Supabase connection status
  useEffect(() => {
    api.get('/supabase/status')
      .then((res) => {
        setSupabaseConnected(res.data?.connected ?? false);
      })
      .catch(() => {
        setSupabaseConnected(false);
      });
  }, []);

  // If already logged in, redirect to matching role dashboard
  useEffect(() => {
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

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
          DF
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-mainText">Create ERP Account</h2>
        <p className="mt-1 text-xs text-secondaryText">
          Dakshin Packaged Foods | Order-to-Audit Enterprise System
        </p>

        {/* Live Supabase Connection Badge */}
        <div className="mt-2 flex items-center justify-center space-x-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Database className="w-3 h-3 mr-1 text-emerald-600" />
            {supabaseConnected === true ? (
              <span>Supabase Connected &amp; Synced</span>
            ) : supabaseConnected === false ? (
              <span>Supabase Initialized</span>
            ) : (
              <span>Connecting to Supabase...</span>
            )}
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-borderLine sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-mainText">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                placeholder="ramesh@dakshin.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Designated ERP Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent bg-white"
              >
                <option value="ADMIN">ADMIN â€” System Administrator &amp; Invoicing</option>
                <option value="SALESMAN">SALESMAN â€” Mobile Sales Orders &amp; Retailers</option>
                <option value="PRODUCTION">PRODUCTION â€” BOMs, Recipe Yield &amp; Batch Runs</option>
                <option value="AUDITOR">AUDITOR â€” Read-only Audit Center &amp; GST</option>
                <option value="OWNER">OWNER â€” Executive Financial Dashboard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Password (min 6 characters)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account & Enter ERP'}
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-borderLine text-center">
            <p className="text-xs text-secondaryText">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign In here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
