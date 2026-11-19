import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('rahul.sharma@gmail.com');
    setPassword('Student@123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your registered email address and password.');
      return;
    }

    setLoading(true);
    const res = await loginStudent(email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate('/student/dashboard');
    } else {
      setErrorMessage(res.error || 'Student login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-xl shadow-blue-600/20">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          NIAT Student Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Admissions 2026 • NextGen Institute of Advanced Technology
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 sm:px-10">
          {/* Quick Demo Credentials Pill */}
          <div className="mb-5 rounded-2xl bg-blue-50/80 p-3.5 border border-blue-200/70 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-900">Reviewer Demo Student</p>
              <p className="text-[10px] text-blue-700">rahul.sharma@gmail.com | Student@123</p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="rounded-lg bg-blue-600 text-white text-xs font-semibold px-2.5 py-1.5 transition hover:bg-blue-700 flex items-center gap-1 shadow-sm"
            >
              <KeyRound className="h-3 w-3" /> Auto-Fill
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Registered Email Address
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
                  placeholder="student@example.com"
                  className="block w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition"
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
                  className="block w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                'Logging In...'
              ) : (
                <>
                  <span>Sign In to Student Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center space-y-2">
            <p className="text-xs text-slate-600">
              New applicant?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Register Student Profile
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Admission Administrator?{' '}
              <Link to="/admin/login" className="font-medium text-slate-700 hover:text-slate-900">
                Go to Admin Portal
              </Link>
            </p>
          </div>
        </div>

        {/* Highlight features */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1.5 p-2 bg-white/60 rounded-xl border border-slate-200/50">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>NIAT AI Assistant</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2 bg-white/60 rounded-xl border border-slate-200/50">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Live Admission Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
