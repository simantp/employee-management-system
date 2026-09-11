'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Employee, Department } from '@/types';
import { getOnboardingProgress } from '@/lib/onboarding';
import EmployeeDetailModal from './EmployeeDetailModal';
import AddEmployeeModal from './AddEmployeeModal';

export default function EmployeeManagementView({
  filterCategory = 'ALL'
}: {
  filterCategory?: 'ALL' | 'PERSONAL' | 'EMPLOYMENT' | 'PAYROLL' | 'EMERGENCY';
}) {
  const { employees, archiveEmployee, unarchiveEmployee, sendProfileCompletionReminder } = useApp();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [remindingEmpId, setRemindingEmpId] = useState<string | null>(null);

  // Modal for Archive / Unarchive confirmation
  const [employeeToArchive, setEmployeeToArchive] = useState<Employee | null>(null);

  // Effective status calculation ensuring 100% completed profiles are always treated as Active
  const getEffectiveStatus = (emp: Employee) => {
    const progress = getOnboardingProgress(emp);
    if (emp.status === 'Pending' && progress.isComplete) {
      return 'Active';
    }
    return emp.status;
  };

  // Status counts based on effective status
  const nonArchivedCount = employees.filter(e => getEffectiveStatus(e) !== 'Archived').length;
  const activeCount = employees.filter(e => getEffectiveStatus(e) === 'Active').length;
  const pendingCount = employees.filter(e => getEffectiveStatus(e) === 'Pending').length;
  const onLeaveCount = employees.filter(e => getEffectiveStatus(e) === 'On Leave').length;
  const terminatedCount = employees.filter(e => getEffectiveStatus(e) === 'Terminated').length;
  const archivedCount = employees.filter(e => getEffectiveStatus(e) === 'Archived').length;

  // Filtered staff list: Archived staff are strictly excluded from default 'ALL' and only shown when 'Archived' is explicitly filtered
  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeNumber.toLowerCase().includes(q) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q));

    const matchesDept = selectedDept === 'ALL' 
      ? true 
      : selectedDept === 'UNASSIGNED' 
      ? !emp.department 
      : emp.department === selectedDept;

    const effStatus = getEffectiveStatus(emp);
    const matchesStatus = selectedStatus === 'ALL' 
      ? effStatus !== 'Archived' 
      : effStatus === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-sans text-xs">
      
      {/* Main Staff Management Directory Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Staff Management Directory ({filtered.length})
              </h2>
              {selectedStatus === 'Archived' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  Archived Filter Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any staff member to view and edit role, bank vault, visa rights, driver licence, and personal details.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-1 xl:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search staff, email, ID, role..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium shadow-xs"
                />
              </div>

              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none shadow-xs"
              >
                <option value="ALL">All Departments</option>
                <option value="UNASSIGNED">Unassigned (Pending)</option>
                <option value="Production (Riverwood)">Production (Riverwood)</option>
                <option value="Production (Rockdale)">Production (Rockdale)</option>
                <option value="Design">Design</option>
                <option value="Administration">Administration</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Human Resources">Human Resources</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className={`text-xs font-bold border rounded-xl px-3 py-2 cursor-pointer focus:outline-none shadow-xs transition-colors ${
                  selectedStatus === 'Archived' 
                    ? 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-400/20' 
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <option value="ALL">All Staff ({nonArchivedCount})</option>
                <option value="Active">Active ({activeCount})</option>
                <option value="Pending">Pending ({pendingCount})</option>
                <option value="On Leave">On Leave ({onLeaveCount})</option>
                <option value="Terminated">Terminated ({terminatedCount})</option>
                <option value="Archived">Archived ({archivedCount})</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer ml-1"
              >
                <span>Add Employee</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informative Banner when Archived filter is selected */}
        {selectedStatus === 'Archived' && (
          <div className="p-3.5 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between gap-3 text-purple-900 text-xs">
            <div className="flex items-center gap-2.5">
              <span>
                <strong>Archived Staff Vault:</strong> Showing {filtered.length} archived record(s). These staff members are hidden from active schedules and regular operations. Click <strong>Unarchive</strong> on any record to reactivate them to Active status with all previous records intact.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer flex-shrink-0"
            >
              Back to All Staff
            </button>
          </div>
        )}

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Department &amp; Role</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(emp => {
                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="hover:bg-orange-50/40 transition-colors group cursor-pointer"
                  >
                    {/* Staff Name & ID */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={emp.firstName}
                          className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs group-hover:ring-orange-400 transition"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 group-hover:text-orange-600 transition block text-sm">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            ID: {emp.employeeNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{emp.jobTitle || 'Staff Member'}</span>
                        {emp.department ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {emp.department}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact info */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <div className="text-slate-700 font-medium">
                          <span className="truncate max-w-[150px] block">{emp.email}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          <span>{emp.mobilePhone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status & Onboarding Progress */}
                    <td className="py-3.5 px-5">
                      {(() => {
                        const progress = getOnboardingProgress(emp);
                        const effStatus = getEffectiveStatus(emp);
                        const isPending = effStatus === 'Pending';

                        if (isPending) {
                          return (
                            <div className="space-y-1">
                              <span 
                                className="px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300"
                                title={`Onboarding: ${progress.completedCount} of 4 sections completed (${progress.percent}%). Missing: ${progress.missingSectionTitles.join(', ')}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending ({progress.completedCount}/4 Done)
                              </span>
                              {/* 4-dot Progress Bar */}
                              <div className="flex items-center gap-1 px-1" title={`${progress.percent}% profile completed`}>
                                {progress.sections.map((sec) => (
                                  <span 
                                    key={sec.id}
                                    title={`${sec.title}: ${sec.isDone ? 'Done' : 'Missing'}`}
                                    className={`h-1.5 rounded-full transition-all ${
                                      sec.isDone ? 'w-3 bg-emerald-500' : 'w-1.5 bg-slate-200'
                                    }`}
                                  />
                                ))}
                                <span className="text-[9px] font-mono font-bold text-amber-700 ml-1">
                                  {progress.percent}%
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1.5 ${
                            effStatus === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : effStatus === 'On Leave' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : effStatus === 'Archived'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 font-black'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {effStatus === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            {effStatus === 'Archived' && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                            {effStatus}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions: Remind, Manage, Archive/Unarchive */}
                    <td className="py-3.5 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {getEffectiveStatus(emp) === 'Pending' && (
                          <button
                            type="button"
                            disabled={remindingEmpId === emp.id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setRemindingEmpId(emp.id);
                              try {
                                await sendProfileCompletionReminder(emp.id);
                              } finally {
                                setRemindingEmpId(null);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] transition inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                            title={`Send Profile Completion Reminder Email to ${emp.email}`}
                          >
                            <span>{remindingEmpId === emp.id ? 'Sending...' : 'Remind'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-bold text-[11px] transition inline-flex items-center shadow-xs cursor-pointer"
                          title="Manage & Edit Profile"
                        >
                          Manage
                        </button>

                        {getEffectiveStatus(emp) === 'Archived' ? (
                          <button
                            type="button"
                            onClick={() => setEmployeeToArchive(emp)}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Unarchive and restore staff member to Active status"
                          >
                            <span>Unarchive</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEmployeeToArchive(emp)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Archive staff member (safely preserved in database)"
                          >
                            <span>Archive</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600">
                      {selectedStatus === 'Archived' 
                        ? 'No archived staff members found' 
                        : 'No staff members found matching criteria'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedStatus === 'Archived' 
                        ? 'Archived employees will appear here when archived from the directory.' 
                        : 'Try clearing filters or searching another term.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Edit Profile Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* Archive / Unarchive Confirmation Modal */}
      {employeeToArchive && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEmployeeToArchive(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {employeeToArchive.status === 'Archived' ? 'Unarchive & Reactivate Staff' : 'Archive Staff Member'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {employeeToArchive.status === 'Archived' ? 'Restore to Active status with all previous records' : 'Preserve records safely in database'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <img
                src={employeeToArchive.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={employeeToArchive.firstName}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200"
              />
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 text-sm truncate">
                  {employeeToArchive.firstName} {employeeToArchive.lastName}
                </p>
                <p className="text-[11px] font-mono text-slate-500">ID: {employeeToArchive.employeeNumber}</p>
                <p className="text-[11px] text-slate-600">{employeeToArchive.jobTitle} • {employeeToArchive.department || 'Operations'}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              {employeeToArchive.status === 'Archived'
                ? `Unarchiving ${employeeToArchive.firstName} ${employeeToArchive.lastName} will restore their status to Active. The staff member will immediately regain full Sign-In access and Shift Clock punch access with their existing/old login credentials, and all previous records (timecards, leave requests, documents, banking) will remain 100% intact.`
                : `Archiving will suspend Sign-In access and Shift Clock punch access for ${employeeToArchive.firstName} ${employeeToArchive.lastName}, and hide them from active floor operations and the main staff directory. All historical timecards, leave requests, documents, and credentials will remain permanently preserved in the database and will be restored if unarchived.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToArchive(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  archiveEmployee(employeeToArchive.id, employeeToArchive.status !== 'Archived');
                  setEmployeeToArchive(null);
                }}
                className={`px-5 py-2 rounded-xl text-white font-bold transition shadow-xs cursor-pointer ${
                  employeeToArchive.status === 'Archived'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                }`}
              >
                {employeeToArchive.status === 'Archived' ? 'Confirm Unarchive' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
