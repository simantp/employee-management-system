'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import ApplyLeaveModal from '../ApplyLeaveModal';
import SickLeaveModal from '../SickLeaveModal';

function getIsBefore7AMSydney(): { isBefore7AM: boolean; timeString: string } {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const sydneyDateStr = now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  const sydneyDate = new Date(sydneyDateStr);
  const hour = sydneyDate.getHours();

  return {
    isBefore7AM: hour < 7,
    timeString,
  };
}

export default function StaffLeaveView() {
  const { currentStaff, leaveRequests } = useApp();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSickModal, setShowSickModal] = useState(false);
  
  const [sydneyTimeInfo, setSydneyTimeInfo] = useState<{ isBefore7AM: boolean; timeString: string }>({
    isBefore7AM: false,
    timeString: '',
  });

  useEffect(() => {
    const updateTime = () => {
      setSydneyTimeInfo(getIsBefore7AMSydney());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const staffRequests = leaveRequests.filter(r => r.employeeId === currentStaff.id);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Leave Management Center</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              sydneyTimeInfo.isBefore7AM
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              Sydney: {sydneyTimeInfo.timeString || 'Loading...'}
            </span>
          </div>
          <p className="text-slate-500 mt-0.5">
            Sydney Leave Balances, Advance Notice Rules &amp; Sick Leave Reporting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {sydneyTimeInfo.isBefore7AM ? (
            <button
              onClick={() => setShowSickModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Sick Leave (&lt; 7 AM)</span>
            </button>
          ) : (
            <button
              disabled
              title="Sick leave self-reporting is closed after the 7:00 AM Sydney morning cutoff. Contact your supervisor directly."
              className="flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-400 px-4 py-2.5 rounded-xl font-bold cursor-not-allowed select-none shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Sick Leave (Closed &gt; 7 AM)</span>
            </button>
          )}

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {!sydneyTimeInfo.isBefore7AM && (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div>
              <h4 className="font-bold text-xs text-amber-950">Morning Sick Leave Cutoff (7:00 AM AEST) Has Passed</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Under Australian workplace policy, same-day sick leave must be self-reported prior to 7:00 AM. For today&apos;s unscheduled absence, please notify your Plant Manager or HR directly.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-200/80 text-amber-900 font-mono font-bold text-[10px] shrink-0 border border-amber-300">
            Cutoff: 07:00 AM
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">My Leave Request History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Medical Certificate</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffRequests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{r.leaveType}</td>
                  <td className="py-3 px-4 font-medium">{r.startDate} to {r.endDate}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.totalDays} day(s)</td>
                  <td className="py-3 px-4 text-slate-600 italic truncate max-w-[200px]">{r.reason}</td>
                  <td className="py-3 px-4">
                    {r.leaveType === 'SICK' ? (
                      r.certificateUploaded ? (
                        <span className="text-emerald-600 font-bold">Attached</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Pending (Day 1)</span>
                      )
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showApplyModal && <ApplyLeaveModal onClose={() => setShowApplyModal(false)} />}
      {showSickModal && <SickLeaveModal onClose={() => setShowSickModal(false)} />}
    </div>
  );
}

