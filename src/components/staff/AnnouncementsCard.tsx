'use client';

import React from 'react';

export default function AnnouncementsCard() {
  return (
    <div className="bg-gradient-to-r from-navy-950 to-navy-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Company Announcement
          </span>
          <h4 className="text-sm font-bold text-white mt-1">
            Sydney Plant Annual Team Building &amp; WHS Briefing
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Join us on Friday 28 August 2026 for our company celebration and updated WHS compliance workshop.
          </p>
        </div>
      </div>

      <button className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs transition flex-shrink-0 shadow-md cursor-pointer">
        View Event Details
      </button>
    </div>
  );
}
