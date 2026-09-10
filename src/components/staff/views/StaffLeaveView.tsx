'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import ApplyLeaveModal from '../ApplyLeaveModal';
import SickLeaveModal from '../SickLeaveModal';

export default function StaffLeaveView() {
  const { currentStaff, leaveRequests } = useApp();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSickModal, setShowSickModal] = useState(false);

  const staffRequests = leaveRequests.filter(r => r.employeeId === currentStaff.id);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Leave Management Center</h2>
          <p className="text-slate-500 mt-0.5">
            Sydney Leave Balances, Advance Notice Rules &amp; Sick Leave Reporting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSickModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Sick Leave (&lt; 7 AM)</span>
          </button>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

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
