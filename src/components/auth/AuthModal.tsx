'use client';

import React, { useState, useRef, useEffect } from 'react';
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
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } else {
      alert(res.message);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
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

    if (val && index < 5) {
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
        <div className="p-6 bg-slate-900 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer"
          >
            Close
          </button>

          <div className="mb-2">
            <h2 className="font-bold text-base tracking-wide text-white">
              EMPLOYEE PORTAL
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sydney, Australia (AEST)
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {mode === 'LOGIN' && 'Sign in to access your Staff or Admin Command Center'}
            {mode === 'REGISTER' && 'Create your official staff portal account'}
            {mode === 'VERIFY_OTP' && 'Verify your work email address with the 6-digit code'}
          </p>
        </div>

        {/* VIEW 1: LOGIN */}
        {mode === 'LOGIN' && (
          <div className="p-6 space-y-4 text-xs">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@company.com.au or staff email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Password</label>
                  <a href="#" className="text-[11px] text-blue-600 font-semibold hover:underline">Forgot?</a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center mt-2 cursor-pointer"
              >
                Sign In to Portal
              </button>
            </form>

            {/* Quick 1-Click Demo Logins */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                1-Click Test Accounts:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@company.com.au')}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 font-bold text-left transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="block text-[11px]">Super Admin</span>
                    <span className="text-[9px] text-blue-600 font-normal">Admin Dashboard</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600">Enter</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('suman.thapa@company.com')}
                  className="p-2 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100 text-cyan-900 font-bold text-left transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="block text-[11px]">Suman Thapa</span>
                    <span className="text-[9px] text-cyan-600 font-normal">Staff Portal</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-600">Enter</span>
                </button>
              </div>
            </div>

            {/* Switch to Register */}
            <div className="text-center pt-2 text-slate-500 text-[11px]">
              Don&apos;t have an employee account?{' '}
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Register as Staff
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: REGISTER */}
        {mode === 'REGISTER' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
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
                <input
                  type="email"
                  required
                  placeholder="liam.wilson@company.com"
                  value={regForm.email}
                  onChange={e => setRegForm({...regForm, email: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Australian Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="0412 345 678"
                  value={regForm.mobilePhone}
                  onChange={e => setRegForm({...regForm, mobilePhone: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                />
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
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regForm.password}
                  onChange={e => setRegForm({...regForm, password: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center mt-2 cursor-pointer"
              >
                Send 6-Digit Verification Code
              </button>
            </form>

            <div className="text-center pt-1 text-slate-500 text-[11px]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: 6-DIGIT EMAIL OTP VERIFICATION */}
        {mode === 'VERIFY_OTP' && (
          <div className="p-6 space-y-5 text-xs text-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Enter 6-Digit Code</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                We sent an email verification code to<br />
                <strong className="text-slate-800">{pendingOTP?.email || 'your email'}</strong>
              </p>
            </div>

            {/* Live Interactive Code Preview Box */}
            {pendingOTP && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center justify-between text-left">
                <div>
                  <span className="font-bold block">Live Verification Dispatch:</span>
                  <span className="font-mono text-xs font-bold text-amber-950 tracking-wider">
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
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shadow-xs cursor-pointer"
                >
                  Auto-Fill & Verify
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
                  className="w-11 h-13 text-center text-lg font-mono font-bold border-2 rounded-xl bg-slate-50 border-slate-200 focus:border-slate-600 focus:bg-white focus:outline-none transition shadow-xs"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerifyCode(otpDigits.join(''))}
              disabled={otpDigits.some(d => d === '')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Verify Email & Enter Portal
            </button>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="hover:underline cursor-pointer"
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
                className="font-bold text-slate-700 hover:underline disabled:text-slate-400 cursor-pointer"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
