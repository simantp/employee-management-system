'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import confetti from 'canvas-confetti';

interface ChangePasswordModalProps {
  onClose: () => void;
  staffId?: string;
  email?: string;
  userName?: string;
}

export default function ChangePasswordModal({
  onClose,
  staffId,
  email,
  userName,
}: ChangePasswordModalProps) {
  const { currentStaff, currentUser, users, updateStaffPassword } = useApp();

  // Find targeted user info
  const targetUser = users.find(u =>
    (email && u.email.toLowerCase() === email.toLowerCase()) ||
    (staffId && u.staffId === staffId) ||
    (currentUser && u.id === currentUser.id) ||
    (currentStaff && (u.staffId === currentStaff.id || u.email.toLowerCase() === currentStaff.email.toLowerCase()))
  );

  const displayName = userName || targetUser?.name || (currentStaff ? (currentStaff.firstName + ' ' + currentStaff.lastName) : (currentUser?.name || 'Staff Member'));
  const displayEmail = email || targetUser?.email || currentStaff?.email || currentUser?.email || '';
  const displayRole = targetUser?.role || currentUser?.role || 'STAFF';
  const displayAvatar = targetUser?.avatarUrl || currentUser?.avatarUrl || currentStaff?.avatarUrl;
  const hasExistingPassword = Boolean(targetUser?.password && targetUser.password.trim().length > 0);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  // Criteria rules
  const hasMinLength = newPassword.length >= 6;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSpecial = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: 'Enter password', color: 'bg-slate-200', textColor: 'text-slate-400' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (hasMixedCase) score += 1;
    if (hasNumberOrSpecial) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-cyan-500', textColor: 'text-cyan-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  };

  const strength = getPasswordStrength();
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (hasExistingPassword && !currentPassword.trim()) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (hasExistingPassword && currentPassword.trim() === newPassword.trim()) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateStaffPassword({
        userId: targetUser?.id,
        email: displayEmail,
        staffId: staffId || currentStaff?.id,
        currentPassword: hasExistingPassword ? currentPassword.trim() : undefined,
        newPassword: newPassword.trim(),
      });

      if (res.success) {
        setIsSuccess(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.message || 'Failed to update password. Please verify your current password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dark Modern Mesh Gradient */}
        <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-navy-950 text-white relative shrink-0 overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Change Password
              </h3>
              <p className="text-xs text-slate-300 font-medium">Account Security &amp; Access Credentials</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer text-xs font-bold"
              title="Close"
            >
              Close
            </button>
          </div>

          {/* User Account Info Chip */}
          <div className="mt-4 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-cyan-400/50 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-cyan-200/90 font-mono truncate">{displayEmail}</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 shrink-0">
              {displayRole}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-slate-900">Password Successfully Changed!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Your sign-in credentials have been updated and synchronized across all portal sessions and database records.
                </p>
              </div>
              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Current Password Field */}
              {hasExistingPassword ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition bg-slate-50/50 hover:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded text-xs cursor-pointer font-bold transition"
                    >
                      {showCurrentPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-cyan-950 text-xs flex items-start gap-2.5">
                  <div>
                    <p className="font-bold">Initial Password Setup</p>
                    <p className="text-[11px] text-cyan-800 mt-0.5 leading-snug">
                      No password has been configured for this account yet. You can create your sign-in password directly below.
                    </p>
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition bg-slate-50/50 hover:bg-white"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded text-xs cursor-pointer font-bold transition"
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Password Strength</span>
                      <span className={strength.textColor}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                      <div className={"h-full flex-1 rounded-full " + (strength.score >= 1 ? strength.color : "bg-slate-200") + " transition-all"} />
                      <div className={"h-full flex-1 rounded-full " + (strength.score >= 2 ? strength.color : "bg-slate-200") + " transition-all"} />
                      <div className={"h-full flex-1 rounded-full " + (strength.score >= 3 ? strength.color : "bg-slate-200") + " transition-all"} />
                      <div className={"h-full flex-1 rounded-full " + (strength.score >= 4 ? strength.color : "bg-slate-200") + " transition-all"} />
                    </div>

                    {/* Criteria Badges */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[10px] font-medium text-slate-600">
                      <span className={"flex items-center gap-1.5 " + (hasMinLength ? "text-emerald-600 font-bold" : "text-slate-400")}>
                        At least 6 characters
                      </span>
                      <span className={"flex items-center gap-1.5 " + (hasMixedCase ? "text-emerald-600 font-bold" : "text-slate-400")}>
                        Upper &amp; lower case
                      </span>
                      <span className={"flex items-center gap-1.5 " + (hasNumberOrSpecial ? "text-emerald-600 font-bold" : "text-slate-400")}>
                        Number or symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={"w-full pl-3.5 pr-14 py-2.5 rounded-xl border text-slate-900 text-sm focus:outline-none focus:ring-2 transition " + (isMatch ? "border-emerald-400 focus:ring-emerald-500 bg-emerald-50/20" : isMismatch ? "border-rose-300 focus:ring-rose-500 bg-rose-50/20" : "border-slate-200 focus:ring-slate-900 bg-slate-50/50 hover:bg-white")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded text-xs cursor-pointer font-bold transition"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {isMatch && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    Passwords match
                  </p>
                )}
                {isMismatch && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (confirmPassword.length > 0 && !isMatch) || newPassword.length < 6}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-navy-900 hover:from-slate-800 hover:to-navy-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
