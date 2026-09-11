'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Announcement } from '@/types';
import PostAnnouncementModal from './PostAnnouncementModal';
import EditAnnouncementModal from './EditAnnouncementModal';

export default function AnnouncementsManager() {
  const { announcements, deleteAnnouncement, togglePinAnnouncement } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PINNED' | 'STANDARD'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showPostModal, setShowPostModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    announcements.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [announcements]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchContent = a.content.toLowerCase().includes(q);
        const matchAuthor = a.author.toLowerCase().includes(q);
        const matchCat = (a.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchAuthor && !matchCat) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
        return false;
      }

      // Pin status
      if (selectedFilter === 'PINNED' && !a.isPinned) return false;
      if (selectedFilter === 'STANDARD' && a.isPinned) return false;

      return true;
    });
  }, [announcements, searchQuery, selectedCategory, selectedFilter]);

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'Operations & Safety':
        return 'bg-amber-500/15 text-amber-800 border-amber-500/30';
      case 'Fair Work NSW':
        return 'bg-blue-500/15 text-blue-800 border-blue-500/30';
      case 'HR & Compliance':
        return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30';
      case 'Company Event':
        return 'bg-purple-500/15 text-purple-800 border-purple-500/30';
      default:
        return 'bg-slate-200/70 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Company Announcements &amp; Broadcast Records
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Permanent compliance ledger of company broadcasts, WHS bulletins, and staff dashboard notices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Broadcast Announcement</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search announcements by title, content keywords, author or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter by Pin Status */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 text-xs font-bold">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({announcements.length})
            </button>
            <button
              onClick={() => setSelectedFilter('PINNED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'PINNED'
                  ? 'bg-white text-orange-700 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Pinned</span>
              <span>({announcements.filter(a => a.isPinned).length})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('STANDARD')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedFilter === 'STANDARD'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Standard ({announcements.filter(a => !a.isPinned).length})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 text-xs font-semibold">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Categories:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg border transition text-xs cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg border transition text-xs whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List / Records Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900">Announcement Records</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Showing {filteredAnnouncements.length} of {announcements.length}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Records stored in database & synchronized across staff portals
          </span>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-800">No Announcements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No announcement records match your current search or category filter. Try clearing filters or create a new broadcast.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnnouncements.map((ann, idx) => {
              const isExpanded = expandedId === ann.id;
              return (
                <div 
                  key={ann.id}
                  className={`p-5 sm:p-6 transition-colors duration-150 ${
                    ann.isPinned ? 'bg-orange-50/20 hover:bg-orange-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    
                    {/* Main Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      
                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Pinned Badge */}
                        {ann.isPinned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-slate-950 uppercase tracking-wider shadow-2xs">
                            <span>Pinned Spotlight</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Standard Notice
                          </span>
                        )}

                        {/* Category */}
                        {ann.category && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(ann.category)}`}>
                            {ann.category}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-medium">
                          {ann.date}
                        </span>

                        <span className="text-[11px] text-slate-500 font-medium">
                          Issued by: <strong className="text-slate-700">{ann.author}</strong> ({ann.authorRole || 'ADMIN'})
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                        {ann.title}
                      </h3>

                      {/* Content (Expandable) */}
                      <div className="text-xs text-slate-600 font-normal leading-relaxed">
                        {isExpanded || ann.content.length <= 160 ? (
                          <p className="whitespace-pre-line">{ann.content}</p>
                        ) : (
                          <p>
                            {ann.content.slice(0, 160)}...
                          </p>
                        )}

                        {ann.content.length > 160 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-1 cursor-pointer"
                          >
                            {isExpanded ? '▲ Show Less' : '▼ Read Full Message'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 self-start lg:self-center flex-shrink-0 pt-2 lg:pt-0">
                      
                      {/* Toggle Pin Button */}
                      <button
                        onClick={() => togglePinAnnouncement(ann.id)}
                        className={`p-2 px-3 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          ann.isPinned
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-700 hover:bg-orange-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={ann.isPinned ? 'Unpin announcement' : 'Pin to top spotlight'}
                      >
                        <span>{ann.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingAnnouncement(ann)}
                        className="p-2 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition flex items-center gap-1.5 cursor-pointer"
                        title="Edit announcement record"
                      >
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingAnnouncement(ann)}
                        className="p-2 px-3 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100/70 transition flex items-center gap-1.5 cursor-pointer"
                        title="Delete announcement record"
                      >
                        <span>Delete</span>
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <PostAnnouncementModal onClose={() => setShowPostModal(false)} />
      )}

      {/* Edit Modal */}
      {editingAnnouncement && (
        <EditAnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAnnouncement && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setDeletingAnnouncement(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Announcement Record</h3>
              <p className="text-[11px] text-slate-500">This action will remove the record permanently from the database.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-xs">{deletingAnnouncement.title}</span>
              <span className="text-[11px] text-slate-500 block">Category: {deletingAnnouncement.category || 'General'} • Date: {deletingAnnouncement.date}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAnnouncement(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAnnouncement(deletingAnnouncement.id);
                  setDeletingAnnouncement(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
