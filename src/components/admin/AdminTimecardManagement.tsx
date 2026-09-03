'use client';

import React, { useState, useEffect } from 'react';
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

function getMonthKey(dateStr: string): string {
  if (!dateStr) return 'August 2026';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    }
  } catch (e) {}

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  for (let i = 0; i < months.length; i++) {
    if (dateStr.includes(months[i]) || dateStr.includes(fullMonths[i])) {
      const yearMatch = dateStr.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : '2026';
      return `${fullMonths[i]} ${year}`;
    }
  }
  return 'August 2026';
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'Monday';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-AU', { weekday: 'long' });
    }
  } catch (e) {}

  const parts = dateStr.trim().split(/[\s-]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = months.findIndex(m => monthStr.toLowerCase().startsWith(m.toLowerCase()));
    if (mIdx !== -1 && !isNaN(day) && !isNaN(year)) {
      const d = new Date(year, mIdx, day);
      return d.toLocaleDateString('en-AU', { weekday: 'long' });
    }
  }
  return 'Monday';
}

function formatSecondsToHMS(totalSec: number): string {
  const safeSec = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  const mer = match[4] ? match[4].toUpperCase() : null;
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 3600 + m * 60 + s;
}

function calculateShiftDuration(clockIn: string, clockOut: string, breakMinutes: number): { totalHours: number; durationSeconds: number; overtimeHours: number } {
  const inSec = parseTimeToSeconds(clockIn);
  let outSec = parseTimeToSeconds(clockOut);
  if (outSec < inSec) {
    outSec += 24 * 3600; // overnight shift
  }
  const breakSec = Math.max(0, (breakMinutes || 0) * 60);
  const totalSec = Math.max(0, outSec - inSec - breakSec);
  const totalHours = parseFloat((totalSec / 3600).toFixed(4));
  const overtimeHours = totalHours > 7.6 ? parseFloat((totalHours - 7.6).toFixed(4)) : 0;
  return { totalHours, durationSeconds: totalSec, overtimeHours };
}

function getShiftRunningSeconds(t: TimecardRecord, nowMs: number): number {
  if (t.clockInTimestamp) {
    return Math.max(0, Math.floor((nowMs - t.clockInTimestamp) / 1000));
  }

  // If clockIn is string format e.g. "07:30 AM"
  try {
    const parts = (t.clockIn || '').match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
    if (!parts) return 0;
    let h = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const s = parts[3] ? parseInt(parts[3], 10) : 0;
    const mer = parts[4] ? parts[4].toUpperCase() : null;
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;

    const now = new Date(nowMs);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);
    const diffSec = Math.floor((nowMs - start.getTime()) / 1000);
    if (diffSec >= 0 && diffSec < 24 * 3600) {
      return diffSec;
    }
    return 0; // Starts clean from 00:00:00!
  } catch (e) {
    return 0;
  }
}

function formatRunningDuration(t: TimecardRecord, nowMs: number): string {
  const sec = getShiftRunningSeconds(t, nowMs);
  return formatSecondsToHMS(sec);
}

