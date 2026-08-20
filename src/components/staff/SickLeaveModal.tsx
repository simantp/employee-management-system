'use client';

import React, { useState, useEffect } from 'react';
import { X, FileHeart, Clock, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { useApp } from '@/lib/store';
import { getSydneyTimeParts } from '@/lib/utils';

export default function SickLeaveModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, submitLeaveRequest } = useApp();
  const [timeInfo, setTimeInfo] = useState(getSydneyTimeParts(new Date()));
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState('Severe flu and fever symptoms.');
  const [uploadNow, setUploadNow] = useState(false);

  useEffect(() => {
    setTimeInfo(getSydneyTimeParts(new Date()));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todaySydney = new Date().toLocaleDateString('en-AU');

    submitLeaveRequest({
      employeeId: currentStaff.id,
      employeeName: `${currentStaff.firstName} ${currentStaff.lastName}`,
      employeeAvatar: currentStaff.avatarUrl,
      department: currentStaff.department,
      leaveType: 'SICK',
      startDate: todaySydney,
      endDate: todaySydney,
      totalDays,
      reason,
      submittedBefore7AM: timeInfo.isBefore7AM,
      isAdvanceNoticeMet: timeInfo.isBefore7AM,
      advanceNoticeDays: 0,
      certificateUploaded: uploadNow,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <FileHeart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Report Sick Leave (Today)</h3>
              <p className="text-[11px] text-slate-500">Australian Policy: Must report before 7:00 AM Mon-Fri</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Time Check Widget */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            timeInfo.isBefore7AM ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                <p className="font-bold text-xs">Current Sydney Time: {timeInfo.timeString}</p>
                <p className="text-[10px]">
                  {timeInfo.isBefore7AM ? '✓ Within standard morning reporting window (< 7:00 AM)' : '⚠️ Past 7:00 AM cutoff — flagged for Admin notification'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Number of Days Off</label>
            <input
              type="number"
              min={1}
              max={5}
              value={totalDays}
              onChange={e => setTotalDays(parseInt(e.target.value, 10) || 1)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Symptoms / Details *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-slate-50"
            />
          </div>

          {/* Medical Certificate Reminder Box */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-cyan-300">Medical Certificate</span>
              <span className="text-[10px] text-slate-400">Upload now or later</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Per Excel specification, if not uploaded now, system sends an automated reminder every <strong>24 hours for 3 days</strong>.
            </p>
            <label className="flex items-center gap-2 text-xs pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={uploadNow}
                onChange={e => setUploadNow(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-slate-200">I have medical certificate ready to attach</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs">Cancel</button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/25 transition"
            >
              Submit Sick Leave Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
