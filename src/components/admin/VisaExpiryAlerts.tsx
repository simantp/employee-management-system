'use client';

import React from 'react';
import { ShieldAlert, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function VisaExpiryAlerts() {
  const { alerts } = useApp();
  const visaAlerts = alerts.filter(a => a.type === 'VISA_EXPIRY');

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Visa Expiry Alerts</h3>
            <p className="text-[11px] text-slate-500">Expiring within 30 days (Australian Law)</p>
          </div>
        </div>
        <button className="text-xs font-bold text-blue-600 hover:underline">
          View all
        </button>
      </div>

      <div className="space-y-2.5 flex-1 mt-2">
        {visaAlerts.map(item => {
          const isUrgent = item.daysRemaining <= 14;
          return (
            <div 
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition hover:shadow-xs ${
                isUrgent ? 'bg-rose-50/40 border-rose-200/70' : 'bg-amber-50/40 border-amber-200/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={item.employeeAvatar || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'} 
                  alt={item.employeeName} 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.employeeName}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.department}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  isUrgent 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' 
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {item.daysRemaining} Days
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {item.dueDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">Auto-alarms active</span>
        <button className="text-blue-600 font-bold hover:underline text-[11px] flex items-center gap-0.5">
          <span>Manage visa workflows</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
