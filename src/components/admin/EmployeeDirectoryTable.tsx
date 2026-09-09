'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Employee } from '@/types';

export default function EmployeeDirectoryTable({
  onSelectEmployee
}: {
  onSelectEmployee?: (emp) => void;
}) {
  const { employees } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredEmployees = employees.filter(emp => {
    const matchQuery = 
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || emp.department === deptFilter;
    return matchQuery && matchDept;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" id="employees">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Employees</h3>
          <p className="text-xs text-slate-500">Australian Staff Directory &amp; Compliance Tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter list..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Production (Riverwood)">Production (Riverwood)</option>
            <option value="Production (Rockdale)">Production (Rockdale)</option>
            <option value="Design">Design</option>
            <option value="Administration">Administration</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3.5 px-5">Employee ID</th>
              <th className="py-3.5 px-5">Full Name</th>
              <th className="py-3.5 px-5">Department</th>
              <th className="py-3.5 px-5">Mobile</th>
              <th className="py-3.5 px-5">Visa / Expiry</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedEmployees.map((emp) => (
              <tr 
                key={emp.id}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => onSelectEmployee && onSelectEmployee(emp)}
              >
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  {emp.employeeNumber}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={emp.firstName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
                    />
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400">{emp.jobTitle}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 font-medium text-slate-700">
                  {emp.department}
                </td>
                <td className="py-3.5 px-5 font-medium text-slate-600">
                  {emp.mobilePhone}
                </td>
                <td className="py-3.5 px-5 font-medium">
                  {emp.visaExpiryDate ? (
                    <span className={`text-[11px] font-bold ${
                      emp.visaExpiryDate.includes('2025') ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {emp.visaExpiryDate}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Citizen (N/A)</span>
                  )}
                </td>
                <td className="py-3.5 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    emp.status === 'On Leave' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold transition"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
