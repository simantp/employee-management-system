'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

const complianceData = [
  { name: 'Compliant', value: 37, color: '#10b981' },
  { name: 'Expiring Soon', value: 3, color: '#f59e0b' },
  { name: 'Non Compliant', value: 2, color: '#ef4444' },
];

export default function ComplianceStatusDonut() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Compliance Status</h3>
            <p className="text-[11px] text-slate-500">TFN, Visas, Licenses & WHS</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 py-1">
        {/* 89% Gauge Ring */}
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={complianceData}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                dataKey="value"
              >
                {complianceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-slate-900 leading-none">89%</span>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Compliant</span>
          </div>
        </div>

        {/* Breakdown stats */}
        <div className="flex-1 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-medium text-[11px]">Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-900">37</span>
              <span className="text-[10px] text-slate-400">(89%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-700 font-medium text-[11px]">Expiring Soon</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-amber-600">3</span>
              <span className="text-[10px] text-slate-400">(7%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-700 font-medium text-[11px]">Non Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-rose-600">2</span>
              <span className="text-[10px] text-slate-400">(4%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <a href="#compliance" className="text-blue-600 font-bold hover:underline text-[11px]">
          View compliance dashboard →
        </a>
      </div>
    </div>
  );
}
