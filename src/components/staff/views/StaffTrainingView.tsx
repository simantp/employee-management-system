'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function StaffTrainingView() {
  const { currentStaff } = useApp();

  const courses = [
    { title: 'SafeWork NSW Work Health & Safety (WHS) Fundamentals', status: 'Completed', score: '100%', date: '12 Jan 2026', cert: true },
    { title: 'Riverwood Plant Hazardous Chemical Safety & MSDS', status: 'Completed', score: '95%', date: '04 Feb 2026', cert: true },
    { title: 'Emergency Evacuation & First Aid Warden Protocol', status: 'Completed', score: '98%', date: '28 Feb 2026', cert: true },
    { title: 'Workplace Equal Opportunity & Anti-Harassment (2026)', status: 'In Progress', score: '40%', date: 'Due 30 Aug 2026', cert: false },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Training &amp; Compliance Modules</h2>
        <p className="text-slate-500 mt-0.5">
          Work Health &amp; Safety certifications, safe plant operations &amp; annual refresher courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs leading-snug">{c.title}</h4>
                <span className="text-[11px] text-slate-400">{c.date}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex-shrink-0 ${
                c.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {c.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <span className="font-semibold text-slate-600">Score: <strong className="text-slate-900">{c.score}</strong></span>
              {c.cert ? (
                <button className="text-blue-600 font-bold hover:underline cursor-pointer">
                  Download Certificate
                </button>
              ) : (
                <button className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-navy-950 rounded-lg font-bold cursor-pointer">
                  Continue Course
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
