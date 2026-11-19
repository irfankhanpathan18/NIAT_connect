import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { AnalyticsData } from '../../types';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Users,
  Award,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#0284c7', '#64748b'];

export const LeadAnalytics: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/api/admin/analytics'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const analyticsData = await res.json();
          setData(analyticsData);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Compiling admission analytics and performance models...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Admission Analytics & Performance Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time conversion funnels, channel yield analysis, and counsellor performance tracking.
        </p>
      </div>

      {/* Row 1: Lead Trend Area Chart & Classification Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                7-Day Inbound Lead Intake & AI Hot Leads
              </h3>
              <p className="text-[11px] text-slate-500">Daily prospective student velocity</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Total Inbound
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-500">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Hot Leads
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends || []}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="hotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Area type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#leadGrad)" />
                <Area type="monotone" dataKey="hot" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#hotGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Classification Donut Chart (1 Col) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              AI Qualification Segmentation
            </h3>
            <p className="text-[11px] text-slate-500">Proportion of Hot, Warm, Cold & Unqualified</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.classifications || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data?.classifications || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-100">
            {(data?.classifications || []).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 truncate">{c.name}: <strong>{c.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Conversion Funnel & Lead Source Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Admission Conversion Pipeline Funnel
              </h3>
              <p className="text-[11px] text-slate-500">Student progression from initial inquiry to admission</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Pipeline Health: High
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.funnel || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Lead Source Channel Performance
              </h3>
              <p className="text-[11px] text-slate-500">Inbound volume across marketing & outreach touchpoints</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sources || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="source" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Counsellor Leaderboard & Performance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Admission Counsellor Performance & Conversion Leaderboard
              </h3>
              <p className="text-[11px] text-slate-500">Caseload distribution, hot lead handling, and student conversion rate</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Counsellor</th>
                <th className="py-2.5 px-3">Specialization</th>
                <th className="py-2.5 px-3">Active Pipeline</th>
                <th className="py-2.5 px-3">Hot Leads Handled</th>
                <th className="py-2.5 px-3">Admitted Conversions</th>
                <th className="py-2.5 px-3 text-right">Student Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.counsellors || []).map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-3 text-slate-600">{c.specialization}</td>
                  <td className="py-3 px-3 font-semibold text-blue-700">{c.assigned_leads} leads</td>
                  <td className="py-3 px-3">
                    <span className="rounded-md bg-rose-50 text-rose-700 font-bold px-2 py-0.5 border border-rose-200">
                      🔥 {c.hot_leads}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{c.converted_leads} admitted</td>
                  <td className="py-3 px-3 text-right font-bold text-amber-600">★ {c.rating} / 5.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
