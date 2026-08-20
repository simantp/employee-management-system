'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Palmtree, 
  ShieldCheck, 
  Briefcase, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  MapPin, 
  UserCheck, 
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  ChevronRight,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Employee, Department } from '@/types';
import EmployeeDetailModal from './EmployeeDetailModal';
import AddEmployeeModal from './AddEmployeeModal';

export default function EmployeeManagementView({
  filterCategory = 'ALL'
}: {
  filterCategory?: 'ALL' | 'PERSONAL' | 'EMPLOYMENT' | 'PAYROLL' | 'EMERGENCY';
}) {
  const { employees } = useApp();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.status === 'Active').length;
  const onLeaveStaff = employees.filter(e => e.status === 'On Leave').length;
  const unassignedDept = employees.filter(e => !e.department).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-sans text-xs">
      
      {/* Top Metric Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalStaff}</span>
            <span className="text-[10px] text-slate-500 font-medium">Registered in HsCreations</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Working</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeStaff}</span>
            <span className="text-[10px] text-emerald-700 font-medium">On site &amp; scheduled</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">On Leave</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{onLeaveStaff}</span>
            <span className="text-[10px] text-amber-700 font-medium">Annual / Sick leave</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Palmtree className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unassigned Dept</span>
            <span className="text-2xl font-black text-orange-600 mt-1 block">{unassignedDept}</span>
            <span className="text-[10px] text-orange-700 font-medium">Needs Admin setup</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Staff Management Directory Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              <span>Staff Management Directory ({filtered.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any staff member to view and edit role, leave balances, bank vault, visa rights, and personal details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, email, ID, role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 w-52 sm:w-64 font-medium"
              />
            </div>

            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="UNASSIGNED">⚠️ Unassigned (Pending)</option>
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
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Department &amp; Role</th>
                <th className="py-3.5 px-5">Start Date</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">Leave Balances</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(emp => {
                const totalLeave = (emp.leaveBalance?.annual || 0) + (emp.leaveBalance?.sick || 0) + (emp.leaveBalance?.carers || 0) + (emp.leaveBalance?.longService || 0);

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
                            ⚠️ Unassigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Start Date */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.startDate || 'Date of Reg'}</span>
                      </div>
                      {emp.workingHours ? (
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                          {emp.workingHours}h / week
                        </span>
                      ) : null}
                    </td>

                    {/* Contact info */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emp.mobilePhone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Leave Balances */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200" title="Annual Leave">
                          🏖️ {emp.leaveBalance?.annual ?? 20}d
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title="Sick Leave">
                          🩺 {emp.leaveBalance?.sick ?? 10}d
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Carers Leave">
                          🤲 {emp.leaveBalance?.carers ?? 5}d
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                        Total: {totalLeave} days accrued
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        emp.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : emp.status === 'On Leave' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manage &amp; Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No staff members found matching criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or searching another term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modals */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
        />
      )}

    </div>
  );
}
