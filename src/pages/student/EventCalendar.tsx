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
  ExternalLink
} from 'lucide-react';

export const EventCalendar: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'my-tickets'>('calendar');
  const [categoryFilter, setCategoryFilter] = useState('All');

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

  const filteredEvents = events.filter(e => {
    return categoryFilter === 'All' || e.category === categoryFilter;
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            NIAT Admission Events & Interactive Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Participate in official webinars, AI masterclasses, and parent interaction sessions.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
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
            List / Agenda
          </button>
          <button
            onClick={() => setViewMode('my-tickets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              viewMode === 'my-tickets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            My Tickets ({myRegistrations.length})
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          'All',
          'NIAT Admission Webinar',
          'Technology Workshop',
          'Parent Counselling Session',
          'Campus Orientation',
          'Student Interaction Session'
        ].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
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
              const isToday = day === 19 && month === 10; // Nov 19 demo date

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
                          if (evt.is_registered) {
                            setViewMode('my-tickets');
                          } else {
                            handleRegister(evt.id);
                          }
                        }}
                        className={`cursor-pointer rounded p-1 text-[9px] font-semibold truncate leading-tight transition ${
                          evt.is_registered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                        }`}
                        title={`${evt.title} (${evt.start_time})`}
                      >
                        {evt.is_registered ? '✓ ' : ''}{evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIST / AGENDA VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredEvents.map(evt => (
            <div
              key={evt.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {evt.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {evt.event_date} • {evt.start_time} - {evt.end_time}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{evt.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    {evt.location_type === 'Online' ? (
                      <Video className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-rose-600" />
                    )}
                    {evt.venue_or_link}
                  </span>
                  {evt.speaker_name && (
                    <span>Speaker: <strong>{evt.speaker_name}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end flex-shrink-0">
                {evt.is_registered ? (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed Seat
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Ticket: {evt.ticket_number}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegister(evt.id)}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                  >
                    Register Free Pass
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: MY TICKETS & PASSES */}
      {viewMode === 'my-tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Confirmed Admission Tickets ({myRegistrations.length})
            </h3>
            <span className="text-[11px] text-slate-500">Present ticket QR/Number during entry or online webinar</span>
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
