import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { Lead, Counsellor, LeadActivity, FollowUp } from '../../types';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  X,
  Flame,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const LeadManagement: React.FC = () => {
  const { token, user } = useAuth();
  const location = useLocation();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [counsellorFilter, setCounsellorFilter] = useState('All');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [leadFollowUps, setLeadFollowUps] = useState<FollowUp[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    phone: '',
    current_education: '12th Pursuing (Science PCM)',
    class_12_passing_year: '2026',
    city: '',
    state: '',
    interested_program: 'B.Tech CSE (AI & ML)',
    lead_source: 'Website',
    admission_interest_level: 'High',
    counselling_status: 'New',
    assigned_counsellor_id: '1',
    follow_up_date: '',
    notes: ''
  });

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchLeads = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (classificationFilter !== 'All') params.append('classification', classificationFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (sourceFilter !== 'All') params.append('source', sourceFilter);
      if (counsellorFilter !== 'All') params.append('counsellor_id', counsellorFilter);

      const [leadsRes, counsRes] = await Promise.all([
        fetch(getApiUrl(`/api/admin/leads?${params.toString()}`), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/admin/counsellors'), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (counsRes.ok) {
        const data = await counsRes.json();
        setCounsellors(data.counsellors || []);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token, classificationFilter, statusFilter, sourceFilter, counsellorFilter]);

  // Handle URL query actions (e.g. ?action=add or ?view=1)
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('action') === 'add') setShowAddModal(true);
    if (query.get('action') === 'import') setShowImportModal(true);
    const viewId = query.get('view');
    if (viewId && leads.length > 0) {
      const match = leads.find(l => l.id === parseInt(viewId, 10));
      if (match) viewLeadDetails(match);
    }
  }, [location.search, leads]);

  const viewLeadDetails = async (lead: Lead) => {
    setSelectedLead(lead);
    try {
      const res = await fetch(getApiUrl(`/api/admin/leads/${lead.id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedLead(data.lead);
        setLeadActivities(data.activities || []);
        setLeadFollowUps(data.followUps || []);
      }
    } catch (err) {
      console.error('Error fetching lead details:', err);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this admission lead?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/leads/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selectedLead?.id === id) setSelectedLead(null);
      }
    } catch (err) {
      alert('Failed to delete lead: ' + err);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingLead;
      const url = isEdit ? getApiUrl(`/api/admin/leads/${editingLead.id}`) : getApiUrl('/api/admin/leads');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowAddModal(false);
        setEditingLead(null);
        fetchLeads();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save lead');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      student_name: lead.student_name,
      email: lead.email,
      phone: lead.phone,
      current_education: lead.current_education,
      class_12_passing_year: String(lead.class_12_passing_year),
      city: lead.city,
      state: lead.state,
      interested_program: lead.interested_program,
      lead_source: lead.lead_source,
      admission_interest_level: lead.admission_interest_level,
      counselling_status: lead.counselling_status,
      assigned_counsellor_id: String(lead.assigned_counsellor_id || 1),
      follow_up_date: lead.follow_up_date || '',
      notes: lead.notes || ''
    });
    setShowAddModal(true);
  };

  const parseCsvText = (text: string) => {
    setCsvRawText(text);
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setCsvPreview([]);
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
    const parsed = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        if (h.includes('name')) obj.student_name = cols[idx];
        else if (h.includes('email')) obj.email = cols[idx];
        else if (h.includes('phone')) obj.phone = cols[idx];
        else if (h.includes('education')) obj.current_education = cols[idx];
        else if (h.includes('year')) obj.class_12_passing_year = cols[idx];
        else if (h.includes('city')) obj.city = cols[idx];
        else if (h.includes('state')) obj.state = cols[idx];
        else if (h.includes('program') || h.includes('course')) obj.interested_program = cols[idx];
        else if (h.includes('source')) obj.lead_source = cols[idx];
        else if (h.includes('interest')) obj.admission_interest_level = cols[idx];
        else if (h.includes('status')) obj.counselling_status = cols[idx];
      });
      if (obj.student_name && obj.email) {
        parsed.push(obj);
      }
    }
    setCsvPreview(parsed);
  };

  const handleExecuteCsvImport = async () => {
    if (csvPreview.length === 0) return;
    try {
      setImportStatus('Importing and running AI lead qualification...');
      const res = await fetch(getApiUrl('/api/admin/leads/import-csv'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leads: csvPreview })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowImportModal(false);
        setCsvPreview([]);
        setCsvRawText('');
        fetchLeads();
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (err) {
      alert('Error during import: ' + err);
    } finally {
      setImportStatus(null);
    }
  };

  const handleExportCsv = () => {
    window.open(getApiUrl('/api/admin/leads-export/csv'), '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Lead Management CRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized prospective student database with AI qualification scoring and activity history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingLead(null);
              setFormData({
                student_name: '',
                email: '',
                phone: '',
                current_education: '12th Pursuing (Science PCM)',
                class_12_passing_year: '2026',
                city: '',
                state: '',
                interested_program: 'B.Tech CSE (AI & ML)',
                lead_source: 'Direct Outreach',
                admission_interest_level: 'High',
                counselling_status: 'New',
                assigned_counsellor_id: '1',
                follow_up_date: '',
                notes: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Upload className="h-4 w-4 text-slate-500" /> Import CSV
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Live Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchLeads(); }}
              placeholder="Search by student name, email, phone, city..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Classification Filter */}
          <div>
            <select
              value={classificationFilter}
              onChange={e => setClassificationFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-blue-600"
            >
              <option value="All">All AI Classifications</option>
              <option value="Hot">🔥 Hot Leads (75-100)</option>
              <option value="Warm">⚡ Warm Leads (45-74)</option>
              <option value="Cold">❄️ Cold Leads (20-44)</option>
              <option value="Unqualified">Unqualified (&lt; 20)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-blue-600"
            >
              <option value="All">All Counselling Statuses</option>
              <option value="New">New Inquiry</option>
              <option value="Contacted">Contacted</option>
              <option value="Counselling Scheduled">Counselling Scheduled</option>
              <option value="Counselling Completed">Counselling Completed</option>
              <option value="Documents Pending">Documents Pending</option>
              <option value="Admitted">Admitted</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-blue-600"
            >
              <option value="All">All Lead Sources</option>
              <option value="Website">Website</option>
              <option value="Webinar">Webinar</option>
              <option value="Education Fair">Education Fair</option>
              <option value="Referral">Referral</option>
              <option value="Campus Visit">Campus Visit</option>
              <option value="Direct Outreach">Direct Outreach</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main CRM Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Contact</th>
                <th className="py-3 px-4">Program & Education</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Counsellor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading admission records...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leads match your current query or filters.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{lead.student_name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-400" /> {lead.email}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {lead.phone}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{lead.interested_program}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lead.current_education} (Pass: {lead.class_12_passing_year})
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {lead.city}, {lead.state}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {lead.lead_score || 50}/100
                        </span>
                      </div>
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (lead.lead_score || 0) >= 75
                              ? 'bg-rose-500'
                              : (lead.lead_score || 0) >= 45
                              ? 'bg-amber-500'
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
                        {lead.ai_classification || 'Warm'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {lead.counselling_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-medium">{lead.counsellor_name || 'Dr. Rajesh Rao'}</p>
                      <p className="text-[10px] text-slate-400">{lead.lead_source}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => viewLeadDetails(lead)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(lead)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-slate-100 transition"
                        title="Edit Lead"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingLead ? 'Edit Admission Lead' : 'Add New Admission Lead'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingLead(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">Current Education</label>
                  <select
                    value={formData.current_education}
                    onChange={e => setFormData({ ...formData, current_education: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="12th Pursuing (Science PCM)">12th Pursuing (Science PCM)</option>
                    <option value="12th Passed (Science PCM)">12th Passed (Science PCM)</option>
                    <option value="Diploma in Computer Engineering">Diploma in Computer Engineering</option>
                    <option value="Other / Non-Engineering">Other / Non-Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Passing Year</label>
                  <select
                    value={formData.class_12_passing_year}
                    onChange={e => setFormData({ ...formData, class_12_passing_year: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="2026">2026 (Upcoming Batch)</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Interested Course/Program</label>
                <select
                  value={formData.interested_program}
                  onChange={e => setFormData({ ...formData, interested_program: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                >
                  <option value="B.Tech CSE (AI & ML)">B.Tech CSE (AI & ML)</option>
                  <option value="B.Tech Data Science & Analytics">B.Tech Data Science & Analytics</option>
                  <option value="B.Tech Software Engineering">B.Tech Software Engineering</option>
                  <option value="NextGen Tech Immersion (Work-Integrated)">NextGen Tech Immersion (Work-Integrated)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700">Source</label>
                  <select
                    value={formData.lead_source}
                    onChange={e => setFormData({ ...formData, lead_source: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="Website">Website</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Education Fair">Education Fair</option>
                    <option value="Referral">Referral</option>
                    <option value="Campus Visit">Campus Visit</option>
                    <option value="Direct Outreach">Direct Outreach</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Interest</label>
                  <select
                    value={formData.admission_interest_level}
                    onChange={e => setFormData({ ...formData, admission_interest_level: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Status</label>
                  <select
                    value={formData.counselling_status}
                    onChange={e => setFormData({ ...formData, counselling_status: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Counselling Scheduled">Counselling Scheduled</option>
                    <option value="Counselling Completed">Counselling Completed</option>
                    <option value="Documents Pending">Documents Pending</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Assigned Counsellor</label>
                <select
                  value={formData.assigned_counsellor_id}
                  onChange={e => setFormData({ ...formData, assigned_counsellor_id: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                >
                  {counsellors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Additional Counsellor Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes from initial interaction or student questions..."
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingLead(null); }}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  {editingLead ? 'Update Lead' : 'Save & Score Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Batch Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Batch Import Leads via CSV</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <p className="font-semibold">CSV Column Requirements:</p>
                <p className="mt-0.5 text-[11px] text-blue-700">
                  Header must include: <code>student_name, email, phone, current_education, class_12_passing_year, city, state, interested_program, lead_source, admission_interest_level</code>
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Paste Raw CSV Data or Choose File:
                </label>
                <textarea
                  rows={5}
                  value={csvRawText}
                  onChange={e => parseCsvText(e.target.value)}
                  placeholder={`student_name,email,phone,current_education,class_12_passing_year,city,state,interested_program,lead_source,admission_interest_level
Siddharth Rao,siddharth.rao@example.com,+91 98888 77777,12th Pursuing (Science PCM),2026,Hyderabad,Telangana,B.Tech CSE (AI & ML),Education Fair,High
Aarav Gupta,aarav.gupta@example.com,+91 97777 66666,12th Passed,2025,Bengaluru,Karnataka,B.Tech Data Science & Analytics,Webinar,Medium`}
                  className="w-full font-mono rounded-xl bg-slate-50 border border-slate-300 p-3 text-slate-900 focus:bg-white"
                />
              </div>

              {csvPreview.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-800 mb-1">
                    Preview ({csvPreview.length} leads detected):
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Program</th>
                          <th className="p-2">City</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{item.student_name}</td>
                            <td className="p-2 text-slate-600">{item.email}</td>
                            <td className="p-2 text-slate-600">{item.phone}</td>
                            <td className="p-2 text-slate-600">{item.interested_program}</td>
                            <td className="p-2 text-slate-600">{item.city}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const sample = `student_name,email,phone,current_education,class_12_passing_year,city,state,interested_program,lead_source,admission_interest_level\nManasvi Singh,manasvi.singh@example.com,+91 98999 11111,12th Pursuing (Science PCM),2026,Pune,Maharashtra,B.Tech CSE (AI & ML),Webinar,High\nDevansh Nair,devansh.nair@example.com,+91 98777 22222,12th Passed,2025,Chennai,Tamil Nadu,B.Tech Software Engineering,Website,Medium`;
                    parseCsvText(sample);
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Load Sample CSV Template
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={csvPreview.length === 0 || !!importStatus}
                    onClick={handleExecuteCsvImport}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {importStatus || `Import & AI Score (${csvPreview.length}) Leads`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Lead Profile Slide-Over Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                  {selectedLead.student_name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{selectedLead.student_name}</h3>
                  <p className="text-[11px] text-blue-300">Admission Candidate ID: #{selectedLead.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* AI Scorecard Card */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-700" />
                    <span className="font-bold text-blue-900 uppercase tracking-wide text-[11px]">
                      AI Lead Qualification Engine
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                      selectedLead.ai_classification === 'Hot'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedLead.ai_classification === 'Warm'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {selectedLead.ai_classification} Lead
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {selectedLead.lead_score || 50}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ 100 Quality Score</span>
                </div>

                {selectedLead.breakdown && selectedLead.breakdown.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200/60 space-y-2">
                    <p className="font-semibold text-slate-700 text-[11px]">Score Factor Rationale:</p>
                    {selectedLead.breakdown.map((item, i) => (
                      <div key={i} className="flex items-start justify-between text-[11px] bg-white/70 p-2 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-800">{item.factor}</p>
                          <p className="text-[10px] text-slate-500">{item.rationale}</p>
                        </div>
                        <span className="font-bold text-blue-700">+{item.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Academic & Contact Details */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                  Student Profile & Educational Credentials
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="font-medium text-slate-900">{selectedLead.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone Number</span>
                    <span className="font-medium text-slate-900">{selectedLead.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <span className="font-medium text-slate-900">{selectedLead.city}, {selectedLead.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">12th Passing Year</span>
                    <span className="font-medium text-slate-900">{selectedLead.class_12_passing_year}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Current Education</span>
                    <span className="font-medium text-slate-900">{selectedLead.current_education}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Target Program</span>
                    <span className="font-bold text-blue-700">{selectedLead.interested_program}</span>
                  </div>
                </div>
              </div>

              {/* Counsellor Notes */}
              {selectedLead.notes && (
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-xs mb-1">Counselling Remarks & Notes:</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{selectedLead.notes}</p>
                </div>
              )}

              {/* Activity History Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Engagement & CRM Timeline</h4>
                <div className="space-y-2.5 border-l-2 border-slate-200 pl-3 ml-2">
                  {leadActivities.length === 0 ? (
                    <p className="text-slate-400 text-[11px]">No activity history logged yet.</p>
                  ) : (
                    leadActivities.map(act => (
                      <div key={act.id} className="relative text-[11px]">
                        <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                        <p className="font-medium text-slate-800">{act.description}</p>
                        <span className="text-[10px] text-slate-400">
                          {act.performed_by} • {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => handleOpenEdit(selectedLead)}
                className="rounded-xl border border-slate-300 px-3.5 py-2 font-semibold text-slate-700 hover:bg-white"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