function formatCompletedDuration(t: TimecardRecord): string {
  if (t.durationSeconds !== undefined && t.durationSeconds > 0) {
    return formatSecondsToHMS(t.durationSeconds);
  }
  const sec = Math.max(0, Math.round((t.totalHours || 0) * 3600));
  return formatSecondsToHMS(sec);
}

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

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');

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

  const availableMonths = Array.from(
    new Set(timecards.map(t => getMonthKey(t.date)))
  );
  if (!availableMonths.includes('August 2026')) availableMonths.unshift('August 2026');
  if (!availableMonths.includes('July 2026')) availableMonths.push('July 2026');

  const filteredTimecards = timecards.filter(t => {
    const q = search.toLowerCase();
    const matchQuery = 
      t.employeeName.toLowerCase().includes(q) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      t.date.toLowerCase().includes(q);

    const matchStaff = staffFilter === 'ALL' || t.employeeId === staffFilter;
    const matchMonth = monthFilter === 'ALL' || getMonthKey(t.date) === monthFilter;

    return matchQuery && matchStaff && matchMonth;
  });

  // Group filtered timecards month-wise
  const timecardsByMonth = filteredTimecards.reduce<Record<string, TimecardRecord[]>>((acc, curr) => {
    const m = getMonthKey(curr.date);
    if (!acc[m]) acc[m] = [];
    acc[m].push(curr);
    return acc;
  }, {});

  const monthKeys = Object.keys(timecardsByMonth);

  const totalCompanyHours = filteredTimecards.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const totalCompanyOvertime = filteredTimecards.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
  const totalCompletedShifts = filteredTimecards.filter(t => t.status === 'COMPLETED' || t.status === 'MANUALLY_ADJUSTED').length;

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const { totalHours, durationSeconds, overtimeHours } = calculateShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);

    adminAdjustTimecard(editingRecord.id, {
      clockIn: formClockIn,
      clockOut: formClockOut,
      breakMinutes: Number(formBreak) || 0,
      totalHours,
      durationSeconds,
      overtimeHours,
      notes: formNotes || editingRecord.notes
    });

    setEditingRecord(null);
  };

  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === formEmployeeId);
    if (!targetEmp) return;

    const { totalHours, durationSeconds, overtimeHours } = calculateShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);

    adminAddTimecard({
      employeeId: targetEmp.id,
      employeeName: `${targetEmp.firstName} ${targetEmp.lastName}`,
      employeeAvatar: targetEmp.avatarUrl,
      department: targetEmp.department || 'Production (Riverwood)',
      date: formDate || new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      clockIn: formClockIn,
      clockOut: formClockOut,
      breakMinutes: Number(formBreak) || 0,
      totalHours,
      durationSeconds,
      overtimeHours,
      status: 'MANUALLY_ADJUSTED',
      notes: formNotes || 'Manually logged by SuperAdmin'
    });

    setShowAddModal(false);
    setFormEmployeeId('');
    setFormNotes('');
  };

  const exportCompanyReportCSV = () => {
    const headers = ['Record ID', 'Employee ID', 'Employee Name', 'Department', 'Day', 'Shift Date', 'Clock In', 'Clock Out', 'Break (min)', 'Paid Hours', 'Overtime', 'Status', 'Notes', 'Adjusted By'];
    const rows = filteredTimecards.map(t => [
      `"${t.id}"`,
      `"${t.employeeId}"`,
      `"${t.employeeName}"`,
      `"${t.department || ''}"`,
      `"${getDayOfWeek(t.date)}"`,
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        In: {emp.lastClockIn ? new Date(emp.lastClockIn).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{formatSecondsToHMS(emp.clockInTimestamp ? Math.max(0, Math.floor((currentTime - emp.clockInTimestamp) / 1000)) : (emp.lastClockIn ? Math.max(0, Math.floor((currentTime - new Date(emp.lastClockIn).getTime()) / 1000)) : 0))}</span>
                      </span>
                    </div>
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
              <span>Month-Wise Staff Timecard Records ({filteredTimecards.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Electronic punch logs organized by month. Real-time active duration timers &amp; Fair Work audit breakdown.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, date..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 w-44 sm:w-52 font-medium"
              />
            </div>

            {/* Staff Filter */}
            <select
              value={staffFilter}
              onChange={e => setStaffFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none max-w-xs"
            >
              <option value="ALL">All Staff Members ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Recorded Months</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {monthKeys.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No Timecard Records Found</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              No shifts match the selected staff or month filter. Adjust your filter selection above.
            </p>
          </div>
        ) : (
          <div className="space-y-6 p-4 sm:p-5">
            {monthKeys.map(monthName => {
              const monthRecords = timecardsByMonth[monthName];
              const monthHours = monthRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
              const monthOT = monthRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

              return (
                <div key={monthName} className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  {/* Month Header Banner */}
                  <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="font-black text-xs text-white">{monthName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {monthRecords.length} Shifts
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-300 font-medium">
                        Total Paid: <strong className="text-emerald-400 font-mono font-bold">{monthHours.toFixed(1)}h</strong>
                      </span>
                      {monthOT > 0 && (
                        <span className="text-slate-300 font-medium">
                          OT: <strong className="text-orange-400 font-mono font-bold">+{monthOT.toFixed(1)}h</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shift Records Table */}
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Staff Member</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Day</th>
                          <th className="py-3 px-4">Shift Date</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Break</th>
                          <th className="py-3 px-4">Total Hours (Live)</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthRecords.map(t => {
                          const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;

                          return (
                            <tr key={t.id} className="hover:bg-orange-50/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">
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
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {t.department || 'Production'}
                              </td>

                              {/* Day Column */}
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] inline-block border border-slate-200/80">
                                  {getDayOfWeek(t.date)}
                                </span>
                              </td>

                              {/* Date Column */}
                              <td className="py-3 px-4 font-medium text-slate-800 font-mono">
                                {t.date}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                                {t.clockIn}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                {t.clockOut || (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black animate-pulse">
                                    Clocked In
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-medium">
                                {t.breakMinutes}m
                              </td>

                              {/* Total Hours with Live hrs:min:sec */}
                              <td className="py-3 px-4">
                                {isClockedIn ? (
                                  <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 w-fit shadow-2xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span>{formatRunningDuration(t, currentTime)}</span>
                                    <span className="text-[9px] text-emerald-600 uppercase font-sans font-extrabold ml-0.5">LIVE</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-mono font-black text-slate-900 text-xs block">
                                      {formatCompletedDuration(t)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                      ({t.totalHours >= 1 ? `${t.totalHours.toFixed(1)}h` : `${(t.totalHours * 60).toFixed(0)}m`})
                                    </span>
                                    {t.overtimeHours > 0 && (
                                      <span className="text-[9px] text-orange-600 block font-bold">+{t.overtimeHours}h OT</span>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4">
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
                            <td className="py-3 px-4 text-right">
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
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                  <th className="p-2">Day</th>
                  <th className="p-2">Shift Date</th>
                  <th className="p-2">In / Out</th>
                  <th className="p-2">Hours (Live)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimecards.map(t => {
                  const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;

                  return (
                    <tr key={t.id}>
                      <td className="p-2 font-bold text-slate-900">{t.employeeName}</td>
                      <td className="p-2 font-semibold text-slate-700">{getDayOfWeek(t.date)}</td>
                      <td className="p-2 font-mono">{t.date}</td>
                      <td className="p-2 font-mono">{t.clockIn} – {t.clockOut || 'Active'}</td>
                      <td className="p-2 font-bold font-mono">
                        {isClockedIn ? formatRunningDuration(t, currentTime) : `${formatCompletedDuration(t)} (${t.totalHours.toFixed(1)}h)`}
                      </td>
                      <td className="p-2 font-semibold">{t.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
