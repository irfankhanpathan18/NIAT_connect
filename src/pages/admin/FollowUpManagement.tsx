import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { FollowUp, Counsellor, Lead } from '../../types';
import {
  CalendarCheck,
  Plus,
  Phone,
  Mail,
  Video,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  MessageSquare,
  Search
} from 'lucide-react';

export const FollowUpManagement: React.FC = () => {
  const { token, user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // New Follow-up Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    lead_id: '',
    counsellor_id: '1',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '11:00 AM',
    contact_method: 'Phone',
    outcome_notes: ''
  });

  // Complete Follow-up Modal
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [followRes, counsRes, leadsRes] = await Promise.all([
        fetch(getApiUrl(`/api/admin/follow-ups?status=${statusFilter}`), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/admin/counsellors'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/admin/leads'), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (followRes.ok) {
        const data = await followRes.json();
        setFollowUps(data.followUps || []);
      }
      if (counsRes.ok) {
        const cData = await counsRes.json();
        setCounsellors(cData.counsellors || []);
      }
      if (leadsRes.ok) {
        const lData = await leadsRes.json();
        setLeads(lData.leads || []);
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, statusFilter]);

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUp.lead_id) {
      alert('Please select a student lead.');
      return;
    }
    try {
      const res = await fetch(getApiUrl('/api/admin/follow-ups'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newFollowUp)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewFollowUp({
          lead_id: '',
          counsellor_id: '1',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '11:00 AM',
          contact_method: 'Phone',
          outcome_notes: ''
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to schedule follow-up');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowUp) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/follow-ups/${completingFollowUp.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          outcome_notes: outcomeNotes
        })
      });
      if (res.ok) {
        setCompletingFollowUp(null);
        setOutcomeNotes('');
        fetchData();
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-blue-600" />
            Counselling & Follow-up Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize prospective student phone calls, video counselling sessions, and reminder schedules.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Schedule Follow-up
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['PENDING', 'COMPLETED', 'All'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === s
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {s === 'PENDING' ? 'Upcoming & Overdue' : s === 'COMPLETED' ? 'Completed Sessions' : 'All Follow-ups'}
          </button>
        ))}
      </div>

      {/* Follow-up Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">
            Loading follow-up queue...
          </div>
        ) : followUps.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-300 p-8">
            No follow-up items found under "{statusFilter}".
          </div>
        ) : (
          followUps.map(fu => (
            <div
              key={fu.id}
              className={`rounded-2xl border p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                fu.status === 'COMPLETED'
                  ? 'border-emerald-200/80 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      fu.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {fu.status}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {fu.scheduled_date} • {fu.scheduled_time || '11:00 AM'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2.5">{fu.student_name}</h4>
                <p className="text-xs text-slate-500 line-clamp-1">{fu.interested_program}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">{fu.student_phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{fu.student_email}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Assigned: <strong>{fu.counsellor_name || 'Dr. Rajesh Rao'}</strong> ({fu.contact_method})
                  </p>
                </div>

                {fu.outcome_notes && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Notes:</span> {fu.outcome_notes}
                  </div>
                )}
              </div>

              {fu.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`tel:${fu.student_phone}`}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" /> Call Student
                  </a>
                  <button
                    onClick={() => {
                      setCompletingFollowUp(fu);
                      setOutcomeNotes('');
                    }}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Mark Done
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Schedule Follow-up Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Schedule Follow-up Counselling</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Prospective Student *</label>
                <select
                  required
                  value={newFollowUp.lead_id}
                  onChange={e => setNewFollowUp({ ...newFollowUp, lead_id: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                >
                  <option value="">-- Choose student lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.student_name} ({l.city} - {l.interested_program})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={newFollowUp.scheduled_date}
                    onChange={e => setNewFollowUp({ ...newFollowUp, scheduled_date: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={newFollowUp.scheduled_time}
                    onChange={e => setNewFollowUp({ ...newFollowUp, scheduled_time: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Method</label>
                  <select
                    value={newFollowUp.contact_method}
                    onChange={e => setNewFollowUp({ ...newFollowUp, contact_method: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="Phone">Phone Call</option>
                    <option value="Video Call">Video Call (Google Meet)</option>
                    <option value="Campus Visit">Campus Visit Meeting</option>
                    <option value="WhatsApp">WhatsApp Guidance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Counsellor</label>
                  <select
                    value={newFollowUp.counsellor_id}
                    onChange={e => setNewFollowUp({ ...newFollowUp, counsellor_id: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    {counsellors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Pre-Counselling Agenda / Remarks</label>
                <textarea
                  rows={2}
                  value={newFollowUp.outcome_notes}
                  onChange={e => setNewFollowUp({ ...newFollowUp, outcome_notes: e.target.value })}
                  placeholder="e.g. Inquire regarding 12th pre-board results and explain AI curriculum..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Follow-up Modal */}
      {completingFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Mark Follow-up as Completed</h3>
              <button onClick={() => setCompletingFollowUp(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteFollowUp} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">{completingFollowUp.student_name}</p>
                <p className="text-[11px] text-slate-500">{completingFollowUp.student_phone}</p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Outcome & Counselling Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={outcomeNotes}
                  onChange={e => setOutcomeNotes(e.target.value)}
                  placeholder="Summarize the outcome: student response, fee structure explained, scheduled for NSAT, document verification status..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingFollowUp(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-emerald-700"
                >
                  Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
