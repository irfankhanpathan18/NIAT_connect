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
  Download
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
    category: 'NIAT Admission Webinar',
    description: '',
    event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    start_time: '11:00 AM',
    end_time: '12:30 PM',
    location_type: 'Online' as 'Online' | 'Campus',
    venue_or_link: 'https://meet.google.com/niat-admissions',
    speaker_name: 'Dr. Arvind Swaminathan',
    speaker_title: 'Director of Admissions',
    capacity: 200,
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED'
  });

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
      category: 'NIAT Admission Webinar',
      description: '',
      event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      start_time: '11:00 AM',
      end_time: '12:30 PM',
      location_type: 'Online',
      venue_or_link: 'https://meet.google.com/niat-admissions',
      speaker_name: 'Dr. Arvind Swaminathan',
      speaker_title: 'Director of Admissions',
      capacity: 200,
      status: 'PUBLISHED'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title,
      category: evt.category,
      description: evt.description,
      event_date: evt.event_date,
      start_time: evt.start_time,
      end_time: evt.end_time,
      location_type: evt.location_type,
      venue_or_link: evt.venue_or_link,
      speaker_name: evt.speaker_name || '',
      speaker_title: evt.speaker_title || '',
      capacity: evt.capacity,
      status: evt.status as any
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
            Institutional Event & Webinar Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish admission webinars, masterclasses, and open-house sessions that automatically appear on student portals.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Create Institutional Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">
            Loading events directory...
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-300 p-8">
            No events scheduled. Click "Create Institutional Event" to add one.
          </div>
        ) : (
          events.map(evt => (
            <div
              key={evt.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {evt.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      evt.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-2 leading-snug">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{evt.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{evt.event_date}</span>
                    <span className="text-slate-400">•</span>
                    <span>{evt.start_time} - {evt.end_time}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {evt.location_type === 'Online' ? (
                      <Video className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    )}
                    <span className="truncate">{evt.venue_or_link}</span>
                  </div>

                  {evt.speaker_name && (
                    <p className="text-[11px] text-slate-500 pt-1">
                      Speaker: <strong className="text-slate-700">{evt.speaker_name}</strong> ({evt.speaker_title})
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => viewAttendees(evt)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>{evt.registrations_count || 0} / {evt.capacity} Registered</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition"
                    title="Edit Event"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEvent ? 'Edit Institutional Event' : 'Create New Institutional Event'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. NIAT National Admission Webinar 2026"
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="NIAT Admission Webinar">NIAT Admission Webinar</option>
                    <option value="Campus Orientation">Campus Orientation</option>
                    <option value="Parent Counselling Session">Parent Counselling Session</option>
                    <option value="Admission Guidance Session">Admission Guidance Session</option>
                    <option value="Technology Workshop">Technology Workshop</option>
                    <option value="Student Interaction Session">Student Interaction Session</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Location Format *</label>
                  <select
                    value={form.location_type}
                    onChange={e => setForm({ ...form, location_type: e.target.value as any })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="Online">Online Webinar (Meet / Zoom)</option>
                    <option value="Campus">In-Person Campus Session</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {form.location_type === 'Online' ? 'Meeting URL / Link *' : 'Campus Venue Location *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.venue_or_link}
                  onChange={e => setForm({ ...form, venue_or_link: e.target.value })}
                  placeholder={form.location_type === 'Online' ? 'https://meet.google.com/xyz-abc' : 'AI Lab 4, Tech Block'}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                    placeholder="11:00 AM"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                    placeholder="12:30 PM"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Key Speaker / Host</label>
                  <input
                    type="text"
                    value={form.speaker_name}
                    onChange={e => setForm({ ...form, speaker_name: e.target.value })}
                    placeholder="Dr. Arvind Swaminathan"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Speaker Designation</label>
                  <input
                    type="text"
                    value={form.speaker_title}
                    onChange={e => setForm({ ...form, speaker_title: e.target.value })}
                    placeholder="Director of Admissions"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Capacity Seat Limit</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: parseInt(e.target.value, 10) })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Publication Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="PUBLISHED">Published (Visible to Students)</option>
                    <option value="DRAFT">Draft (Admin Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Event Agenda & Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed agenda, key takeaways, and prerequisites for prospective attendees..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  {editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registered Attendees Modal */}
      {attendeesModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Registered Students: {attendeesModalEvent.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {attendees.length} confirmed student reservations
                </p>
              </div>
              <button
                onClick={() => setAttendeesModalEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto text-xs">
              {loadingAttendees ? (
                <p className="py-8 text-center text-slate-400">Loading attendee roster...</p>
              ) : attendees.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No student registrations recorded yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Pass Ticket #</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">City</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendees.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-blue-700">{a.ticket_number}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{a.student_name}</td>
                        <td className="p-2.5 text-slate-600">{a.student_email}</td>
                        <td className="p-2.5 text-slate-600">{a.student_phone}</td>
                        <td className="p-2.5 text-slate-600">{a.city || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAttendeesModalEvent(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
