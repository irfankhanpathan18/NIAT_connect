import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  Check, 
  ExternalLink,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Brand Identity & Portal Tag */}
      <div className="flex items-center space-x-3">
        <Link 
          to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} 
          className="flex items-center space-x-2.5 transition-transform hover:scale-[1.01]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 shadow-md shadow-blue-500/20">
            <span className="text-lg font-black tracking-wider text-white">N</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">NIAT Connect</span>
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 border border-blue-200">
                2026 INTAKE
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              NextGen Institute of Advanced Technology
            </p>
          </div>
        </Link>

        {/* Role Portal Badge */}
        <div className="hidden md:flex items-center pl-3">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/80">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              Admission CRM Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
              Student Portal
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions, AI Badge, Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Quick AI Admission Chatbot Access for Students */}
        {isStudent && (
          <Link
            to="/student/ai-assistant"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-200 animate-pulse" />
            <span className="hidden sm:inline">Ask NIAT AI</span>
            <span className="sm:hidden">AI</span>
          </Link>
        )}

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No notifications right now.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        if (n.link) {
                          navigate(n.link);
                          setShowNotifications(false);
                        }
                      }}
                      className={`flex cursor-pointer items-start gap-3 p-3.5 transition hover:bg-slate-50 ${
                        !n.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                        {n.type === 'EVENT' ? '📅' : n.type === 'ALERT' ? '⚡' : n.type === 'COUNSELLING' ? '🤝' : '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-100"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-50">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                  {user?.role}
                </span>
              </div>

              {isStudent && (
                <Link
                  to="/student/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  My Student Profile
                </Link>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate(isAdmin ? '/admin/login' : '/login');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
