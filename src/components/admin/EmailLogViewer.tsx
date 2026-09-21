'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { EmailLog } from '@/types';

export default function EmailLogViewer() {
  const { emailLogs, clearEmailLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewingEmail, setViewingEmail] = useState<EmailLog | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered email records
  const filteredLogs = useMemo(() => {
    return emailLogs.filter(log => {
      const matchesSearch = 
        log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.messageId && log.messageId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [emailLogs, searchTerm, selectedCategory, selectedStatus]);

  // Counts for metric summary strip
  const totalEmails = emailLogs.length;
  const expiryCount = emailLogs.filter(e => e.category === 'EXPIRY_REMINDER').length;
  const inviteCount = emailLogs.filter(e => e.category === 'ONBOARDING_INVITE').length;
  const sentCount = emailLogs.filter(e => e.status === 'SENT' || e.status === 'SIMULATED').length;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'EXPIRY_REMINDER':
        return { label: 'Visa / License Expiry', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ONBOARDING_INVITE':
        return { label: 'Staff Onboarding', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'PROFILE_REMINDER':
        return { label: 'Profile Reminder', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'LEAVE_NOTIFICATION':
        return { label: 'Leave Update', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'TIMECARD_ALERT':
        return { label: 'Shift / Timecard', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'OTP_SECURITY':
        return { label: '2FA / Security', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'General Notice', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="email-logs">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Automated Email Communications Log
            </h2>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Immutable audit record of all automated visa &amp; licence expiry reminders, staff invites, and compliance notices.
          </p>
        </div>

        {totalEmails > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-bold text-xs border border-slate-200 hover:border-rose-200 shadow-2xs transition self-start sm:self-auto cursor-pointer"
          >
            Clear Log History
          </button>
        )}
      </div>

      {/* 2. Top Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-base flex-shrink-0">
            ??
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Dispatched</div>
            <div className="text-xl font-black text-slate-900">{totalEmails}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-base flex-shrink-0">
            ??
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Expiry Reminders</div>
            <div className="text-xl font-black text-amber-900">{expiryCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-base flex-shrink-0">
            ??
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Staff Invites</div>
            <div className="text-xl font-black text-blue-900">{inviteCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-base flex-shrink-0">
            ?
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Delivered</div>
            <div className="text-xl font-black text-emerald-900">{sentCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Controls & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by staff name, email address, subject or message ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/10 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">??</span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="EXPIRY_REMINDER">Visa &amp; License Expiry</option>
              <option value="ONBOARDING_INVITE">Onboarding Invites</option>
              <option value="PROFILE_REMINDER">Profile Reminders</option>
              <option value="LEAVE_NOTIFICATION">Leave Updates</option>
              <option value="TIMECARD_ALERT">Shift &amp; Timecards</option>
              <option value="OTP_SECURITY">2FA / Security</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent (Delivered)</option>
              <option value="SIMULATED">Simulated / Test</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Interactive Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl mx-auto">
              ??
            </div>
            <h4 className="font-bold text-slate-900 text-sm">No Email Logs Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No email records match your active search and filter criteria.'
                : 'Automated email records and dispatch logs will appear here when triggered.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/80 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Timestamp (AEST)</th>
                  <th className="py-3 px-4">Staff Recipient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject &amp; Preview</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {filteredLogs.map(log => {
                  const badge = getCategoryBadge(log.category);
                  const initials = log.recipientName.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{log.recipientName}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{log.recipientEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Subject & Preview Snippet */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-slate-900 truncate">{log.subject}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {log.previewSnippet || log.details || 'No preview available'}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            log.status === 'SENT' ? 'bg-emerald-500' :
                            log.status === 'SIMULATED' ? 'bg-indigo-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-bold text-[11px] text-slate-800">
                            {log.status === 'SENT' ? 'Sent' : log.status === 'SIMULATED' ? 'Simulated' : 'Failed'}
                          </span>
                          {log.deliveryMode === 'REAL_SMTP' && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              SMTP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingEmail(log)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 hover:text-purple-950 font-bold text-xs border border-purple-200/80 shadow-2xs transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detailed Email Preview Modal */}
      {viewingEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(viewingEmail.category).bg}`}>
                    {getCategoryBadge(viewingEmail.category).label}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">{viewingEmail.timestamp}</span>
                </div>
                <h3 className="text-base font-black text-slate-900">{viewingEmail.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs transition cursor-pointer"
              >
                ?
              </button>
            </div>

            {/* Email Headers Meta Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-sans font-bold">To:</span>
                <span className="text-slate-900 font-bold">{viewingEmail.recipientName} &lt;{viewingEmail.recipientEmail}&gt;</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-sans font-bold">Sender Bot:</span>
                <span className="text-slate-800">{viewingEmail.actorName || 'Automated Compliance Engine'}</span>
              </div>
              {viewingEmail.messageId && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-sans font-bold">Message ID:</span>
                  <span className="text-slate-600 text-[11px] truncate">{viewingEmail.messageId}</span>
                </div>
              )}
            </div>

            {/* Email Message Content Body */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-2xl bg-white border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Content Preview:</div>
              <div className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/60 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {viewingEmail.previewSnippet || viewingEmail.details || 'Automated system notification dispatched.'}
              </div>

              {viewingEmail.details && (
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <strong>System Audit Note:</strong> {viewingEmail.details}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-lg">
                ???
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Clear Email Log History</h4>
                <p className="text-[11px] text-slate-500">Reset email dispatch audit trails</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to clear all {totalEmails} email communication logs? This action will reset the log history.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearEmailLogs();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Confirm &amp; Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
