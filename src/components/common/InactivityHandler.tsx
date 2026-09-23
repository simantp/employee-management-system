'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';

export default function InactivityHandler() {
  const { currentUser, logout, securitySettings, addToast, addAudit } = useApp();
  
  // Warning countdown state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(15);

  // Stable references to store methods and state to prevent effect re-runs
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

  // Single in-memory timestamp for last physical user action
  const lastActionTimeRef = useRef<number>(Date.now());
  const isWarningModalOpenRef = useRef<boolean>(false);
  const isLoggedOutRef = useRef<boolean>(false);

  // Hard banking-style logout
  const performHardLogout = useCallback((reasonMessage?: string) => {
    if (isLoggedOutRef.current) return;
    isLoggedOutRef.current = true;
    isWarningModalOpenRef.current = false;
    setShowWarningModal(false);

    const user = currentUserRef.current;
    const timeoutMin = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
    const message = reasonMessage || `You were automatically logged out after ${timeoutMin} minute(s) of inactivity for security.`;

    try {
      addToastRef.current?.('Session Expired', message, 'info');
    } catch (e) {}

    if (user) {
      try {
        addAuditRef.current?.(
          'SESSION_AUTO_LOGOUT_INACTIVITY',
          'User',
          user.id,
          `User ${user.name} (${user.role}) automatically logged out after ${timeoutMin} minute(s) of inactivity.`,
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

  // Continue session action (User explicitly clicks "Continue Session / Stay Logged In")
  const handleContinueSession = useCallback(() => {
    const now = Date.now();
    lastActionTimeRef.current = now;
    isWarningModalOpenRef.current = false;
    setShowWarningModal(false);
    setCountdownSeconds(15);
    try {
      localStorage.setItem('ems_last_active_timestamp', now.toString());
    } catch (e) {}
  }, []);

  // Log Out Now button
  const handleLogOutNow = useCallback(() => {
    isWarningModalOpenRef.current = false;
    setShowWarningModal(false);
    performHardLogout('User chose to log out from inactivity warning.');
  }, [performHardLogout]);

  // 1. Listen strictly to physical user interactions (Clicks, Typing, Mobile Touch)
  useEffect(() => {
    if (!currentUser?.id) return;

    const onUserInteraction = () => {
      // If the warning modal is active, user must explicitly click "Continue Session"
      if (isWarningModalOpenRef.current) return;
      lastActionTimeRef.current = Date.now();
    };

    const directEvents = ['click', 'keydown', 'touchstart'];
    directEvents.forEach(evt => {
      window.addEventListener(evt, onUserInteraction, { passive: true });
    });

    return () => {
      directEvents.forEach(evt => {
        window.removeEventListener(evt, onUserInteraction);
      });
    };
  }, [currentUser?.id]);

  // 2. High-precision Inactivity & Countdown Monitor (runs every 250ms)
  useEffect(() => {
    if (!currentUser?.id) {
      isLoggedOutRef.current = false;
      isWarningModalOpenRef.current = false;
      setShowWarningModal(false);
      return;
    }

    // Reset clock upon login
    lastActionTimeRef.current = Date.now();
    isLoggedOutRef.current = false;
    isWarningModalOpenRef.current = false;
    setShowWarningModal(false);

    try {
      localStorage.removeItem('ems_auth_session_logout');
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}

    const interval = setInterval(() => {
      if (isLoggedOutRef.current) return;

      const autoLogoutEnabled = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;

      if (!autoLogoutEnabled || timeoutMinutes <= 0) {
        if (isWarningModalOpenRef.current) {
          isWarningModalOpenRef.current = false;
          setShowWarningModal(false);
        }
        return;
      }

      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActionTimeRef.current;
      const remainingMs = totalTimeoutMs - elapsedMs;

      // 60 Seconds Reached -> Immediate Hard Logout
      if (remainingMs <= 0) {
        performHardLogout();
        return;
      }

      // Warning Zone (Last 15 Seconds: between 45s and 60s)
      const warningWindowMs = 15 * 1000;
      if (remainingMs <= warningWindowMs) {
        const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
        isWarningModalOpenRef.current = true;
        setCountdownSeconds(remainingSec);
        setShowWarningModal(true);
      } else {
        // Safe Zone (0s - 45s)
        if (isWarningModalOpenRef.current) {
          isWarningModalOpenRef.current = false;
          setShowWarningModal(false);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [currentUser?.id, performHardLogout]);

  // 3. Multi-Tab Broadcast & Inactive Tab Immediate Expiration Check
  useEffect(() => {
    if (!currentUser?.id) return;

    // Cross-Tab Logout Synchronization
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'ems_auth_session_logout' && e.newValue) {
        if (!isLoggedOutRef.current) {
          isLoggedOutRef.current = true;
          isWarningModalOpenRef.current = false;
          setShowWarningModal(false);
          try {
            logoutRef.current?.();
          } catch (err) {}
        }
      }
    };

    // Immediate check when tab becomes active / focused
    const onVisibilityOrFocusChange = () => {
      if (!currentUserRef.current || isLoggedOutRef.current) return;
      const autoLogoutEnabled = securitySettingsRef.current?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettingsRef.current?.sessionTimeoutMinutes ?? 1;
      if (!autoLogoutEnabled || timeoutMinutes <= 0) return;

      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActionTimeRef.current;

      if (elapsedMs >= totalTimeoutMs) {
        performHardLogout(`You were logged out after ${timeoutMinutes} minute(s) of inactivity while the tab was in the background.`);
      }
    };

    window.addEventListener('storage', onStorageChange);
    document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
    window.addEventListener('focus', onVisibilityOrFocusChange);

    return () => {
      window.removeEventListener('storage', onStorageChange);
      document.removeEventListener('visibilitychange', onVisibilityOrFocusChange);
      window.removeEventListener('focus', onVisibilityOrFocusChange);
    };
  }, [currentUser?.id, performHardLogout]);

  // Do not render anything if user is logged out or modal is not triggered
  if (!showWarningModal || !currentUser) {
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
          For banking-grade compliance and data protection, your session will automatically terminate if no activity is detected:
        </p>

        {/* High-Visibility Live Countdown Display */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
          <div className="text-4xl sm:text-5xl font-black font-mono text-amber-600 tracking-wider animate-pulse">
            {countdownSeconds}s
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
