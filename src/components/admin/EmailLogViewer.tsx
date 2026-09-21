'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { EmailLog } from '@/types';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  User,
  Calendar,
  X,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Info
} from 'lucide-react';

export const EmailLogViewer: React.FC = () => {
  const { emailLogs, clearEmailLogs, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return emailLogs.filter((log) => {
      const matchesSearch =
        log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.previewSnippet && log.previewSnippet.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' || log.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'ALL' || log.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [emailLogs, searchTerm, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = emailLogs.length;
    const sent = emailLogs.filter((l) => l.status === 'SENT').length;
    const queued = emailLogs.filter((l) => l.status === 'QUEUED').length;
    const failed = emailLogs.filter((l) => l.status === 'FAILED').length;
    const expiryReminders = emailLogs.filter(
      (l) => l.category === 'VISA_EXPIRY' || l.category === 'LICENSE_EXPIRY'
    ).length;

    return { total, sent, queued, failed, expiryReminders };
  }, [emailLogs]);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all email audit records?')) {
      setIsClearing(true);
      try {
        await clearEmailLogs();
        addToast('Email records cleared successfully', 'info');
      } catch (err) {
        addToast('Failed to clear email logs', 'error');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const getCategoryBadge = (category: EmailLog['category']) => {
    switch (category) {
      case 'VISA_EXPIRY':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Visa Expiry
          </span>
        );
      case 'LICENSE_EXPIRY':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 mr-1 text-purple-600" />
            License Expiry
          </span>
        );
      case 'STAFF_INVITE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <User className="w-3 h-3 mr-1 text-blue-600" />
            Staff Invite
          </span>
        );
      case 'PROFILE_REMINDER':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Clock className="w-3 h-3 mr-1 text-indigo-600" />
            Profile Update
          </span>
        );
      case 'LEAVE_NOTICE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
            Leave Notice
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Mail className="w-3 h-3 mr-1 text-slate-500" />
            General
          </span>
        );
    }
  };

  const getStatusBadge = (status: EmailLog['status']) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Sent
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            Queued
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
            Failed
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-[#453a6a]">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Logs & Audit</h1>
              <p className="text-sm text-slate-500">
                Track and inspect automated compliance reminders, expiry alerts, onboarding invites, and staff notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {emailLogs.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Sent & Logged</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Mail className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivered Successfully</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{stats.sent}</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expiry Reminders</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600">{stats.expiryReminders}</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery Failures</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600">{stats.failed}</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by recipient, subject, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#453a6a] focus:bg-white text-slate-900 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">All Categories</option>
              <option value="VISA_EXPIRY">Visa Expiry</option>
              <option value="LICENSE_EXPIRY">License Expiry</option>
              <option value="STAFF_INVITE">Staff Invite</option>
              <option value="PROFILE_REMINDER">Profile Update</option>
              <option value="LEAVE_NOTICE">Leave Notice</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="QUEUED">Queued</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No email records found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filters.'
                : 'Automated reminders and notices sent to staff will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Subject & Preview</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#453a6a]/10 text-[#453a6a] font-semibold text-xs flex items-center justify-center uppercase">
                          {log.recipientName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {log.recipientName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {log.recipientEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(log.category)}
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-medium text-slate-800 truncate">
                        {log.subject}
                      </div>
                      {log.previewSnippet && (
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {log.previewSnippet}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {log.timestamp}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#453a6a] hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Full Email"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-50 text-[#453a6a]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Email Dispatch Record</h3>
                  <p className="text-xs text-slate-500">ID: {selectedLog.id} • {selectedLog.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Meta information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold">To:</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">
                    {selectedLog.recipientName} ({selectedLog.recipientEmail})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Delivery Status:</span>
                  <div className="mt-0.5 flex items-center space-x-2">
                    {getStatusBadge(selectedLog.status)}
                    <span className="text-slate-500">({selectedLog.deliveryMode})</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Category:</span>
                  <div className="mt-1">{getCategoryBadge(selectedLog.category)}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Triggered By:</span>
                  <p className="font-medium text-slate-700 mt-1">
                    {selectedLog.actorName || 'System Automation'}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Subject</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-900 mt-1">
                  {selectedLog.subject}
                </div>
              </div>

              {/* Body / Content */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Message Content</label>
                <div className="mt-1 p-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {selectedLog.previewSnippet || 'No text snippet available.'}
                </div>
              </div>

              {/* Additional Details/Meta */}
              {selectedLog.details && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-2.5 text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Dispatch Note: </span>
                    {selectedLog.details}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogViewer;

