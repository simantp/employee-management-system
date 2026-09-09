'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';

export default function StaffDirectoryView() {
  const { employees } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filtered = employees.filter(e => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.jobTitle} ${e.department}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || e.department.includes(deptFilter);
    return matchSearch && matchDept;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Company Staff Directory</h2>
          <p className="text-slate-500 mt-0.5">
            Internal contact details for colleagues across Riverwood, Rockdale &amp; Headquarters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, role, plant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-xl bg-white focus:outline-none w-64 shadow-xs"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="p-2 border rounded-xl bg-white font-semibold"
          >
            <option value="ALL">All Plants</option>
            <option value="Riverwood">Riverwood</option>
            <option value="Rockdale">Rockdale</option>
            <option value="Design">Design</option>
            <option value="Administration">Administration</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3.5 hover:shadow-md transition">
            <img 
              src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775?w=150'} 
              alt={emp.firstName} 
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-xs truncate">{emp.firstName} {emp.lastName}</h4>
              <p className="text-[11px] text-cyan-600 font-semibold truncate">{emp.jobTitle}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{emp.department}</p>
              
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-500">
                <span className="truncate">{emp.email}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
