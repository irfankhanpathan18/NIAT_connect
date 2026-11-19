import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { Lead, AISummary } from '../../types';
import {
  Sparkles,
  Flame,
  TrendingUp,
  Snowflake,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Sliders,
  CheckCircle2,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

export const AILeadFiltration: React.FC = () => {
  const { token, user } = useAuth();
  const location = useLocation();

  const [summary, setSummary] = useState<AISummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Hot' | 'Warm' | 'Cold' | 'Unqualified'>('All');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // Manual Override Modal State
  const [selectedLeadForOverride, setSelectedLeadForOverride] = useState<Lead | null>(null);
  const [newClassification, setNewClassification] = useState<'Hot' | 'Warm' | 'Cold' | 'Unqualified'>('Hot');
  const [newScore, setNewScore] = useState<number>(85);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [savingOverride, setSavingOverride] = useState(false);

  // Score Factor Criteria Inspection Modal
  const [inspectedLead, setInspectedLead] = useState<Lead | null>(null);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [sumRes, leadsRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/ai/summary'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl(`/api/admin/leads?classification=${activeTab}`), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }
    } catch (err) {
      console.error('Failed to load AI filtration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tabParam = query.get('tab') as any;
    if (tabParam && ['Hot', 'Warm', 'Cold', 'Unqualified'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  const handleRecalculateAll = async () => {
    if (!window.confirm('Recalculate AI Lead Scores for all prospective students? Note: Human manually overridden scores will be preserved.')) return;
    try {
      setRecalculating(true);
      const res = await fetch(getApiUrl('/api/admin/ai/re-evaluate'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      }
    } catch (err) {
      alert('Recalculation error: ' + err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenOverride = (lead: Lead) => {
    setSelectedLeadForOverride(lead);
    setNewClassification(lead.ai_classification || 'Warm');
    setNewScore(lead.lead_score || 50);
    setOverrideReason(lead.override_reason || '');
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForOverride) return;

    if (!overrideReason.trim()) {
      alert('Please enter a documented justification reason for the human override.');
      return;
    }

    try {
      setSavingOverride(true);
      const res = await fetch(getApiUrl(`/api/admin/ai/override/${selectedLeadForOverride.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newScore,
          newClassification,
          overrideReason: overrideReason.trim()
        })
      });

      if (res.ok) {
        setSelectedLeadForOverride(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save override');
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold border border-amber-200">
              CORE ADMISSION INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            AI-Powered Lead Filtration Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Intelligent algorithmic qualification, intent scoring (0–100), and transparent prospective student segmentation.
          </p>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={recalculating}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Evaluating All Leads...' : 'Batch Re-evaluate Engine'}
        </button>
      </div>

      {/* Mandatory Institutional Ethical AI Policy Banner */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-white p-4 shadow-sm flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
            Mandatory Institutional Review & Non-Rejection Protocol
          </h4>
          <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
            <strong>Important:</strong> Never automatically reject or disqualify students based solely on AI predictions. All eligibility decisions must adhere to verified official NIAT admission criteria and require documented human review. AI scores exclusively optimize counsellor follow-up prioritization.
          </p>
        </div>
      </div>

      {/* AI Segmentation Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Evaluated */}
        <div
          onClick={() => setActiveTab('All')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'All'
              ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Evaluated</span>
            <Sliders className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary?.totalLeads || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">100% Inbound Scored</p>
        </div>

        {/* Hot Leads */}
        <div
          onClick={() => setActiveTab('Hot')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'Hot'
              ? 'border-rose-600 bg-rose-50/50 shadow-md ring-2 ring-rose-600/20'
              : 'border-rose-200 bg-white hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-700 font-bold">
            <span>Hot Leads</span>
            <Flame className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">{summary?.hotLeads || 0}</p>
          <p className="text-[10px] text-rose-600 mt-1">Score: 75 – 100</p>
        </div>

        {/* Warm Leads */}
        <div
          onClick={() => setActiveTab('Warm')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'Warm'
              ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-600/20'
              : 'border-amber-200 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold">
            <span>Warm Leads</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800">{summary?.warmLeads || 0}</p>
          <p className="text-[10px] text-amber-700 mt-1">Score: 45 – 74</p>
        </div>

        {/* Cold Leads */}
        <div
          onClick={() => setActiveTab('Cold')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'Cold'
              ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-600/20'
              : 'border-sky-200 bg-white hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-700 font-bold">
            <span>Cold Leads</span>
            <Snowflake className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-800">{summary?.coldLeads || 0}</p>
          <p className="text-[10px] text-sky-700 mt-1">Score: 20 – 44</p>
        </div>

        {/* Unqualified Leads */}
        <div
          onClick={() => setActiveTab('Unqualified')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'Unqualified'
              ? 'border-slate-800 bg-slate-100 shadow-md ring-2 ring-slate-800/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
            <span>Unqualified</span>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-700">{summary?.unqualifiedLeads || 0}</p>
          <p className="text-[10px] text-slate-500 mt-1">Score: 0 – 19</p>
        </div>
      </div>

      {/* Segment Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['All', 'Hot', 'Warm', 'Cold', 'Unqualified'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'Hot' && '🔥 '}
            {tab === 'Warm' && '⚡ '}
            {tab === 'Cold' && '❄️ '}
            {tab} Leads
          </button>
        ))}
      </div>

      {/* Segmented Leads Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Target Program</th>
                <th className="py-3 px-4">AI Score & Factor Meter</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Human Override</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Evaluating lead factors...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leads in the {activeTab} segment.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{lead.student_name}</p>
                      <p className="text-[10px] text-slate-500">{lead.email}</p>
                      <p className="text-[10px] text-slate-400">{lead.city}, {lead.state}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{lead.interested_program}</p>
                      <p className="text-[10px] text-slate-500">{lead.current_education}</p>
                    </td>

                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{lead.lead_score || 50}/100</span>
                        <button
                          onClick={() => setInspectedLead(lead)}
                          className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          <Info className="h-3 w-3" /> Breakdown
                        </button>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (lead.lead_score || 0) >= 75
                              ? 'bg-rose-500'
                              : (lead.lead_score || 0) >= 45
                              ? 'bg-amber-500'
                              : (lead.lead_score || 0) >= 20
                              ? 'bg-sky-400'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${lead.lead_score || 50}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          lead.ai_classification === 'Hot'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : lead.ai_classification === 'Warm'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : lead.ai_classification === 'Cold'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {lead.ai_classification === 'Hot' && '🔥'}
                        {lead.ai_classification === 'Warm' && '⚡'}
                        {lead.ai_classification === 'Cold' && '❄️'}
                        {lead.ai_classification}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {lead.is_manually_overridden === 1 ? (
                        <div>
                          <span className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[10px] font-bold">
                            Human Verified
                          </span>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={lead.override_reason || ''}>
                            {lead.override_reason}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Algorithmic</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {lead.counselling_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenOverride(lead)}
                        className="rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="h-3 w-3" /> Override
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {selectedLeadForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Manual AI Classification Override</h3>
              </div>
              <button
                onClick={() => setSelectedLeadForOverride(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">{selectedLeadForOverride.student_name}</p>
                <p className="text-[11px] text-slate-500">{selectedLeadForOverride.interested_program}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Current AI Evaluation: {selectedLeadForOverride.ai_classification} ({selectedLeadForOverride.lead_score}/100)
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Assigned Classification:
                </label>
                <select
                  value={newClassification}
                  onChange={e => {
                    const val = e.target.value as any;
                    setNewClassification(val);
                    if (val === 'Hot') setNewScore(85);
                    else if (val === 'Warm') setNewScore(60);
                    else if (val === 'Cold') setNewScore(35);
                    else setNewScore(15);
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                >
                  <option value="Hot">🔥 Hot Lead (Priority Admission Follow-up)</option>
                  <option value="Warm">⚡ Warm Lead (Needs Course Exploration)</option>
                  <option value="Cold">❄️ Cold Lead (Passive / Non-Urgent)</option>
                  <option value="Unqualified">Unqualified (Outside Academic Criteria)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-slate-700">Custom Quality Score (0–100):</label>
                  <span className="font-bold text-blue-700">{newScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newScore}
                  onChange={e => setNewScore(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Documented Reviewer Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Explain why this student was manually re-classified (e.g. Student demonstrated exceptional national hackathon award or requested direct campus visit with family)..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForOverride(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingOverride ? 'Saving...' : 'Apply Human Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Factor Breakdown Inspection Modal */}
      {inspectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  AI Lead Scoring Factor Analysis
                </h3>
              </div>
              <button onClick={() => setInspectedLead(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{inspectedLead.student_name}</h4>
                  <p className="text-[11px] text-slate-500">{inspectedLead.interested_program}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-700">{inspectedLead.lead_score}/100</span>
                  <p className="text-[10px] text-slate-400 font-semibold">{inspectedLead.ai_classification} Segment</p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-slate-800 text-xs">Weighted Scoring Criteria:</h5>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">1. Admission Interest Level</p>
                      <p className="text-[10px] text-slate-500">Student intent: {inspectedLead.admission_interest_level}</p>
                    </div>
                    <span className="font-bold text-blue-600">Max 30 pts</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">2. Academic Year & Timeline Urgency</p>
                      <p className="text-[10px] text-slate-500">Class 12 Passing: {inspectedLead.class_12_passing_year}</p>
                    </div>
                    <span className="font-bold text-blue-600">Max 20 pts</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">3. Counselling & Interaction Stage</p>
                      <p className="text-[10px] text-slate-500">Current status: {inspectedLead.counselling_status}</p>
                    </div>
                    <span className="font-bold text-blue-600">Max 20 pts</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">4. Inbound Source Quality</p>
                      <p className="text-[10px] text-slate-500">Channel: {inspectedLead.lead_source}</p>
                    </div>
                    <span className="font-bold text-blue-600">Max 15 pts</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">5. Program & Eligibility Alignment</p>
                      <p className="text-[10px] text-slate-500">{inspectedLead.current_education}</p>
                    </div>
                    <span className="font-bold text-blue-600">Max 15 pts</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectedLead(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
