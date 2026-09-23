'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';

export default function InactivityHandler() {
  const { currentUser, logout, securitySettings, addToast, addAudit } = useApp();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15);

  // Maintain stable refs to avoid effect recreation on store updates / re-renders
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const securitySettingsRef = useRef(securitySettings);
  securitySettingsRef.current = securitySettings;

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  const addAuditRef = useRef(addAudit);
  addAuditRef.current = addAudit;

  // Inactivity tracking state in memory
  const lastActivityTimeRef = useRef<number>(Date.now());
  const isWarningActiveRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Perform clean, guaranteed logout
  const performLogout = useCallback((reasonMsg?: string) => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    isWarningActiveRef.current = false;
    setShowWarningModal(false);

    const user = currentUserRef.current;
    const timeoutMin = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
    const message = reasonMsg || `You have been automatically logged out due to ${timeoutMin} minute(s) of inactivity.`;

    try {
      addToastRef.current?.('Session Expired', message, 'info');
    } catch (e) {}

    if (user) {
      try {
        addAuditRef.current?.(
          'SESSION_AUTO_LOGOUT_INACTIVITY',
          'User',
          user.id,
          `User ${user.name} (${user.role}) auto-logged out after ${timeoutMin} min(s) inactivity.`,
          user.name,
          user.role
        );
      } catch (e) {}
    }

    try {
      localStorage.setItem('ems_auth_session_logout', Date.now().toString());
    } catch (e) {}

    try {
      logoutRef.current?.();
    } catch (e) {}
  }, []);

  // Explicit user action: "Stay Logged In"
  const handleStayLoggedIn = useCallback(() => {
    const now = Date.now();
    lastActivityTimeRef.current = now;
    isWarningActiveRef.current = false;
    setShowWarningModal(false);
    setRemainingSeconds(15);
    try {
      localStorage.setItem('ems_last_active_timestamp', now.toString());
    } catch (e) {}
  }, []);

  // Explicit user action: "Log Out Now"
  const handleLogOutNow = useCallback(() => {
    isWarningActiveRef.current = false;
    setShowWarningModal(false);
    performLogout();
  }, [performLogout]);

  // Listen to intentional user clicks and key presses on the page
  useEffect(() => {
    if (!currentUser?.id) {
      isLoggingOutRef.current = false;
      isWarningActiveRef.current = false;
      setShowWarningModal(false);
      return;
    }

    const handleUserInteraction = () => {
      // If warning modal is already on screen, user must explicitly click "Stay Logged In"
      if (isWarningActiveRef.current) return;
      lastActivityTimeRef.current = Date.now();
    };

    const directEvents = ['click', 'keydown', 'touchstart'];
    directEvents.forEach(evt => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    return () => {
      directEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserInteraction);
      });
    };
  }, [currentUser?.id]);

  // Main inactivity tick interval (stable, never restarts unless user ID changes)
  useEffect(() => {
    if (!currentUser?.id) {
      isLoggingOutRef.current = false;
      isWarningActiveRef.current = false;
      setShowWarningModal(false);
      return;
    }

    // Initialize timestamps upon login
    lastActivityTimeRef.current = Date.now();
    isLoggingOutRef.current = false;
    isWarningActiveRef.current = false;
    setShowWarningModal(false);

    try {
      localStorage.removeItem('ems_auth_session_logout');
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}

    const timer = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const autoLogout = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;

      if (!autoLogout || timeoutMinutes <= 0) {
        if (isWarningActiveRef.current) {
          isWarningActiveRef.current = false;
          setShowWarningModal(false);
        }
        return;
      }

      const timeoutMs = timeoutMinutes * 60 * 1000;
      const now = Date.now();
      const elapsedMs = now - lastActivityTimeRef.current;
      const remainingMs = timeoutMs - elapsedMs;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      // 15 seconds warning threshold for 1-minute timeout
      const warningThresholdSec = timeoutMinutes <= 1 ? 15 : Math.min(30, Math.floor((timeoutMinutes * 60) / 3));

      if (remainingSec <= 0) {
        // Time is up -> Logout immediately
        performLogout();
      } else if (remainingSec <= warningThresholdSec) {
        // In warning zone: activate modal and count down smoothly
        isWarningActiveRef.current = true;
        setRemainingSeconds(remainingSec);
        setShowWarningModal(true);
      } else {
        // Normal active zone
        if (isWarningActiveRef.current) {
          isWarningActiveRef.current = false;
          setShowWarningModal(false);
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [currentUser?.id, performLogout]);

  // Cross-tab sync and background/visibility handler
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ems_auth_session_logout' && e.newValue) {
        if (!isLoggingOutRef.current) {
          isLoggingOutRef.current = true;
          isWarningActiveRef.current = false;
          setShowWarningModal(false);
          try {
            logoutRef.current?.();
          } catch (err) {}
        }
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!currentUserRef.current || isLoggingOutRef.current) return;
      const autoLogout = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      if (!autoLogout || timeoutMinutes <= 0) return;

      const timeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActivityTimeRef.current;

      if (elapsedMs >= timeoutMs) {
        performLogout(`You were logged out after ${timeoutMinutes} minute(s) of inactivity while the tab was not active.`);
      }
    };

    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [currentUser?.id, performLogout]);

  if (!showWarningModal || !currentUser) {
    return null;
  }

  const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;

  return (
    <div 
      data-inactivity-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
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
          You have been inactive. To safeguard workforce records and sensitive portal access, your session will end automatically in:
        </p>

        {/* Countdown Timer Display */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-600 tracking-wider">
            {remainingSeconds}s
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            Inactivity limit: {timeoutMinutes} {timeoutMinutes === 1 ? 'Minute' : 'Minutes'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleStayLoggedIn}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Stay Logged In</span>
          </button>

          <button
            type="button"
            onClick={handleLogOutNow}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
