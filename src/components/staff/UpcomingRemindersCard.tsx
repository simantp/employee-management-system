'use client';

import React from 'react';
import { Bell, Calendar, ShieldAlert, Award, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function UpcomingRemindersCard() {
  const { currentStaff } = useApp();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming & Reminders</h3>
            <p className="text-[11px] text-slate-500">Key dates & compliance timeline</p>
          </div>
        </div>
        <button className="text-xs font-bold text-blue-600 hover:underline">
          View Calendar →
        </button>
      </div>

      <div className="space-y-2.5 my-1 text-xs">
        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <div>
              <p className="font-bold text-slate-900 text-[11px]">Visa Expiry Review</p>
              <p className="text-[10px] text-slate-500">{currentStaff.visaExpiryDate || '30 Aug 2026'}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            In 15 days
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold text-slate-900 text-[11px]">Annual Performance Review</p>
              <p className="text-[10px] text-slate-500">30 September 2026</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
            In 3 months
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="font-bold text-slate-900 text-[11px]">Approved Annual Leave</p>
              <p className="text-[10px] text-slate-500">22 - 26 Sep 2026 (5 days)</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Confirmed
          </span>
        </div>
      </div>
    </div>
  );
}
