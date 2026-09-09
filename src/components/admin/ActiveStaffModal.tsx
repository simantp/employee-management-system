'use client';

import React, { useState } from 'react';
import { Employee } from '@/types';
import { useApp } from '@/lib/store';

interface ActiveStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee) => void;
}

export default function ActiveStaffModal({
  isOpen,
  onClose,
  onSelectEmployee
}: ActiveStaffModalProps) {
  const { employees } = useApp();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  if (!isOpen) return null;

  // Filter staff currently on shift
  const activeStaff = employees.filter(e => e.clockState === 'CLOCKED_IN');

  const filteredStaff = activeStaff.filter(emp => {
    const q = search.toLowerCase();
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.employeeNumber.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q));

    const matchesDept = departmentFilter === 'ALL' ? true : emp.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(activeStaff.map(e => e.department).filter(Boolean)));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20 flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Active On-Shift Staff</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                  {activeStaff.length} Clocked In
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Live floor workforce attendance across Sydney printing &amp; prepress plants
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Search active staff by name, ID, role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 shadow-2xs w-full sm:w-64"
            />

            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept!}>{dept}</option>
                ))}
              </select>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-semibold self-end sm:self-center">
            Showing <strong className="text-slate-900">{filteredStaff.length}</strong> of {activeStaff.length} on duty
          </div>
        </div>

        {/* Staff List Body */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 divide-y divide-slate-100">
          {filteredStaff.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg font-bold">
                👥
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                {activeStaff.length === 0 ? 'No Staff Currently On Shift' : 'No Matching Staff Found'}
              </h4>
              <p className="text-slate-500 max-w-sm mx-auto text-xs">
                {activeStaff.length === 0 
                  ? 'No employees have punched in to the Shift Clock terminal today yet.' 
                  : 'Try clearing your search query to see all active staff members.'}
              </p>
            </div>
          ) : (
            filteredStaff.map(emp => {
              return (
                <div
                  key={emp.id}
                  className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3 rounded-2xl hover:bg-slate-50/90 transition-all border border-transparent hover:border-slate-200/80"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={emp.firstName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-xs"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          {emp.employeeNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ON SHIFT
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium truncate">
                        {emp.jobTitle} • <strong className="text-slate-700">{emp.department || 'Production'}</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>📍 {emp.workLocation || 'Sydney Plant'}</span>
                        <span>🔑 PIN: <strong className="font-mono text-slate-700">{emp.kioskPin || '4829'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Synchronized with live Sydney plant timecard registry.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
