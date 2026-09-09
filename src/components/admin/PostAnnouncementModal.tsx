'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';

export default function PostAnnouncementModal({ onClose }: { onClose: () => void }) {
  const { postAnnouncement } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Operations & Safety');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    postAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Post Company Announcement</h3>
            <p className="text-[11px] text-slate-300 font-medium">Broadcasts to top of all Staff Dashboards</p>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sydney Plant Schedule Update & WHS Policy"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Category / Tag</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 cursor-pointer"
            >
              <option value="Operations & Safety">Operations & Safety</option>
              <option value="Fair Work NSW">Fair Work NSW</option>
              <option value="Company Event">Company Event</option>
              <option value="HR & Compliance">HR & Compliance</option>
              <option value="General Announcement">General Announcement</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Announcement Message *</label>
            <textarea
              required
              rows={4}
              placeholder="Write the full announcement message for all staff..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-[11px]">
            This announcement will instantly appear in the <strong>Company's Latest Announcement</strong> banner at the top of the Staff Dashboard.
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800 cursor-pointer"
            >
              Broadcast Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
