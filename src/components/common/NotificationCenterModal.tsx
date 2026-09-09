'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function NotificationCenterModal({ onClose }: { onClose: () => void }) {
  const { currentUser, notifications, activePortal, markNotificationRead, markAllNotificationsRead } = useApp();

  const relevantNotifs = activePortal === 'ADMIN'
    ? notifications.filter(n => n.recipient === 'ADMIN')
    : notifications.filter(n => {
        if (n.recipient !== 'STAFF' && n.recipient !== 'ALL') return false;
        // If recipientId is specified, match current user
        if (n.recipientId) {
          return n.recipientId === currentUser?.id || n.recipientId === currentUser?.staffId;
        }
        // Initial demo notifications are only for demo employee Suman Thapa
        return currentUser?.email === 'suman.thapa@company.com';
      });

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'LEAVE_REQUEST': return 'Leave';
      case 'VISA_EXPIRY': return 'Visa';
      case 'BANK_UPDATE': return 'Bank';
      default: return 'Notice';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activePortal === 'ADMIN' ? 'Admin Notification Center' : 'Staff Notification Center'}
            </h3>
            <p className="text-xs text-slate-500">Real-time alerts & compliance events</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => markAllNotificationsRead(activePortal === 'ADMIN' ? 'ADMIN' : 'STAFF')}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
            >
              Mark all read
            </button>
            <button 
              onClick={onClose} 
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-4 space-y-2.5">
          {relevantNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-xs font-semibold">No notifications right now.</p>
            </div>
          ) : (
            relevantNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  n.read 
                    ? 'bg-slate-50/60 border-slate-200/60 opacity-80' 
                    : 'bg-white border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {getBadgeLabel(n.type)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-slate-900 flex-shrink-0 mt-1.5"></span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
