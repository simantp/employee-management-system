'use client';

import React, { useState } from 'react';
import { X, Megaphone, Send, Sparkles } from 'lucide-react';
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
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Post Company Announcement</h3>
              <p className="text-[11px] text-orange-400 font-medium">Broadcasts to top of all Staff Dashboards</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5" />
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
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
              className="w-full p-3 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200 text-orange-900 text-[11px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span>This announcement will instantly appear in the <strong>Company's Latest Announcement</strong> banner at the top of the Staff Dashboard.</span>
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
