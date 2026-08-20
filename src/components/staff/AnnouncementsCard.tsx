'use client';

import React from 'react';
import { Megaphone, ArrowRight } from 'lucide-react';

export default function AnnouncementsCard() {
  return (
    <div className="bg-gradient-to-r from-navy-950 to-navy-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Company Announcement
          </span>
          <h4 className="text-sm font-bold text-white mt-1">
            Sydney Plant Annual Team Building & WHS Briefing
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Join us on Friday 28 August 2026 for our company celebration and updated WHS compliance workshop.
          </p>
        </div>
      </div>

      <button className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs transition flex items-center gap-1.5 flex-shrink-0 shadow-md">
        <span>View Event Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
