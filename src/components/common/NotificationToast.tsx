'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function NotificationToast() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 max-w-lg w-[calc(100%-2rem)] sm:w-auto pointer-events-none">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md min-w-[280px] sm:min-w-[340px] max-w-md ${
              isSuccess
                ? 'bg-slate-950/95 text-white border-emerald-500/70 shadow-emerald-950/50'
                : isError
                ? 'bg-slate-950/95 text-white border-rose-500/70 shadow-rose-950/50'
                : isWarning
                ? 'bg-slate-950/95 text-white border-amber-500/70 shadow-amber-950/50'
                : 'bg-slate-950/95 text-white border-slate-700 shadow-slate-950/50'
            }`}
          >
            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                  isSuccess 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : isError 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : isWarning 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {isSuccess ? 'Database Saved' : isError ? 'Database Error' : isWarning ? 'Warning' : 'Info'}
                </span>
                <h5 className="text-xs font-bold text-white truncate">{t.title}</h5>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">{t.message}</p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-[10px] font-bold text-slate-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0 uppercase tracking-wider border border-slate-700/60"
              title="Dismiss"
            >
              Dismiss
            </button>

            {/* Animated Progress Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
              <div 
                className={`h-full ${
                  isSuccess ? 'bg-emerald-400' : isError ? 'bg-rose-400' : isWarning ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{
                  animation: 'progressBar 2.5s linear forwards'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
