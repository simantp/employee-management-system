'use client';

import React from 'react';
import { useApp } from '@/lib/store';

export default function StaffAnnouncementsView() {
  const { announcements } = useApp();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs font-sans">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Company Announcements &amp; Notices</h2>
        <p className="text-slate-500 mt-0.5">
          Official HsCreations broadcast bulletins, Work Health &amp; Safety updates and workplace guidelines
        </p>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {a.category || 'Company Announcement'}
                </span>
                <span className="text-slate-500 text-[11px] font-medium">
                  by {a.author}
                </span>
              </div>
              <span className="text-slate-400 text-[11px] font-medium">
                {a.date}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900">{a.title}</h3>
            <p className="text-slate-600 leading-relaxed text-xs">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
