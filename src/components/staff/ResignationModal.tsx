'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';

export default function ResignationModal({ onClose }: { onClose: () => void }) {
  const { currentStaff, submitLeaveRequest } = useApp();
  const [effectiveDate, setEffectiveDate] = useState('16/09/2026');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please state your notice reasons for HR record.');
      return;
    }

    submitLeaveRequest({
      employeeId: currentStaff.id,
      employeeName: `${currentStaff.firstName} ${currentStaff.lastName}`,
      employeeAvatar: currentStaff.avatarUrl,
      department: currentStaff.department,
      leaveType: 'RESIGNATION',
      startDate: effectiveDate,
      endDate: effectiveDate,
      totalDays: 0,
      reason: `Resignation Notice (4 weeks standard): ${reason}`,
      isAdvanceNoticeMet: true,
      advanceNoticeDays: 28,
      certificateUploaded: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Formal Resignation Notice</h3>
            <p className="text-[11px] text-slate-500">Australian Standard Notice: 4 Weeks in Advance</p>
          </div>
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <p className="text-[11px]">
              Per company policy, resignation notices must be given <strong>4 weeks in advance</strong>. Once posted, the status will show as Pending until Admin confirmation.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Proposed Last Working Day (DD/MM/YYYY)</label>
            <input
              type="text"
              required
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason / Statement for HR</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Pursuing a new career opportunity..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/25 transition cursor-pointer"
            >
              Submit Resignation Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
