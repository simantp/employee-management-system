'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';

export default function InactivityHandler() {
  const { currentUser, logout, securitySettings, addToast, addAudit } = useApp();

  // Active countdown number (null when safe, 15..1 when warning modal is displayed)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Stable references to prevent effect re-triggering
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

  // Single in-memory timestamp of the last user physical action
  const lastActionTimestampRef = useRef<number>(Date.now());
  const isLoggedOutRef = useRef<boolean>(false);

  // Hard logout function
  const terminateSession = useCallback((reasonMsg?: string) => {
    if (isLoggedOutRef.current) return;
    isLoggedOutRef.current = true;
    setSecondsRemaining(null);

    const user = currentUserRef.current;
    const timeoutMin = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
    const message = reasonMsg || `You have been automatically logged out after ${timeoutMin} minute(s) of inactivity.`;

    try {
      addToastRef.current?.('Session Expired', message, 'info');
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

  // Explicit user action: "Stay Logged In"
  const handleStayLoggedIn = useCallback(() => {
    lastActionTimestampRef.current = Date.now();
    setSecondsRemaining(null);
    try {
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}
  }, []);

  // Explicit user action: "Log Out Now"
  const handleLogOutNow = useCallback(() => {
    terminateSession('User clicked Log Out on inactivity notice.');
  }, [terminateSession]);

  // 1. Direct physical user interaction listener
  useEffect(() => {
    if (!currentUser?.id) return;

    const onInteraction = () => {
      const timeoutMin = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      const totalTimeoutMs = timeoutMin * 60 * 1000;
      const elapsed = Date.now() - lastActionTimestampRef.current;
      const warningWindowStart = Math.max(0, totalTimeoutMs - 15000);

      // Synchronous Guard: If we are already in the 15-second warning zone, ambient clicks do NOT reset the clock
      if (elapsed >= warningWindowStart) {
        return;
      }

      lastActionTimestampRef.current = Date.now();
    };

    const directEvents = ['click', 'keydown', 'touchstart'];
    directEvents.forEach(evt => {
      window.addEventListener(evt, onInteraction, { passive: true });
    });

    return () => {
      directEvents.forEach(evt => {
        window.removeEventListener(evt, onInteraction);
      });
    };
  }, [currentUser?.id]);

  // 2. Continuous Monotonic Inactivity Clock (ticks every 250ms)
  useEffect(() => {
    if (!currentUser?.id) {
      isLoggedOutRef.current = false;
      setSecondsRemaining(null);
      return;
    }

    // Initialize clock on login
    lastActionTimestampRef.current = Date.now();
    isLoggedOutRef.current = false;
    setSecondsRemaining(null);

    try {
      localStorage.removeItem('ems_auth_session_logout');
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}

    const clock = setInterval(() => {
      if (isLoggedOutRef.current) return;

      const autoLogout = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      if (!autoLogout || timeoutMinutes <= 0) {
        setSecondsRemaining(prev => (prev === null ? prev : null));
        return;
      }

      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActionTimestampRef.current;
      const remainingMs = totalTimeoutMs - elapsedMs;

      // 60s reached -> Hard Logout!
      if (elapsedMs >= totalTimeoutMs) {
        terminateSession();
        return;
      }

      // Warning window: 45s to 60s (15s remaining down to 1s)
      const warningWindowStart = Math.max(0, totalTimeoutMs - 15000);
      if (elapsedMs >= warningWindowStart && remainingMs > 0) {
        const sec = Math.max(1, Math.min(15, Math.ceil(remainingMs / 1000)));
        setSecondsRemaining(prev => (prev === sec ? prev : sec));
      } else {
        // Normal active zone (0s to 45s)
        setSecondsRemaining(prev => (prev === null ? prev : null));
      }
    }, 250);

    return () => clearInterval(clock);
  }, [currentUser?.id, terminateSession]);

  // 3. Multi-Tab sync & background tab wake-up check
  useEffect(() => {
    if (!currentUser?.id) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ems_auth_session_logout' && e.newValue) {
        if (!isLoggedOutRef.current) {
          isLoggedOutRef.current = true;
          setSecondsRemaining(null);
          try {
            logoutRef.current?.();
          } catch (e) {}
        }
      } else if (e.key === 'ems_security_settings_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            securitySettingsRef.current = {
              ...securitySettingsRef.current,
              ...parsed,
              sessionTimeoutMinutes: Number(parsed.sessionTimeoutMinutes) || 1,
              autoLogoutOnInactivity: parsed.autoLogoutOnInactivity !== false,
            };
          }
        } catch (err) {}
      }
    };

    const onVisibilityOrFocus = () => {
      if (!currentUserRef.current || isLoggedOutRef.current) return;
      try {
        const saved = localStorage.getItem('ems_security_settings_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            securitySettingsRef.current = {
              ...securitySettingsRef.current,
              ...parsed,
              sessionTimeoutMinutes: Number(parsed.sessionTimeoutMinutes) || 1,
              autoLogoutOnInactivity: parsed.autoLogoutOnInactivity !== false,
            };
          }
        }
      } catch (e) {}

      const autoLogout = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      if (!autoLogout || timeoutMinutes <= 0) return;

      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActionTimestampRef.current;

      if (elapsedMs >= totalTimeoutMs) {
        terminateSession(`You were logged out after ${timeoutMinutes} minute(s) of inactivity while the tab was not active.`);
      }
    };

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [currentUser?.id, terminateSession]);

  const isVisible = secondsRemaining !== null && !!currentUser;
  const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;

  return (
    <div 
      data-inactivity-modal="true"
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none transition-opacity duration-200 ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div 
        className={`bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 text-slate-900 relative transform transition-transform duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
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
          For security and workforce privacy, your session will automatically terminate if no activity is detected:
        </p>

        {/* High-Visibility Live Countdown Display */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
          <div className="text-4xl sm:text-5xl font-black font-mono text-amber-600 tracking-wider">
            {secondsRemaining ?? 15}s
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            Auto-Logout Inactivity Limit: {timeoutMinutes} {timeoutMinutes === 1 ? 'Minute' : 'Minutes'}
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
