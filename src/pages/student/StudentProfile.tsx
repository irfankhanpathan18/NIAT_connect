import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { StudentProfile } from '../../types';
import {
  User,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, token, updateProfileState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    current_education: '12th Pursuing (Science PCM)',
    class_12_passing_year: '2026',
    class_12_percentage: '',
    city: '',
    state: '',
    interested_program: 'B.Tech CSE (AI & ML)',
    dream_career: '',
    parent_name: '',
    parent_phone: '',
    counselling_preferred_time: 'Weekday Evenings (5 PM - 7 PM)'
  });

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/api/student/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const p: StudentProfile = data.profile;
          if (p) {
            setFormData({
              name: data.user.name || '',
              phone: data.user.phone || '',
              current_education: p.current_education || '12th Pursuing (Science PCM)',
              class_12_passing_year: String(p.class_12_passing_year || '2026'),
              class_12_percentage: p.class_12_percentage ? String(p.class_12_percentage) : '',
              city: p.city || '',
              state: p.state || '',
              interested_program: p.interested_program || 'B.Tech CSE (AI & ML)',
              dream_career: p.dream_career || '',
              parent_name: p.parent_name || '',
              parent_phone: p.parent_phone || '',
              counselling_preferred_time: p.counselling_preferred_time || 'Weekday Evenings (5 PM - 7 PM)'
            });
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    try {
      setSaving(true);
      const res = await fetch(getApiUrl('/api/student/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccessMsg('Your student admission profile has been successfully updated.');
        updateProfileState(formData as any);
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      alert('Error updating profile: ' + err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading student credentials and academic profile...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          My Student Profile & Academic Record
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your contact information, senior secondary credentials, and specialization preferences.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Contact and Basic Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Email cannot be modified once verified</span>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Mobile Contact Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Educational Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            Academic Background & Eligibility
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Current Education Level</label>
              <select
                value={formData.current_education}
                onChange={e => setFormData({ ...formData, current_education: e.target.value })}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              >
                <option value="12th Pursuing (Science PCM)">12th Pursuing (Science PCM)</option>
                <option value="12th Passed (Science PCM)">12th Passed (Science PCM)</option>
                <option value="3-Year Polytechnic Diploma (CSE/IT)">3-Year Polytechnic Diploma (CSE/IT)</option>
                <option value="Undergraduate Degree / Transfer">Undergraduate Degree / Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Passing Year</label>
              <select
                value={formData.class_12_passing_year}
                onChange={e => setFormData({ ...formData, class_12_passing_year: e.target.value })}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              >
                <option value="2026">2026 (Upcoming Intake)</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">12th PCM / Aggregate Percentage</label>
              <input
                type="number"
                step="0.1"
                value={formData.class_12_percentage}
                onChange={e => setFormData({ ...formData, class_12_percentage: e.target.value })}
                placeholder="e.g. 91.5"
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target B.Tech Program</label>
              <select
                value={formData.interested_program}
                onChange={e => setFormData({ ...formData, interested_program: e.target.value })}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              >
                <option value="B.Tech CSE (AI & ML)">B.Tech CSE (AI & ML)</option>
                <option value="B.Tech Data Science & Analytics">B.Tech Data Science & Analytics</option>
                <option value="B.Tech Software Engineering">B.Tech Software Engineering</option>
                <option value="NextGen Tech Immersion (Work-Integrated)">NextGen Tech Immersion (Work-Integrated)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Dream Career Role</label>
              <input
                type="text"
                value={formData.dream_career}
                onChange={e => setFormData({ ...formData, dream_career: e.target.value })}
                placeholder="e.g. AI Research Scientist"
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Parent & Guidance Preferences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            Parent Contact & Counselling Slot
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Parent / Guardian Name</label>
              <input
                type="text"
                value={formData.parent_name}
                onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                placeholder="e.g. Suresh Sharma"
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Parent Contact Number</label>
              <input
                type="tel"
                value={formData.parent_phone}
                onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="+91 98111 22000"
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Preferred Counselling Slot</label>
              <select
                value={formData.counselling_preferred_time}
                onChange={e => setFormData({ ...formData, counselling_preferred_time: e.target.value })}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
              >
                <option value="Weekday Evenings (5 PM - 7 PM)">Weekday Evenings (5 PM - 7 PM)</option>
                <option value="Weekday Afternoons (2 PM - 4 PM)">Weekday Afternoons (2 PM - 4 PM)</option>
                <option value="Weekend Mornings (10 AM - 12 PM)">Weekend Mornings (10 AM - 12 PM)</option>
                <option value="Weekend Afternoons (3 PM - 5 PM)">Weekend Afternoons (3 PM - 5 PM)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
