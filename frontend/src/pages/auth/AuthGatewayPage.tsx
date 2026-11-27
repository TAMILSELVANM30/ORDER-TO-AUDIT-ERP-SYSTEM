import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  Database, 
  Lock, 
  CheckCircle, 
  FileCheck, 
  Server, 
  ArrowRight 
} from 'lucide-react';
import api from '../../services/api';

export const AuthGatewayPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking...');
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(true);

  // If already authenticated, redirect to role home
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'SALESMAN') navigate('/salesman');
      else if (role === 'PRODUCTION') navigate('/production');
      else if (role === 'AUDITOR') navigate('/auditor');
      else if (role === 'OWNER') navigate('/owner');
      else navigate('/admin');
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    api.get('/supabase/status')
      .then((res) => {
        if (res.data?.connected) {
          setSupabaseStatus('Supabase Cloud Storage Active');
          setIsSupabaseOnline(true);
        } else {
          setSupabaseStatus('Local Storage Mode');
          setIsSupabaseOnline(false);
        }
      })
      .catch(() => {
        setSupabaseStatus('Local Storage Mode');
        setIsSupabaseOnline(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Security Banner */}
      <div className="w-full bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 text-center flex items-center justify-center space-x-3 border-b border-slate-800">
        <span className="flex items-center text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Enterprise 256-bit Security Active
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center text-teal-300">
          <Database className="w-3.5 h-3.5 mr-1" />
          {supabaseStatus}
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:flex items-center text-slate-400">
          <Server className="w-3.5 h-3.5 mr-1 text-slate-400" />
          NIT Trichy Challenge Validated
        </span>
      </div>

      {/* Main Center Gateway Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full">
          {/* Header Brand */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-teal-900/10 mb-4 border-2 border-teal-500/20">
              DF
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-mainText tracking-tight">
              Dakshin Packaged Foods ERP
            </h1>
            <p className="mt-1 text-sm text-secondaryText font-medium">
              Secure Enterprise Access Gateway
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Please choose an authentication option below to enter the system
            </p>
          </div>

          {/* Action Cards Grid: Sign In vs Sign Up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* 1. Sign In Button Card */}
            <div 
              onClick={() => navigate('/login')}
              className="bg-white rounded-2xl p-6 border-2 border-borderLine hover:border-accent hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-accent mb-4 group-hover:scale-105 transition-transform">
                  <LogIn className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-base font-bold text-mainText group-hover:text-accent transition-colors">
                  Sign In to Account
                </h3>
                <p className="mt-1.5 text-xs text-secondaryText leading-relaxed">
                  Already registered? Access your ERP dashboard with your verified email and password credentials.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Sign Up Button Card */}
            <div 
              onClick={() => navigate('/signup')}
              className="bg-white rounded-2xl p-6 border-2 border-teal-200/80 bg-linear-to-b from-white to-teal-50/20 hover:border-accent hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 mb-2">
                  New User Registration
                </div>
                <h3 className="text-base font-bold text-mainText group-hover:text-accent transition-colors">
                  Create New Account
                </h3>
                <p className="mt-1.5 text-xs text-secondaryText leading-relaxed">
                  First time here? Register your staff profile with designated role (Admin, Sales, Production, Auditor, or Owner).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-teal-100/50 flex items-center justify-between text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                <span>Open Registration Form</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Security Features Accordion / Highlights */}
          <div className="bg-white rounded-xl p-4 border border-borderLine shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-mainText mb-2.5">
              <Lock className="w-4 h-4 text-accent" />
              <span>Security &amp; Verification Protocols</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-secondaryText">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Strict bcrypt password verification</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>JWT session tokens with expiration</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Role-based access authorization</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Real-time audit log tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-secondaryText border-t border-borderLine bg-white">
        &copy; {new Date().getFullYear()} Dakshin Packaged Foods Pvt Ltd. All rights reserved.
      </div>
    </div>
  );
};

export default AuthGatewayPage;
