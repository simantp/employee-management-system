'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

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
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl shadow-2xl border transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md ${
              isSuccess
                ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-500/10'
                : isWarning
                ? 'bg-slate-900/95 text-white border-amber-500/40 shadow-amber-500/10'
                : 'bg-slate-900/95 text-white border-blue-500/40 shadow-blue-500/10'
            }`}
          >
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              isSuccess ? 'bg-emerald-500/20 text-emerald-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : isWarning ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-bold text-white truncate">{t.title}</h5>
                <span className="text-[10px] text-slate-400 font-mono">{t.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* 2-Second Visual Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
              <div 
                className={`h-full animate-[progress_2s_linear_forwards] ${
                  isSuccess ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-cyan-400'
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
