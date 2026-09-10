'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Announcement } from '@/types';

export default function EditAnnouncementModal({ 
  announcement, 
  onClose 
}: { 
  announcement: Announcement; 
  onClose: () => void;
}) {
  const { updateAnnouncement } = useApp();
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [category, setCategory] = useState(announcement.category || 'Operations & Safety');
  const [author, setAuthor] = useState(announcement.author);
  const [date, setDate] = useState(announcement.date);
  const [isPinned, setIsPinned] = useState(Boolean(announcement.isPinned));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    updateAnnouncement(announcement.id, {
      title: title.trim(),
      content: content.trim(),
      category,
      author: author.trim() || announcement.author,
      date: date.trim() || announcement.date,
      isPinned,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm">✏️</span>
              <h3 className="text-base font-bold text-white">Edit Announcement Record</h3>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">Update title, message content, category or pinned spotlight status</p>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category / Tag</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 cursor-pointer"
              >
                <option value="Operations & Safety">Operations & Safety</option>
                <option value="Fair Work NSW">Fair Work NSW</option>
                <option value="HR & Compliance">HR & Compliance</option>
                <option value="Company Event">Company Event</option>
                <option value="General Announcement">General Announcement</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Broadcast Date</label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="e.g. 20 Aug 2026"
                className="w-full p-3 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Author / Issuer</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Super Admin (HsCreations)"
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Announcement Message Content *</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-400 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-900 block">Pin to Spotlight</span>
              <span className="text-[11px] text-slate-500">Feature this announcement prominently at the top of the Staff Portal banner.</span>
            </div>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              Save Changes & Sync
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
