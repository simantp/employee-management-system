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
            className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md min-w-[280px] sm:min-w-[340px] max-w-md ${
              isSuccess
                ? 'bg-white text-slate-800 border-emerald-300 shadow-emerald-950/10'
                : isError
                ? 'bg-white text-slate-800 border-rose-300 shadow-rose-950/10'
                : isWarning
                ? 'bg-white text-slate-800 border-amber-300 shadow-amber-950/10'
                : 'bg-white text-slate-800 border-slate-200 shadow-slate-950/10'
            }`}
          >
            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                  isSuccess 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : isError 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : isWarning 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {isSuccess ? 'Database Saved' : isError ? 'Database Error' : isWarning ? 'Warning' : 'Info'}
                </span>
                <h5 className="text-xs font-bold text-slate-900 truncate">{t.title}</h5>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{t.message}</p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0 uppercase tracking-wider border border-slate-200"
              title="Dismiss"
            >
              Dismiss
            </button>

            {/* Animated Progress Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 overflow-hidden">
              <div 
                className={`h-full ${
                  isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
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
