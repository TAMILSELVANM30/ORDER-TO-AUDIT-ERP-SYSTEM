import React, { useState, useEffect } from 'react';
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
  Check, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import api from '../../services/api';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Real-time password validation helpers
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('Password does not meet security requirements (minimum 8 characters with at least one letter and one number).');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please re-enter identical passwords.');
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
              <span>Supabase Storage Initialized</span>
            ) : (
              <span>Verifying Supabase Project...</span>
            )}
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-borderLine sm:px-10">
          {/* Prominent Tab Switcher: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="py-2 text-xs font-bold rounded-lg text-secondaryText hover:text-mainText flex items-center justify-center space-x-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className="py-2 text-xs font-bold rounded-lg bg-white text-primary shadow-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
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
              <label className="block text-xs font-medium text-mainText">Full Legal Name</label>
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
              <label className="block text-xs font-medium text-mainText">Enterprise Email Address</label>
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
              <label className="block text-xs font-medium text-mainText">Assigned ERP Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="mt-1 block w-full px-3 py-2 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent bg-white"
              >
                <option value="ADMIN">ADMIN â€” System Administrator, Invoicing &amp; Dispatches</option>
                <option value="SALESMAN">SALESMAN â€” Mobile Sales Orders &amp; Retailers</option>
                <option value="PRODUCTION">PRODUCTION â€” BOMs, Recipe Yield &amp; Batch Runs</option>
                <option value="AUDITOR">AUDITOR â€” Read-only Audit Center &amp; GST</option>
                <option value="OWNER">OWNER â€” Executive Financial Overview</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Create Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="Min. 8 characters, letters &amp; numbers"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements Real-Time Indicator */}
              <div className="mt-2 space-y-1 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px]">
                <div className="flex items-center space-x-1.5">
                  {hasMinLength ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                  <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {hasLetter ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                  <span className={hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    Contains at least one letter (a-z / A-Z)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                  <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    Contains at least one number (0-9)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-mainText">Confirm Password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-borderLine rounded-lg text-xs focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`mt-1 text-[10px] ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {passwordsMatch ? 'âœ“ Passwords match' : 'âœ— Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Registering Account...' : 'Create Account & Enter ERP'}
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
