'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import confetti from 'canvas-confetti';

interface ResetPasswordModalProps {
  token: string;
  email?: string;
  onClose: () => void;
  onSuccessLogin?: (email: string) => void;
  onRequestNewLink?: () => void;
}

export default function ResetPasswordModal({
  token,
  email: initialEmail = '',
  onClose,
  onSuccessLogin,
  onRequestNewLink,
}: ResetPasswordModalProps) {
  const { verifyResetToken, completePasswordReset } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live countdown state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isExpired, setIsExpired] = useState(false);
  const [accountEmail, setAccountEmail] = useState(initialEmail);
  const [accountName, setAccountName] = useState('Staff Member');

  // Verify token on mount and set countdown
  useEffect(() => {
    const check = verifyResetToken(token);
    if (!check.valid || check.expired) {
      setIsExpired(true);
      setRemainingSeconds(0);
      if (check.email) setAccountEmail(check.email);
    } else {
      setIsExpired(false);
      setRemainingSeconds(check.remainingSeconds || 300);
      if (check.email) setAccountEmail(check.email);
      if (check.userName) setAccountName(check.userName);
    }
  }, [token]);

  // 1-second interval ticker for 5-minute expiry countdown
  useEffect(() => {
    if (isExpired || isSuccess) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExpired, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isExpired || remainingSeconds <= 0) {
      setErrorMessage('This password reset link has expired (5-minute limit). Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await completePasswordReset(token, password);
      if (res.success) {
        setIsSuccess(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch(e) {}
      } else {
        setErrorMessage(res.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white">
        
        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-base shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                {isSuccess ? 'Password Reset Complete' : isExpired ? 'Link Expired' : 'Set New Password'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isSuccess ? 'Your account credentials have been updated' : 'HsCreations Single-Use Security Setup'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* CASE 1: LINK EXPIRED */}
          {isExpired && !isSuccess && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-extrabold uppercase tracking-wider inline-block">
                Link Expired
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-white">Reset Link Expired</h4>
                <p className="text-slate-300 text-xs max-w-sm mx-auto leading-relaxed">
                  For your security, password reset links are strictly valid for <strong>5 minutes</strong>. This link has expired and can no longer be used.
                </p>
              </div>

              {accountEmail && (
                <div className="font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 inline-block">
                  Account: {accountEmail}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onRequestNewLink) {
                      onRequestNewLink();
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 transition cursor-pointer"
                >
                  Request New 5-Minute Link →
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: SUCCESS STATE */}
          {isSuccess && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider inline-block">
                Success
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-white">Password Updated!</h4>
                <p className="text-slate-300 text-xs max-w-sm mx-auto leading-relaxed">
                  Your new password has been saved to the database. You can now sign in using your updated credentials.
                </p>
              </div>

              {accountEmail && (
                <div className="font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-orange-400 inline-block font-bold">
                  {accountEmail}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccessLogin && accountEmail) {
                      onSuccessLogin(accountEmail);
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  Sign In with New Password →
                </button>
              </div>
            </div>
          )}

          {/* CASE 3: ACTIVE RESET FORM */}
          {!isExpired && !isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Top Banner with Account & Live 5-Minute Timer */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Resetting Password For
                  </span>
                  <span className="font-bold text-xs text-white block truncate max-w-[200px]">
                    {accountName} ({accountEmail || 'Registered User'})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Link Expires In
                  </span>
                  <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg border ${
                    remainingSeconds > 60
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  }`}>
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-medium animate-in fade-in">
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 block text-xs">New Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-orange-400 hover:underline cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                />
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 block text-xs">Confirm New Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter identical password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                />
              </div>

              {/* Password strength criteria indicator */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                <span className={`flex items-center gap-1 ${password.length >= 6 ? 'text-emerald-400 font-bold' : ''}`}>
                  {password.length >= 6 ? 'Valid:' : '•'} Min. 6 characters
                </span>
                <span className={`flex items-center gap-1 ${password && password === confirmPassword ? 'text-emerald-400 font-bold' : ''}`}>
                  {password && password === confirmPassword ? 'Valid:' : '•'} Passwords match
                </span>
              </div>

              {/* Submit & Cancel */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || remainingSeconds <= 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <span>Save New Password &amp; Sign In →</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
