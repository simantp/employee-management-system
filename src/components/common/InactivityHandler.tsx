'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';

export default function InactivityHandler() {
  const { currentUser, logout, securitySettings, addToast, addAudit } = useApp();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);

  const lastActivityRef = useRef<number>(Date.now());
  const lastStorageSyncRef = useRef<number>(0);

  // Reset activity timestamp
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (showWarningModal) {
      setShowWarningModal(false);
    }
    // Throttle writing to localStorage to once every 2 seconds
    if (now - lastStorageSyncRef.current > 2000) {
      lastStorageSyncRef.current = now;
      try {
        localStorage.setItem('ems_last_active_timestamp', now.toString());
      } catch (e) {}
    }
  }, [showWarningModal]);

  // Listen to global user interactions
  useEffect(() => {
    if (!currentUser) return;

    recordActivity();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleEvent = () => recordActivity();

    events.forEach(event => {
      window.addEventListener(event, handleEvent, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [currentUser, recordActivity]);

  // Monitor inactivity duration
  useEffect(() => {
    if (!currentUser) {
      setShowWarningModal(false);
      return;
    }

    const checkInterval = setInterval(() => {
      const isAutoLogoutActive = securitySettings?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 30;

      // If timeout is disabled or <= 0
      if (!isAutoLogoutActive || timeoutMinutes <= 0) {
        if (showWarningModal) setShowWarningModal(false);
        return;
      }

      const timeoutMs = timeoutMinutes * 60 * 1000;
      let lastActive = lastActivityRef.current;
      try {
        const stored = localStorage.getItem('ems_last_active_timestamp');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastActive) {
            lastActive = parsed;
            lastActivityRef.current = parsed;
          }
        }
      } catch (e) {}

      const now = Date.now();
      const elapsedMs = now - lastActive;
      const remainingMs = timeoutMs - elapsedMs;
      const remainingSec = Math.ceil(remainingMs / 1000);

      // Warning threshold: 60 seconds remaining
      if (remainingSec <= 60 && remainingSec > 0) {
        setRemainingSeconds(remainingSec);
        setShowWarningModal(true);
      } else if (remainingSec <= 0) {
        // Auto-logout triggered!
        setShowWarningModal(false);
        addToast(
          'Session Expired',
          `You have been automatically logged out due to ${timeoutMinutes} minutes of inactivity.`,
          'info'
        );
        addAudit(
          'SESSION_AUTO_LOGOUT_INACTIVITY',
          'User',
          currentUser.id,
          `User ${currentUser.name} (${currentUser.role}) was automatically logged out after ${timeoutMinutes} minutes of inactivity.`,
          currentUser.name,
          currentUser.role
        );
        logout();
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [currentUser, securitySettings, logout, addToast, addAudit, showWarningModal]);

  if (!showWarningModal || !currentUser) {
    return null;
  }

  const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 30;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 text-slate-900 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Security Inactivity Notice
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Session Expiring Soon</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          You have been inactive on the system. For security compliance and protection of workforce data, your session will automatically terminate in:
        </p>

        {/* Big Countdown Timer Badge */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-600 tracking-wider">
            {remainingSeconds}s
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            Auto-Logout threshold: {timeoutMinutes} Minutes
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              recordActivity();
              setShowWarningModal(false);
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Stay Logged In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowWarningModal(false);
              logout();
            }}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
