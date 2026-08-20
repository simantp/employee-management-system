'use client';

import React, { useState } from 'react';
import { Megaphone, Calendar, User, ChevronRight, BellRing, Sparkles, ChevronLeft } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function CompanyLatestAnnouncementBanner() {
  const { announcements } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!announcements || announcements.length === 0) {
    return null;
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
              <Megaphone className="w-3 h-3" />
              <span>Company's Latest Announcement</span>
            </span>

            {currentAnnouncement.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-orange-300 border border-white/10">
                {currentAnnouncement.category}
              </span>
            )}

            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{currentAnnouncement.date}</span>
            </span>

            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-slate-500" />
              <span>{currentAnnouncement.author}</span>
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
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer"
              title="Previous Announcement"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev < announcements.length - 1 ? prev + 1 : 0))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer"
              title="Next Announcement"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
