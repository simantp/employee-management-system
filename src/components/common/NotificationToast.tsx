'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function NotificationToast() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isWarning = t.type === 'warning';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 rounded-xl shadow-lg border transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md ${
              isSuccess
                ? 'bg-slate-900 text-white border-emerald-500/40'
                : isWarning
                ? 'bg-slate-900 text-white border-amber-500/40'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isSuccess ? 'bg-emerald-500/20 text-emerald-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isSuccess ? 'Success' : isWarning ? 'Warning' : 'Info'}
                  </span>
                  <h5 className="text-xs font-bold text-white truncate">{t.title}</h5>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{t.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-[11px] font-semibold text-slate-400 hover:text-white transition px-1 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>

            {/* 2-Second Visual Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
              <div 
                className={`h-full animate-[progress_2s_linear_forwards] ${
                  isSuccess ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{
                  animation: 'progressBar 2s linear forwards'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
