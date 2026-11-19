import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { EventItem, StudentProfile, ApplicationStage } from '../../types';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  Video,
  MapPin,
  FileText,
  UserCheck,
  X,
  Bell
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [counsellor, setCounsellor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Counselling Request Modal State
  const [showCounsellingModal, setShowCounsellingModal] = useState(false);
  const [counsellingForm, setCounsellingForm] = useState({
    preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    preferredTime: 'Weekday Evening (5 PM - 7 PM)',
    topic: 'Curriculum & AI Specialization Guidance',
    parentJoining: true
  });
  const [counsellingSuccess, setCounsellingSuccess] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setUpcomingEvents(data.upcomingEvents || []);
          setMyEvents(data.myEvents || []);
          setAnnouncements(data.announcements || []);
          setCounsellor(data.counsellor);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [token]);

  const handleRegisterEvent = async (eventId: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/student/events/${eventId}/register`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Confirmed seat reserved. Your ticket: ${data.ticketNumber}`);
        // Refresh dashboard
        const dashRes = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (dashRes.ok) {
          const d = await dashRes.json();
          setMyEvents(d.myEvents || []);
        }
      } else {
        alert(data.error || 'Failed to register');
      }
    } catch (err) {
      alert('Error registering for event: ' + err);
    }
  };

  const handleRequestCounselling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/student/counselling/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(counsellingForm)
      });
      if (res.ok) {
        setCounsellingSuccess(true);
        setTimeout(() => {
          setShowCounsellingModal(false);
          setCounsellingSuccess(false);
        }, 2500);
      }
    } catch (err) {
      alert('Error requesting counselling: ' + err);
    }
  };

  // 5-Stage Admission Progress Pipeline
  const currentStage: ApplicationStage = profile?.application_stage || 'INQUIRY';
  const stages: Array<{ id: ApplicationStage; label: string; desc: string }> = [
    { id: 'INQUIRY', label: '1. Inquiry & Profile', desc: 'Basic info verified' },
    { id: 'APPLICATION_STARTED', label: '2. Application', desc: 'Academic details' },
    { id: 'COUNSELLING_COMPLETED', label: '3. NSAT & Counselling', desc: 'Faculty guidance' },
    { id: 'DOCUMENT_VERIFIED', label: '4. Documents', desc: '10/12 verification' },
    { id: 'ADMITTED', label: '5. Seat Allocation', desc: 'Enrollment confirmed' }
  ];

  const getStageIndex = (stage: ApplicationStage) => {
    switch (stage) {
      case 'INQUIRY': return 0;
      case 'APPLICATION_STARTED': return 1;
      case 'APTITUDE_SCHEDULED': return 2;
      case 'COUNSELLING_COMPLETED': return 2;
      case 'DOCUMENT_VERIFIED': return 3;
      case 'SEAT_OFFERED': return 4;
      case 'ADMITTED': return 4;
      default: return 0;
    }
  };

  const activeIndex = getStageIndex(currentStage);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block rounded-md bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-blue-100 backdrop-blur-md">
            Prospective Student Portal • Batch 2026-30
          </span>
          <h1 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome to NIAT, {user?.name}!
          </h1>
          <p className="mt-1 text-xs text-blue-100 leading-relaxed">
            Your journey toward next-generation engineering starts here. Track your admission application milestones, attend masterclasses, or query our AI Assistant.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/student/ai-assistant"
              className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-blue-900 shadow-md hover:bg-blue-50 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              Ask NIAT AI Assistant
            </Link>

            <button
              onClick={() => setShowCounsellingModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500/30 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500/50 transition backdrop-blur-sm"
            >
              <PhoneCall className="h-4 w-4" />
              Book 1-on-1 Counselling
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 5-Step Admission Progress Pipeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Admission Progress Milestone Tracker
            </h3>
            <p className="text-[11px] text-slate-500">
              Current Program Interest: <strong className="text-blue-700">{profile?.interested_program || 'B.Tech CSE (AI & ML)'}</strong>
            </p>
          </div>
          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-bold">
            Stage {activeIndex + 1} of 5
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {stages.map((st, i) => {
            const isCompleted = i < activeIndex;
            const isCurrent = i === activeIndex;
            return (
              <div
                key={st.id}
                className={`p-3 rounded-xl border transition ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : isCurrent
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 shadow-sm ring-1 ring-blue-600/30'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                  <p className="font-bold text-xs truncate">{st.label}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 pl-5">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Upcoming Admission Events & Quick Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Upcoming Admission Events */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Admission Events & Masterclasses</h3>
            </div>
            <Link to="/student/calendar" className="text-xs font-semibold text-blue-600 hover:underline">
              View Calendar
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map(evt => {
              const isAlreadyRegistered = myEvents.some(m => m.id === evt.id);
              return (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5">
                        {evt.category}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {evt.event_date} • {evt.start_time}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      {evt.location_type === 'Online' ? (
                        <Video className="h-3 w-3 text-blue-600" />
                      ) : (
                        <MapPin className="h-3 w-3 text-rose-600" />
                      )}
                      <span>{evt.venue_or_link}</span>
                    </p>
                  </div>

                  <div>
                    {isAlreadyRegistered ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Seat Confirmed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegisterEvent(evt.id)}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                      >
                        Register Free
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (1 col): Assigned Counsellor & Announcements */}
        <div className="space-y-6">
          {/* Assigned Counsellor Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 border-b border-slate-100 pb-2 mb-3">
              Your NIAT Admission Counsellor
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-base">
                DR
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{counsellor?.name || 'Dr. Rajesh Rao'}</p>
                <p className="text-[11px] text-slate-500">{counsellor?.specialization || 'AI & Machine Learning Admissions'}</p>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">★ {counsellor?.rating || '4.9'} / 5.0 Rating</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <button
                onClick={() => setShowCounsellingModal(true)}
                className="w-full rounded-xl bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition shadow-sm text-center block"
              >
                Schedule Personal Session
              </button>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
              <Bell className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                Official Announcements
              </h3>
            </div>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="rounded bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5">
                    {a.type}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{a.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1-on-1 Counselling Booking Modal */}
      {showCounsellingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Book 1-on-1 Admission Counselling</h3>
              </div>
              <button onClick={() => setShowCounsellingModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {counsellingSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Counselling Session Scheduled!</h4>
                <p className="text-xs text-slate-500">
                  Your counsellor has received your request and will connect via Google Meet / Phone at your preferred slot.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestCounselling} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={counsellingForm.preferredDate}
                    onChange={e => setCounsellingForm({ ...counsellingForm, preferredDate: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Preferred Time Window</label>
                  <select
                    value={counsellingForm.preferredTime}
                    onChange={e => setCounsellingForm({ ...counsellingForm, preferredTime: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="Weekday Evening (5 PM - 7 PM)">Weekday Evening (5 PM - 7 PM)</option>
                    <option value="Weekday Afternoon (2 PM - 4 PM)">Weekday Afternoon (2 PM - 4 PM)</option>
                    <option value="Saturday Morning (10 AM - 12 PM)">Saturday Morning (10 AM - 12 PM)</option>
                    <option value="Saturday Afternoon (3 PM - 5 PM)">Saturday Afternoon (3 PM - 5 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Discussion Topic</label>
                  <input
                    type="text"
                    value={counsellingForm.topic}
                    onChange={e => setCounsellingForm({ ...counsellingForm, topic: e.target.value })}
                    placeholder="e.g. B.Tech CSE (AI & ML) eligibility or scholarship queries"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="parentJoin"
                    checked={counsellingForm.parentJoining}
                    onChange={e => setCounsellingForm({ ...counsellingForm, parentJoining: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="parentJoin" className="text-slate-700 cursor-pointer">
                    Parents/Guardians will join the counselling call
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCounsellingModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
