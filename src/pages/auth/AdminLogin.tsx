import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('admin@niat.edu.in');
    setPassword('Admin@123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both administrative email and password.');
      return;
    }

    setLoading(true);
    const res = await loginAdmin(email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 shadow-xl shadow-blue-500/25">
            <span className="text-2xl font-black text-white tracking-widest">N</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          NIAT Admission CRM
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Authorized NextGen Institute Administrative Portal
        </p>

        {/* Security Notice */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-blue-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Role-Based Access Control Protected</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/80 backdrop-blur-xl sm:px-10">
          {/* Quick Demo Credentials Pill */}
          <div className="mb-5 rounded-2xl bg-slate-900/80 p-3.5 border border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-200">Reviewer Demo Access</p>
              <p className="text-[10px] text-slate-400">admin@niat.edu.in | Admin@123</p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold px-2.5 py-1.5 transition border border-blue-500/30 flex items-center gap-1"
            >
              <KeyRound className="h-3 w-3" /> Auto-Fill
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Official Administrative Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@niat.edu.in"
                  className="block w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl bg-slate-900/80 border border-slate-700 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                'Authenticating with NIAT Server...'
              ) : (
                <>
                  <span>Sign In to Admin CRM</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-700/70 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Are you a prospective student?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300">
                Go to Student Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
