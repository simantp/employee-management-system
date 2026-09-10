'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import SydneyClock from './SydneyClock';

export interface ActivityNotificationItem {
  id: string;
  source: 'AUDIT' | 'NOTIFICATION' | 'LEAVE' | 'COMPLIANCE';
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  actorName?: string;
  actorAvatar?: string;
  isUnread?: boolean;
}

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
    alerts,
    leaveRequests,
    employees,
    auditLogs,
    unreadAdminCount, 
    unreadStaffCount,
    markNotificationRead,
    markAllNotificationsRead
  } = useApp();

  const [showAlertsHub, setShowAlertsHub] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HR_MANAGER';
  const unreadCount = activePortal === 'ADMIN' ? unreadAdminCount : unreadStaffCount;

  // Compile unified latest activities & notifications stream
  const latestActivities = useMemo<ActivityNotificationItem[]>(() => {
    const list: ActivityNotificationItem[] = [];

    // 1. Audit logs (Clock-ins, shift adjustments, leave submissions, approvals, etc.)
    auditLogs.forEach(aud => {
      let icon = '⚡';
      let badge = 'ACTIVITY';
      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

      const actionUpper = aud.action.toUpperCase();
      if (actionUpper.includes('CLOCK_IN')) {
        icon = '🟢';
        badge = 'CLOCK IN';
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (actionUpper.includes('CLOCK_OUT')) {
        icon = '🔴';
        badge = 'CLOCK OUT';
        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
      } else if (actionUpper.includes('LEAVE')) {
        icon = '📋';
        badge = 'LEAVE';
        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      } else if (actionUpper.includes('DOCUMENT') || actionUpper.includes('DOC')) {
        icon = '📄';
        badge = 'DOCUMENT';
        badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
      } else if (actionUpper.includes('ANNOUNCEMENT') || actionUpper.includes('BROADCAST')) {
        icon = '📢';
        badge = 'BROADCAST';
        badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
      } else if (actionUpper.includes('TIMECARD') || actionUpper.includes('ADJUST') || actionUpper.includes('SHIFT')) {
        icon = '⏱️';
        badge = 'TIMECARD';
        badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      } else if (actionUpper.includes('BANK') || actionUpper.includes('PAYROLL') || actionUpper.includes('ENCRYPT')) {
        icon = '💳';
        badge = 'PAYROLL / BANK';
        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      } else if (actionUpper.includes('LOGIN') || actionUpper.includes('AUTH')) {
        icon = '🔑';
        badge = 'SECURITY';
        badgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      }

      list.push({
        id: `aud-${aud.id}`,
        source: 'AUDIT',
        badge,
        badgeColor,
        icon,
        title: `${aud.actorName || 'System'} • ${aud.action.replace(/_/g, ' ')}`,
        description: aud.details || `${aud.actorName} performed ${aud.action}`,
        timestamp: aud.timestamp || 'Recent',
        actorName: aud.actorName,
        isUnread: false,
      });
    });

    // 2. Notifications (relevant to current portal / user)
    const relevantNotifs = activePortal === 'ADMIN'
      ? notifications.filter(n => n.recipient === 'ADMIN' || n.recipient === 'ALL')
      : notifications.filter(n => {
          if (n.recipient !== 'STAFF' && n.recipient !== 'ALL') return false;
          if (n.recipientId) {
            return n.recipientId === currentUser?.id || n.recipientId === currentUser?.staffId;
          }
          return currentUser?.email === 'suman.thapa@company.com';
        });

    relevantNotifs.forEach(n => {
      let icon = '🔔';
      let badge = 'NOTIFICATION';
      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

      const nType = (n.type as string) || '';
      if (nType.includes('ANNOUNCEMENT') || nType.includes('BROADCAST')) {
        icon = '📢';
        badge = 'ANNOUNCEMENT';
        badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
      } else if (nType.includes('LEAVE')) {
        icon = '📋';
        badge = 'LEAVE NOTICE';
        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      } else if (nType.includes('DOC') || nType.includes('CERTIFICATE')) {
        icon = '📄';
        badge = 'DOCUMENT';
        badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
      } else if (nType.includes('VISA') || nType.includes('LICENSE')) {
        icon = '⚠️';
        badge = 'EXPIRY ALERT';
        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
      } else if (nType.includes('TIMECARD') || nType.includes('CLOCK')) {
        icon = nType.includes('IN') ? '🟢' : '🔴';
        badge = 'TIMECARD';
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      }

      list.push({
        id: `notif-${n.id}`,
        source: 'NOTIFICATION',
        badge,
        badgeColor,
        icon,
        title: n.title,
        description: n.message,
        timestamp: n.timestamp || 'Recent',
        isUnread: !n.read,
      });
    });

    return list;
  }, [notifications, auditLogs, activePortal, currentUser]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowAlertsHub(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sticky top-0 z-40 flex items-center justify-between gap-3 shadow-xs shrink-0 select-none">
      
      {/* 1. Left Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xs md:max-w-sm">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={isAdmin ? 'Search staff, visas, timecards...' : 'Search policies, leaves, directory...'}
            className="w-full px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition placeholder:text-slate-400 text-slate-800 font-medium"
          />
        </div>
      </div>

      {/* 2. Sydney Live Clock */}
      <div className="hidden md:flex items-center">
        <SydneyClock />
      </div>

      {/* 3. Right Action Controls */}
      <div className="flex items-center gap-2.5">
        
        {/* ========================================================================= */}
        {/* ALERTS NOTIFICATION BELL BUTTON & LATEST ACTIVITIES HUB */}
        {/* ========================================================================= */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowAlertsHub(!showAlertsHub)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-black transition-all cursor-pointer select-none ${
              showAlertsHub
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : unreadCount > 0
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 ring-2 ring-rose-500/30 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
            }`}
            title="Latest Activities & Notifications"
          >
            {/* Animated Ringing Bell Icon */}
            <span className="relative flex items-center justify-center">
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${
                  unreadCount > 0 ? 'animate-[swing_2.5s_ease-in-out_infinite] text-rose-600' : 'text-slate-600'
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              {/* Pulsing Alert Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] text-white font-black items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </span>

            <span className="tracking-wide">Latest Activities</span>

            {/* Glowing Live Indicator Dot if unread */}
            {unreadCount > 0 && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
          </button>

          {/* ========================================================================= */}
          {/* LATEST ACTIVITIES NOTIFICATION PANEL */}
          {/* ========================================================================= */}
          {showAlertsHub && (
            <div className="absolute right-0 top-full mt-2.5 w-84 sm:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                      <span>Latest Activities</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold border border-slate-700">
                        {latestActivities.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Real-time activity logs &amp; notifications
                    </p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(activePortal === 'ADMIN' ? 'ADMIN' : 'STAFF')}
                    className="text-[10px] font-black text-orange-400 hover:text-orange-300 transition py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              {/* Activity List */}
              <div className="max-h-[380px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                {latestActivities.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 space-y-1">
                    <span className="text-2xl block mb-1">⚡</span>
                    <p className="text-xs font-bold text-slate-700">No Recent Activities</p>
                    <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                      Activity notifications will appear here automatically when actions occur.
                    </p>
                  </div>
                ) : (
                  latestActivities.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.source === 'NOTIFICATION' && item.isUnread) {
                          markNotificationRead(item.id.replace('notif-', ''));
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        item.isUnread
                          ? 'bg-orange-50/60 border-orange-200/90 shadow-2xs hover:bg-orange-50 cursor-pointer'
                          : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-sm shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {item.timestamp}
                          </span>
                        </div>

                        <h5 className="text-[11px] font-bold text-slate-900 mt-1 truncate">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      {item.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5 shadow-xs animate-pulse" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/80 text-center flex items-center justify-between px-3">
                <span className="text-[9px] text-slate-400 font-medium">
                  Live real-time activity telemetry
                </span>
                <span className="text-[9px] text-slate-400 font-mono font-semibold">
                  {latestActivities.length} items logged
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
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition bg-white shadow-2xs cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-xl object-cover ring-1 ring-blue-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-blue-100 border border-blue-400 flex items-center justify-center text-blue-700 font-bold text-[10px]">
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
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Global CSS Keyframes for animated bell swing */}
      <style jsx global>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(2deg); }
        }
      `}</style>

    </header>
  );
}



