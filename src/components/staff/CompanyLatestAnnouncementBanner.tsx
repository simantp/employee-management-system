'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';

export default function CompanyLatestAnnouncementBanner() {
  const { announcements } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!announcements || announcements.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 text-white text-center space-y-2 shadow-xl animate-in fade-in duration-150">
        <span className="text-3xl block mb-1">📢</span>
        <h3 className="text-sm font-bold text-white">No Announcements at this time</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          When company management posts new notices or operational updates, they will appear here.
        </p>
      </div>
    );
  }

  const currentAnnouncement = announcements[currentIndex] || announcements[0];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-navy-950 border border-orange-500/30 p-5 sm:p-6 text-white shadow-xl shadow-slate-950/20 animate-in fade-in duration-200">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left side info */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-slate-950 tracking-wider uppercase shadow-xs">
              <span>Company's Latest Announcement</span>
            </span>

            {currentAnnouncement.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-orange-300 border border-white/10">
                {currentAnnouncement.category}
              </span>
            )}

            <span className="text-[11px] text-slate-400 font-medium">
              {currentAnnouncement.date}
            </span>

            <span className="text-[11px] text-slate-400 font-medium">
              by {currentAnnouncement.author}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
            {currentAnnouncement.title}
          </h3>

          <p className="text-xs text-slate-300 font-normal leading-relaxed max-w-4xl">
            {currentAnnouncement.content}
          </p>
        </div>

        {/* Right side navigation if multiple announcements */}
        {announcements.length > 1 && (
          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center pt-2 md:pt-0">
            <span className="text-[10px] font-extrabold text-slate-400 mr-1">
              {currentIndex + 1} of {announcements.length}
            </span>
            <button
              onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : announcements.length - 1))}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer"
              title="Previous Announcement"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev < announcements.length - 1 ? prev + 1 : 0))}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer"
              title="Next Announcement"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
