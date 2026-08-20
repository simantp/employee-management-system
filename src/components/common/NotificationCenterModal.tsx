'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Bell, Check, X, Calendar, ShieldAlert, CreditCard, Clock } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {activePortal === 'ADMIN' ? 'Admin Notification Center' : 'Staff Notification Center'}
              </h3>
              <p className="text-[11px] text-slate-500">Real-time alerts & compliance events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllNotificationsRead(activePortal === 'ADMIN' ? 'ADMIN' : 'STAFF')}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-4 space-y-2.5">
          {relevantNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No notifications right now.</p>
            </div>
          ) : (
            relevantNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                  n.read 
                    ? 'bg-slate-50/60 border-slate-200/60 opacity-80' 
                    : 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.type === 'LEAVE_REQUEST' ? 'bg-amber-100 text-amber-700' :
                  n.type === 'VISA_EXPIRY' ? 'bg-rose-100 text-rose-700' :
                  n.type === 'BANK_UPDATE' ? 'bg-cyan-100 text-cyan-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {n.type === 'LEAVE_REQUEST' ? <Calendar className="w-4 h-4" /> :
                   n.type === 'VISA_EXPIRY' ? <ShieldAlert className="w-4 h-4" /> :
                   n.type === 'BANK_UPDATE' ? <CreditCard className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
