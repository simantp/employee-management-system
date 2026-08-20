'use client';

import React, { useState } from 'react';
import { HelpCircle, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function StaffSupportView() {
  const { currentStaff } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setSubmitted(true);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">HR Help & Support Desk</h2>
        <p className="text-slate-500 mt-0.5">
          Submit queries regarding payroll, leave, visas or employee relations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-600" />
            <span>Open Support Request</span>
          </h3>

          {submitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Your support ticket has been submitted to HR. Ticket ID: #HR-9842.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold">
                <option>Payroll & Payslip Inquiries</option>
                <option>Leave & Time-Off Approvals</option>
                <option>Visa & Sponsorship Documentation</option>
                <option>Workplace Safety & Equipment</option>
                <option>General HR Question</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="Brief summary of your question"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Detailed Message</label>
              <textarea
                rows={4}
                required
                placeholder="Explain what you need assistance with..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition"
            >
              Send Request to HR
            </button>
          </form>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Direct HR Contacts (Sydney)</span>
          </h3>

          <div className="space-y-3 text-slate-300">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
              <span className="font-bold text-white block">HR Manager Office</span>
              <span>Email: hr@company.com.au • Phone: (02) 9840 2200</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
              <span className="font-bold text-white block">Payroll & Superannuation Dept</span>
              <span>Email: payroll@company.com.au • Phone: (02) 9840 2204</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
