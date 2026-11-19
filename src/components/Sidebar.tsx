import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  BarChart3,
  CalendarCheck,
  Calendar,
  BookOpen,
  UserCheck,
  HelpCircle,
  MessageSquare,
  GraduationCap,
  Shield,
  Layers
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();

  const adminNav = [
    { name: 'Dashboard Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Lead Management CRM', path: '/admin/leads', icon: Users },
    { name: 'AI Lead Filtration', path: '/admin/ai-leads', icon: Sparkles, badge: 'AI' },
    { name: 'Lead Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Follow-up Schedule', path: '/admin/follow-ups', icon: CalendarCheck },
    { name: 'Event Management', path: '/admin/events', icon: Calendar },
    { name: 'RAG Knowledge Base', path: '/admin/knowledge-base', icon: BookOpen }
  ];

  const studentNav = [
    { name: 'Student Portal Home', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Events & Calendar', path: '/student/calendar', icon: Calendar },
    { name: 'NIAT AI Assistant', path: '/student/ai-assistant', icon: MessageSquare, badge: 'RAG' },
    { name: 'My Profile & Status', path: '/student/profile', icon: UserCheck },
    { name: 'Admission Handbook & FAQs', path: '/student/faq', icon: HelpCircle }
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">NIAT Connect</h1>
            <p className="text-[11px] text-blue-400 font-medium">Admissions & Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {isAdmin ? 'Admission Operations' : 'Student Experience'}
        </div>

        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="h-4 w-4 flex-shrink-0 transition-colors" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 text-[9px] font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Info Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-200">
              {isAdmin ? 'NIAT Admin Active' : 'Admissions 2026 Open'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {isAdmin 
              ? 'Role-based access enforced with Row Level Policies' 
              : 'Class 12 batch registrations underway'}
          </p>
        </div>
      </div>
    </aside>
  );
};
