'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import SydneyClock from './SydneyClock';

export default function Topbar({
  onOpenLeaveModal,
}: {
  onOpenLeaveModal?: () => void;
}) {
  const { 
    currentUser,
    logout,
    activePortal, 
    notifications,
    unreadAdminCount, 
    unreadStaffCount,
    markNotificationRead,
    markAllNotificationsRead
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HR_MANAGER';
  const unreadCount = activePortal === 'ADMIN' ? unreadAdminCount : unreadStaffCount;

  // Filter notifications relevant to current user
  const relevantNotifs = activePortal === 'ADMIN'
    ? notifications.filter(n => n.recipient === 'ADMIN')
    : notifications.filter(n => {
        if (n.recipient !== 'STAFF' && n.recipient !== 'ALL') return false;
        if (n.recipientId) {
          return n.recipientId === currentUser?.id || n.recipientId === currentUser?.staffId;
        }
        return currentUser?.email === 'suman.thapa@company.com';
      });

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 sticky top-0 z-40 flex items-center justify-between gap-4 shadow-xs shrink-0">
      
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={isAdmin ? 'Search employees, departments, visas, BSB...' : 'Search policies, payslips, leaves, directory...'}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Sydney Live Clock */}
      <div className="hidden md:flex items-center">
        <SydneyClock />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Notifications Dropdown Anchor */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              showNotifications
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
            }`}
            title="Notifications"
          >
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              
              {/* Dropdown Header */}
              <div className="px-4.5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Notifications</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All caught up'}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(activePortal === 'ADMIN' ? 'ADMIN' : 'STAFF')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition py-1 px-2 rounded-lg hover:bg-blue-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                {relevantNotifs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 space-y-1">
                    <p className="text-xs font-bold text-slate-700">No Notifications</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                      You will receive alerts here when documents or leaves are reviewed.
                    </p>
                  </div>
                ) : (
                  relevantNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        n.read
                          ? 'bg-slate-50/50 border-slate-200/60 opacity-70 hover:opacity-100 hover:bg-slate-100/60'
                          : 'bg-blue-50/60 border-blue-200/90 shadow-xs hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-[11px] font-bold text-slate-900 truncate">{n.title}</h5>
                          <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                      </div>

                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1 shadow-xs" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/60 text-center">
                <span className="text-[10px] text-slate-400 font-semibold">
                  Sydney Live Notification Center
                </span>
              </div>

            </div>
          )}
        </div>

        {/* User Account / Auth Dropdown */}
        {currentUser && (
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition bg-white shadow-2xs"
            >
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-400 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-cyan-600 font-semibold">{currentUser.role}</span>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="p-2.5 border-b border-slate-100 mb-1">
                  <p className="font-bold text-xs text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-1">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
