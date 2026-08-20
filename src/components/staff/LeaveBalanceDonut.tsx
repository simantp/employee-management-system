'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function LeaveBalanceDonut({ onApplyLeave }: { onApplyLeave?: () => void } = {}) {
  const { currentStaff } = useApp();
  const balance = currentStaff.leaveBalance;

  const total = balance.annual + balance.sick + balance.carers + balance.longService;

  const data = [
    { name: 'Annual Leave', value: balance.annual, color: '#f97316' },
    { name: 'Personal / Carer', value: balance.carers, color: '#10b981' },
    { name: 'Sick Leave', value: balance.sick, color: '#f59e0b' },
    { name: 'Long Service Leave', value: balance.longService, color: '#6366f1' },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-black text-slate-900">My Leave Balance</h3>
          <p className="text-[11px] text-slate-500">Accrued Sydney statutory entitlements</p>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          Fair Work AU
        </span>
      </div>

      <div className="flex items-center gap-4 my-2">
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-slate-900 leading-none">{total}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Days</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-slate-600 font-medium text-[11px]">Annual</span>
            </div>
            <span className="font-bold text-slate-900">{balance.annual} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium text-[11px]">Personal</span>
            </div>
            <span className="font-bold text-slate-900">{balance.carers} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-medium text-[11px]">Sick Leave</span>
            </div>
            <span className="font-bold text-amber-600">{balance.sick} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-slate-600 font-medium text-[11px]">Long Service</span>
            </div>
            <span className="font-bold text-slate-900">{balance.longService} days</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Accrual tracked in HsCreations Payroll Vault</span>
        </span>
      </div>
    </div>
  );
}
