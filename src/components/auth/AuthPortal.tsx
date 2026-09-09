'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import confetti from 'canvas-confetti';

export default function AuthPortal() {
  const { 
    login, 
    register, 
    verifyOTP, 
    resendOTP, 
    pendingOTP, 
    users,
    employees,
    clockInWithKiosk,
    clockOutWithKiosk,
    activePortal 
  } = useApp();

  // Mode: 'LOGIN' | 'REGISTER' | 'VERIFY_OTP' | 'CLOCK'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_OTP' | 'CLOCK'>('LOGIN');

  // Shift Clock state
  const [clockPin, setClockPin] = useState('');
  const [clockPassword, setClockPassword] = useState('');
  const [clockFeedback, setClockFeedback] = useState<{
    type: 'IN' | 'OUT';
    staffName: string;
    department: string;
    avatarUrl?: string;
    time: string;
    hours?: number;
    message: string;
  } | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    password: '',
  });

  // Submission & error feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OTP 6-Digit input state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(45);

  // Live Sydney clock
  const [sydneyTimeStr, setSydneyTimeStr] = useState('');

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
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown for resend code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'VERIFY_OTP' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, resendTimer]);

  // Sync mode when pendingOTP is set
  useEffect(() => {
    if (pendingOTP) {
      setMode('VERIFY_OTP');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(45);
    }
  }, [pendingOTP]);

  // Real-time PIN matching with fallback
  const matchedStaff = employees.find(e => {
    const cleanPin = clockPin.trim();
    if (!cleanPin) return false;
    const empPin = (e.kioskPin || '').trim();
    return empPin === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-38');
  });

  const handleClockIn = () => {
    if (!clockPin || !matchedStaff) return;
    const res = clockInWithKiosk(clockPin, clockPassword);
    if (res.success && res.employee) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const now = new Date();
      setClockFeedback({
        type: 'IN',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        message: res.message
      });
      setTimeout(() => {
        setClockPin('');
        setClockPassword('');
        setClockFeedback(null);
      }, 4000);
    }
  };

  const handleClockOut = () => {
    if (!clockPin || !matchedStaff) return;
    const res = clockOutWithKiosk(clockPin, clockPassword, 30);
    if (res.success && res.employee) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const now = new Date();
      setClockFeedback({
        type: 'OUT',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        hours: res.totalHours,
        message: res.message
      });
      setTimeout(() => {
        setClockPin('');
        setClockPassword('');
        setClockFeedback(null);
      }, 4000);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setErrorMessage(null);
    login(loginEmail);
  };

  const handleQuickLogin = (email: string) => {
    setErrorMessage(null);
    login(email);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.mobilePhone) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await register({
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        mobilePhone: regForm.mobilePhone,
        password: regForm.password || 'password123',
      });

      if (res.success) {
        setMode('VERIFY_OTP');
      } else {
        setErrorMessage(res.message || 'Registration could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while sending the email verification code.');
    } finally {
      setIsSubmitting(false);
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
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed -top-24 left-1/4 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-24 right-1/4 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
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
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12 relative z-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* LEFT SIDE: Brand Hero & Telemetry (Visible on large screens, compact on mobile) */}
          <div className="lg:col-span-5 flex flex-col space-y-5 lg:space-y-6">
            
            {/* Tagline & Headline */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/25 text-xs font-bold backdrop-blur-md">
                <span>⚡ Sydney Printing, Signage &amp; Prepress Hub</span>
              </div>

              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight leading-snug">
                Crafting Print Perfection. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                  Empowering Our Team.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
                Welcome to the <strong>HsCreations</strong> operations platform. Real-time shift tracking, leave approvals, prepress timesheets, and encrypted compliance for our Sydney print technicians, signage specialists, and design staff.
              </p>
            </div>

            {/* Live Operational Stats Pills */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1 shadow-lg shadow-black/20">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Print Operations
                </div>
                <div className="text-white font-bold text-xs sm:text-sm">Press &amp; Prepress Active</div>
                <div className="text-[11px] text-orange-400 font-semibold">07:30 – 16:00 AEST</div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1 shadow-lg shadow-black/20">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Compliance &amp; QA
                </div>
                <div className="text-white font-bold text-xs sm:text-sm">ISO 9001 Standard</div>
                <div className="text-[11px] text-emerald-400 font-semibold">Fair Work AU Verified</div>
              </div>
            </div>

            {/* System Highlights */}
            <div className="hidden sm:flex flex-col space-y-2 max-w-md text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <span className="text-orange-400 font-bold">✓</span>
                <span className="text-slate-300 font-medium text-xs">Digital, Offset &amp; Large Format Production Hub</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <span className="text-orange-400 font-bold">✓</span>
                <span className="text-slate-300 font-medium text-xs">AES-256 Encrypted Documents &amp; VEVO Visa Tracking</span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Interactive Auth Card (7 cols) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end w-full">
            <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full overflow-hidden text-xs shadow-black/50">
              
              {/* Card Header & Segmented Tabs */}
              <div className="p-5 sm:p-7 border-b border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    HsCreations Terminal
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Sydney Facility
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {mode === 'LOGIN' && 'Sign in to Portal'}
                  {mode === 'REGISTER' && 'Register Staff Account'}
                  {mode === 'VERIFY_OTP' && 'Verify Your Email'}
                  {mode === 'CLOCK' && 'Shift Clock Terminal'}
                </h2>
                
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'LOGIN' && 'Super Admin auto-routes to Admin Portal, Staff enters Staff Workspace.'}
                  {mode === 'REGISTER' && 'Join the HsCreations printing & design team with automated email verification.'}
                  {mode === 'VERIFY_OTP' && `Security code dispatched to ${pendingOTP?.email || 'your email'}`}
                  {mode === 'CLOCK' && 'Instant 4-digit PIN timecard punch with real-time manager synchronization.'}
                </p>

                {/* 3-Way Mode Switcher Tabs */}
                {mode !== 'VERIFY_OTP' && (
                  <div className="grid grid-cols-3 bg-slate-950/90 p-1.5 rounded-2xl mt-4 sm:mt-5 border border-slate-800 gap-1.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('LOGIN');
                        setErrorMessage(null);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs transition-all text-center cursor-pointer ${
                        mode === 'LOGIN' 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-extrabold' 
                          : 'text-slate-400 hover:text-white font-bold'
                      }`}
                    >
                      Sign In
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('REGISTER');
                        setErrorMessage(null);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs transition-all text-center cursor-pointer ${
                        mode === 'REGISTER' 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-extrabold' 
                          : 'text-slate-400 hover:text-white font-bold'
                      }`}
                    >
                      Register
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('CLOCK');
                        setErrorMessage(null);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs transition-all flex items-center justify-center text-center cursor-pointer ${
                        mode === 'CLOCK' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-extrabold' 
                          : 'text-emerald-400 hover:text-emerald-300 font-bold'
                      }`}
                    >
                      <span>Shift Clock</span>
                    </button>
                  </div>
                )}
              </div>

              {/* MODE 1: LOGIN */}
              {mode === 'LOGIN' && (
                <div className="p-5 sm:p-7 space-y-5">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                          onClick={() => alert('Password reset link will be sent to your registered work email.')}
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
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center mt-2 cursor-pointer"
                    >
                      Sign In to HsCreations
                    </button>
                  </form>

                  {/* 1-Click Instant Demo Credentials */}
                  <div className="pt-4 border-t border-slate-800 space-y-2.5">
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
                </div>
              )}

              {/* MODE 2: REGISTER AS STAFF */}
              {mode === 'REGISTER' && (
                <div className="p-5 sm:p-7 space-y-4">
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs shadow-lg shadow-rose-950/30">
                      <div className="font-bold text-rose-300">Registration Notice</div>
                      <div className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">{errorMessage}</div>
                      {errorMessage.includes('already exists') && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail(regForm.email);
                            setMode('LOGIN');
                            setErrorMessage(null);
                          }}
                          className="mt-2 text-[11px] font-bold text-orange-300 hover:text-orange-200 underline cursor-pointer"
                        >
                          Click here to Sign In with {regForm.email}
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    
                    {/* First & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-200 block mb-1 text-xs">First Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Liam"
                          value={regForm.firstName}
                          onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-200 block mb-1 text-xs">Last Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Wilson"
                          value={regForm.lastName}
                          onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="font-bold text-slate-200 block mb-1 text-xs">Work or Personal Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="liam.wilson@hscreations.com.au"
                        value={regForm.email}
                        onChange={e => setRegForm({...regForm, email: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div>
                      <label className="font-bold text-slate-200 block mb-1 text-xs">Mobile Phone *</label>
                      <input
                        type="text"
                        required
                        placeholder="0412 345 678"
                        value={regForm.mobilePhone}
                        onChange={e => setRegForm({...regForm, mobilePhone: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="font-bold text-slate-200 block mb-1 text-xs">Set Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regForm.password}
                        onChange={e => setRegForm({...regForm, password: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-60 text-slate-950 font-extrabold text-xs shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center mt-3 cursor-pointer"
                    >
                      {isSubmitting ? 'Sending Verification Code...' : 'Send 6-Digit Email Verification Code'}
                    </button>
                  </form>
                </div>
              )}

              {/* MODE 3: 6-DIGIT EMAIL OTP VERIFICATION */}
              {mode === 'VERIFY_OTP' && (
                <div className="p-5 sm:p-7 space-y-5 text-center">
                  <div>
                    <h3 className="font-bold text-white text-base">Enter 6-Digit Email Code</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Verification code dispatched to<br />
                      <strong className="text-orange-400 font-mono font-bold">{pendingOTP?.email || 'your email'}</strong>
                    </p>
                  </div>

                  {/* Simulator Box */}
                  {pendingOTP && (
                    <div className="p-3.5 bg-orange-950/40 border border-orange-500/30 rounded-2xl text-xs flex items-center justify-between text-left shadow-lg shadow-orange-950/20">
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
                  <div className="flex justify-center gap-2 my-4">
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
                        className="w-12 h-14 text-center text-2xl font-mono font-bold border-2 rounded-xl bg-slate-950 border-slate-700 text-white focus:border-orange-400 focus:bg-[#0c1322] focus:outline-none transition shadow-inner"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyCode(otpDigits.join(''))}
                    disabled={otpDigits.some(d => d === '')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Verify &amp; Enter HsCreations Portal
                  </button>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setMode('REGISTER')}
                      className="hover:text-white transition font-medium cursor-pointer"
                    >
                      ← Back to Register
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

              {/* MODE 4: SHIFT CLOCK IN / OUT TERMINAL */}
              {mode === 'CLOCK' && (
                <div className="p-5 sm:p-7 space-y-5">
                  
                  {/* Real-time Clock Header */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 shadow-inner">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sydney Plant Timecard Terminal
                    </div>
                    <div className="text-2xl font-bold font-mono text-orange-400 tracking-wider">
                      {sydneyTimeStr || '08:30:00 AM'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold block">AEST • Live Shift Time</span>
                  </div>

                  {/* Feedback Modal / Overlay when Clocked */}
                  {clockFeedback ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/60 text-center space-y-3 shadow-2xl animate-in zoom-in-95">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          clockFeedback.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {clockFeedback.type === 'IN' ? 'Clocked IN Successfully' : 'Clocked OUT Successfully'}
                        </span>
                        <h4 className="text-lg font-bold text-white mt-2">{clockFeedback.staffName}</h4>
                        <p className="text-xs text-slate-400">{clockFeedback.department}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                        <div>Punch Time: <strong className="text-orange-400">{clockFeedback.time} AEST</strong></div>
                        {clockFeedback.hours !== undefined && (
                          <div className="mt-1">Logged Shift: <strong className="text-emerald-400">{clockFeedback.hours.toFixed(2)} Hours</strong></div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 font-semibold">
                        Terminal resets automatically in 3 seconds...
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* 4-Digit PIN & Password Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-200 text-xs">4-Digit PIN *</label>
                            <span className="text-[10px] text-orange-400 font-semibold">Auto-detects</span>
                          </div>
                          <input
                            type="password"
                            maxLength={4}
                            inputMode="numeric"
                            placeholder="••••"
                            value={clockPin}
                            onChange={e => setClockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full text-center text-2xl font-mono font-bold tracking-widest py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:outline-none transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-200 block mb-1 text-xs">Password (Optional)</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={clockPassword}
                            onChange={e => setClockPassword(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:outline-none transition text-xs shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Detected Staff Badge Card */}
                      {clockPin.length === 4 && (
                        <div>
                          {matchedStaff ? (
                            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 animate-in fade-in">
                              <div className="flex items-center gap-3">
                                <img
                                  src={matchedStaff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                  alt={matchedStaff.firstName}
                                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-orange-500/50"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-white text-sm">
                                      {matchedStaff.firstName} {matchedStaff.lastName}
                                    </h4>
                                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                                      ID: {matchedStaff.employeeNumber}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">{matchedStaff.jobTitle} • {matchedStaff.department || 'Production'}</p>
                                </div>
                              </div>

                              {/* Live Clock Status Indicator */}
                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-bold">Current State:</span>
                                {matchedStaff.clockState === 'CLOCKED_IN' ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                                    ON SHIFT (Clocked In)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                                    OFF DUTY (Clocked Out)
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-center text-rose-300 text-xs font-bold">
                              No employee found with PIN: {clockPin}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dual Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {/* Clock In Button */}
                        <button
                          type="button"
                          disabled={!matchedStaff || matchedStaff.clockState === 'CLOCKED_IN'}
                          onClick={handleClockIn}
                          className={`py-3 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            matchedStaff && matchedStaff.clockState !== 'CLOCKED_IN'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer'
                              : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-sm font-bold">
                            Clock IN
                          </span>
                          <span className="text-[9px] font-semibold opacity-80">
                            {matchedStaff?.clockState === 'CLOCKED_IN' ? 'Already on shift' : 'Start Shift'}
                          </span>
                        </button>

                        {/* Clock Out Button */}
                        <button
                          type="button"
                          disabled={!matchedStaff || matchedStaff.clockState !== 'CLOCKED_IN'}
                          onClick={handleClockOut}
                          className={`py-3 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            matchedStaff && matchedStaff.clockState === 'CLOCKED_IN'
                              ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30 hover:scale-[1.02] cursor-pointer'
                              : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-sm font-bold">
                            Clock OUT
                          </span>
                          <span className="text-[9px] font-semibold opacity-80">
                            {matchedStaff?.clockState !== 'CLOCKED_IN' ? 'Not clocked in' : 'End Shift'}
                          </span>
                        </button>
                      </div>

                      {/* Quick Demo Test PIN Chips */}
                      <div className="pt-3 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                          1-Click Demo Employee PINs:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {employees.slice(0, 4).map(emp => {
                            const effectivePin = emp.kioskPin || (emp.id === 'emp-42' ? '4829' : emp.id === 'emp-41' ? '1234' : emp.id === 'emp-40' ? '5678' : '9988');
                            return (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => setClockPin(effectivePin)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                                  clockPin === effectivePin
                                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                <span>{emp.firstName}:</span>
                                <span className="font-mono text-orange-400 font-bold">{effectivePin}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-slate-500 text-xs relative z-20 border-t border-slate-800/60 bg-slate-950/40">
        © 2026 HsCreations Pty Ltd • Sydney NSW Printing &amp; Design • Fair Work Australia &amp; SafeWork NSW Compliant
      </footer>

    </div>
  );
}
