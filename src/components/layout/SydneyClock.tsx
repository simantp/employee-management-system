'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getSydneyTimeParts } from '@/lib/utils';

export default function SydneyClock({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [timeInfo, setTimeInfo] = useState({
    timeString: '',
    dateString: '',
    hour24: 9,
    isBefore7AM: false,
  });

  useEffect(() => {
    setMounted(true);
    const update = () => setTimeInfo(getSydneyTimeParts(new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium px-3 py-1.5 rounded-lg bg-slate-100">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span>Sydney (AEST) Loading...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        <span>Sydney: {timeInfo.timeString}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-xs rounded-xl px-3.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight">
            <span>{timeInfo.timeString}</span>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              Sydney (AEST)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {timeInfo.dateString}
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center border-l border-slate-200 pl-3">
        {timeInfo.isBefore7AM ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Sick Leave Window Open (&lt; 7:00 AM)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Past 7 AM Cutoff
          </span>
        )}
      </div>
    </div>
  );
}
