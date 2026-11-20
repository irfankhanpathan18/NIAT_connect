import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { EventItem, EventRegistration } from '../../types';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Users,
  Video,
  MapPin,
  Clock,
  ExternalLink,
  CheckCircle2,
  X,
  Eye,
  Radio,
  Download,
  Building2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const EventManager: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [attendeesModalEvent, setAttendeesModalEvent] = useState<EventItem | null>(null);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Hackathons',
    description: '',
    event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    start_time: '11:00 AM',
    end_time: '12:30 PM',
    location_type: 'Online' as 'Online' | 'Campus',
    venue_or_link: 'https://meet.google.com/niat-admissions',
    speaker_name: 'Dr. Arvind Swaminathan',
    speaker_title: 'Director of Admissions',
    capacity: 200,
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED',
    organizer: 'NIAT',
    registration_url: '',
    registration_deadline: '',
    eligibility_criteria: '',
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    is_featured: 0,
    source_verified: 'Verified Academic Committee'
  });

  const categories = [
    'Hackathons',
    'Big Tech Events',
    'AI and Machine Learning Events',
    'Coding Competitions',
    'Developer Conferences',
    'Technology Workshops',
    'Webinars',
    'Startup Events',
    'Innovation Challenges',
    'NIAT Admission Webinar',
    'Campus Orientation',
    'Parent Counselling Session'
  ];

  const fetchEvents = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/admin/events'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setForm({
      title: '',
      category: 'Hackathons',
      description: '',
      event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      start_time: '11:00 AM',
      end_time: '12:30 PM',
      location_type: 'Online',
      venue_or_link: 'https://meet.google.com/niat-admissions',
      speaker_name: 'Dr. Arvind Swaminathan',
      speaker_title: 'Director of Admissions',
      capacity: 200,
      status: 'PUBLISHED',
      organizer: 'NIAT',
      registration_url: '',
      registration_deadline: '',
      eligibility_criteria: '',
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      is_featured: 0,
      source_verified: 'Verified Academic Committee'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title,
      category: evt.category as string,
      description: evt.description,
      event_date: evt.event_date,
      start_time: evt.start_time,
      end_time: evt.end_time,
      location_type: evt.location_type,
      venue_or_link: evt.venue_or_link,
      speaker_name: evt.speaker_name || '',
      speaker_title: evt.speaker_title || '',
      capacity: evt.capacity,
      status: evt.status as any,
      organizer: evt.organizer || 'NIAT',
      registration_url: evt.registration_url || '',
      registration_deadline: evt.registration_deadline || '',
      eligibility_criteria: evt.eligibility_criteria || '',
      banner_url: evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      is_featured: evt.is_featured || 0,
      source_verified: evt.source_verified || 'Verified Academic Committee'
    });
    setShowModal(true);
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Delete this event? All student registrations will be removed.')) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/events/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      alert('Failed to delete event: ' + err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingEvent;
      const url = isEdit ? getApiUrl(`/api/admin/events/${editingEvent.id}`) : getApiUrl('/api/admin/events');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save event');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const viewAttendees = async (evt: EventItem) => {
    setAttendeesModalEvent(evt);
    try {
      setLoadingAttendees(true);
      const res = await fetch(getApiUrl(`/api/admin/events/${evt.id}/attendees`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
      }
    } catch (err) {
      console.error('Failed to load attendees:', err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Institutional & Big Tech Event Calendar Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create webinars, hackathons, and curate Big Tech public events (Google, NVIDIA, Microsoft).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No events scheduled. Click "Publish New Event" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Event Details</th>
                  <th className="py-3.5 px-4">Organizer</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Location / Link</th>
                  <th className="py-3.5 px-4">Registrations</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {evt.is_featured === 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-extrabold text-[9px] uppercase">
                            Featured
                          </span>
                        )}
                        <span>{evt.title}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold">{evt.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {evt.organizer || 'NIAT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {evt.event_date} <br />
                      <span className="text-[10px] text-slate-400">{evt.start_time}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-500">
                      {evt.venue_or_link}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => viewAttendees(evt)}
                        className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{evt.registrations_count || 0} / {evt.capacity}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingEvent ? 'Edit Event Details' : 'Publish New Event / Hackathon'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Google Cloud GenAI Hackathon 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Organizer</label>
                  <input
                    type="text"
                    required
                    value={form.organizer}
                    onChange={e => setForm({ ...form, organizer: e.target.value })}
                    placeholder="e.g. Google, NVIDIA, Microsoft, NIAT"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Location Type</label>
                  <select
                    value={form.location_type}
                    onChange={e => setForm({ ...form, location_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="Online">Online Webinar / Livestream</option>
                    <option value="Campus">Physical Campus Session</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Venue or Meeting Link</label>
                  <input
                    type="text"
                    required
                    value={form.venue_or_link}
                    onChange={e => setForm({ ...form, venue_or_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Official Registration Link (Optional)</label>
                  <input
                    type="url"
                    value={form.registration_url}
                    onChange={e => setForm({ ...form, registration_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Registration Deadline (Optional)</label>
                  <input
                    type="date"
                    value={form.registration_deadline}
                    onChange={e => setForm({ ...form, registration_deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={form.eligibility_criteria}
                  onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })}
                  placeholder="e.g. Open to all Class 12 and B.Tech candidates"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_featured === 1}
                    onChange={e => setForm({ ...form, is_featured: e.target.checked ? 1 : 0 })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mark as Featured Event</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {attendeesModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registered Attendees ({attendees.length})
                </h3>
                <p className="text-xs text-slate-500 truncate">{attendeesModalEvent.title}</p>
              </div>
              <button
                onClick={() => setAttendeesModalEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              {attendees.map(a => (
                <div key={a.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{a.student_name}</div>
                    <div className="text-[11px] text-slate-400">{a.student_email} • {a.student_phone}</div>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {a.ticket_number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
