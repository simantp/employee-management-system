'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const data = [
  { name: 'Production (Riverwood)', value: 16, percent: 38.1, color: '#2563eb' },
  { name: 'Production (Rockdale)', value: 10, percent: 23.8, color: '#38bdf8' },
  { name: 'Design', value: 6, percent: 14.3, color: '#f59e0b' },
  { name: 'Administration', value: 5, percent: 11.9, color: '#10b981' },
  { name: 'Sales & Marketing', value: 3, percent: 7.1, color: '#8b5cf6' },
  { name: 'Other', value: 2, percent: 4.8, color: '#94a3b8' },
];

export default function DepartmentDonutChart() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Employee Overview</h3>
          <p className="text-[11px] text-slate-500">Distribution by Department & Plant</p>
        </div>
        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          By Department ▾
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
        {/* Donut Chart with Center Number */}
        <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val, name) => [`${val} staff`, name]} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 leading-none">42</span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Total</span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex-1 w-full space-y-1.5">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 font-medium truncate text-[11px]">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-slate-900 text-xs">{item.value}</span>
                <span className="text-[10px] text-slate-400 w-10 text-right">{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <a href="#employees" className="text-blue-600 font-bold hover:underline text-[11px]">
          View full department report →
        </a>
      </div>
    </div>
  );
}
