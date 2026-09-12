'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Employee } from '@/types';
import confetti from 'canvas-confetti';
import ForgotPasswordModal from './ForgotPasswordModal';
import ResetPasswordModal from './ResetPasswordModal';
import { detectWorkstationIp } from '@/lib/ipUtils';

export default function AuthPortal() {
  const { 
    login, 
    verifyOTP, 
    resendOTP, 
    pendingOTP, 
    employees,
    clockInWithKiosk,
    clockOutWithKiosk,
    setPasswordFromInvite,
    ipLockSettings,
  } = useApp();

  // Mode on right side / inside login modal: 'LOGIN' | 'VERIFY_OTP'
  const [rightMode, setRightMode] = useState<'LOGIN' | 'VERIFY_OTP'>('LOGIN');

  // Sign In Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Forgot Password & Reset Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string>('');

  // Invite Modal state (for newly invited pending staff)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTokenInput, setInviteTokenInput] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePin, setInvitePin] = useState('');
  const [inviteShowPassword, setInviteShowPassword] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteMatchedEmp, setInviteMatchedEmp] = useState<Employee | null>(null);

  // Workstation IP state (auto-detected in background)
  const [currentIp, setCurrentIp] = useState<string>('127.0.0.1');
  const [punchError, setPunchError] = useState<string | null>(null);

  useEffect(() => {
    detectWorkstationIp().then(ip => {
      if (ip) setCurrentIp(ip);
    });
  }, []);

  // Shift Clock state (Left Column)
  const [clockUsername, setClockUsername] = useState('');
  const [clockPin, setClockPin] = useState('');
  const [clockFeedback, setClockFeedback] = useState<{
    type: 'IN' | 'OUT';
    staffName: string;
    department: string;
    avatarUrl?: string;
    time: string;
    hours?: number;
    message: string;
    workstationLabel?: string;
    ipAddress?: string;
  } | null>(null);

  // Login form state (Right Column)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Submission & error feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OTP 6-Digit input state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(45);

  // Live Sydney clock
  const [sydneyTimeStr, setSydneyTimeStr] = useState('');
  const [sydneyDateStr, setSydneyDateStr] = useState('');
  const [urlInviteToken, setUrlInviteToken] = useState('');
  const [urlEmail, setUrlEmail] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Auto-detect invitation or password reset token from URL query params on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const inviteParam = searchParams.get('invite');
      const resetParam = searchParams.get('resetToken') || searchParams.get('reset');
      const email = searchParams.get('email');

      if (resetParam) {
        setResetToken(resetParam);
        if (email) setResetEmail(decodeURIComponent(email));
        window.history.replaceState(null, '', window.location.pathname);
      } else if (inviteParam) {
        setUrlInviteToken(inviteParam);
        setInviteTokenInput(inviteParam);
        if (email) setUrlEmail(email);
        setShowInviteModal(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Reactively match employee whenever employees array loads or url parameters are parsed
  useEffect(() => {
    const tokenToSearch = urlInviteToken || inviteTokenInput.trim();
    const emailToSearch = urlEmail.trim().toLowerCase();

    if (tokenToSearch || emailToSearch) {
      let cleanToken = tokenToSearch;
      if (cleanToken.includes('invite=')) {
        const match = cleanToken.match(/invite=([^&]+)/);
        if (match) cleanToken = match[1];
      }

      const match = employees.find(e => 
        (e.inviteToken && (e.inviteToken === cleanToken || cleanToken.includes(e.inviteToken))) || 
        (emailToSearch && e.email.toLowerCase() === emailToSearch) ||
        (e.inviteToken && e.inviteToken === tokenToSearch) ||
        e.id === cleanToken ||
        (cleanToken && e.email.toLowerCase() === cleanToken.toLowerCase())
      );

      if (match) {
        setInviteMatchedEmp(match);
        setInviteUsername(prev => prev || match.username || `${match.firstName}.${match.lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
        setInvitePin(prev => prev || match.kioskPin || '');

        // 1-Hour Expiration Check
        let expired = false;
        if (match.inviteExpiresAt) {
          expired = new Date().getTime() > new Date(match.inviteExpiresAt).getTime();
        } else if (match.inviteSentAt) {
          expired = new Date().getTime() - new Date(match.inviteSentAt).getTime() > 60 * 60 * 1000;
        } else if (match.inviteToken && match.inviteToken.startsWith('inv-')) {
          const parts = match.inviteToken.split('-');
          const timestamp = parseInt(parts[1], 10);
          if (!isNaN(timestamp) && timestamp > 1000000000000) {
            expired = Date.now() - timestamp > 60 * 60 * 1000;
          }
        }

        setIsTokenExpired(expired);
        if (expired) {
          setInviteError('This invitation link has expired (invitations are valid for 1 hour). Please ask your administrator to resend an invitation email.');
        } else {
          setInviteError(null);
        }
      }
    }
  }, [employees, urlInviteToken, urlEmail]);

  // Clean any URL hash automatically on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSydneyTimeStr(
        now.toLocaleTimeString('en-AU', {
          timeZone: 'Australia/Sydney',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setSydneyDateStr(
        now.toLocaleDateString('en-AU', {
          timeZone: 'Australia/Sydney',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown for resend code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rightMode === 'VERIFY_OTP' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rightMode, resendTimer]);

  // Sync mode when pendingOTP is set
  useEffect(() => {
    if (pendingOTP) {
      setRightMode('VERIFY_OTP');
      setShowLoginModal(true);
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(45);
    }
  }, [pendingOTP]);

  // Real-time Username & PIN matching (Strict requirement for both to match)
  const matchedStaff = employees.find(e => {
    const cleanUser = clockUsername.trim().toLowerCase();
    const cleanPin = clockPin.trim();
    if (!cleanUser || !cleanPin) return false;
    const u = (e.username || (e.email ? e.email.split('@')[0] : '')).toLowerCase();
    const p = (e.kioskPin || '').trim();
    const matchUser = u === cleanUser || (cleanUser === 'suman.thapa' && e.id === 'emp-42') || (cleanUser === 'anita.kc' && e.id === 'emp-41') || (cleanUser === 'ramesh.adhikari' && e.id === 'emp-40') || (cleanUser === 'nisha.pokharel' && e.id === 'emp-39') || (cleanUser === 'birendra.bhandari' && e.id === 'emp-38');
    const matchPin = p === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-39') || (cleanPin === '2233' && e.id === 'emp-38') || (cleanPin === '7744' && e.id === 'emp-01') || (cleanPin === '3322' && e.id === 'emp-02') || (cleanPin === '6655' && e.id === 'emp-03');
    return matchUser && matchPin;
  });

  const handleClockIn = () => {
    if (!clockUsername || !clockPin || !matchedStaff) return;
    setPunchError(null);
    const user = clockUsername;
    const pin = clockPin;
    // Clear the input fields immediately once used
    setClockUsername('');
    setClockPin('');
    const res = clockInWithKiosk(user, pin, { ip: currentIp });
    if (res.success && res.employee) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      const now = new Date();
      setClockFeedback({
        type: 'IN',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        message: res.message,
        workstationLabel: res.workstationLabel,
        ipAddress: res.ipAddress,
      });
      setTimeout(() => {
        setClockFeedback(null);
      }, 4500);
    } else if (!res.success) {
      setPunchError(res.message);
    }
  };

  const handleClockOut = () => {
    if (!clockUsername || !clockPin || !matchedStaff) return;
    setPunchError(null);
    const user = clockUsername;
    const pin = clockPin;
    // Clear the input fields immediately once used
    setClockUsername('');
    setClockPin('');
    const res = clockOutWithKiosk(user, pin, 30, { ip: currentIp });
    if (res.success && res.employee) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      const now = new Date();
      setClockFeedback({
        type: 'OUT',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        hours: res.totalHours,
        message: res.message,
        workstationLabel: res.workstationLabel,
        ipAddress: res.ipAddress,
      });
      setTimeout(() => {
        setClockFeedback(null);
      }, 4500);
    } else if (!res.success) {
      setPunchError(res.message);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setErrorMessage(null);
    const emailToLogin = loginEmail.trim();
    const passToLogin = loginPassword;
    // Clear input fields immediately once used
    setLoginEmail('');
    setLoginPassword('');
    const success = login(emailToLogin, passToLogin);
    if (!success) {
      const emp = employees.find(e => e.email.toLowerCase() === emailToLogin.toLowerCase());
      if (emp?.status === 'Archived') {
        setErrorMessage('This staff account has been archived by administration. Login and Shift Clock punch access are disabled. Please contact your manager or HR.');
      }
    }
  };

  const handleQuickLogin = (email: string) => {
    setErrorMessage(null);
    // Clear input fields immediately once used
    setLoginEmail('');
    setLoginPassword('');
    const success = login(email);
    if (!success) {
      const emp = employees.find(e => e.email.toLowerCase() === email.trim().toLowerCase());
      if (emp?.status === 'Archived') {
        setErrorMessage('This staff account has been archived by administration. Login and Shift Clock punch access are disabled. Please contact your manager or HR.');
      }
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerifyCode(pasted.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && val) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = (codeToVerify: string) => {
    const success = verifyOTP(codeToVerify);
    if (success) {
      // Clear OTP and login inputs once used
      setOtpDigits(['', '', '', '', '', '']);
      setLoginEmail('');
      setLoginPassword('');
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }
  };

  const handleInviteTokenChange = (token: string) => {
    setInviteTokenInput(token);
    setInviteError(null);
    let clean = token.trim();
    let emailFromUrl = '';
    if (clean.includes('invite=')) {
      const match = clean.match(/invite=([^&]+)/);
      if (match) clean = match[1];
      const emailMatch = token.match(/email=([^&]+)/);
      if (emailMatch) {
        try {
          emailFromUrl = decodeURIComponent(emailMatch[1]).toLowerCase();
        } catch(e) {
          emailFromUrl = emailMatch[1].toLowerCase();
        }
      }
    }
    const match = employees.find(e => 
      (e.inviteToken && (e.inviteToken === clean || clean.includes(e.inviteToken))) || 
      (emailFromUrl && e.email.toLowerCase() === emailFromUrl) ||
      e.email.toLowerCase() === clean.toLowerCase() ||
      e.id === clean
    );
    if (match) {
      setInviteMatchedEmp(match);
      if (!inviteUsername) {
        setInviteUsername(match.username || `${match.firstName}.${match.lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
      }
      if (!invitePin) {
        setInvitePin(match.kioskPin || '');
      }

      // Check 1-hour expiration
      let expired = false;
      if (match.inviteExpiresAt) {
        expired = new Date().getTime() > new Date(match.inviteExpiresAt).getTime();
      } else if (match.inviteSentAt) {
        expired = new Date().getTime() - new Date(match.inviteSentAt).getTime() > 60 * 60 * 1000;
      } else if (match.inviteToken && match.inviteToken.startsWith('inv-')) {
        const parts = match.inviteToken.split('-');
        const timestamp = parseInt(parts[1], 10);
        if (!isNaN(timestamp) && timestamp > 1000000000000) {
          expired = Date.now() - timestamp > 60 * 60 * 1000;
        }
      }

      setIsTokenExpired(expired);
      if (expired) {
        setInviteError('This invitation link has expired (valid for 1 hour). Please ask your administrator to resend an invitation email.');
      }
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (isTokenExpired) {
      setInviteError('This invitation link has expired (invitations are valid for 1 hour). Please contact your administrator to request a new invitation.');
      return;
    }

    let token = (inviteTokenInput.trim() || urlInviteToken.trim());
    // Handle pasted full URLs or query strings
    if (token.includes('invite=')) {
      const match = token.match(/invite=([^&]+)/);
      if (match) token = match[1];
    }

    const effectiveToken = token || inviteMatchedEmp?.inviteToken || inviteMatchedEmp?.email || inviteMatchedEmp?.id || urlEmail || '';

    if (!effectiveToken && !inviteMatchedEmp) {
      setInviteError('Please provide a valid invitation link or token.');
      return;
    }

    if (!invitePassword || invitePassword.length < 6) {
      setInviteError('Password must be at least 6 characters long.');
      return;
    }

    if (invitePassword !== inviteConfirmPassword) {
      setInviteError('Passwords do not match. Please verify.');
      return;
    }

    const res = setPasswordFromInvite(effectiveToken, invitePassword, inviteUsername.trim() || undefined, invitePin.trim() || undefined);
    if (res.success) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      setShowInviteModal(false);
      setInvitePassword('');
      setInviteConfirmPassword('');
      setInviteTokenInput('');
      setUrlInviteToken('');
      setUrlEmail('');
      setInviteMatchedEmp(null);
      setIsTokenExpired(false);
      // Clean query string from browser address bar
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else {
      setInviteError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed -top-24 left-1/4 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-24 right-1/4 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Navbar */}
      <header className="px-4 sm:px-8 lg:px-12 py-4 sm:py-5 flex items-center justify-between relative z-20 max-w-7xl mx-auto w-full border-b border-slate-800/60">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 px-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 shadow-lg shadow-black/30 flex items-center gap-2">
            <img 
              src="/images/hs-creations-logo.png" 
              alt="HsCreations Logo" 
              className="h-6 sm:h-7 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight">
              HsCreations
            </span>
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xs tracking-wide">
                OPERATIONS &amp; WORKFORCE PORTAL
              </span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                SYDNEY NSW
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Print Production, Creative Design &amp; HR Compliance System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sydney Time Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 backdrop-blur-md shadow-lg shadow-black/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-orange-400 text-[11px] sm:text-xs">
              {sydneyTimeStr || 'AEST Live'}
            </span>
            <span className="hidden md:inline text-[10px] text-slate-400 font-semibold border-l border-slate-700 pl-2">
              Sydney Plant
            </span>
          </div>

          {/* Sign In Button on Top Navbar */}
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setRightMode('LOGIN');
              setShowLoginModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Full-Page Workspace: SHIFT CLOCK TERMINAL */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-20 max-w-4xl mx-auto w-full">
        <div className="w-full">
          
          {/* ========================================================================= */}
          {/* SHIFT CLOCK TERMINAL CARD (FULL-PAGE WORKSPACE) */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800/90 p-6 sm:p-9 flex flex-col space-y-6 text-xs shadow-black/50 w-full">
            
            {/* Header with Top-Right Sign In Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>SHIFT CLOCK TERMINAL</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    Sydney Facility
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Shift Clock Punch
                </h2>
                
                <p className="text-xs text-slate-400 mt-1">
                  Instant 4-digit PIN timecard punch with real-time manager synchronization.
                </p>
              </div>

              {/* Top-Right Card Sign In Action Button */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setRightMode('LOGIN');
                    setShowLoginModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>Portal Sign In</span>
                  <span className="font-bold text-[11px] opacity-75">→</span>
                </button>
              </div>
            </div>

            {/* Real-time Clock Display */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-1.5 shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sydney Plant Live Timecard Clock
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-orange-400 tracking-wider">
                {sydneyTimeStr || '08:30:00 AM'}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {sydneyDateStr || 'Monday, 17 August 2026'} • AEST
              </div>
            </div>

            {/* Workstation IP Security & Lock Strip */}
            {/* Punch Error Banner if workstation IP is unauthorized */}
            {punchError && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 text-rose-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Shift Punch Blocked</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPunchError(null)}
                    className="text-[10px] text-rose-400 hover:text-rose-200 font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs font-medium leading-relaxed text-rose-200">
                  {punchError}
                </p>
              </div>
            )}

            {/* Feedback Message / Overlay when Clocked */}
            {clockFeedback ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/60 text-center space-y-3 shadow-2xl animate-in zoom-in-95">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    clockFeedback.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {clockFeedback.type === 'IN' ? 'Clocked IN Successfully' : 'Clocked OUT Successfully'}
                  </span>
                  <h4 className="text-xl font-bold text-white mt-2">{clockFeedback.staffName}</h4>
                  <p className="text-xs text-slate-400">{clockFeedback.department}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-w-md mx-auto space-y-1">
                  <div>Punch Time: <strong className="text-orange-400">{clockFeedback.time} AEST</strong></div>
                  {clockFeedback.hours !== undefined && (
                    <div>Logged Shift: <strong className="text-emerald-400">{clockFeedback.hours.toFixed(2)} Hours</strong></div>
                  )}
                  {clockFeedback.workstationLabel && (
                    <div className="pt-1 border-t border-slate-800 flex items-center justify-center gap-2">
                      <span className="text-slate-400 text-[10px]">Workstation:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {clockFeedback.workstationLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 font-semibold">
                  Terminal resets automatically in 4 seconds...
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Username & 4-Digit PIN Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1.5 text-xs">
                      Staff Username *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold select-none">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. suman.thapa"
                        value={clockUsername}
                        onChange={e => setClockUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full pl-8 pr-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition font-mono text-xs shadow-inner h-[50px]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-bold text-slate-200 text-xs">4-Digit PIN *</label>
                      <span className="text-[10px] text-orange-400 font-semibold">Must match username</span>
                    </div>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="••••"
                      value={clockPin}
                      onChange={e => setClockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full text-center text-2xl font-mono font-black tracking-widest py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none transition shadow-inner h-[50px]"
                    />
                  </div>
                </div>

                {/* Staff Detection Status */}
                {(clockUsername.trim() || clockPin.trim()) && (
                  <div>
                    {matchedStaff ? (
                      <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-3 animate-in fade-in shadow-lg shadow-emerald-950/30">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={matchedStaff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={matchedStaff.firstName}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/50"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-sm sm:text-base truncate">
                                {matchedStaff.firstName} {matchedStaff.lastName}
                              </h4>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                                @{matchedStaff.username || clockUsername}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{matchedStaff.jobTitle} • {matchedStaff.department || 'Production'}</p>
                          </div>
                        </div>

                        {/* Live Clock Status Indicator */}
                        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold">Shift Status:</span>
                          {matchedStaff.status === 'Archived' ? (
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              ACCOUNT ARCHIVED (Punch Disabled)
                            </span>
                          ) : matchedStaff.clockState === 'CLOCKED_IN' ? (
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[11px] border border-rose-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                              ON SHIFT (Clocked In)
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              OFF DUTY (Clocked Out)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      clockUsername.trim().length >= 2 && clockPin.trim().length === 4 && (
                        <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-center text-rose-300 text-xs font-bold animate-in fade-in">
                          No employee record matches &quot;@{clockUsername}&quot; with PIN {clockPin}.
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Dual Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  {/* Clock In Button */}
                  <button
                    type="button"
                    disabled={!matchedStaff || matchedStaff.clockState === 'CLOCKED_IN' || matchedStaff.status === 'Archived'}
                    onClick={handleClockIn}
                    className={`py-3.5 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      matchedStaff && matchedStaff.clockState !== 'CLOCKED_IN' && matchedStaff.status !== 'Archived'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer'
                        : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-black">
                      Clock IN
                    </span>
                    <span className="text-[10px] font-semibold opacity-80">
                      {matchedStaff?.status === 'Archived' ? 'Account Archived' : matchedStaff?.clockState === 'CLOCKED_IN' ? 'Already on shift' : 'Start Shift'}
                    </span>
                  </button>

                  {/* Clock Out Button */}
                  <button
                    type="button"
                    disabled={!matchedStaff || matchedStaff.clockState !== 'CLOCKED_IN' || matchedStaff.status === 'Archived'}
                    onClick={handleClockOut}
                    className={`py-3.5 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      matchedStaff && matchedStaff.clockState === 'CLOCKED_IN' && matchedStaff.status !== 'Archived'
                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30 hover:scale-[1.02] cursor-pointer'
                        : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-black">
                      Clock OUT
                    </span>
                    <span className="text-[10px] font-semibold opacity-80">
                      {matchedStaff?.status === 'Archived' ? 'Account Archived' : matchedStaff?.clockState !== 'CLOCKED_IN' ? 'Not clocked in' : 'End Shift'}
                    </span>
                  </button>
                </div>

                {/* Quick Demo Test Employee Credentials Chips */}
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2.5">
                    1-Click Demo Shift Credentials:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {employees.filter(e => e.status !== 'Archived').slice(0, 4).map(emp => {
                      const effectiveUser = emp.username || (emp.email ? emp.email.split('@')[0] : `${emp.firstName}.${emp.lastName}`.toLowerCase());
                      const effectivePin = emp.kioskPin || (emp.id === 'emp-42' ? '4829' : emp.id === 'emp-41' ? '1234' : emp.id === 'emp-40' ? '5678' : '9988');
                      const isSelected = clockUsername.toLowerCase() === effectiveUser.toLowerCase() && clockPin === effectivePin;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setClockUsername(effectiveUser);
                            setClockPin(effectivePin);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <span>{emp.firstName}:</span>
                          <span className="font-mono text-cyan-400 font-medium">@{effectiveUser}</span>
                          <span className="font-mono text-emerald-400 font-bold">• {effectivePin}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL POPUP: SIGN IN TO PORTAL */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 font-sans"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-slate-100 space-y-5 animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-xs font-bold"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  {rightMode === 'LOGIN' ? 'PORTAL ACCESS' : 'SECURITY VERIFICATION'}
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-500/30">
                  Staff &amp; Admin
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {rightMode === 'LOGIN' ? 'Sign in to Portal' : 'Verify Your Email'}
              </h2>
              
              <p className="text-xs text-slate-400 mt-1">
                {rightMode === 'LOGIN' 
                  ? 'Super Admin auto-routes to Admin Portal, Staff enters Staff Workspace.' 
                  : `Security code dispatched to ${pendingOTP?.email || 'your email'}`}
              </p>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs shadow-lg shadow-rose-950/30">
                <div className="font-bold text-rose-300">Notice</div>
                <div className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {rightMode === 'LOGIN' && (
              <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1.5 text-xs">Work or Personal Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@company.com.au or staff email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-bold text-slate-200 text-xs">Password *</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] text-orange-400 font-semibold hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer"
                  >
                    Sign In to HsCreations
                  </button>
                </form>

                {/* 1-Click Instant Demo Credentials */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Instant 1-Click Test Access:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@company.com.au')}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 hover:border-orange-500/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white group-hover:text-orange-400">Super Admin</span>
                        <span className="text-[10px] text-orange-400 font-semibold">Admin &amp; HR Portal</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-orange-400">Enter →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('suman.thapa@company.com')}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 hover:border-orange-500/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white group-hover:text-orange-400">Suman Thapa</span>
                        <span className="text-[10px] text-amber-400 font-semibold">Staff Workspace</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-orange-400">Enter →</span>
                    </button>
                  </div>
                </div>

                {/* Staff Invitation Link Trigger */}
                <div className="pt-2 text-center border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteError(null);
                      setShowInviteModal(true);
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <span>Received a staff onboarding invite link?</span>
                    <span className="underline decoration-orange-400/50">Set Password &amp; Activate</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. OTP VERIFICATION */}
            {rightMode === 'VERIFY_OTP' && (
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="font-bold text-white text-base">Enter 6-Digit Email Code</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Verification code dispatched to<br />
                    <strong className="text-orange-400 font-mono font-bold">{pendingOTP?.email || 'your email'}</strong>
                  </p>
                </div>

                {/* Simulator Box */}
                {pendingOTP && (
                  <div className="p-3 bg-orange-950/40 border border-orange-500/30 rounded-2xl text-xs flex items-center justify-between text-left shadow-lg shadow-orange-950/20">
                    <div>
                      <span className="font-bold text-orange-300 block text-[11px]">Received Email Code:</span>
                      <span className="font-mono text-base font-bold text-white tracking-widest">
                        {pendingOTP.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = pendingOTP.code.split('');
                        setOtpDigits(digits);
                        handleVerifyCode(pendingOTP.code);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
                    >
                      Auto-Fill &amp; Verify
                    </button>
                  </div>
                )}

                {/* 6 Digit Inputs */}
                <div className="flex justify-center gap-2 my-3">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-10 sm:w-11 h-12 text-center text-xl font-mono font-bold border-2 rounded-xl bg-slate-950 border-slate-700 text-white focus:border-orange-400 focus:bg-[#0c1322] focus:outline-none transition shadow-inner"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyCode(otpDigits.join(''))}
                  disabled={otpDigits.some(d => d === '')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Verify &amp; Enter Portal
                </button>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setRightMode('LOGIN')}
                    className="hover:text-white transition font-medium cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resendOTP();
                      setResendTimer(45);
                    }}
                    disabled={resendTimer > 0}
                    className="font-bold text-orange-400 hover:underline disabled:text-slate-500 cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL POPUP: SET PASSWORD FROM INVITATION LINK */}
      {/* ========================================================================= */}
      {showInviteModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 font-sans"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full text-slate-100 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                  <span>STAFF ONBOARDING ACTIVATION</span>
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  1-Hour Valid Link
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Set Your Account Password
              </h2>
              
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Welcome to the HsCreations operations workspace! Create your password to log in and complete your staff profile.
              </p>
            </div>

            {/* Matched Staff Information Card */}
            {inviteMatchedEmp ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 text-sm">
                    {inviteMatchedEmp.firstName[0]}{inviteMatchedEmp.lastName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      {inviteMatchedEmp.firstName} {inviteMatchedEmp.lastName}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">{inviteMatchedEmp.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Pending Onboarding
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{inviteMatchedEmp.department || 'Production'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block text-xs">Invitation Token / Link *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. inv-173650... or paste full invite URL"
                  value={inviteTokenInput}
                  onChange={e => handleInviteTokenChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            )}

            {/* Expiration Notice or Error banner */}
            {isTokenExpired ? (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs">
                <strong className="block font-bold text-rose-300 uppercase tracking-wider text-[11px]">Invitation Link Expired (1-Hour Limit)</strong>
                <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                  For security purposes, employee invitation links expire after 1 hour. Please ask your manager or HR administrator to click &quot;Resend Email&quot; in the Admin Command Center to get a fresh link.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                <span>This invitation link is valid for <strong>1 hour</strong> from dispatch.</span>
              </div>
            )}

            {inviteError && !isTokenExpired && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold animate-in fade-in">
                {inviteError}
              </div>
            )}

            {/* Set Password Form */}
            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              
              {/* Username & PIN Pre-configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-xs">Staff Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold">@</span>
                    <input
                      type="text"
                      placeholder="e.g. suman.thapa"
                      value={inviteUsername}
                      onChange={e => setInviteUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-xs">Shift Clock PIN (4 Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="••••"
                    value={invitePin}
                    onChange={e => setInvitePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full text-center font-mono font-bold tracking-widest py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:outline-none text-base"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-300 text-xs">New Password *</label>
                    <button
                      type="button"
                      onClick={() => setInviteShowPassword(!inviteShowPassword)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                    >
                      {inviteShowPassword ? 'Hide' : 'Show'} Password
                    </button>
                  </div>
                  <input
                    type={inviteShowPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-xs">Confirm Password *</label>
                  <input
                    type={inviteShowPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter your password"
                    value={inviteConfirmPassword}
                    onChange={e => setInviteConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="submit"
                  disabled={isTokenExpired}
                  className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-extrabold text-xs shadow-lg transition ${
                    isTokenExpired
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/25 hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {isTokenExpired ? 'Invitation Expired (Request New Link)' : 'Save Password & Enter Staff Portal →'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-MINUTE EXPIRING FORGOT PASSWORD & RESET MODALS */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <ForgotPasswordModal
          initialEmail={loginEmail}
          onClose={() => setShowForgotModal(false)}
          onOpenResetModal={(token, email) => {
            setShowForgotModal(false);
            setResetToken(token);
            setResetEmail(email);
          }}
        />
      )}

      {resetToken && (
        <ResetPasswordModal
          token={resetToken}
          email={resetEmail}
          onClose={() => setResetToken(null)}
          onSuccessLogin={(email) => {
            setResetToken(null);
            setLoginEmail(email);
          }}
          onRequestNewLink={() => {
            setResetToken(null);
            setShowForgotModal(true);
          }}
        />
      )}

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-slate-500 text-xs relative z-20 border-t border-slate-800/60 bg-slate-950/40">
        © 2026 HsCreations Pty Ltd • Sydney NSW Printing &amp; Design • Fair Work Australia &amp; SafeWork NSW Compliant
      </footer>

    </div>
  );
}

