'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { EmailLog, Employee } from '@/types';
import {
  Mail,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  X,
  Eye,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface StaffEmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function StaffEmailLogsModal({
  isOpen,
  onClose,
  employee
}: StaffEmailLogsModalProps) {
  const { emailLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Filter logs strictly for this employee
  const staffLogs = useMemo(() => {
    if (!employee) return [];
    const empEmail = (employee.email || '').toLowerCase().trim();
    const empFullName = `${employee.firstName} ${employee.lastName}`.toLowerCase().trim();
    const empId = (employee.id || '').toLowerCase().trim();
    const empNum = (employee.employeeNumber || '').toLowerCase().trim();

    return emailLogs.filter((log) => {
      const recipientEmail = (log.recipientEmail || '').toLowerCase().trim();
      const recipientName = (log.recipientName || '').toLowerCase().trim();
      const meta = log.meta || {};

      const isForEmployee =
        (empEmail && recipientEmail === empEmail) ||
        (empFullName && recipientName.includes(empFullName)) ||
        (empId && (recipientEmail.includes(empId) || meta.employeeId === employee.id)) ||
        (empNum && recipientEmail.includes(empNum));

      return isForEmployee;
    });
  }, [emailLogs, employee]);

  // Apply search and filter within staff logs
  const filteredLogs = useMemo(() => {
    return staffLogs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        log.subject.toLowerCase().includes(q) ||
        (log.previewSnippet && log.previewSnippet.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.messageId && log.messageId.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === 'ALL' || log.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'ALL' || log.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [staffLogs, searchTerm, categoryFilter, statusFilter]);

  if (!isOpen || !employee) return null;

  const getCategoryBadge = (category: EmailLog['category']) => {
    switch (category) {
      case 'VISA_EXPIRY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5 mr-1 text-amber-600" />
            Visa Expiry
          </span>
        );
      case 'LICENSE_EXPIRY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-2.5 h-2.5 mr-1 text-purple-600" />
            License Expiry
          </span>
        );
      case 'STAFF_INVITE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <User className="w-2.5 h-2.5 mr-1 text-blue-600" />
            Staff Invite
          </span>
        );
      case 'LEAVE_NOTIFICATION':
      case 'LEAVE_NOTICE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <FileText className="w-2.5 h-2.5 mr-1 text-emerald-600" />
            Leave
          </span>
        );
      case 'ONBOARDING_INVITE':
      case 'PROFILE_REMINDER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <User className="w-2.5 h-2.5 mr-1 text-indigo-600" />
            Onboarding
          </span>
        );
      case 'TIMECARD_ALERT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <Clock className="w-2.5 h-2.5 mr-1 text-orange-600" />
            Timecard
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Mail className="w-2.5 h-2.5 mr-1 text-slate-500" />
            {category}
          </span>
        );
    }
  };

  const getStatusBadge = (status: EmailLog['status']) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
            SENT
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-2.5 h-2.5 mr-1 text-amber-600" />
            QUEUED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-2.5 h-2.5 mr-1 text-rose-600" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={employee.firstName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight truncate">
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {employee.employeeNumber}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  • {employee.department || 'Sydney Operations'}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee.email}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">
                  {staffLogs.length} Total Email Record(s)
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject, content, message ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({staffLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('VISA_EXPIRY')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  categoryFilter === 'VISA_EXPIRY'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visa Expiry ({staffLogs.filter((l) => l.category === 'VISA_EXPIRY').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('LICENSE_EXPIRY')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  categoryFilter === 'LICENSE_EXPIRY'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                License ({staffLogs.filter((l) => l.category === 'LICENSE_EXPIRY').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="QUEUED">Queued</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Email Logs List */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                No Email Logs Found for {employee.firstName} {employee.lastName}
              </h4>
              <p className="text-slate-500 max-w-sm mx-auto text-xs">
                Sent visa reminders, driver license notices, and leave notifications for this employee will be recorded here automatically upon dispatch.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              return (
                <div
                  key={log.id}
                  className="pt-3 first:pt-0 flex flex-col gap-2 p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(log.category)}
                      {getStatusBadge(log.status)}
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View Body</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject and Preview */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs">
                      {log.subject}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {log.previewSnippet || log.details || 'No preview text provided.'}
                    </p>
                  </div>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-medium">
                    <span>
                      To: <strong className="text-slate-600">{log.recipientEmail}</strong>
                    </span>
                    {log.deliveryMode && (
                      <span>
                        Gateway: <strong className="text-slate-600">{log.deliveryMode}</strong>
                      </span>
                    )}
                    {log.messageId && (
                      <span className="font-mono truncate max-w-xs">
                        ID: {log.messageId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Fair Work Australia &amp; Home Affairs automated compliance communications audit log.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Secondary Detailed Email Preview Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(selectedLog.category)}
                  {getStatusBadge(selectedLog.status)}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">
                  {selectedLog.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-slate-800">{selectedLog.recipientName} &lt;{selectedLog.recipientEmail}&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
              </div>
              {selectedLog.messageId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Message ID:</span>
                  <span className="font-mono text-slate-800">{selectedLog.messageId}</span>
                </div>
              )}
            </div>

            {/* Render HTML or Snippet Preview */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Email Message Content:</h4>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl max-h-72 overflow-y-auto text-xs leading-relaxed text-slate-700 shadow-inner">
                {selectedLog.htmlContent ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedLog.htmlContent }}
                    className="prose prose-xs max-w-none text-slate-700"
                  />
                ) : (
                  <p className="whitespace-pre-wrap font-sans text-slate-700">
                    {selectedLog.previewSnippet || selectedLog.details || 'No content provided.'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
