'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, Calendar, Send, FileSpreadsheet } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function StaffTimesheetView() {
  const { currentStaff } = useApp();
  const [submitted, setSubmitted] = useState(false);

  const days = [
    { day: 'Monday', date: '17 Aug 2026', start: '07:30 AM', end: '04:00 PM', break: '30m', total: '8.0h', status: 'Approved' },
    { day: 'Tuesday', date: '18 Aug 2026', start: '07:30 AM', end: '04:00 PM', break: '30m', total: '8.0h', status: 'Approved' },
    { day: 'Wednesday', date: '19 Aug 2026', start: '07:30 AM', end: '04:00 PM', break: '30m', total: '8.0h', status: 'Logged' },
    { day: 'Thursday', date: '20 Aug 2026', start: '07:30 AM', end: '04:00 PM', break: '30m', total: '7.5h', status: 'Pending' },
    { day: 'Friday', date: '21 Aug 2026', start: '07:30 AM', end: '03:00 PM', break: '30m', total: '6.5h', status: 'Pending' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Timesheet & Attendance</h2>
          <p className="text-slate-500 mt-0.5">
            Current Pay Cycle: 17 Aug – 23 Aug 2026 • Standard 38.0 Hours / Week
          </p>
        </div>

        <button
          onClick={() => setSubmitted(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shadow-sm ${
            submitted ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
          }`}
        >
          {submitted ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          <span>{submitted ? 'Timesheet Submitted to HR' : 'Submit Weekly Timesheet'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 font-semibold block">Total Logged Hours</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">38.0 hrs</span>
          <span className="text-[11px] text-emerald-600 font-bold">100% of Weekly Target</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 font-semibold block">Overtime (1.5x)</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">0.0 hrs</span>
          <span className="text-[11px] text-slate-500">Standard roster hours</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 font-semibold block">Cycle Approval Status</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">Verified</span>
          <span className="text-[11px] text-slate-500">Supervisor: {currentStaff.reportsTo}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm">Daily Clock Log</span>
          <span className="text-slate-500">Plant Location: {currentStaff.workLocation}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Meal Break</th>
                <th className="py-3 px-4">Paid Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{d.day}</td>
                  <td className="py-3 px-4">{d.date}</td>
                  <td className="py-3 px-4 font-mono">{d.start}</td>
                  <td className="py-3 px-4 font-mono">{d.end}</td>
                  <td className="py-3 px-4">{d.break}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{d.total}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
