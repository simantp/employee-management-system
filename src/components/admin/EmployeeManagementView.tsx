'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Employee, Department } from '@/types';
import EmployeeDetailModal from './EmployeeDetailModal';

export default function EmployeeManagementView({
  filterCategory = 'ALL'
}: {
  filterCategory?: 'ALL' | 'PERSONAL' | 'EMPLOYMENT' | 'PAYROLL' | 'EMERGENCY';
}) {
  const { employees, deleteEmployee, archiveEmployee } = useApp();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Modals for confirmation
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [employeeToArchive, setEmployeeToArchive] = useState<Employee | null>(null);

  // Filtered staff list
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

    const matchesStatus = selectedStatus === 'ALL' 
      ? true 
      : emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-sans text-xs">
      
      {/* Main Staff Management Directory Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Staff Management Directory ({filtered.length})
            </h2>
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
                className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none shadow-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

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

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        emp.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : emp.status === 'On Leave' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : emp.status === 'Archived'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 font-black'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions: Manage, Archive/Restore, Delete */}
                    <td className="py-3.5 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-bold text-[11px] transition inline-flex items-center shadow-xs cursor-pointer"
                          title="Manage & Edit Profile"
                        >
                          Manage
                        </button>

                        <button
                          type="button"
                          onClick={() => setEmployeeToArchive(emp)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer border ${
                            emp.status === 'Archived'
                              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                          title={emp.status === 'Archived' ? 'Restore / Unarchive staff member' : 'Archive staff member'}
                        >
                          <span>📦</span>
                          <span>{emp.status === 'Archived' ? 'Restore' : 'Archive'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEmployeeToDelete(emp)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Permanently delete employee"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600">No staff members found matching criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or searching another term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* Archive / Restore Confirmation Modal */}
      {employeeToArchive && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEmployeeToArchive(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold ${
                employeeToArchive.status === 'Archived' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
              }`}>
                📦
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {employeeToArchive.status === 'Archived' ? 'Restore Staff Member' : 'Archive Staff Member'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {employeeToArchive.status === 'Archived' ? 'Reactivate staff profile' : 'Preserve records in database'}
                </p>
              </div>
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
                ? `Restoring ${employeeToArchive.firstName} ${employeeToArchive.lastName} will set their status back to Active.`
                : `Archiving will hide ${employeeToArchive.firstName} ${employeeToArchive.lastName} from active floor shifts. All historical timecards, leave requests, documents, and audit logs remain permanently stored in the MySQL database.`}
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
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {employeeToArchive.status === 'Archived' ? 'Confirm Restore' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEmployeeToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Employee Profile</h3>
                <p className="text-[11px] text-slate-500">Permanent database removal</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-2xl flex items-center gap-3">
              <img
                src={employeeToDelete.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={employeeToDelete.firstName}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-rose-200"
              />
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 text-sm truncate">
                  {employeeToDelete.firstName} {employeeToDelete.lastName}
                </p>
                <p className="text-[11px] font-mono text-slate-500">ID: {employeeToDelete.employeeNumber}</p>
                <p className="text-[11px] text-slate-600">{employeeToDelete.jobTitle} • {employeeToDelete.department || 'Operations'}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this employee? This will remove their profile and records from the database. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEmployee(employeeToDelete.id);
                  setEmployeeToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
