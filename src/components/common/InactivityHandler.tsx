'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';

export default function InactivityHandler() {
  const { currentUser, logout, securitySettings, addToast, addAudit } = useApp();

  // Explicit warning countdown state
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  // Stable references to prevent effect thrashing
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

  // Single timestamp of the last user action
  const lastActionTimestampRef = useRef<number>(Date.now());
  const isLoggedOutRef = useRef<boolean>(false);
  const isWarningActiveRef = useRef<boolean>(false);

  // Synchronize ref with state
  useEffect(() => {
    isWarningActiveRef.current = isWarningActive;
  }, [isWarningActive]);

  // Guaranteed Hard Logout
  const executeHardLogout = useCallback((reason?: string) => {
    if (isLoggedOutRef.current) return;
    isLoggedOutRef.current = true;
    setIsWarningActive(false);
    isWarningActiveRef.current = false;

    const user = currentUserRef.current;
    const timeoutMin = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
    const msg = reason || `You have been automatically logged out after ${timeoutMin} minute(s) of inactivity.`;

    try {
      addToastRef.current?.('Session Expired', msg, 'info');
    } catch (e) {}

    if (user) {
      try {
        addAuditRef.current?.(
          'SESSION_AUTO_LOGOUT_INACTIVITY',
          'User',
          user.id,
          `User ${user.name} (${user.role}) automatically logged out after ${timeoutMin} min(s) inactivity.`,
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

  // Explicit "Continue Session" action
  const handleContinueSession = useCallback(() => {
    lastActionTimestampRef.current = Date.now();
    setIsWarningActive(false);
    isWarningActiveRef.current = false;
    setSecondsRemaining(15);
    try {
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}
  }, []);

  // Explicit "Log Out Now" action
  const handleLogOutNow = useCallback(() => {
    executeHardLogout('User chose to log out immediately.');
  }, [executeHardLogout]);

  // 1. Listen strictly to physical user interactions when NOT in warning modal
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleInteraction = () => {
      // If warning modal is open, user MUST click "Continue Session"
      if (isWarningActiveRef.current) return;
      lastActionTimestampRef.current = Date.now();
    };

    const directEvents = ['click', 'keydown', 'touchstart'];
    directEvents.forEach(evt => {
      window.addEventListener(evt, handleInteraction, { passive: true });
    });

    return () => {
      directEvents.forEach(evt => {
        window.removeEventListener(evt, handleInteraction);
      });
    };
  }, [currentUser?.id]);

  // 2. Idle Tracker: Triggers the 15-Second Warning Screen at 45s of Inactivity
  useEffect(() => {
    if (!currentUser?.id) {
      isLoggedOutRef.current = false;
      setIsWarningActive(false);
      isWarningActiveRef.current = false;
      return;
    }

    lastActionTimestampRef.current = Date.now();
    isLoggedOutRef.current = false;
    setIsWarningActive(false);
    isWarningActiveRef.current = false;

    try {
      localStorage.removeItem('ems_auth_session_logout');
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}

    const idleChecker = setInterval(() => {
      if (isLoggedOutRef.current) return;
      if (isWarningActiveRef.current) return; // Warning countdown handles itself once triggered

      const autoLogout = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      if (!autoLogout || timeoutMinutes <= 0) return;

      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActionTimestampRef.current;
      const warningThresholdMs = Math.max(0, totalTimeoutMs - 15000); // Trigger at 45 seconds for 1 min timeout

      // If user reached or exceeded total timeout without warning
      if (elapsedMs >= totalTimeoutMs) {
        executeHardLogout();
        return;
      }

      // If user reached 45 seconds idle -> Trigger Warning Screen!
      if (elapsedMs >= warningThresholdMs) {
        const remainingMs = totalTimeoutMs - elapsedMs;
        const initialSeconds = Math.max(1, Math.min(15, Math.ceil(remainingMs / 1000)));
        setSecondsRemaining(initialSeconds);
        setIsWarningActive(true);
        isWarningActiveRef.current = true;
      }
    }, 500);

    return () => clearInterval(idleChecker);
  }, [currentUser?.id, executeHardLogout]);

  // 3. Dedicated 15-Second Countdown State Machine (Runs uninterrupted while warning is active)
  useEffect(() => {
    if (!isWarningActive || isLoggedOutRef.current) return;

    const countdownTimer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          // 0 seconds reached -> Terminate session immediately!
          executeHardLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isWarningActive, executeHardLogout]);

  // 4. Cross-tab synchronization and background tab auto-expiration
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ems_auth_session_logout' && e.newValue) {
        if (!isLoggedOutRef.current) {
          isLoggedOutRef.current = true;
          setIsWarningActive(false);
          isWarningActiveRef.current = false;
          try {
            logoutRef.current?.();
          } catch (e) {}
        }
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!currentUserRef.current || isLoggedOutRef.current) return;
      const autoLogout = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      if (!autoLogout || timeoutMinutes <= 0) return;

      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActionTimestampRef.current;

      // If away for >= timeout, immediately log out upon returning
      if (elapsedMs >= totalTimeoutMs) {
        executeHardLogout(`You were logged out after ${timeoutMinutes} minute(s) of inactivity while the tab was in the background.`);
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
  }, [currentUser?.id, executeHardLogout]);

  if (!isWarningActive || !currentUser) {
    return null;
  }

  const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;

  return (
    <div 
      data-inactivity-modal="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
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
              Security Protection
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Session Expiring Soon</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          For security and data protection, your session will automatically terminate if no activity is detected:
        </p>

        {/* Live Countdown Display */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
          <div className="text-4xl sm:text-5xl font-black font-mono text-amber-600 tracking-wider animate-pulse">
            {secondsRemaining}s
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            Auto-Logout Inactivity Limit: {timeoutMinutes} {timeoutMinutes === 1 ? 'Minute' : 'Minutes'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleContinueSession}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Continue Session</span>
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
