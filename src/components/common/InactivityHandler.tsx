'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';

export default function InactivityHandler() {
  const { currentUser, logout, securitySettings, addToast, addAudit } = useApp();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15);

  const lastActivityRef = useRef<number>(Date.now());
  const lastStorageSyncRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset activity timestamp on intentional user interaction
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (showWarningModal) {
      setShowWarningModal(false);
    }
    // Throttle writing to localStorage to once every 1.5 seconds
    if (now - lastStorageSyncRef.current > 1500) {
      lastStorageSyncRef.current = now;
      try {
        localStorage.setItem('ems_last_active_timestamp', now.toString());
      } catch (e) {}
    }
  }, [showWarningModal]);

  // Execute clean auto-logout with audit & notification
  const executeAutoLogout = useCallback((reasonMsg?: string) => {
    if (isLoggingOutRef.current || !currentUser) return;
    isLoggingOutRef.current = true;
    setShowWarningModal(false);

    const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;
    const message = reasonMsg || `You have been automatically logged out due to ${timeoutMinutes} minute(s) of inactivity.`;

    addToast('Session Expired', message, 'info');

    try {
      addAudit(
        'SESSION_AUTO_LOGOUT_INACTIVITY',
        'User',
        currentUser.id,
        `User ${currentUser.name} (${currentUser.role}) auto-logged out after ${timeoutMinutes} min(s) inactivity.`,
        currentUser.name,
        currentUser.role
      );
    } catch (e) {}

    // Broadcast logout to other open tabs
    try {
      localStorage.setItem('ems_auth_session_logout', Date.now().toString());
    } catch (e) {}

    logout();
  }, [currentUser, securitySettings, addToast, addAudit, logout]);

  // Listen to intentional user interactions (clicks, keys, touches, scrolls, deliberate mouse moves)
  useEffect(() => {
    if (!currentUser) {
      isLoggingOutRef.current = false;
      return;
    }

    // Initialize activity timestamp upon login
    lastActivityRef.current = Date.now();
    isLoggingOutRef.current = false;
    try {
      localStorage.removeItem('ems_auth_session_logout');
      localStorage.setItem('ems_last_active_timestamp', Date.now().toString());
    } catch (e) {}

    const handleInteraction = () => recordActivity();

    // Mouse movement filter (ignore micro-jitter/sensor noise, only detect intentional cursor moves > 25px)
    const handleMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - lastMousePosRef.current.x);
      const dy = Math.abs(e.clientY - lastMousePosRef.current.y);
      if (dx > 25 || dy > 25) {
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        recordActivity();
      }
    };

    const directEvents = ['click', 'mousedown', 'pointerdown', 'keydown', 'keypress', 'touchstart', 'scroll', 'wheel'];

    directEvents.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      directEvents.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentUser, recordActivity]);

  // Multi-tab synchronization & background tab visibility handling
  useEffect(() => {
    if (!currentUser) return;

    // Cross-tab broadcast listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ems_auth_session_logout' && e.newValue) {
        if (!isLoggingOutRef.current) {
          isLoggingOutRef.current = true;
          setShowWarningModal(false);
          logout();
        }
      }
      if (e.key === 'ems_last_active_timestamp' && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val) && val > lastActivityRef.current) {
          lastActivityRef.current = val;
          if (showWarningModal) {
            setShowWarningModal(false);
          }
        }
      }
    };

    // Check immediately when tab gains focus or becomes visible
    const handleVisibilityOrFocus = () => {
      if (!currentUser || isLoggingOutRef.current) return;

      const isAutoLogoutActive = securitySettings?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;
      if (!isAutoLogoutActive || timeoutMinutes <= 0) return;

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

      // If user was away / tab inactive for >= timeout, log out immediately upon return
      if (elapsedMs >= timeoutMs) {
        executeAutoLogout(`You were logged out after ${timeoutMinutes} minute(s) of inactivity while the tab was not active.`);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [currentUser, securitySettings, logout, executeAutoLogout, showWarningModal]);

  // Main inactivity timer tick (every 500ms)
  useEffect(() => {
    if (!currentUser) {
      setShowWarningModal(false);
      return;
    }

    const checkInterval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const isAutoLogoutActive = securitySettings?.autoLogoutOnInactivity !== false;
      const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;

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

      // Warning threshold: 15s for 1 min timeout, or up to 30s for longer timeouts
      const warningThresholdSec = timeoutMinutes <= 1 ? 15 : Math.min(30, Math.floor((timeoutMinutes * 60) / 3));

      if (remainingSec <= 0) {
        // Inactivity limit reached -> terminate session
        executeAutoLogout();
      } else if (remainingSec <= warningThresholdSec && remainingSec > 0) {
        // Show interactive warning modal if tab is currently visible
        if (document.visibilityState === 'visible') {
          setRemainingSeconds(remainingSec);
          setShowWarningModal(true);
        }
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [currentUser, securitySettings, executeAutoLogout, showWarningModal]);

  if (!showWarningModal || !currentUser) {
    return null;
  }

  const timeoutMinutes = securitySettings?.sessionTimeoutMinutes ?? 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
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
              executeAutoLogout();
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
