'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ShieldCheck, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  KeyRound,
  RotateCcw,
  Zap
} from 'lucide-react';
import { useApp } from '@/lib/store';
import confetti from 'canvas-confetti';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { 
    currentUser, 
    login, 
    register, 
    verifyOTP, 
    resendOTP, 
    pendingOTP 
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_OTP'>(pendingOTP ? 'VERIFY_OTP' : 'LOGIN');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    password: '',
    department: 'Production (Riverwood)' as any,
  });

  // 6-Digit OTP inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(45);

  useEffect(() => {
    let interval: any;
    if (mode === 'VERIFY_OTP' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(loginEmail, loginPassword);
    if (success) onClose();
  };

  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    const success = login(email);
    if (success) onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.lastName || !regForm.email) {
      alert('Please fill out all required fields');
      return;
    }

    const res = await register(regForm);
    if (res.success) {
      setMode('VERIFY_OTP');
      setResendTimer(45);
      // Pre-fill first digit for easy testing if desired, or auto-focus
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } else {
      alert(res.message);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste of 6 digits
      const digits = val.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => { if (i < 6) newDigits[i] = d; });
      setOtpDigits(newDigits);
      if (digits.length === 6) {
        handleVerifyCode(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = val.replace(/[^0-9]/g, '');
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered
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
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        
        {/* Header with Dark Gradient */}
        <div className="p-6 bg-gradient-to-tr from-navy-950 via-navy-900 to-slate-900 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-wide text-white">
                EMPLOYEE PORTAL
              </h2>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                Sydney, Australia (AEST)
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            {mode === 'LOGIN' && 'Sign in to access your Staff or Admin Command Center'}
            {mode === 'REGISTER' && 'Create your official staff portal account (Instant Auto-Role)'}
            {mode === 'VERIFY_OTP' && 'Verify your work email address with the 6-digit code'}
          </p>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: LOGIN */}
        {/* ========================================================= */}
        {mode === 'LOGIN' && (
          <div className="p-6 space-y-4 text-xs">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@company.com.au or staff email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Password</label>
                  <a href="#" className="text-[11px] text-blue-600 font-semibold hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Logins for Instant Testing */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>1-Click Test Accounts:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@company.com.au')}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 font-bold text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="block text-[11px]">👑 Super Admin</span>
                    <span className="text-[9px] text-blue-600 font-normal">Admin Dashboard</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('suman.thapa@company.com')}
                  className="p-2 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100 text-cyan-900 font-bold text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="block text-[11px]">👤 Suman Thapa</span>
                    <span className="text-[9px] text-cyan-600 font-normal">Staff Portal</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
                </button>
              </div>
            </div>

            {/* Switch to Register */}
            <div className="text-center pt-2 text-slate-500 text-[11px]">
              Don&apos;t have an employee account?{' '}
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="font-bold text-blue-600 hover:underline"
              >
                Register as Staff
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REGISTER (Auto-assigns STAFF & triggers 6-digit OTP) */}
        {/* ========================================================= */}
        {mode === 'REGISTER' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">
                New accounts are registered as <strong>STAFF</strong> automatically. An email verification code will be sent to confirm your identity.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Liam"
                    value={regForm.firstName}
                    onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Wilson"
                    value={regForm.lastName}
                    onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Australian Work Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="liam.wilson@company.com"
                    value={regForm.email}
                    onChange={e => setRegForm({...regForm, email: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Australian Mobile Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="0412 345 678"
                    value={regForm.mobilePhone}
                    onChange={e => setRegForm({...regForm, mobilePhone: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={regForm.department}
                  onChange={e => setRegForm({...regForm, department: e.target.value as any})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"
                >
                  <option value="Production (Riverwood)">Production (Riverwood)</option>
                  <option value="Production (Rockdale)">Production (Rockdale)</option>
                  <option value="Design">Design</option>
                  <option value="Administration">Administration</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Create Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regForm.password}
                    onChange={e => setRegForm({...regForm, password: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/25 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Send 6-Digit Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-1 text-slate-500 text-[11px]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="font-bold text-blue-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: 6-DIGIT EMAIL OTP VERIFICATION */}
        {/* ========================================================= */}
        {mode === 'VERIFY_OTP' && (
          <div className="p-6 space-y-5 text-xs text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-200 shadow-sm">
                <Mail className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Enter 6-Digit Code</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                We sent an email verification code to<br />
                <strong className="text-slate-800">{pendingOTP?.email || 'your email'}</strong>
              </p>
            </div>

            {/* Live Interactive Code Preview Box for Smooth Testing */}
            {pendingOTP && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center justify-between text-left">
                <div>
                  <span className="font-bold block">📨 Live Verification Dispatch:</span>
                  <span className="font-mono text-xs font-black text-amber-950 tracking-wider">
                    Code: {pendingOTP.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = pendingOTP.code.split('');
                    setOtpDigits(digits);
                    handleVerifyCode(pendingOTP.code);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shadow-xs"
                >
                  Auto-Fill & Verify
                </button>
              </div>
            )}

            {/* 6 Individual Auto-Advancing Digit Boxes */}
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
                  className="w-11 h-13 text-center text-lg font-mono font-black border-2 rounded-xl bg-slate-50 border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-xs"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerifyCode(otpDigits.join(''))}
              disabled={otpDigits.some(d => d === '')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition"
            >
              Verify Email & Enter Portal
            </button>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="hover:underline"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={() => {
                  resendOTP();
                  setResendTimer(45);
                }}
                disabled={resendTimer > 0}
                className="font-bold text-blue-600 hover:underline disabled:text-slate-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
