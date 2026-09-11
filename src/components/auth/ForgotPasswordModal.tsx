'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onOpenResetModal?: (token: string, email: string) => void;
  initialEmail?: string;
}

export default function ForgotPasswordModal({
  onClose,
  onOpenResetModal,
  initialEmail = '',
}: ForgotPasswordModalProps) {
  const { requestPasswordReset, users, employees } = useApp();

  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    token: string;
    resetUrl: string;
    email: string;
    userName: string;
  } | null>(null);

  const [countdown, setCountdown] = useState(300); // 5 minutes = 300s
  const [copied, setCopied] = useState(false);

  // Live 5-minute countdown ticker on success
  useEffect(() => {
    if (!successData) return;
    setCountdown(300);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [successData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(email.trim());
      if (res.success && res.token && res.resetUrl) {
        setSuccessData({
          token: res.token,
          resetUrl: res.resetUrl,
          email: email.trim().toLowerCase(),
          userName: res.user?.name || 'Staff Member',
        });
      } else {
        setErrorMessage(res.message || 'Failed to generate reset link. Please verify your email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!successData?.resetUrl) return;
    navigator.clipboard.writeText(successData.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white">
        
        {/* MODAL HEADER */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-base shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                {successData ? 'Reset Link Dispatched' : 'Forgot Password'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {successData ? 'Check your inbox or use the instant link below' : 'HsCreations Identity & Security Hub'}
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

        {/* MODAL BODY */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* VIEW 1: EMAIL INPUT FORM */}
          {!successData ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Enter your registered work email address below. We'll send you a secure password reset link valid for <strong>5 minutes</strong>.
              </p>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-medium animate-in fade-in">
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 block text-xs">
                  Registered Work Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. admin@company.com.au or staff email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition placeholder:text-slate-500 text-xs shadow-inner"
                  />
                </div>
              </div>

              {/* 5-Minute Expiry Badge */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-400">
                <div className="text-[11px] leading-tight">
                  <strong className="text-orange-400 font-bold">5-Minute Security Link:</strong> The generated password reset link is single-use and strictly expires in 5 minutes for privacy compliance.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generating 5-Min Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link →</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>

              {/* Quick Select Registered Accounts for Testing */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Select Account:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmail('admin@company.com.au')}
                    className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer group"
                  >
                    <span className="block text-[11px] font-bold text-slate-300 group-hover:text-orange-400 truncate">Super Admin</span>
                    <span className="text-[9px] text-slate-500 truncate block">admin@company.com.au</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmail('suman.thapa@company.com')}
                    className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer group"
                  >
                    <span className="block text-[11px] font-bold text-slate-300 group-hover:text-orange-400 truncate">Suman Thapa</span>
                    <span className="text-[9px] text-slate-500 truncate block">suman.thapa@company.com</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* VIEW 2: SUCCESS WITH 5-MINUTE LIVE COUNTDOWN & INSTANT ACCESS */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider inline-block">
                  Success
                </span>
                <h4 className="font-extrabold text-sm text-white">Reset Link Dispatched!</h4>
                <p className="text-[11px] text-slate-300">
                  A single-use password reset link has been dispatched to:
                </p>
                <div className="font-mono font-bold text-xs bg-slate-950/80 text-orange-400 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
                  {successData.email}
                </div>
              </div>

              {/* 5-Minute Live Countdown Timer Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 text-xs">
                    Link Expires In:
                  </span>
                  <span className={`font-mono text-base font-black px-2.5 py-0.5 rounded-lg border ${
                    countdown > 60
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : countdown > 0
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}>
                    {formatTime(countdown)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      countdown > 60 ? 'bg-orange-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${(countdown / 300) * 100}%` }}
                  />
                </div>

                {countdown === 0 && (
                  <p className="text-[11px] text-rose-400 font-bold pt-1">
                    This reset link has expired. Please request a new link below.
                  </p>
                )}
              </div>

              {/* Primary Actions */}
              <div className="space-y-2 pt-1">
                {countdown > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenResetModal) {
                        onOpenResetModal(successData.token, successData.email);
                      } else {
                        window.location.href = successData.resetUrl;
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open Password Reset Form Now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessData(null);
                      setCountdown(300);
                    }}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Request Fresh Reset Link
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 hover:bg-slate-800 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Reset Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 font-semibold text-xs transition cursor-pointer text-center block"
                >
                  Done • Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
