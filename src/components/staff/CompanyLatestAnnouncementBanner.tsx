'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Announcement } from '@/types';

export default function CompanyLatestAnnouncementBanner() {
  const { announcements } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('ALL');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  // Strictly take up to 10 latest / previous announcements
  const displayAnnouncements = useMemo(() => {
    return (announcements || []).slice(0, 10);
  }, [announcements]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    displayAnnouncements.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [displayAnnouncements]);

  // Filtered within the 10 announcements
  const filteredHistory = useMemo(() => {
    return displayAnnouncements.filter(a => {
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchContent = a.content.toLowerCase().includes(q);
        const matchAuthor = a.author.toLowerCase().includes(q);
        const matchCat = (a.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchAuthor && !matchCat) return false;
      }
      if (historyCategory !== 'ALL' && a.category !== historyCategory) return false;
      return true;
    });
  }, [displayAnnouncements, historySearch, historyCategory]);

  if (!displayAnnouncements || displayAnnouncements.length === 0) {
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

  const safeIndex = currentIndex >= displayAnnouncements.length ? 0 : currentIndex;
  const currentAnnouncement = displayAnnouncements[safeIndex];

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'Operations & Safety':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Fair Work NSW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'HR & Compliance':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Company Event':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-white/10 text-orange-300 border-white/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Spotlight: Company's Latest Announcement Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-navy-950 border border-orange-500/30 p-5 sm:p-6 text-white shadow-xl shadow-slate-950/20 animate-in fade-in duration-200">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          {/* Left side info */}
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-slate-950 tracking-wider uppercase shadow-xs">
                <span>📢 Company's Latest Announcement</span>
              </span>

              {currentAnnouncement.category && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(currentAnnouncement.category)}`}>
                  {currentAnnouncement.category}
                </span>
              )}

              <span className="text-[11px] text-slate-400 font-medium">
                📅 {currentAnnouncement.date}
              </span>

              <span className="text-[11px] text-slate-400 font-medium">
                by <strong className="text-slate-200">{currentAnnouncement.author}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
              {currentAnnouncement.title}
            </h3>

            <p className="text-xs text-slate-300 font-normal leading-relaxed max-w-4xl whitespace-pre-line">
              {currentAnnouncement.content}
            </p>

            {/* Indicator dots for the up to 10 announcements */}
            {displayAnnouncements.length > 1 && (
              <div className="flex items-center gap-1.5 pt-1">
                {displayAnnouncements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === safeIndex ? 'w-6 bg-orange-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Announcement ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right side navigation & toggle history */}
          <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 flex-shrink-0 self-end md:self-start pt-2 md:pt-0">
            
            {/* Carousel navigation buttons */}
            {displayAnnouncements.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                <span className="text-[10px] font-extrabold text-slate-400 px-2">
                  {safeIndex + 1} of {displayAnnouncements.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : displayAnnouncements.length - 1))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Previous Announcement"
                >
                  ◀ Prev
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => (prev < displayAnnouncements.length - 1 ? prev + 1 : 0))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Next Announcement"
                >
                  Next ▶
                </button>
              </div>
            )}

            {/* View up to 10 previous announcements history button */}
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                showHistory 
                  ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/20'
                  : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
            >
              <span>📋</span>
              <span>{showHistory ? 'Hide Previous Notices' : `View Previous Notices (${displayAnnouncements.length})`}</span>
              <span className="text-[10px]">{showHistory ? '▲' : '▼'}</span>
            </button>

          </div>

        </div>
      </div>

      {/* Expandable Archive: Up to 10 Previous Announcements History */}
      {showHistory && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-98 duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600 text-xs">📂</span>
                <h4 className="text-sm font-black text-slate-900">
                  Previous Company Announcements (Up to 10)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Browse recent company policies, WHS safety notices, and payroll updates
              </p>
            </div>

            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-center">
              {filteredHistory.length} of {displayAnnouncements.length} available
            </span>
          </div>

          {/* Search and Category Filter within Previous 10 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search within previous notices by keyword, title, author..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              <button
                onClick={() => setHistoryCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition cursor-pointer whitespace-nowrap ${
                  historyCategory === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setHistoryCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition cursor-pointer whitespace-nowrap ${
                    historyCategory === cat
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Previous Announcements */}
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No previous announcements match your search query.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {filteredHistory.map((notice, idx) => {
                const isSelectedInSpotlight = displayAnnouncements.findIndex(a => a.id === notice.id) === safeIndex;
                const isExpanded = expandedNoticeId === notice.id;

                return (
                  <div
                    key={notice.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelectedInSpotlight 
                        ? 'border-orange-400 bg-orange-50/30 ring-1 ring-orange-400/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            #{idx + 1}
                          </span>

                          {notice.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {notice.category}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 font-medium">
                            {notice.date}
                          </span>

                          <span className="text-[11px] text-slate-500 font-medium">
                            by <strong>{notice.author}</strong>
                          </span>

                          {isSelectedInSpotlight && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 uppercase tracking-wider">
                              Currently in Spotlight
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight pt-0.5">
                          {notice.title}
                        </h5>

                        <div className="text-xs text-slate-600 font-normal leading-relaxed pt-0.5">
                          {isExpanded || notice.content.length <= 150 ? (
                            <p className="whitespace-pre-line">{notice.content}</p>
                          ) : (
                            <p>{notice.content.slice(0, 150)}...</p>
                          )}

                          {notice.content.length > 150 && (
                            <button
                              onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-1 block cursor-pointer"
                            >
                              {isExpanded ? '▲ Show Less' : '▼ Read Full Bulletin'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Jump to spotlight button */}
                      <button
                        onClick={() => {
                          const realIdx = displayAnnouncements.findIndex(a => a.id === notice.id);
                          if (realIdx !== -1) {
                            setCurrentIndex(realIdx);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 self-start sm:self-center cursor-pointer ${
                          isSelectedInSpotlight
                            ? 'bg-orange-500 text-slate-950 font-black'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelectedInSpotlight ? '★ Featured' : 'View in Spotlight'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

