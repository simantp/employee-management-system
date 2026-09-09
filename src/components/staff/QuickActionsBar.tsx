'use client';

import React from 'react';

interface QuickActionsBarProps {
  onEditProfile: () => void;
  onBanking: () => void;
  onPayslips?: () => void;
  onResignation: () => void;
}

export default function QuickActionsBar({
  onEditProfile,
  onBanking,
  onPayslips,
  onResignation,
}: QuickActionsBarProps) {
  return (
    <div className="bg-white/90 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2 sm:gap-2.5">
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 font-bold text-[11px] uppercase tracking-wider hidden lg:flex">
        <span>Quick Actions:</span>
      </div>

      <button
        onClick={onEditProfile}
        className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200/80 hover:border-orange-300 px-3.5 py-2 rounded-xl font-bold text-xs transition-all hover:shadow-xs cursor-pointer"
      >
        <span>Update Profile &amp; Visa Status</span>
      </button>

      <button
        onClick={onBanking}
        className="flex items-center gap-2 bg-slate-50 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl font-bold text-xs transition-all hover:shadow-xs cursor-pointer"
      >
        <span>Bank &amp; TFN Vault</span>
      </button>

      <button
        onClick={onResignation}
        className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/80 px-3.5 py-2 rounded-xl font-bold text-xs transition-all ml-auto hover:shadow-xs cursor-pointer"
      >
        <span>Resignation Notice</span>
      </button>
    </div>
  );
}
