'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { LeaveRequest, LeaveType, LeaveStatus } from '@/types';

export default function PendingLeaveApprovals({
  mode = 'full'
}: {
  mode?: 'compact' | 'full';
}) {
  const { leaveRequests, reviewLeaveRequest, employees } = useApp();
  
  // Search and Filters for Approved/Historical Records
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  const pendingRequests = leaveRequests.filter(r => r.status === 'PENDING');
  const approvedRequests = leaveRequests.filter(r => r.status === 'APPROVED');
  const rejectedRequests = leaveRequests.filter(r => r.status === 'REJECTED');
  
  const totalApprovedDays = approvedRequests.reduce((acc, curr) => acc + (curr.totalDays || 0), 0);
  const staffOnLeaveCount = employees.filter(e => e.status === 'On Leave').length;

  // Filtered list for the approved / historical records table
  const filteredLeaves = leaveRequests.filter(req => {
    const q = search.toLowerCase();
    const matchSearch = 
      req.employeeName.toLowerCase().includes(q) ||
      (req.department && req.department.toLowerCase().includes(q)) ||
      (req.reason && req.reason.toLowerCase().includes(q)) ||
      req.leaveType.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' ? true : req.status === statusFilter;
    const matchType = typeFilter === 'ALL' ? true : req.leaveType === typeFilter;
    const matchDept = deptFilter === 'ALL' ? true : req.department === deptFilter;

    return matchSearch && matchStatus && matchType && matchDept;
  });

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'ANNUAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SICK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CARERS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LONG_SERVICE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESIGNATION':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'UNPAID':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'WFH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const exportApprovedLeavesCSV = () => {
    const headers = [
      'Request ID', 
      'Employee ID', 
      'Employee Name', 
      'Department', 
      'Leave Type', 
      'Start Date', 
      'End Date', 
      'Total Days', 
      'Status', 
      'Submitted At', 
      'Reviewed By', 
      'Reviewed At', 
      'Reason', 
      'Admin Notes'
    ];
    const rows = filteredLeaves.map(r => [
      `"${r.id}"`,
      `"${r.employeeId}"`,
      `"${r.employeeName}"`,
      `"${r.department || ''}"`,
      `"${r.leaveType}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      r.totalDays,
      `"${r.status}"`,
      `"${r.submittedAt || ''}"`,
      `"${r.reviewedBy || ''}"`,
      `"${r.reviewedAt || ''}"`,
      `"${r.reason ? r.reason.replace(/"/g, '""') : ''}"`,
      `"${r.adminNotes ? r.adminNotes.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HsCreations_Leave_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compact Mode (used as widget on Main Dashboard)
  // Compact Mode (used as widget on Main Dashboard)
  if (mode === 'compact') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6 text-xs" id="approvals">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Pending Staff Requests &amp; Approvals</span>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {pendingRequests.length} Action Required
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">Live approval queue (Instant staff notification upon review)</p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-600">All caught up</p>
            <p className="text-[11px] text-slate-400">No pending leave or resignation requests right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingRequests.map(req => {
              const isSick = req.leaveType === 'SICK';
              return (
                <div 
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={req.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt={req.employeeName} 
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shadow-xs"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{req.employeeName}</h4>
                          <span className="text-[10px] text-slate-500">{req.department}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getLeaveTypeBadge(req.leaveType)}`}>
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
                            {req.certificateUploaded ? 'Attached' : 'Pending'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/40 mt-1">
                    <button
                      onClick={() => reviewLeaveRequest(req.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => reviewLeaveRequest(req.id, 'APPROVED')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      Approve Leave
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

  // Full Mode (Used in Leave Approvals Tab: shows pending queue + comprehensive approved records management)
  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      
      {/* 1. Pending Staff Requests & Approvals Queue (Priority Action Box) */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Pending Leave Approvals</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {pendingRequests.length} Waiting
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Instant notification and payroll sync occurs upon approving</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(req => {
              const isSick = req.leaveType === 'SICK';
              return (
                <div 
                  key={req.id}
                  className="p-4 rounded-2xl border border-amber-200 bg-white shadow-xs flex flex-col justify-between hover:border-amber-400 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={req.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt={req.employeeName} 
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shadow-xs"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{req.employeeName}</h4>
                          <span className="text-[10px] text-slate-500">{req.department || 'Sydney Operations'}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getLeaveTypeBadge(req.leaveType)}`}>
                        {req.leaveType} LEAVE
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 my-2 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="font-semibold text-[11px]">Leave Dates:</span>
                        <span className="font-bold text-slate-900">{req.startDate} → {req.endDate} ({req.totalDays} day{req.totalDays > 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-semibold text-[11px]">Reason:</span>
                        <span className="text-slate-800 text-[11px] italic truncate max-w-[220px]">{req.reason}</span>
                      </div>
                      {isSick && (
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                          <span className="text-slate-500">Medical Certificate:</span>
                          <span className={`font-bold ${req.certificateUploaded ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {req.certificateUploaded ? 'Attached' : 'Pending'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                        <span>Submitted:</span>
                        <span>{req.submittedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => reviewLeaveRequest(req.id, 'REJECTED')}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => reviewLeaveRequest(req.id, 'APPROVED')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      Approve Leave
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Approved Staff Leaves & Historical Records Directory */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Directory Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Approved Leaves &amp; Staff Leave Records ({filteredLeaves.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live audit trail of approved staff leaves, medical certificates, and leave management controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportApprovedLeavesCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer shadow-xs text-xs"
            >
              Export Leaves (CSV)
            </button>
            <input
              type="text"
              placeholder="Search staff, reason, type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 w-44 sm:w-52 font-medium shadow-xs"
            />

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none shadow-xs"
            >
              <option value="ALL">All Leave Types</option>
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="CARERS">Carer's Leave</option>
              <option value="LONG_SERVICE">Long Service Leave</option>
              <option value="RESIGNATION">Resignation</option>
              <option value="UNPAID">Unpaid Leave</option>
              <option value="WFH">Work From Home</option>
            </select>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none shadow-xs"
            >
              <option value="ALL">All Departments</option>
              <option value="Production (Riverwood)">Production (Riverwood)</option>
              <option value="Production (Rockdale)">Production (Rockdale)</option>
              <option value="Design">Design</option>
              <option value="Administration">Administration</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
        </div>

        {/* Leave Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Leave Type</th>
                <th className="py-3.5 px-5">Leave Period &amp; Days</th>
                <th className="py-3.5 px-5">Reason &amp; Documentation</th>
                <th className="py-3.5 px-5">Review &amp; Approval</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="font-bold text-slate-600">No leave records matching the selected filters</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try resetting search or filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => {
                  const isApproved = leave.status === 'APPROVED';
                  const isPending = leave.status === 'PENDING';
                  const isRejected = leave.status === 'REJECTED';

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Staff Member */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={leave.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                            alt={leave.employeeName} 
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-xs"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{leave.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{leave.employeeId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-5">
                        <span className="text-slate-700 font-medium block">{leave.department || 'Sydney Operations'}</span>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3.5 px-5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getLeaveTypeBadge(leave.leaveType)}`}>
                          {leave.leaveType}
                        </span>
                      </td>

                      {/* Leave Period & Days */}
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 block">{leave.startDate} → {leave.endDate}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}</span>
                      </td>

                      {/* Reason & Documentation */}
                      <td className="py-3.5 px-5 max-w-[200px]">
                        <span className="text-slate-800 text-[11px] block truncate font-medium" title={leave.reason}>
                          {leave.reason}
                        </span>
                        {leave.certificateUploaded ? (
                          <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                            Medical Cert Attached
                          </span>
                        ) : leave.leaveType === 'SICK' ? (
                          <span className="text-[10px] font-medium text-amber-600 block mt-0.5">
                            Cert Not Uploaded
                          </span>
                        ) : null}
                      </td>

                      {/* Review & Approval Info */}
                      <td className="py-3.5 px-5">
                        {leave.reviewedBy ? (
                          <div>
                            <span className="font-bold text-slate-800 block text-[11px]">{leave.reviewedBy}</span>
                            <span className="text-[10px] text-slate-400">{leave.reviewedAt || 'Approved'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending Review</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isApproved 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : isPending 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <span>{leave.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLeave(leave)}
                            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer font-bold text-[11px]"
                          >
                            Details
                          </button>

                          {isApproved ? (
                            <button
                              onClick={() => reviewLeaveRequest(leave.id, 'REJECTED', 'Status reverted by SuperAdmin')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] border border-rose-200 transition cursor-pointer"
                              title="Revert / Cancel Approval"
                            >
                              Revoke
                            </button>
                          ) : isPending ? (
                            <button
                              onClick={() => reviewLeaveRequest(leave.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] transition cursor-pointer"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => reviewLeaveRequest(leave.id, 'APPROVED', 'Re-approved by SuperAdmin')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition cursor-pointer"
                            >
                              Re-Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail & Management Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Leave Application Details</h3>
                <span className="text-[10px] text-slate-400 font-mono">{selectedLeave.id}</span>
              </div>
              <button 
                onClick={() => setSelectedLeave(null)}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <img 
                src={selectedLeave.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt={selectedLeave.employeeName} 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedLeave.employeeName}</h4>
                <p className="text-[11px] text-slate-500">{selectedLeave.department || 'Sydney Headquarters'}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${getLeaveTypeBadge(selectedLeave.leaveType)}`}>
                  {selectedLeave.leaveType} LEAVE ({selectedLeave.totalDays} Days)
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Leave Period:</span>
                <span className="font-bold text-slate-900">{selectedLeave.startDate} → {selectedLeave.endDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Submitted Date:</span>
                <span className="font-semibold text-slate-800">{selectedLeave.submittedAt || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className={`font-bold text-[11px] ${
                  selectedLeave.status === 'APPROVED' ? 'text-emerald-600' : selectedLeave.status === 'PENDING' ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {selectedLeave.status}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Reviewed By:</span>
                <span className="font-semibold text-slate-800">{selectedLeave.reviewedBy || 'Not reviewed yet'}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 font-medium block mb-1">Reason for Leave:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs italic">
                  "{selectedLeave.reason}"
                </p>
              </div>

              {selectedLeave.leaveType === 'SICK' && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-900 block">Medical Certificate:</span>
                    <span className="text-[10px] text-amber-700">
                      {selectedLeave.certificateUploaded ? 'Verified & attached to HR vault' : 'Pending upload by employee'}
                    </span>
                  </div>
                  {selectedLeave.certificateUploaded && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Attached
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs transition cursor-pointer"
              >
                Close
              </button>
              {selectedLeave.status !== 'APPROVED' ? (
                <button
                  onClick={() => {
                    reviewLeaveRequest(selectedLeave.id, 'APPROVED');
                    setSelectedLeave(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Approve Leave
                </button>
              ) : (
                <button
                  onClick={() => {
                    reviewLeaveRequest(selectedLeave.id, 'REJECTED', 'Revoked from modal');
                    setSelectedLeave(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Revoke Approval
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

