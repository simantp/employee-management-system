'use client';

import React, { useState } from 'react';
import { X, Calendar, AlertCircle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { LeaveType } from '@/types';
import { getSydneyTimeParts, calculateDaysBetween, getDaysUntil } from '@/lib/utils';

export default function ApplyLeaveModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, submitLeaveRequest } = useApp();
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState('28/08/2026');
  const [endDate, setEndDate] = useState('01/09/2026');
  const [totalDays, setTotalDays] = useState(5);
  const [reason, setReason] = useState('');
  const [uploadLater, setUploadLater] = useState(false);

  const daysUntilStart = getDaysUntil(startDate);

  // Business Rule Lead Time Validations from Excel
  const getAdvanceRequirement = () => {
    if (totalDays === 1) return { required: 2, label: '2 days in advance for 1 day leave' };
    if (totalDays <= 5) return { required: 14, label: '2 weeks in advance for 2-5 days leave' };
    return { required: 28, label: '4 weeks in advance for 5+ days leave' };
  };

  const advanceRule = getAdvanceRequirement();
  const isAdvanceMet = daysUntilStart >= advanceRule.required;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a brief reason for your leave.');
      return;
    }

    submitLeaveRequest({
      employeeId: currentStaff.id,
      employeeName: `${currentStaff.firstName} ${currentStaff.lastName}`,
      employeeAvatar: currentStaff.avatarUrl,
      department: currentStaff.department,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      isAdvanceNoticeMet: isAdvanceMet,
      advanceNoticeDays: daysUntilStart,
      certificateUploaded: !uploadLater,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Apply for Leave</h3>
              <p className="text-[11px] text-slate-500">Australian standard advance notice rules applied</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="ANNUAL">Annual Leave (Balance: {currentStaff.leaveBalance.annual} days)</option>
              <option value="SICK">Sick Leave (Balance: {currentStaff.leaveBalance.sick} days)</option>
              <option value="CARERS">Personal / Carer&apos;s Leave (Balance: {currentStaff.leaveBalance.carers} days)</option>
              <option value="LONG_SERVICE">Long Service Leave ({currentStaff.leaveBalance.longService} days)</option>
              <option value="WFH">Work From Home (WFH Request)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Date (DD/MM/YYYY)</label>
              <input
                type="text"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">End Date (DD/MM/YYYY)</label>
              <input
                type="text"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Total Days Requested</label>
            <input
              type="number"
              min={1}
              max={30}
              value={totalDays}
              onChange={e => setTotalDays(parseInt(e.target.value, 10) || 1)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Compliance Lead Time Feedback Pill */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isAdvanceMet ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {isAdvanceMet ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-xs">Advance Notice: {advanceRule.label}</p>
              <p className="text-[11px] opacity-90">
                You are submitting {daysUntilStart} days ahead. {isAdvanceMet ? 'Compliant with policy.' : 'Late notice submitted — requires Admin approval.'}
              </p>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Annual family vacation or medical appointment..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">⚡ Real-time alert dispatched to Admin</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs">Cancel</button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/25 transition"
              >
                Submit Request
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
