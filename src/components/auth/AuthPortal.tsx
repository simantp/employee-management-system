'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Zap, 
  RotateCcw,
  Check,
  Shield,
  Briefcase,
  Palette,
  Printer,
  Layers,
  Loader2
} from 'lucide-react';
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

  // Mode: 'LOGIN' | 'REGISTER' | 'VERIFY_OTP' | 'KIOSK'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_OTP' | 'KIOSK'>('LOGIN');

  // Kiosk mode state
  const [kioskPin, setKioskPin] = useState('');
  const [kioskPassword, setKioskPassword] = useState('');
  const [kioskFeedback, setKioskFeedback] = useState<{
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
    department: 'Large Format & Digital Print',
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


  // Kiosk real-time PIN matching with robust fallback
  const matchedStaff = employees.find(e => {
    const cleanPin = kioskPin.trim();
    if (!cleanPin) return false;
    const empPin = (e.kioskPin || '').trim();
    return empPin === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-38');
  });

  const handleKioskClockIn = () => {
    if (!kioskPin || !matchedStaff) return;
    const res = clockInWithKiosk(kioskPin, kioskPassword);
    if (res.success && res.employee) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const now = new Date();
      setKioskFeedback({
        type: 'IN',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        message: res.message
      });
      setTimeout(() => {
        setKioskPin('');
        setKioskPassword('');
        setKioskFeedback(null);
      }, 4000);
    }
  };

  const handleKioskClockOut = () => {
    if (!kioskPin || !matchedStaff) return;
    const res = clockOutWithKiosk(kioskPin, kioskPassword, 30);
    if (res.success && res.employee) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const now = new Date();
      setKioskFeedback({
        type: 'OUT',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        hours: res.totalHours,
        message: res.message
      });
      setTimeout(() => {
        setKioskPin('');
        setKioskPassword('');
        setKioskFeedback(null);
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
        department: regForm.department,
      });

      if (res.success) {
        setMode('VERIFY_OTP');
      } else {
        setErrorMessage(res.message || 'Registration could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while sending the email code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Pasted full code
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-y-auto font-sans">
      
      {/* Dynamic Ambient Background Glows tailored to HsCreations Brand */}
      <div className="fixed top-0 left-1/4 w-[550px] h-[550px] bg-gradient-to-br from-orange-600/15 via-red-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-amber-600/15 via-orange-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Navbar with HsCreations Official Brand */}
      <header className="px-6 lg:px-12 py-4 flex items-center justify-between relative z-20 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3.5">
          <div className="bg-white px-2.5 py-1.5 rounded-2xl shadow-lg shadow-black/30 border border-slate-700/60 flex items-center justify-center">
            <img 
              src="/images/hs-creations-logo.png" 
              alt="HsCreations Logo" 
              className="h-7 sm:h-8 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black text-sm tracking-wide flex items-center gap-1.5">
                <span>HSCREATIONS</span>
                <span className="text-[10px] text-orange-400 font-extrabold uppercase">PORTAL</span>
              </h1>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                SYDNEY
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Printing &amp; Designing Operations Hub • Sydney NSW
            </span>
          </div>
        </div>

        {/* Live Sydney Time Badge */}
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 backdrop-blur-md shadow-lg shadow-black/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono font-bold text-orange-400">{sydneyTimeStr || 'AEST'}</span>
          <span className="text-[11px] text-slate-400 font-semibold">• Sydney Plant</span>
        </div>
      </header>

      {/* Main Dual-Side Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 relative z-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* LEFT SIDE: Brand Atmosphere & Printing/Design Telemetry (5 cols) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/25 text-xs font-bold backdrop-blur-md">
                <Palette className="w-3.5 h-3.5 text-orange-400" />
                <span>Sydney Printing, Signage &amp; Creative Design</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                Crafting Print Perfection. Empowering Staff.
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Welcome to <strong>HsCreations</strong> workforce system. Seamless shift rostering, instant leave submissions, prepress workflows, and encrypted HR compliance for our Sydney print technicians, designers, and production team.
              </p>
            </div>

            {/* Live Operational Stats Pills */}
            <div className="grid grid-cols-2 gap-3.5 max-w-md">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1.5 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Print Floor</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-white font-black text-sm">Press &amp; Design Live</div>
                <div className="text-[11px] text-orange-400 font-medium">07:30 – 16:00 AEST</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1.5 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Quality Standard</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="text-white font-black text-sm">ISO 9001 Print QA</div>
                <div className="text-[11px] text-emerald-400 font-medium">Fair Work AU Compliant</div>
              </div>
            </div>

            {/* Service & System Highlights */}
            <div className="space-y-3 max-w-md text-xs text-slate-300">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-300 text-xs">Digital, Offset &amp; Large Format Print Scheduling</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-7 h-7 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-300 text-xs">Graphic Design &amp; Prepress Proof Approval</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-300 text-xs">AES-256 Encrypted Banking &amp; ATO TFN Vault</span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Interactive Holographic Terminal Card (7 cols) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end w-full">
            <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800/90 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs shadow-black/40">
              
              {/* Card Header & Switcher */}
              <div className="p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>HsCreations Terminal</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Sydney Facility
                  </span>
                </div>

                <h3 className="text-xl font-black text-white">
                  {mode === 'LOGIN' && 'Sign in to Portal'}
                  {mode === 'REGISTER' && 'Register New Staff Account'}
                  {mode === 'VERIFY_OTP' && 'Verify Your Email'}
                  {mode === 'KIOSK' && '⏱️ Shift Clock In / Out Kiosk'}
                </h3>
                
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'LOGIN' && 'Super Admin auto-routes to Admin Portal, Staff enters Staff Workspace'}
                  {mode === 'REGISTER' && 'Join the HsCreations printing & design team with automated email verification'}
                  {mode === 'VERIFY_OTP' && `Security code dispatched to ${pendingOTP?.email || 'your email'}`}
                  {mode === 'KIOSK' && 'Instant 4-digit PIN timecard punching with real-time SuperAdmin alert'}
                </p>

                {/* 3-Way Mode Switcher Tabs */}
                {mode !== 'VERIFY_OTP' && (
                  <div className="grid grid-cols-3 bg-slate-950 p-1.5 rounded-2xl mt-5 border border-slate-800 gap-1.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setMode('LOGIN')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        mode === 'LOGIN' 
                          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 text-slate-950 shadow-md font-black' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('REGISTER')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        mode === 'REGISTER' 
                          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 text-slate-950 shadow-md font-black' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Register
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('KIOSK')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
                        mode === 'KIOSK' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black' 
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Kiosk Clock</span>
                    </button>
                  </div>
                )}
              </div>

              {/* MODE 4: KIOSK CLOCK IN / OUT TERMINAL */}
              {mode === 'KIOSK' && (
                <div className="p-6 space-y-5 animate-in fade-in duration-150">
                  
                  {/* Real-time Clock Header */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 shadow-inner">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Sydney Plant Terminal</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-orange-400 tracking-wider">
                      {sydneyTimeStr || '08:30:00 AM'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold block">AEST (Australian Eastern Standard Time)</span>
                  </div>

                  {/* Feedback Modal / Overlay when Clocked */}
                  {kioskFeedback ? (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/60 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          kioskFeedback.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {kioskFeedback.type === 'IN' ? '🟢 Clocked IN Successfully' : '🔴 Clocked OUT Successfully'}
                        </span>
                        <h4 className="text-xl font-black text-white mt-2">{kioskFeedback.staffName}</h4>
                        <p className="text-xs text-slate-400">{kioskFeedback.department}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                        <div>Punch Timestamp: <strong className="text-orange-400">{kioskFeedback.time} AEST</strong></div>
                        {kioskFeedback.hours && (
                          <div className="mt-1">Logged Shift Duration: <strong className="text-emerald-400">{kioskFeedback.hours} Hours</strong></div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">SuperAdmin and Sydney Dispatch alerted.</div>
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
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="font-bold text-slate-300 text-xs">4-Digit PIN *</label>
                            <span className="text-[10px] text-orange-400 font-semibold">Auto-detects</span>
                          </div>
                          <input
                            type="password"
                            maxLength={4}
                            inputMode="numeric"
                            placeholder="••••"
                            value={kioskPin}
                            onChange={e => setKioskPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:outline-none transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-300 block mb-1.5 text-xs">Password (Optional)</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={kioskPassword}
                              onChange={e => setKioskPassword(e.target.value)}
                              className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:outline-none transition text-xs shadow-inner"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Detected Staff Badge Card */}
                      {kioskPin.length === 4 && (
                        <div>
                          {matchedStaff ? (
                            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in">
                              <div className="flex items-center gap-3">
                                <img
                                  src={matchedStaff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                  alt={matchedStaff.firstName}
                                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-orange-500/50"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-white text-sm">
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
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-bold">Current State:</span>
                                {matchedStaff.clockState === 'CLOCKED_IN' ? (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] border border-rose-500/30 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                    <span>ON SHIFT (Clocked In)</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>OFF DUTY (Clocked Out)</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-center text-red-300 text-xs font-bold">
                              ⚠️ No employee found with PIN: {kioskPin}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dual Action Buttons (Rule: only one is active based on state!) */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {/* Clock In Button */}
                        <button
                          type="button"
                          disabled={!matchedStaff || matchedStaff.clockState === 'CLOCKED_IN'}
                          onClick={handleKioskClockIn}
                          className={`py-3.5 px-4 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            matchedStaff && matchedStaff.clockState !== 'CLOCKED_IN'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer'
                              : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-sm font-black flex items-center gap-1">
                            <span>🟢 Clock IN</span>
                          </span>
                          <span className="text-[9px] font-semibold opacity-80">
                            {matchedStaff?.clockState === 'CLOCKED_IN' ? 'Already on shift' : 'Start Shift'}
                          </span>
                        </button>

                        {/* Clock Out Button */}
                        <button
                          type="button"
                          disabled={!matchedStaff || matchedStaff.clockState !== 'CLOCKED_IN'}
                          onClick={handleKioskClockOut}
                          className={`py-3.5 px-4 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            matchedStaff && matchedStaff.clockState === 'CLOCKED_IN'
                              ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30 hover:scale-[1.02] cursor-pointer'
                              : 'bg-slate-950 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-sm font-black flex items-center gap-1">
                            <span>🔴 Clock OUT</span>
                          </span>
                          <span className="text-[9px] font-semibold opacity-80">
                            {matchedStaff?.clockState !== 'CLOCKED_IN' ? 'Not clocked in' : 'End Shift'}
                          </span>
                        </button>
                      </div>

                      {/* Quick Demo Test PIN Chips */}
                      <div className="pt-4 border-t border-slate-800/80">
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
                                onClick={() => setKioskPin(effectivePin)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                                  kioskPin === effectivePin
                                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                <span>{emp.firstName}:</span>
                                <span className="font-mono text-orange-400 font-black">{effectivePin}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${emp.clockState === 'CLOCKED_IN' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* MODE 1: LOGIN */}
              {mode === 'LOGIN' && (
                <div className="p-6 space-y-5">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">Work or Personal Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="admin@hscreations.com.au or staff email"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="font-bold text-slate-300 text-xs">Password *</label>
                        <span className="text-[11px] text-orange-400 font-semibold cursor-pointer hover:underline">Forgot password?</span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-slate-950 font-black text-xs shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-3 cursor-pointer"
                    >
                      <span>Sign In to HsCreations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* 1-Click Instant Demo Credentials */}
                  <div className="pt-5 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Instant 1-Click Test Access:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('admin@company.com.au')}
                        className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800 hover:border-orange-500/50 text-left transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                      >
                        <div>
                          <span className="block text-xs font-black text-white group-hover:text-orange-400">👑 Super Admin</span>
                          <span className="text-[10px] text-orange-400 font-bold">Admin Portal</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickLogin('suman.thapa@company.com')}
                        className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800 hover:border-orange-500/50 text-left transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                      >
                        <div>
                          <span className="block text-xs font-black text-white group-hover:text-orange-400">👤 Suman Thapa</span>
                          <span className="text-[10px] text-amber-400 font-bold">Staff Portal</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: REGISTER AS STAFF (Substantial, Thick & Modern Inputs) */}
              {mode === 'REGISTER' && (
                <div className="p-6 space-y-4">
                  {errorMessage && (
                    <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 shadow-lg shadow-red-950/30 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-red-300">Registration Notice</div>
                        <div className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed">{errorMessage}</div>
                        {errorMessage.includes('already exists') && (
                          <button
                            type="button"
                            onClick={() => {
                              setLoginEmail(regForm.email);
                              setMode('LOGIN');
                              setErrorMessage(null);
                            }}
                            className="mt-2 text-[11px] font-bold text-orange-300 hover:text-orange-200 underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Click here to Sign In with {regForm.email}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    
                    {/* First & Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-300 block mb-1.5 text-xs">First Name *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Liam"
                            value={regForm.firstName}
                            onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                            className="w-full pl-10 pr-3 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-bold text-slate-300 block mb-1.5 text-xs">Last Name *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Wilson"
                            value={regForm.lastName}
                            onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                            className="w-full pl-10 pr-3 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="liam.wilson@hscreations.com.au"
                          value={regForm.email}
                          onChange={e => setRegForm({...regForm, email: e.target.value})}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Mobile Phone */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">Mobile Phone *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="0412 345 678"
                          value={regForm.mobilePhone}
                          onChange={e => setRegForm({...regForm, mobilePhone: e.target.value})}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1.5 text-xs">Set Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={regForm.password}
                          onChange={e => setRegForm({...regForm, password: e.target.value})}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:bg-[#0c1322] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-60 text-slate-950 font-black text-xs shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Dispatching Security Code to Email...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit Email Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* MODE 3: 6-DIGIT EMAIL OTP VERIFICATION */}
              {mode === 'VERIFY_OTP' && (
                <div className="p-6 space-y-5 text-center">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                      <Mail className="w-7 h-7 animate-pulse" />
                    </div>
                    <h4 className="font-black text-white text-base">Enter 6-Digit Email Code</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Verification code dispatched to<br />
                      <strong className="text-orange-400 font-mono font-bold">{pendingOTP?.email || 'your email'}</strong>
                    </p>
                  </div>

                  {/* Simulator Box */}
                  {pendingOTP && (
                    <div className="p-4 bg-orange-950/50 border border-orange-500/40 rounded-2xl text-xs flex items-center justify-between text-left shadow-lg shadow-orange-950/20">
                      <div>
                        <span className="font-bold text-orange-300 block text-[11px]">📨 Received Email Code:</span>
                        <span className="font-mono text-base font-black text-white tracking-widest">
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
                        className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
                      >
                        Auto-Fill & Verify
                      </button>
                    </div>
                  )}

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-2.5 my-5">
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
                        className="w-12 h-14 text-center text-2xl font-mono font-black border-2 rounded-2xl bg-slate-950 border-slate-700 text-white focus:border-orange-400 focus:bg-[#0c1322] focus:outline-none transition shadow-inner"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyCode(otpDigits.join(''))}
                    disabled={otpDigits.some(d => d === '')}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Verify & Enter HsCreations Portal
                  </button>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setMode('REGISTER')}
                      className="hover:text-white transition font-medium"
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
                      className="font-bold text-orange-400 hover:underline disabled:text-slate-500 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                    </button>
                  </div>
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
