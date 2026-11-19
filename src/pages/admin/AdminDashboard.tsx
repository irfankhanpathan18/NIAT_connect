import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { AISummary, Lead, FollowUp, EventItem } from '../../types';
import {
  Users,
  Sparkles,
  CalendarCheck,
  Calendar,
  Flame,
  ArrowRight,
  TrendingUp,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  PhoneCall,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [recentHotLeads, setRecentHotLeads] = useState<Lead[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [sumRes, leadsRes, followRes, eventsRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/ai/summary'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/admin/leads?classification=Hot'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/admin/follow-ups?status=PENDING'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/admin/events'), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setRecentHotLeads((leadsData.leads || []).slice(0, 5));
      }
      if (followRes.ok) {
        const followData = await followRes.json();
        setUpcomingFollowUps((followData.followUps || []).slice(0, 4));
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setUpcomingEvents((eventsData.events || []).slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30">
              NIAT ADMISSION COMMAND CENTER
            </span>
            <span className="text-xs text-slate-400">• Fall 2026 Admissions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time pipeline monitoring, automated AI lead qualification, and institutional engagement metrics for NextGen Institute of Advanced Technology.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/leads?action=add"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
          >
            <UserPlus className="h-4 w-4" /> Add Lead
          </Link>
          <Link
            to="/admin/leads?action=import"
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4" /> Import CSV
          </Link>
          <Link
            to="/admin/ai-leads"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
          >
            <Sparkles className="h-4 w-4" /> AI Engine
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Admission Leads</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary?.totalLeads || 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Inbound</span>
            <Link to="/admin/leads" className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
              View CRM <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/30 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700">AI Hot Leads (Score 75-100)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">{summary?.hotLeads || 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-rose-600">
            <span>Ready for Counselling</span>
            <Link to="/admin/ai-leads?tab=Hot" className="font-semibold hover:underline flex items-center gap-0.5">
              Engage Now <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Warm Leads */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Warm Leads (Score 45-74)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800">{summary?.warmLeads || 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-amber-700">
            <span>Active Follow-up Queue</span>
            <Link to="/admin/ai-leads?tab=Warm" className="font-semibold hover:underline flex items-center gap-0.5">
              Review <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Admission Conversion Rate */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Conversion Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{summary?.conversionRate || '0.0'}%</p>
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-700">
            <span>Inquiry to Admitted</span>
            <Link to="/admin/analytics" className="font-semibold hover:underline flex items-center gap-0.5">
              Funnel Stats <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Hot Leads Alert & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Top AI Hot Leads Ready for Admission */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Priority AI Hot Leads</h2>
                <p className="text-[11px] text-slate-500">Highest-intent students identified by qualification engine</p>
              </div>
            </div>
            <Link
              to="/admin/ai-leads"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Full AI Pipeline <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Student</th>
                  <th className="py-2.5 px-3">Interested Program</th>
                  <th className="py-2.5 px-3">AI Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentHotLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No hot leads currently pending.
                    </td>
                  </tr>
                ) : (
                  recentHotLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{lead.student_name}</p>
                        <p className="text-[10px] text-slate-500">{lead.city}, {lead.state}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate">
                        {lead.interested_program}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                          🔥 {lead.lead_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {lead.counselling_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/leads?view=${lead.id}`}
                          className="rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition inline-block"
                        >
                          View Lead
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): Upcoming Follow-ups Today */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Upcoming Follow-ups</h2>
              </div>
              <Link to="/admin/follow-ups" className="text-xs font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingFollowUps.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pending follow-ups scheduled.</p>
              ) : (
                upcomingFollowUps.map(fu => (
                  <div key={fu.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{fu.student_name}</p>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {fu.scheduled_date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{fu.interested_program}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <PhoneCall className="h-3 w-3 text-slate-400" /> {fu.contact_method}
                      </span>
                      <span>Counsellor: {fu.counsellor_name || 'Dr. Rajesh Rao'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/admin/follow-ups"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Open Follow-up Queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Published Events & Fast Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Preview */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Published Admission Events</h2>
            </div>
            <Link to="/admin/events" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage Events
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upcomingEvents.map(evt => (
              <div key={evt.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] font-bold">
                    {evt.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{evt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {evt.event_date} • {evt.start_time}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-700 font-semibold">{evt.registrations_count || 0} Registered</span>
                  <span className="text-slate-500">{evt.location_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ethical AI and System Notice */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
              Verified Admission Assurance
            </h3>
          </div>
          <p className="text-xs text-blue-900 leading-relaxed">
            NIAT Connect enforces strict human-in-the-loop governance. AI scores serve purely to guide counsellor outreach priorities and never automatically disqualify or reject prospective applicants.
          </p>
          <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
            <span className="text-blue-800 font-semibold">Row Level Security Active</span>
            <Link to="/admin/knowledge-base" className="text-blue-700 font-bold hover:underline">
              Manage RAG Docs &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
