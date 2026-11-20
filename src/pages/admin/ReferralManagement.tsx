import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Gift,
  Search,
  Settings,
  ShieldCheck,
  Check,
  Save,
  Filter,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { AdminReferralItem } from '../../types';

export const ReferralManagement: React.FC = () => {
  const { token } = useAuth();
  const [referrals, setReferrals] = useState<AdminReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    points_distributed: 0,
    suspicious_count: 0
  });

  // Settings
  const [pointsPerReferral, setPointsPerReferral] = useState(25);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<AdminReferralItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Does not meet 12th class eligibility criteria.');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, [token]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/referrals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
        if (data.analytics) setAnalytics(data.analytics);
        if (data.points_per_referral) setPointsPerReferral(data.points_per_referral);
      }
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await fetch(`${API_BASE_URL}/admin/referrals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ points: pointsPerReferral })
      });
      if (res.ok) {
        fetchReferrals();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to approve referral');
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    try {
      setProcessingId(rejectingItem.id);
      const res = await fetch(`${API_BASE_URL}/admin/referrals/${rejectingItem.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setRejectingItem(null);
        fetchReferrals();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reject referral');
      }
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch(`${API_BASE_URL}/admin/referrals/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ points_per_referral: pointsPerReferral })
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchSearch = !searchQuery ||
      r.referred_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_phone.includes(searchQuery) ||
      r.referrer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2">
            <Gift className="w-3.5 h-3.5 text-blue-600" />
            <span>Admission CRM Expansion</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Student Referral & Rewards Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review prospective student leads submitted via student referral links, verify eligibility, and award reward points.
          </p>
        </div>

        {/* Global Config Card */}
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 self-start md:self-auto"
        >
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Points Per Referral
            </label>
            <input
              type="number"
              min="5"
              max="500"
              value={pointsPerReferral}
              onChange={e => setPointsPerReferral(parseInt(e.target.value, 10))}
              className="w-20 px-2 py-1 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={savingSettings}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            {settingsSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{settingsSuccess ? 'Saved' : 'Save'}</span>
          </button>
        </form>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Referrals</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 block">Approved & Credited</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{analytics.approved}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 block">Pending Review</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{analytics.pending}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 block">Rejected / Ineligible</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{analytics.rejected}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-indigo-600 block">Points Distributed</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{analytics.points_distributed} pts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-orange-600 block">Suspicious Activity</span>
          <div className="text-2xl font-bold text-orange-600 mt-1">{analytics.suspicious_count}</div>
        </div>
      </div>

      {/* Referral Table & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student, referrer, phone, code..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No referral records found matching current query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Referred Student</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Referrer (Student)</th>
                  <th className="py-3.5 px-4">Referral Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Points</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReferrals.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.referred_name}
                      <span className="block text-[10px] font-normal text-slate-400 font-mono">
                        {item.created_at ? item.created_at.split(' ')[0] : 'Today'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{item.referred_email}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{item.referred_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.referrer_name}</div>
                      <div className="text-[11px] text-slate-400">ID #{item.referrer_id} • {item.referrer_email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      {item.referral_code}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {item.points_awarded > 0 ? `+${item.points_awarded}` : '0'} pts
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={processingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingItem(item)}
                            disabled={processingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.verified_at ? `Verified ${item.verified_at.split(' ')[0]}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reject Referral #{rejectingItem.id}
            </h3>
            <p className="text-xs text-slate-500">
              Provide a reason for rejecting the referral for <strong>{rejectingItem.referred_name}</strong>. The referring student ({rejectingItem.referrer_name}) will be notified.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectingItem.id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
