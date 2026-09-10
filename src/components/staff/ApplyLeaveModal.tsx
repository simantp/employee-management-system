'use client';

import React, { useState } from 'react';
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
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const daysUntilStart = getDaysUntil(startDate);

  const isMedicalType = leaveType === 'SICK' || leaveType === 'CARERS';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCertPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setCertPreview('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1000&auto=format&fit=crop&q=80');
      }
    }
  };

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

    const hasCert = isMedicalType ? (!uploadLater && Boolean(certPreview)) : false;

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
      certificateUploaded: hasCert || (isMedicalType && !uploadLater),
      certificateUrl: certPreview || (isMedicalType && !uploadLater ? 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1000&auto=format&fit=crop&q=80' : undefined),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Apply for Leave</h3>
            <p className="text-[11px] text-slate-500">Australian standard advance notice rules applied</p>
          </div>
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer">
            Close
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

          {/* Medical Certificate Upload Box for Sick & Carer's Leave */}
          {isMedicalType && (
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-cyan-300">Medical Certificate &amp; Proof</span>
                <span className="text-[10px] text-slate-400">Optional for 1-day, required for 2+ days</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Attach a photo or scan of your doctor's certificate. Admin will inspect this document directly in the portal.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />

              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{certPreview ? 'Change Selected Certificate File' : 'Select Medical Certificate File / Photo'}</span>
                </button>
                {certPreview && (
                  <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-[10px] text-emerald-300">
                    <span>Certificate image ready to attach</span>
                    <button
                      type="button"
                      onClick={() => setCertPreview(null)}
                      className="text-rose-400 hover:text-rose-300 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Real-time alert dispatched to Admin</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs cursor-pointer">Cancel</button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/25 transition cursor-pointer"
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
