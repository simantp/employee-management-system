'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  FileSpreadsheet, 
  Building2, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  Palmtree, 
  Trash2,
  FileText
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { TimecardRecord, Employee, Department } from '@/types';

export default function AdminTimecardManagement() {
  const { 
    timecards, 
    employees, 
    leaveRequests, 
    adminAdjustTimecard, 
    adminAddTimecard, 
    adminDeleteTimecard,
    clockOutWithKiosk
  } = useApp();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [editingRecord, setEditingRecord] = useState<TimecardRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formClockIn, setFormClockIn] = useState('07:30 AM');
  const [formClockOut, setFormClockOut] = useState('04:00 PM');
  const [formBreak, setFormBreak] = useState<number>(30);
  const [formNotes, setFormNotes] = useState('');

  const activeStaff = employees.filter(e => e.clockState === 'CLOCKED_IN');

  const filteredTimecards = timecards.filter(t => {
    const q = search.toLowerCase();
    const matchQuery = 
      t.employeeName.toLowerCase().includes(q) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      t.date.toLowerCase().includes(q);

    const matchDept = deptFilter === 'ALL' || t.department === deptFilter;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchQuery && matchDept && matchStatus;
  });

  const totalCompanyHours = filteredTimecards.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const totalCompanyOvertime = filteredTimecards.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
  const totalCompletedShifts = filteredTimecards.filter(t => t.status === 'COMPLETED' || t.status === 'MANUALLY_ADJUSTED').length;

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    adminAdjustTimecard(editingRecord.id, {
      clockIn: formClockIn,
      clockOut: formClockOut,
      breakMinutes: Number(formBreak) || 0,
      totalHours: 8.0,
      notes: formNotes || editingRecord.notes
    });

    setEditingRecord(null);
  };

  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === formEmployeeId);
    if (!targetEmp) return;

    adminAddTimecard({
      employeeId: targetEmp.id,
      employeeName: `${targetEmp.firstName} ${targetEmp.lastName}`,
      employeeAvatar: targetEmp.avatarUrl,
      department: targetEmp.department || 'Production (Riverwood)',
      date: formDate || new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      clockIn: formClockIn,
      clockOut: formClockOut,
      breakMinutes: Number(formBreak) || 30,
      totalHours: 8.0,
      overtimeHours: 0.4,
      status: 'MANUALLY_ADJUSTED',
      notes: formNotes || 'Manually logged by SuperAdmin'
    });

    setShowAddModal(false);
    setFormEmployeeId('');
    setFormNotes('');
  };

  const exportCompanyReportCSV = () => {
    const headers = ['Record ID', 'Employee ID', 'Employee Name', 'Department', 'Shift Date', 'Clock In', 'Clock Out', 'Break (min)', 'Paid Hours', 'Overtime', 'Status', 'Notes', 'Adjusted By'];
    const rows = filteredTimecards.map(t => [
      `"${t.id}"`,
      `"${t.employeeId}"`,
      `"${t.employeeName}"`,
      `"${t.department || ''}"`,
      `"${t.date}"`,
      `"${t.clockIn}"`,
      `"${t.clockOut || 'Active'}"`,
      t.breakMinutes,
      t.totalHours,
      t.overtimeHours,
      `"${t.status}"`,
      `"${t.notes || ''}"`,
      `"${t.adjustedBy || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HsCreations_Payroll_Timecard_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Timecard Records &amp; Shift Management</h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black border border-orange-200">
              SuperAdmin Suite
            </span>
          </div>
          <p className="text-slate-500 mt-0.5">
            Real-time biometric &amp; electronic Kiosk punch logs across Riverwood, Rockdale, and Sydney plants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Manual Shift Entry</span>
          </button>

          <button
            onClick={exportCompanyReportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate PDF Summary</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currently Working</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block flex items-center gap-1.5">
              <span>{activeStaff.length}</span>
              {activeStaff.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Clocked in via Kiosk</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Timer className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Hours</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCompanyHours.toFixed(1)} hrs</span>
            <span className="text-[10px] text-slate-500 font-medium">Across {totalCompletedShifts} logged shifts</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Overtime Hours</span>
            <span className="text-2xl font-black text-orange-600 mt-1 block">{totalCompanyOvertime.toFixed(1)} hrs</span>
            <span className="text-[10px] text-orange-700 font-medium">Fair Work 1.5x/2.0x audit</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payroll Integrity</span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">100%</span>
            <span className="text-[10px] text-purple-700 font-medium">Fair Work NSW Compliant</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="font-extrabold text-sm text-white">Live Floor Active Shifts ("Who's Working Right Now")</h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {activeStaff.length} On Duty
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sydney Facility Telemetry</span>
        </div>

        {activeStaff.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto text-slate-600 mb-1.5" />
            <p className="font-bold text-slate-300">No staff currently punched in on floor</p>
            <p className="text-slate-500 text-[11px]">Staff will appear here automatically when they punch in via the Kiosk.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeStaff.map(emp => (
              <div key={emp.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={emp.firstName}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/50"
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs">{emp.firstName} {emp.lastName}</h4>
                    <span className="text-[10px] text-slate-400 block">{emp.department || 'Production'}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      In: {emp.lastClockIn ? new Date(emp.lastClockIn).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => clockOutWithKiosk(emp.kioskPin || '', undefined, 30)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-black transition cursor-pointer"
                  title="Force clock-out if staff forgot"
                >
                  Clock Out
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>All Staff Timecards ({filteredTimecards.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Electronic timecard logs recorded via 4-digit PIN Kiosks. Superadmin has full adjustment access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, dept, date..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 w-48 sm:w-56 font-medium"
              />
            </div>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Production (Riverwood)">Production (Riverwood)</option>
              <option value="Production (Rockdale)">Production (Rockdale)</option>
              <option value="Design">Design</option>
              <option value="Administration">Administration</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CLOCKED_IN">Clocked In (Active)</option>
              <option value="COMPLETED">Completed</option>
              <option value="MANUALLY_ADJUSTED">Admin Adjusted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Clock In</th>
                <th className="py-3.5 px-5">Clock Out</th>
                <th className="py-3.5 px-5">Break</th>
                <th className="py-3.5 px-5">Total Hours</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimecards.map(t => (
                <tr key={t.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={t.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={t.employeeName}
                        className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 block">{t.employeeName}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">ID: {t.employeeId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-700">
                    {t.department || 'Production'}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-slate-800">
                    {t.date}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">
                    {t.clockIn}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                    {t.clockOut || (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black animate-pulse">
                        Clocked In
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 font-medium">
                    {t.breakMinutes}m
                  </td>
                  <td className="py-3.5 px-5 font-black text-slate-900 text-sm">
                    {t.totalHours}h
                    {t.overtimeHours > 0 && (
                      <span className="text-[10px] text-orange-600 block font-bold">+{t.overtimeHours}h OT</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      t.status === 'CLOCKED_IN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      t.status === 'MANUALLY_ADJUSTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Adjusted' : t.status}
                    </span>
                    {t.adjustedBy && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">By {t.adjustedBy}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingRecord(t);
                          setFormClockIn(t.clockIn);
                          setFormClockOut(t.clockOut || '04:00 PM');
                          setFormBreak(t.breakMinutes);
                          setFormNotes(t.notes || '');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-orange-900 text-slate-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                        <span>Adjust</span>
                      </button>

                      <button
                        onClick={() => adminDeleteTimecard(t.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Delete Shift"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: SUPERADMIN ADJUST */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Adjust Staff Timecard</h3>
                  <p className="text-[10px] text-slate-500">{editingRecord.employeeName} • {editingRecord.date}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clock In (AEST)</label>
                  <input
                    type="text"
                    required
                    value={formClockIn}
                    onChange={e => setFormClockIn(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                    placeholder="07:30 AM"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clock Out (AEST)</label>
                  <input
                    type="text"
                    required
                    value={formClockOut}
                    onChange={e => setFormClockOut(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                    placeholder="04:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Meal Break (minutes)</label>
                <input
                  type="number"
                  required
                  value={formBreak}
                  onChange={e => setFormBreak(Number(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Audit Reason / Note</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900"
                  placeholder="e.g. Employee forgot punch-out; supervisor verified shift."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 cursor-pointer"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL SHIFT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">Manual Shift Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewShift} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                <select
                  required
                  value={formEmployeeId}
                  onChange={e => setFormEmployeeId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold cursor-pointer"
                >
                  <option value="">-- Select Staff Member --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.department || 'Production'}) - ID: {emp.employeeNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shift Date</label>
                <input
                  type="date"
                  required
                  onChange={e => {
                    if (e.target.value) {
                      const d = new Date(e.target.value);
                      setFormDate(d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }));
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clock In Time</label>
                  <input
                    type="text"
                    required
                    value={formClockIn}
                    onChange={e => setFormClockIn(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clock Out Time</label>
                  <input
                    type="text"
                    required
                    value={formClockOut}
                    onChange={e => setFormClockOut(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Meal Break (minutes)</label>
                <input
                  type="number"
                  required
                  value={formBreak}
                  onChange={e => setFormBreak(Number(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Plant Line</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Riverwood Roland Press Shift"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 cursor-pointer"
                >
                  Add Shift Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REPORT SUMMARY */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">HsCreations Payroll &amp; Attendance Report</h3>
                <p className="text-[11px] text-slate-500">Fair Work Australia Certified Timecard Summary</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Total Records</span>
                <span className="text-lg font-black text-slate-900">{filteredTimecards.length} Shifts</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Total Hours Logged</span>
                <span className="text-lg font-black text-emerald-600">{totalCompanyHours.toFixed(1)} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Total Overtime Hours</span>
                <span className="text-lg font-black text-orange-600">{totalCompanyOvertime.toFixed(1)} hrs</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-2">Employee</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">In / Out</th>
                  <th className="p-2">Hours</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimecards.map(t => (
                  <tr key={t.id}>
                    <td className="p-2 font-bold text-slate-900">{t.employeeName}</td>
                    <td className="p-2">{t.date}</td>
                    <td className="p-2 font-mono">{t.clockIn} – {t.clockOut || 'Active'}</td>
                    <td className="p-2 font-bold">{t.totalHours}h</td>
                    <td className="p-2">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
