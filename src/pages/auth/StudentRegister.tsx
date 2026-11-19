import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { GraduationCap, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const StudentRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    current_education: '12th Pursuing (Science PCM)',
    class_12_passing_year: '2026',
    class_12_percentage: '',
    city: '',
    state: '',
    interested_program: 'B.Tech CSE (AI & ML)',
    dream_career: 'AI & Machine Learning Engineer'
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'idle' | 'loading' | 'ok' | 'error'; text?: string }>({ type: 'idle' });

  // Auto-fill city and state from the India Post pincode directory
  const handlePincodeChange = async (value: string) => {
    const pin = value.replace(/\D/g, '').slice(0, 6);
    setPincode(pin);
    if (pin.length !== 6) {
      setPincodeStatus({ type: 'idle' });
      return;
    }
    setPincodeStatus({ type: 'loading', text: 'Looking up pincode...' });
    try {
      const res = await fetch(getApiUrl(`/api/public/pincode/${pin}`));
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, city: data.district, state: data.state }));
        setPincodeStatus({ type: 'ok', text: `${data.district}, ${data.state} (India Post)` });
      } else {
        setPincodeStatus({ type: 'error', text: res.status === 404 ? 'Pincode not found. Please enter city and state manually.' : 'Lookup unavailable. Please enter city and state manually.' });
      }
    } catch {
      setPincodeStatus({ type: 'error', text: 'Lookup unavailable. Please enter city and state manually.' });
    }
  };
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await registerStudent(formData);
    setLoading(false);

    if (res.success) {
      navigate('/student/dashboard');
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-xl shadow-blue-600/20 mb-4">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Admission Registration
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Create your NIAT Connect profile to track your application, reserve admission event passes, and interact with our AI Assistant.
          </p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200/80">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Personal Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">1</span>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="rahul.sharma@example.com"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic Profile */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">2</span>
                Academic Background
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">Current Education Stream *</label>
                  <select
                    name="current_education"
                    value={formData.current_education}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="12th Pursuing (Science PCM)">12th Pursuing (Science PCM)</option>
                    <option value="12th Passed (Science PCM)">12th Passed (Science PCM)</option>
                    <option value="12th Pursuing (Other Board/Stream)">12th Pursuing (Other Board/Stream)</option>
                    <option value="3-Year Polytechnic Diploma (CSE/IT)">3-Year Polytechnic Diploma (CSE/IT)</option>
                    <option value="Undergraduate Degree / Transfer">Undergraduate Degree / Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Passing Year *</label>
                  <select
                    name="class_12_passing_year"
                    value={formData.class_12_passing_year}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="2026">2026 (Upcoming Batch)</option>
                    <option value="2025">2025 (Recent Passed)</option>
                    <option value="2024">2024</option>
                    <option value="2027">2027 (Class 11)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">12th / Pre-board % (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="class_12_percentage"
                    value={formData.class_12_percentage}
                    onChange={handleChange}
                    placeholder="e.g. 88.5"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Pincode (auto-fills city &amp; state)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="pincode"
                    value={pincode}
                    onChange={e => handlePincodeChange(e.target.value)}
                    placeholder="e.g. 500032"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  {pincodeStatus.type !== 'idle' && (
                    <p className={`mt-1 text-[10px] ${pincodeStatus.type === 'error' ? 'text-rose-600' : pincodeStatus.type === 'ok' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {pincodeStatus.text}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Hyderabad"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">State *</label>
                  <input
                    type="text"
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Telangana"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Program Preferences */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">3</span>
                Preferred NIAT Program
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Target Degree Program *</label>
                  <select
                    name="interested_program"
                    value={formData.interested_program}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="B.Tech CSE (AI & ML)">B.Tech CSE (AI & ML)</option>
                    <option value="B.Tech Data Science & Analytics">B.Tech Data Science & Analytics</option>
                    <option value="B.Tech Software Engineering">B.Tech Software Engineering</option>
                    <option value="NextGen Tech Immersion (Work-Integrated)">NextGen Tech Immersion (Work-Integrated)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Aspirational Career Goal</label>
                  <input
                    type="text"
                    name="dream_career"
                    value={formData.dream_career}
                    onChange={handleChange}
                    placeholder="e.g. AI Research Scientist"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Security */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">4</span>
                Account Security
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Create Password *</label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="mt-1 block w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (
                'Submitting Registration & Generating Portal Profile...'
              ) : (
                <>
                  <span>Complete Student Registration</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-600">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in to your portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
