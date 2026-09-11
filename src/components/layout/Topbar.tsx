'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import SydneyClock from './SydneyClock';

export interface ActivityNotificationItem {
  id: string;
  source: 'AUDIT' | 'NOTIFICATION' | 'LEAVE' | 'COMPLIANCE' | 'TIMECARD';
  badge: string;
  badgeColor: string;
  icon?: string;
  title: string;
  description: string;
  timestamp: string;
  rawTimestamp?: number;
  actorName?: string;
  actorAvatar?: string;
  isUnread?: boolean;
  targetTab?: string;
  timecardId?: string;
}

export default function Topbar({
  onOpenLeaveModal,
  onNavigateTab,
}: {
  onOpenLeaveModal?: () => void;
  onNavigateTab?: (tab: string) => void;
}) {
  const { 
    currentUser,
    logout,
    activePortal, 
    notifications,
    alerts,
    leaveRequests,
    employees,
    timecards,
    auditLogs,
    unreadAdminCount, 
    unreadStaffCount,
    currentStaff,
    currentStaffId,
    markNotificationRead,
    markAllNotificationsRead,
    showChangePasswordModal,
    setShowChangePasswordModal
  } = useApp();

  const [showAlertsHub, setShowAlertsHub] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [viewedActionIds, setViewedActionIds] = useState<string[]>([]);

  // Hydrate viewed action IDs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ems_viewed_staff_actions_v1');
      if (saved) {
        setViewedActionIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'HR_MANAGER' || activePortal === 'ADMIN';

  // Compile only important staff requests and action items needing attention (removes routine audit log noise)
  const staffActionNotifications = useMemo<ActivityNotificationItem[]>(() => {
    const list: ActivityNotificationItem[] = [];

    if (isAdmin) {
      // 1. Pending Staff Shift Inquiries & Error Notes (Highest priority for timesheet adjustments)
      const pendingShiftNotes = timecards.filter(t => t.staffNote && t.staffNote.trim() && t.staffNoteStatus !== 'RESOLVED');
      pendingShiftNotes.forEach(tc => {
        const emp = employees.find(e => e.id === tc.employeeId);
        const empName = tc.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Staff Member');
        const itemId = `shift-note-${tc.id}-${tc.staffNoteSubmittedAt || tc.staffNote.slice(0, 10)}`;
        const rawTime = tc.staffNoteSubmittedAt ? new Date(tc.staffNoteSubmittedAt).getTime() : Date.now();

        list.push({
          id: itemId,
          source: 'TIMECARD',
          badge: 'SHIFT QUERY',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
          title: `${empName} • Shift Note (${tc.date})`,
          description: `"${tc.staffNote}" — Staff reported issue on shift (${tc.clockIn} - ${tc.clockOut || 'Active'}), awaiting admin review`,
          timestamp: tc.staffNoteSubmittedAt 
            ? new Date(tc.staffNoteSubmittedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
            : 'Pending Review',
          rawTimestamp: rawTime,
          actorName: empName,
          actorAvatar: tc.employeeAvatar || emp?.avatarUrl,
          isUnread: !viewedActionIds.includes(itemId),
          targetTab: 'timecards',
          timecardId: tc.id,
        });
      });

      // 2. Pending Staff Leave Requests
      const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');
      pendingLeaves.forEach(lr => {
        const emp = employees.find(e => e.id === lr.employeeId);
        const hasMedCert = !!(lr.certificateUrl || lr.certificateUploaded);
        const leaveTypeName = lr.leaveType ? lr.leaveType.replace(/_/g, ' ') : 'Leave';
        const itemId = `leave-${lr.id}`;
        const rawTime = lr.submittedAt ? new Date(lr.submittedAt).getTime() : Date.now() - 3600000;

        list.push({
          id: itemId,
          source: 'LEAVE',
          badge: hasMedCert ? 'SICK LEAVE + CERT' : `${leaveTypeName.toUpperCase()}`,
          badgeColor: hasMedCert ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200',
          title: `${lr.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Staff Member')} • Leave Request`,
          description: `${leaveTypeName}: ${lr.startDate} to ${lr.endDate} (${lr.totalDays || 1} days)${lr.reason ? ` — "${lr.reason}"` : ''}${hasMedCert ? ' • Medical Cert Attached' : ''}`,
          timestamp: lr.submittedAt || 'Pending Review',
          rawTimestamp: rawTime,
          actorName: lr.employeeName,
          actorAvatar: emp?.avatarUrl,
          isUnread: !viewedActionIds.includes(itemId),
          targetTab: 'approvals',
        });
      });

      // 3. Pending Staff Uploaded Documents needing verification
      employees.forEach(emp => {
        if (Array.isArray(emp.documents)) {
          emp.documents.forEach(doc => {
            if (doc.status === 'Pending') {
              const itemId = `doc-${emp.id}-${doc.id}`;
              const rawTime = (doc as any).uploadedAt ? new Date((doc as any).uploadedAt).getTime() : Date.now() - 7200000;
              list.push({
                id: itemId,
                source: 'COMPLIANCE',
                badge: 'DOC VERIFICATION',
                badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                title: `${emp.firstName} ${emp.lastName} • ${doc.name}`,
                description: `Category: ${doc.type || 'Document'}${doc.expiryDate ? ` • Expiry: ${doc.expiryDate}` : ''} — Uploaded by staff, awaiting admin approval`,
                timestamp: (doc as any).uploadedAt || 'Pending Review',
                rawTimestamp: rawTime,
                actorName: `${emp.firstName} ${emp.lastName}`,
                actorAvatar: emp.avatarUrl,
                isUnread: !viewedActionIds.includes(itemId),
                targetTab: 'employees',
              });
            }
          });
        }
      });

      // 4. Critical & Warning Expiry Alerts
      alerts.forEach(alert => {
        const isUrgent = alert.severity === 'URGENT';
        const itemId = `alert-${alert.id}`;
        list.push({
          id: itemId,
          source: 'COMPLIANCE',
          badge: isUrgent ? 'URGENT EXPIRY' : 'EXPIRY WARNING',
          badgeColor: isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold' : 'bg-amber-50 text-amber-800 border-amber-200',
          title: alert.title || `${alert.employeeName} • Expiry Alert`,
          description: alert.description || 'Compliance renewal action needed',
          timestamp: alert.dueDate ? `Due ${alert.dueDate}` : 'Action Required',
          rawTimestamp: alert.dueDate ? new Date(alert.dueDate).getTime() : Date.now() - 86400000,
          actorName: alert.employeeName,
          isUnread: !viewedActionIds.includes(itemId),
          targetTab: 'alerts',
        });
      });

      // 5. Actionable Admin Notifications & Announcements
      const adminNotifs = notifications.filter(n => (n.recipient === 'ADMIN' || n.recipient === 'ALL'));
      adminNotifs.forEach(n => {
        const nType = (n.type as string) || '';
        // Avoid duplicate shift note entry if already captured in pendingShiftNotes
        if (nType === 'TIMECARD_ADJUST' && pendingShiftNotes.length > 0) {
          return;
        }

        let badge = 'ADMIN NOTICE';
        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        let targetTab = 'dashboard';

        if (nType === 'TIMECARD_CLOCK_IN') {
          badge = 'CLOCK IN';
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          targetTab = 'timecards';
        } else if (nType === 'TIMECARD_CLOCK_OUT') {
          badge = 'CLOCK OUT';
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          targetTab = 'timecards';
        } else if (nType === 'TIMECARD_ADJUST') {
          badge = 'SHIFT QUERY';
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          targetTab = 'timecards';
        } else if (nType === 'BANK_UPDATE') {
          badge = 'BANKING';
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          targetTab = 'employees';
        } else if (nType === 'PROFILE_UPDATE') {
          badge = 'PROFILE UPDATE';
          badgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';
          targetTab = 'employees';
        } else if (nType.includes('LEAVE')) {
          badge = 'LEAVE NOTICE';
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          targetTab = 'approvals';
        } else if (nType.includes('EXPIRY') || nType.includes('VISA') || nType.includes('LICENSE')) {
          badge = 'COMPLIANCE';
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          targetTab = 'alerts';
        } else if (nType.includes('ANNOUNCEMENT')) {
          badge = 'ANNOUNCEMENT';
          badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
          targetTab = 'announcements';
        }

        const itemId = `notif-${n.id}`;
        list.push({
          id: itemId,
          source: 'NOTIFICATION',
          badge,
          badgeColor,
          title: n.title,
          description: n.message,
          timestamp: n.timestamp || 'Recent',
          rawTimestamp: n.id ? (parseInt(n.id.replace(/\D/g, '')) || Date.now()) : Date.now(),
          isUnread: !n.read && !viewedActionIds.includes(itemId),
          targetTab,
        });
      });

    } else {
      // Staff Portal notifications: show reviewed leave requests, resolved shift queries, notifications addressed to this user, or broadcast to ALL
      const myStaffId = currentStaff?.id || currentStaffId || currentUser?.staffId || 'emp-42';

      // 1. Direct real-time reviewed leave requests (Approved or Rejected)
      const myReviewedLeaves = leaveRequests.filter(l => l.employeeId === myStaffId && (l.status === 'APPROVED' || l.status === 'REJECTED'));
      myReviewedLeaves.forEach(lr => {
        const itemId = `staff-leave-${lr.id}-${lr.status}-${lr.reviewedAt || 'rev'}`;
        const leaveTypeName = lr.leaveType ? lr.leaveType.replace(/_/g, ' ') : 'Leave';
        const isApproved = lr.status === 'APPROVED';
        const adminNotesPart = lr.adminNotes ? ` — Note: "${lr.adminNotes}"` : '';
        const rawTime = lr.reviewedAt ? new Date(lr.reviewedAt).getTime() : (lr.submittedAt ? new Date(lr.submittedAt).getTime() : Date.now());

        list.push({
          id: itemId,
          source: 'LEAVE',
          badge: isApproved ? 'LEAVE APPROVED' : 'LEAVE REJECTED',
          badgeColor: isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
          title: `${leaveTypeName} Request ${isApproved ? 'Approved' : 'Rejected'} (${lr.startDate})`,
          description: `Your ${leaveTypeName.toLowerCase()} leave request (${lr.startDate} to ${lr.endDate}, ${lr.totalDays || 1} day${(lr.totalDays || 1) > 1 ? 's' : ''}) has been ${lr.status.toLowerCase()} by ${lr.reviewedBy || 'Administration'}.${adminNotesPart}`,
          timestamp: lr.reviewedAt ? `Reviewed ${lr.reviewedAt}` : (lr.submittedAt || 'Reviewed'),
          rawTimestamp: rawTime,
          actorName: lr.reviewedBy || 'Admin',
          actorAvatar: currentStaff?.avatarUrl,
          isUnread: !viewedActionIds.includes(itemId),
          targetTab: 'leave',
        });
      });

      // 2. Direct real-time resolved shift inquiries from timecard records
      const myResolvedNotes = timecards.filter(t => t.employeeId === myStaffId && t.staffNote && t.staffNote.trim() && t.staffNoteStatus === 'RESOLVED');
      myResolvedNotes.forEach(tc => {
        const itemId = `staff-shift-resolved-${tc.id}-${tc.adjustedAt || tc.staffNoteSubmittedAt || 'res'}`;
        const adminNotePart = tc.adminNote || tc.notes ? ` — Admin Response: "${tc.adminNote || tc.notes}"` : '';
        const rawTime = tc.staffNoteSubmittedAt ? new Date(tc.staffNoteSubmittedAt).getTime() : Date.now();
        list.push({
          id: itemId,
          source: 'TIMECARD',
          badge: 'SHIFT RESOLVED',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          title: `Shift Query Resolved (${tc.date})`,
          description: `Your query: "${tc.staffNote}" was marked resolved by ${tc.adjustedBy || 'Administration'}${adminNotePart}`,
          timestamp: tc.adjustedAt ? `Resolved ${tc.adjustedAt}` : (tc.staffNoteSubmittedAt ? new Date(tc.staffNoteSubmittedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }) : 'Resolved'),
          rawTimestamp: rawTime,
          actorName: tc.adjustedBy || 'Admin',
          actorAvatar: currentStaff?.avatarUrl,
          isUnread: !viewedActionIds.includes(itemId),
          targetTab: 'timesheet',
        });
      });

      // 3. Real-time Notification Center items
      const relevantNotifs = notifications.filter(n => {
        if (n.recipient !== 'STAFF' && n.recipient !== 'ALL') return false;
        if (n.recipientId) {
          return (
            n.recipientId === currentUser?.id ||
            n.recipientId === currentUser?.staffId ||
            n.recipientId === currentStaffId ||
            n.recipientId === currentStaff?.id ||
            (currentUser?.email && n.recipientId.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentStaff?.email && n.recipientId.toLowerCase() === currentStaff.email.toLowerCase())
          );
        }
        if (n.recipient === 'ALL') return true;
        // Legacy demo notifications without recipientId are only for demo user Suman Thapa
        return currentUser?.email === 'suman.thapa@company.com' || currentUser?.staffId === 'emp-42' || currentStaffId === 'emp-42';
      });

      relevantNotifs.forEach(n => {
        const nType = (n.type as string) || '';
        // Avoid duplicate leave status entry if already captured in myReviewedLeaves
        if (nType === 'LEAVE_STATUS' && myReviewedLeaves.length > 0) {
          return;
        }

        let badge = 'STAFF NOTICE';
        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        let targetTab = 'dashboard';

        if (nType === 'TIMECARD_RESOLVED') {
          badge = 'SHIFT RESOLVED';
          badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
          targetTab = 'timesheet';
        } else if (nType === 'TIMECARD_ADJUST') {
          badge = 'SHIFT ADJUSTED';
          badgeColor = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
          targetTab = 'timesheet';
        } else if (nType === 'TIMECARD_CLOCK_OUT') {
          badge = 'CLOCK OUT';
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          targetTab = 'timesheet';
        } else if (nType === 'LEAVE_STATUS') {
          badge = 'LEAVE STATUS';
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          targetTab = 'leave';
        } else if (nType === 'PROFILE_UPDATE') {
          badge = 'PROFILE';
          badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
          targetTab = 'profile';
        } else if (nType === 'BANK_UPDATE') {
          badge = 'BANKING';
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          targetTab = 'profile';
        } else if (nType === 'CERTIFICATE_REMINDER') {
          badge = 'REMINDER';
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          targetTab = 'profile';
        } else if (nType.includes('EXPIRY') || nType.includes('VISA') || nType.includes('LICENSE')) {
          badge = 'COMPLIANCE';
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          targetTab = 'profile';
        }

        const itemId = `notif-${n.id}`;
        list.push({
          id: itemId,
          source: 'NOTIFICATION',
          badge,
          badgeColor,
          title: n.title,
          description: n.message,
          timestamp: n.timestamp || 'Recent',
          rawTimestamp: n.id ? (parseInt(n.id.replace(/\D/g, '')) || Date.now()) : Date.now(),
          isUnread: !n.read && !viewedActionIds.includes(itemId),
          targetTab,
        });
      });
    }

    // Sort items: Unread items first, then by rawTimestamp descending (newest first)
    list.sort((a, b) => {
      if (a.isUnread && !b.isUnread) return -1;
      if (!a.isUnread && b.isUnread) return 1;
      return (b.rawTimestamp || 0) - (a.rawTimestamp || 0);
    });

    return list;
  }, [leaveRequests, employees, alerts, timecards, notifications, isAdmin, currentUser, currentStaff, currentStaffId, viewedActionIds]);

  const attentionCount = useMemo(() => {
    return staffActionNotifications.filter(item => item.isUnread).length;
  }, [staffActionNotifications]);

  // Mark all current staff action items as viewed & reset badge count to 0
  const markAllActionsAsViewed = () => {
    markAllNotificationsRead(isAdmin ? 'ADMIN' : 'STAFF');
    const allIds = staffActionNotifications.map(item => item.id);
    setViewedActionIds(prev => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('ems_viewed_staff_actions_v1', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
  };

  // Mark a single action item as viewed
  const markSingleActionAsViewed = (id: string) => {
    if (id.startsWith('notif-')) {
      markNotificationRead(id.replace('notif-', ''));
    }
    setViewedActionIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('ems_viewed_staff_actions_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Toggle dropdown
  const handleToggleAlertsHub = () => {
    setShowAlertsHub(prev => !prev);
  };

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
        {/* STAFF REQUESTS & ALERTS NOTIFICATION BELL BUTTON */}
        {/* ========================================================================= */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleToggleAlertsHub}
            className={`relative flex items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
              showAlertsHub
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : attentionCount > 0
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 ring-2 ring-rose-500/30 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
            }`}
            title={isAdmin ? 'Staff Requests & Action Items' : 'Notifications'}
            aria-label="Staff Requests & Notifications"
          >
            {/* Animated Ringing Bell Icon */}
            <span className="relative flex items-center justify-center">
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${
                  attentionCount > 0 ? 'animate-[swing_2.5s_ease-in-out_infinite] text-rose-600' : 'text-slate-600'
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              {/* Pulsing Alert Badge (Visible only when there are unread items) */}
              {attentionCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] text-white font-black items-center justify-center shadow-xs">
                    {attentionCount > 9 ? '9+' : attentionCount}
                  </span>
                </span>
              )}
            </span>
          </button>

          {/* ========================================================================= */}
          {/* STAFF REQUESTS & ACTION CENTER NOTIFICATION PANEL */}
          {/* ========================================================================= */}
          {showAlertsHub && (
            <div className="absolute right-0 top-full mt-2.5 w-84 sm:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                      <span>{isAdmin ? 'Staff Requests & Attention' : 'Notifications'}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold border border-slate-700">
                        {staffActionNotifications.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isAdmin 
                        ? 'Requests and compliance items needing administrator action'
                        : 'Your portal notifications & updates'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={markAllActionsAsViewed}
                  className="text-[10px] font-black text-orange-400 hover:text-orange-300 transition py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              {/* Request & Alert List */}
              <div className="max-h-[380px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                {staffActionNotifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                      All Caught Up
                    </span>
                    <p className="text-xs font-bold text-slate-700">All Staff Requests Up to Date</p>
                    <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
                      {isAdmin 
                        ? 'No pending leave approvals, shift queries, document reviews, or compliance alerts.' 
                        : 'You are all caught up. No new notifications.'}
                    </p>
                  </div>
                ) : (
                  staffActionNotifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markSingleActionAsViewed(item.id);
                        if (item.targetTab && onNavigateTab) {
                          onNavigateTab(item.targetTab);
                          setShowAlertsHub(false);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        item.isUnread
                          ? 'bg-amber-50/70 border-amber-200/90 shadow-2xs hover:bg-amber-50'
                          : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/70'
                      }`}
                    >
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
                  {isAdmin ? 'Staff section action queue' : 'Portal notifications'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono font-bold">
                  {staffActionNotifications.length} items
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
                    setShowChangePasswordModal(true);
                  }}
                  className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition cursor-pointer mb-1"
                >
                  Change Password
                </button>

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



