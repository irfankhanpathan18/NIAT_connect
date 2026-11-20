import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { EventItem } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Ticket,
  ArrowRight,
  ExternalLink,
  Bookmark,
  Sparkles,
  Building2,
  ShieldCheck,
  Search
} from 'lucide-react';

export const EventCalendar: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'saved' | 'my-tickets'>('calendar');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [organizerFilter, setOrganizerFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date(2026, 11, 1)); // December 2026 default

  const fetchEvents = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [eventsRes, regRes] = await Promise.all([
        fetch(getApiUrl('/api/student/events'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/api/student/my-registrations'), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEvents(eData.events || []);
      }
      if (regRes.ok) {
        const rData = await regRes.json();
        setMyRegistrations(rData.registrations || []);
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

  const handleRegister = async (eventId: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/student/events/${eventId}/register`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Confirmed seat reserved. Your ticket: ${data.ticketNumber}`);
        fetchEvents();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      alert('Error registering: ' + err);
    }
  };

  const handleUnregister = async (eventId: number) => {
    if (!window.confirm('Cancel your registration for this event?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/student/events/${eventId}/unregister`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const handleToggleBookmark = async (eventId: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/student/events/${eventId}/bookmark`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(prev =>
          prev.map(e => (e.id === eventId ? { ...e, is_bookmarked: data.bookmarked ? 1 : 0 } : e))
        );
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const categories = [
    'All',
    'Hackathons',
    'Big Tech Events',
    'AI and Machine Learning Events',
    'Coding Competitions',
    'Developer Conferences',
    'Technology Workshops',
    'Webinars',
    'Startup Events',
    'Innovation Challenges',
    'NIAT Admission Webinar'
  ];

  const organizers = ['All', 'Google', 'NVIDIA', 'Microsoft', 'NIAT'];

  const filteredEvents = events.filter(e => {
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchOrg = organizerFilter === 'All' || (e.organizer && e.organizer.toLowerCase().includes(organizerFilter.toLowerCase()));
    const matchSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.organizer && e.organizer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchSaved = viewMode !== 'saved' || e.is_bookmarked === 1;

    return matchCat && matchOrg && matchSearch && matchSaved;
  });

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.event_date === formatted);
  };

  const savedCount = events.filter(e => e.is_bookmarked === 1).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Educational, Technical & Big Tech Events</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Events, Hackathons & Tech Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover upcoming hackathons, Big Tech conferences (Google, NVIDIA, Microsoft), coding competitions, and NIAT webinars.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List / Catalog
          </button>
          <button
            onClick={() => setViewMode('saved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              viewMode === 'saved' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved ({savedCount})
          </button>
          <button
            onClick={() => setViewMode('my-tickets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              viewMode === 'my-tickets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            My Passes ({myRegistrations.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events, organizers, topics..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Organizer Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Organizer:</span>
            {organizers.map(org => (
              <button
                key={org}
                onClick={() => setOrganizerFilter(org)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  organizerFilter === org
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {org}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(2026, 11, 1))}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Dec 2026
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-slate-50 p-2 text-center text-[10px] font-bold text-slate-600 uppercase">
                {d}
              </div>
            ))}

            {/* Empty Offset Days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-white min-h-[95px] p-2 bg-slate-50/40" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = day === 20 && month === 10; // Current local day

              return (
                <div
                  key={`day-${day}`}
                  className={`bg-white min-h-[95px] p-2 flex flex-col justify-between hover:bg-blue-50/30 transition ${
                    isToday ? 'ring-2 ring-blue-600/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          if (evt.registration_url) {
                            window.open(evt.registration_url, '_blank');
                          } else if (evt.is_registered) {
                            setViewMode('my-tickets');
                          } else {
                            handleRegister(evt.id);
                          }
                        }}
                        className={`cursor-pointer rounded p-1 text-[9px] font-semibold truncate leading-tight transition ${
                          evt.is_registered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : evt.organizer && evt.organizer !== 'NIAT'
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                            : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                        }`}
                        title={`${evt.organizer || 'NIAT'}: ${evt.title} (${evt.start_time})`}
                      >
                        {evt.is_registered ? '✓ ' : ''}{evt.organizer ? `[${evt.organizer}] ` : ''}{evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2 & 3: LIST / CATALOG & SAVED VIEW */}
      {(viewMode === 'list' || viewMode === 'saved') && (
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              {viewMode === 'saved'
                ? 'You have not saved or bookmarked any events yet.'
                : 'No events matched your chosen filters.'}
            </div>
          ) : (
            filteredEvents.map(evt => (
              <div
                key={evt.id}
                className="rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row group"
              >
                {/* Event Banner */}
                <div className="relative md:w-72 h-48 md:h-auto bg-slate-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {evt.organizer || 'NIAT'}
                    </span>
                    {evt.is_featured === 1 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-extrabold uppercase">
                        Featured
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleBookmark(evt.id)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-sm text-slate-600 hover:text-amber-500 transition-colors"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${evt.is_bookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                    />
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                        {evt.category}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {evt.event_date} • {evt.start_time} - {evt.end_time}
                      </span>
                      {evt.registration_deadline && (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          Deadline: {evt.registration_deadline}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {evt.description}
                    </p>

                    {evt.eligibility_criteria && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <strong>Eligibility:</strong> {evt.eligibility_criteria}
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        {evt.location_type === 'Online' ? (
                          <Video className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-rose-600" />
                        )}
                        <span className="truncate max-w-[220px]">{evt.venue_or_link}</span>
                      </span>

                      {evt.source_verified && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{evt.source_verified}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.registration_url && (
                        <a
                          href={evt.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Official Portal Registration</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                        </a>
                      )}

                      {!evt.registration_url && evt.is_registered ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pass Reserved ({evt.ticket_number})
                        </span>
                      ) : !evt.registration_url && (
                        <button
                          onClick={() => handleRegister(evt.id)}
                          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                        >
                          Reserve Seat Free
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 4: MY TICKETS & PASSES */}
      {viewMode === 'my-tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Confirmed Admission Tickets & Passes ({myRegistrations.length})
            </h3>
            <span className="text-[11px] text-slate-500">Present ticket pass during entry or online webinar</span>
          </div>

          {myRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400 bg-white">
              You have not registered for any upcoming admission events yet. Check the calendar above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRegistrations.map(reg => (
                <div
                  key={reg.registration_id}
                  className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-md flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">
                        {reg.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {reg.ticket_number}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">{reg.title}</h4>

                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-blue-100">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {reg.event_date} • {reg.start_time} - {reg.end_time}
                      </p>
                      <p className="flex items-center gap-1.5">
                        {reg.location_type === 'Online' ? (
                          <Video className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-rose-600" />
                        )}
                        <span className="truncate">{reg.venue_or_link}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between">
                    {reg.location_type === 'Online' ? (
                      <a
                        href={reg.venue_or_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Join Session <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-700">Campus Pass Confirmed</span>
                    )}

                    <button
                      onClick={() => handleUnregister(reg.id)}
                      className="text-[11px] font-medium text-rose-600 hover:text-rose-800"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
