'use client';

import React from 'react';
import { CalendarCheck2, Check, X } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function PendingLeaveApprovals() {
  const { leaveRequests, reviewLeaveRequest } = useApp();
  const pendingRequests = leaveRequests.filter(r => r.status === 'PENDING');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6" id="approvals">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Pending Staff Requests & Approvals</span>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  {pendingRequests.length} Action Required
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">Live approval queue (Instant staff notification upon review)</p>
          </div>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
          <p className="text-xs font-bold text-slate-600">All caught up!</p>
          <p className="text-[11px] text-slate-400">No pending leave or resignation requests right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pendingRequests.map(req => {
            const isSick = req.leaveType === 'SICK';
            return (
              <div 
                key={req.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={req.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                        alt={req.employeeName} 
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-xs"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{req.employeeName}</h4>
                        <span className="text-[10px] text-slate-500">{req.department}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isSick ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {req.leaveType} LEAVE
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/60 my-2 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium text-[11px]">Dates:</span>
                      <span className="font-bold text-slate-900">{req.startDate} → {req.endDate} ({req.totalDays} day{req.totalDays > 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium text-[11px]">Reason:</span>
                      <span className="text-slate-800 text-[11px] italic truncate max-w-[200px]">{req.reason}</span>
                    </div>
                    {isSick && (
                      <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Medical Certificate:</span>
                        <span className={`font-bold ${req.certificateUploaded ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {req.certificateUploaded ? '✓ Attached' : '⏳ Pending (Reminder Day 1)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/40 mt-1">
                  <button
                    onClick={() => reviewLeaveRequest(req.id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => reviewLeaveRequest(req.id, 'APPROVED')}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Leave
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
