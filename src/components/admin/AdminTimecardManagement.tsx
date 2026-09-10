'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { TimecardRecord, Employee, Department } from '@/types';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';

// --- Month & Date Utility Helpers ---
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function parseDateFlexible(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // Try standard parse
  const t = Date.parse(clean);
  if (!isNaN(t)) {
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d;
  }

  // Handle "17 Aug 2026" or "17 August 2026" or "17-Aug-2026"
  const parts = clean.split(/[\s,/-]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const mIdx = MONTH_NAMES_SHORT.findIndex(m => mStr.startsWith(m.toLowerCase()));
    if (!isNaN(day) && mIdx !== -1 && !isNaN(year)) {
      return new Date(year, mIdx, day);
    }

    const yVal = parseInt(parts[0], 10);
    const mVal = parseInt(parts[1], 10) - 1;
    const dVal = parseInt(parts[2], 10);
    if (yVal > 1900 && mVal >= 0 && mVal <= 11 && dVal >= 1 && dVal <= 31) {
      return new Date(yVal, mVal, dVal);
    }
  }
  return null;
}

function getMonthKey(dateStr: string): string {
  const d = parseDateFlexible(dateStr);
  if (d) {
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }
  return 'August 2026';
}

function getDayOfWeek(dateStr: string): string {
  const d = parseDateFlexible(dateStr);
  if (d) {
    return d.toLocaleDateString('en-AU', { weekday: 'long' });
  }
  return 'Monday';
}

function isWeekend(dateStr: string): boolean {
  const d = parseDateFlexible(dateStr);
  if (d) {
    const day = d.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }
  return false;
}

function formatDateDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
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
    return 0;
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

  // --- Selected Month & Date State (Auto-selects Today's Date) ---
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(() => new Date().getMonth());
  const [selectedDateString, setSelectedDateString] = useState<string>(() => formatDateDisplay(new Date()));

  useEffect(() => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonthIndex(today.getMonth());
    setSelectedDateString(formatDateDisplay(today));
  }, []);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals state
  const [editingRecord, setEditingRecord] = useState<TimecardRecord | null>(null);
  const [deletingTimecard, setDeletingTimecard] = useState<TimecardRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Manual Add Form State
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formClockIn, setFormClockIn] = useState('07:30 AM');
  const [formClockOut, setFormClockOut] = useState('04:00 PM');
  const [formBreak, setFormBreak] = useState<number>(30);
  const [formNotes, setFormNotes] = useState('');

  // --- PDF Summary Modal Filter State ---
  const [pdfStaffScope, setPdfStaffScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [pdfSelectedStaffId, setPdfSelectedStaffId] = useState<string>('');
  const [pdfTimeframeType, setPdfTimeframeType] = useState<'MONTH' | 'CUSTOM' | 'DATE'>('MONTH');
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState<string>('August 2026');
  const [pdfCustomStartDate, setPdfCustomStartDate] = useState<string>('2026-08-01');
  const [pdfCustomEndDate, setPdfCustomEndDate] = useState<string>('2026-08-31');
  const [pdfIncludeOTBreakdown, setPdfIncludeOTBreakdown] = useState<boolean>(true);
  const [pdfIncludeSignoff, setPdfIncludeSignoff] = useState<boolean>(true);

  // Active Floor Staff
  const activeStaff = employees.filter(e => e.clockState === 'CLOCKED_IN');

  // Generate available months list from records + defaults
  const availableMonthKeys = useMemo(() => {
    const set = new Set<string>();
    set.add('August 2026');
    set.add('July 2026');
    set.add('September 2026');
    timecards.forEach(t => {
      set.add(getMonthKey(t.date));
    });
    return Array.from(set);
  }, [timecards]);

  // Current Month Label (e.g. "August 2026")
  const currentMonthLabel = `${MONTH_NAMES[selectedMonthIndex]} ${selectedYear}`;

  // Days in selected Month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(selectedYear, selectedMonthIndex, day);
      const dateKey = formatDateDisplay(d);
      const dayName = d.toLocaleDateString('en-AU', { weekday: 'short' });
      const dayFullName = d.toLocaleDateString('en-AU', { weekday: 'long' });
      const weekend = d.getDay() === 0 || d.getDay() === 6;

      // Count shifts for this day
      const shiftsOnDay = timecards.filter(t => {
        const tDate = parseDateFlexible(t.date);
        if (!tDate) return false;
        return (
          tDate.getFullYear() === selectedYear &&
          tDate.getMonth() === selectedMonthIndex &&
          tDate.getDate() === day
        );
      });

      days.push({
        dayNumber: day,
        dateKey,
        dayName,
        dayFullName,
        isWeekend: weekend,
        shiftCount: shiftsOnDay.length,
        dateObj: d,
      });
    }
    return days;
  }, [selectedYear, selectedMonthIndex, timecards]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  const handleSelectMonth = (monthLabel: string) => {
    const parts = monthLabel.split(' ');
    if (parts.length >= 2) {
      const mIdx = MONTH_NAMES.indexOf(parts[0]);
      const y = parseInt(parts[1], 10);
      if (mIdx !== -1 && !isNaN(y)) {
        setSelectedMonthIndex(mIdx);
        setSelectedYear(y);
      }
    }
  };

  // Filtered Timecards for main view
  const filteredTimecards = useMemo(() => {
    return timecards.filter(t => {
      const tDate = parseDateFlexible(t.date);
      if (!tDate) return false;

      // Month match
      const matchMonth = (
        tDate.getFullYear() === selectedYear &&
        tDate.getMonth() === selectedMonthIndex
      );
      if (!matchMonth) return false;

      // Specific Date match
      if (selectedDateString !== 'ALL') {
        const selDate = parseDateFlexible(selectedDateString);
        if (selDate) {
          const matchDay = (
            tDate.getFullYear() === selDate.getFullYear() &&
            tDate.getMonth() === selDate.getMonth() &&
            tDate.getDate() === selDate.getDate()
          );
          if (!matchDay) return false;
        }
      }

      // Staff filter
      if (staffFilter !== 'ALL' && t.employeeId !== staffFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL' && t.department !== departmentFilter) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchQ = 
          t.employeeName.toLowerCase().includes(q) ||
          (t.department && t.department.toLowerCase().includes(q)) ||
          t.date.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q));
        if (!matchQ) return false;
      }

      return true;
    });
  }, [timecards, selectedYear, selectedMonthIndex, selectedDateString, staffFilter, departmentFilter, search]);

  // Selected date object & details
  const selectedDateObj = useMemo(() => {
    if (selectedDateString === 'ALL') return null;
    return parseDateFlexible(selectedDateString);
  }, [selectedDateString]);

  const isSelectedDateWeekend = selectedDateObj ? (selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6) : false;

  // Manual Adjustment Save
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

  // Manual Shift Save
  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === formEmployeeId);
    if (!targetEmp) return;

    const { totalHours, durationSeconds, overtimeHours } = calculateShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);

    const shiftDateToUse = formDate || (selectedDateString !== 'ALL' ? selectedDateString : new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }));

    adminAddTimecard({
      employeeId: targetEmp.id,
      employeeName: `${targetEmp.firstName} ${targetEmp.lastName}`,
      employeeAvatar: targetEmp.avatarUrl,
      department: targetEmp.department || 'Production (Riverwood)',
      date: shiftDateToUse,
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

  // --- PDF Summary Computation ---
  const pdfRecords = useMemo(() => {
    return timecards.filter(t => {
      // 1. Staff Scope
      if (pdfStaffScope === 'SPECIFIC' && pdfSelectedStaffId) {
        if (t.employeeId !== pdfSelectedStaffId) return false;
      }

      // 2. Timeframe
      const tDate = parseDateFlexible(t.date);
      if (!tDate) return false;

      if (pdfTimeframeType === 'MONTH') {
        const mKey = getMonthKey(t.date);
        if (mKey !== pdfSelectedMonth) return false;
      } else if (pdfTimeframeType === 'CUSTOM') {
        const start = new Date(pdfCustomStartDate);
        const end = new Date(pdfCustomEndDate);
        end.setHours(23, 59, 59, 999);
        if (tDate < start || tDate > end) return false;
      } else if (pdfTimeframeType === 'DATE') {
        if (selectedDateString !== 'ALL') {
          const selDate = parseDateFlexible(selectedDateString);
          if (selDate) {
            const match = (
              tDate.getFullYear() === selDate.getFullYear() &&
              tDate.getMonth() === selDate.getMonth() &&
              tDate.getDate() === selDate.getDate()
            );
            if (!match) return false;
          }
        }
      }

      return true;
    });
  }, [timecards, pdfStaffScope, pdfSelectedStaffId, pdfTimeframeType, pdfSelectedMonth, pdfCustomStartDate, pdfCustomEndDate, selectedDateString]);

  const pdfTotalHours = pdfRecords.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const pdfTotalOvertime = pdfRecords.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
  const pdfTotalBreaks = pdfRecords.reduce((acc, curr) => acc + (curr.breakMinutes || 0), 0);
  const pdfSelectedStaffObj = employees.find(e => e.id === pdfSelectedStaffId);

  // Trigger browser printing with custom styling
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Timecard Records &amp; Shift Management</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
              Admin Suite
            </span>
          </div>
          <p className="text-slate-500 mt-0.5">
            Biometric punch logs, manual adjustments &amp; Fair Work compliant payroll tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setFormDate(selectedDateString !== 'ALL' ? selectedDateString : formatDateDisplay(new Date()));
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span>+ Manual Shift Entry</span>
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate PDF Summary</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE MONTH & DATE PICKER STRIP */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Month Selector Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Previous Month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="px-3 py-1 font-black text-sm text-white tracking-wide min-w-[130px] text-center">
                {currentMonthLabel}
              </span>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Next Month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => {
                const now = new Date();
                setSelectedYear(now.getFullYear());
                setSelectedMonthIndex(now.getMonth());
                setSelectedDateString(formatDateDisplay(now));
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Working Day (Mon–Fri)</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300/90 ml-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Office Closed (Weekend)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Strip (Day 1 to Last Day + "All Month" Pill) */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {/* "All Days in Month" Button */}
            <button
              onClick={() => setSelectedDateString('ALL')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition cursor-pointer shrink-0 flex flex-col items-center justify-center border shadow-2xs ${
                selectedDateString === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">View Entire</span>
              <span className="text-xs font-black">All Month</span>
            </button>

            <div className="w-[1px] h-9 bg-slate-300 shrink-0 mx-1" />

            {/* Individual Day Cards */}
            {daysInMonth.map(day => {
              const isSelected = selectedDateString === day.dateKey;
              const hasShifts = day.shiftCount > 0;

              return (
                <button
                  key={day.dayNumber}
                  onClick={() => setSelectedDateString(day.dateKey)}
                  className={`px-3 py-2 rounded-2xl text-center transition cursor-pointer shrink-0 min-w-[58px] flex flex-col items-center justify-center border relative ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/40 shadow-sm'
                      : day.isWeekend
                      ? 'bg-slate-100/90 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected 
                      ? 'text-blue-100' 
                      : day.isWeekend 
                      ? 'text-amber-700 font-black' 
                      : 'text-slate-400'
                  }`}>
                    {day.dayName}
                  </span>

                  <span className="text-base font-black leading-tight mt-0.5">
                    {String(day.dayNumber).padStart(2, '0')}
                  </span>

                  {/* Weekend Closed Pill / Shift Count Indicator */}
                  {day.isWeekend ? (
                    <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : hasShifts 
                        ? 'bg-amber-200 text-amber-900 border border-amber-300' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {hasShifts ? `${day.shiftCount} OT` : 'Closed'}
                    </span>
                  ) : (
                    <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : hasShifts
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'text-slate-400'
                    }`}>
                      {hasShifts ? `${day.shiftCount} shf` : '—'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Context & Filters Header */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {selectedDateString === 'ALL' ? (
                    `All Recorded Shifts in ${currentMonthLabel}`
                  ) : (
                    `${getDayOfWeek(selectedDateString)}, ${selectedDateString}`
                  )}
                </h3>

                {selectedDateString !== 'ALL' && isSelectedDateWeekend && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                    <span>🏢 Weekend • Office Closed</span>
                  </span>
                )}

                {selectedDateString !== 'ALL' && !isSelectedDateWeekend && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Standard Operations
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDateString === 'ALL'
                  ? `Showing all shifts across ${currentMonthLabel}. Filter by staff or department below.`
                  : isSelectedDateWeekend
                  ? 'Office & production floor are normally closed on Saturday and Sunday. Any shifts shown below are approved weekend overtime.'
                  : `Review clock in/out times, meal breaks, and live punch duration for ${selectedDateString}.`
                }
              </p>
            </div>
          </div>

          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Search staff, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 w-40 sm:w-48 font-medium"
            />

            {/* Staff Filter */}
            <select
              value={staffFilter}
              onChange={e => setStaffFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none max-w-xs"
            >
              <option value="ALL">All Staff ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
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

        {/* Weekend Notice Banner (If Weekend Date is Selected) */}
        {selectedDateString !== 'ALL' && isSelectedDateWeekend && (
          <div className="mx-5 mb-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <h4 className="font-bold text-xs text-amber-950">
                  Weekend Office &amp; Plant Policy
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  HsCreations official operations are <strong>Closed on Saturday &amp; Sunday</strong>. Standard shifts are not scheduled. 
                  Any work performed is treated as <strong>Fair Work Australia Overtime (2.0x Double Time)</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFormDate(selectedDateString);
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer shrink-0 shadow-2xs"
            >
              + Log Weekend Shift
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SHIFTS TABLE OR CLEAN EMPTY STATE */}
        {/* ========================================================================= */}
        {filteredTimecards.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50/40 border-t border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              {isSelectedDateWeekend ? '🏢' : '📋'}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                {selectedDateString !== 'ALL' && isSelectedDateWeekend
                  ? `Office Closed — No Shifts Recorded for ${selectedDateString}`
                  : `No Timecard Records for this Selection`
                }
              </h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                {selectedDateString !== 'ALL' && isSelectedDateWeekend
                  ? 'No staff clocked in on this weekend day. If emergency or production overtime occurred, use Manual Shift Entry.'
                  : 'No employee shift records match the selected date or search filter. You can log a shift manually.'
                }
              </p>
            </div>
            <button
              onClick={() => {
                setFormDate(selectedDateString !== 'ALL' ? selectedDateString : formatDateDisplay(new Date()));
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer shadow-xs inline-block"
            >
              + Add Shift for {selectedDateString !== 'ALL' ? selectedDateString : 'Today'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Day &amp; Date</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Break</th>
                  <th className="py-3 px-4">Total Hours (Live)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTimecards.map(t => {
                  const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;
                  const shiftIsWeekend = isWeekend(t.date);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Staff Member */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={t.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={t.employeeName}
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{t.employeeName}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">ID: {t.employeeId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {t.department || 'Production'}
                      </td>

                      {/* Day & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            shiftIsWeekend 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200/80'
                          }`}>
                            {getDayOfWeek(t.date).slice(0, 3)}
                          </span>
                          <span className="font-mono font-medium text-slate-800">
                            {t.date}
                          </span>
                          {shiftIsWeekend && (
                            <span className="text-[9px] font-black text-amber-600 uppercase">
                              (Wknd)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Clock In */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {t.clockIn}
                      </td>

                      {/* Clock Out */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {t.clockOut || (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold animate-pulse">
                            ● Clocked In
                          </span>
                        )}
                      </td>

                      {/* Break */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {t.breakMinutes}m
                      </td>

                      {/* Total Hours */}
                      <td className="py-3.5 px-4">
                        {isClockedIn ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 w-fit shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{formatRunningDuration(t, currentTime)}</span>
                            <span className="text-[9px] text-emerald-600 uppercase font-sans font-bold ml-0.5">LIVE</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              {formatCompletedDuration(t)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">
                              ({t.totalHours >= 1 ? `${t.totalHours.toFixed(1)}h` : `${(t.totalHours * 60).toFixed(0)}m`})
                            </span>
                            {t.overtimeHours > 0 && (
                              <span className="text-[9px] text-amber-600 block font-bold">+{t.overtimeHours}h OT</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          t.status === 'CLOCKED_IN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          t.status === 'MANUALLY_ADJUSTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Adjusted' : t.status === 'CLOCKED_IN' ? 'Live on Shift' : t.status}
                        </span>
                        {t.notes && (
                          <span className="text-[9px] text-slate-400 block mt-0.5 max-w-[140px] truncate" title={t.notes}>
                            {t.notes}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingRecord(t);
                              setFormClockIn(t.clockIn);
                              setFormClockOut(t.clockOut || '04:00 PM');
                              setFormBreak(t.breakMinutes);
                              setFormNotes(t.notes || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            Adjust
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingTimecard(t)}
                            className="px-2 py-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold text-[11px] transition cursor-pointer"
                            title="Delete Shift"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SUPERADMIN ADJUST TIMECARD */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Adjust Staff Timecard</h3>
                <p className="text-[10px] text-slate-500">{editingRecord.employeeName} • {editingRecord.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                Close
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
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL SHIFT ENTRY */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Manual Shift Entry</h3>
                <p className="text-[10px] text-slate-500">Log an authorised shift or weekend overtime</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                Close
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
                  value={formDate ? (parseDateFlexible(formDate)?.toISOString().slice(0, 10) || '') : ''}
                  onChange={e => {
                    if (e.target.value) {
                      const d = new Date(e.target.value + 'T00:00:00');
                      setFormDate(formatDateDisplay(d));
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
                <label className="font-bold text-slate-700 block mb-1">Notes / Plant Line / Overtime Authorization</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Riverwood Roland Press Overtime"
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
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Add Shift Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FULL-FEATURED GENERATE PDF SUMMARY POPUP MODAL */}
      {/* ========================================================================= */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Generate PDF Summary &amp; Payroll Report</h3>
                  <p className="text-[11px] text-slate-400">
                    Fair Work Australia compliant timecard summary with customizable staff &amp; timeframe scope.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print / Save as PDF</span>
                </button>

                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body with Filter Controls & Live Print Preview */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50">
              
              {/* 1. REPORT CONFIGURATION CONTROLS */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>1. Configure Report Scope &amp; Timeframe</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">Dynamic Filtering</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Staff Scope */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block text-xs">Staff Scope</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPdfStaffScope('ALL');
                          setPdfSelectedStaffId('');
                        }}
                        className={`p-2.5 rounded-xl text-center font-bold text-xs transition cursor-pointer border ${
                          pdfStaffScope === 'ALL'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        All Staff ({employees.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPdfStaffScope('SPECIFIC');
                          if (!pdfSelectedStaffId && employees.length > 0) {
                            setPdfSelectedStaffId(employees[0].id);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-center font-bold text-xs transition cursor-pointer border ${
                          pdfStaffScope === 'SPECIFIC'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Single Staff Member
                      </button>
                    </div>

                    {pdfStaffScope === 'SPECIFIC' && (
                      <div className="pt-1 animate-in fade-in">
                        <select
                          value={pdfSelectedStaffId}
                          onChange={e => setPdfSelectedStaffId(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-xs"
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} ({emp.department || 'Production'}) - ID: {emp.employeeNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Timeframe Scope */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block text-xs">Timeframe Period</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPdfTimeframeType('MONTH')}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                          pdfTimeframeType === 'MONTH'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Calendar Month
                      </button>

                      <button
                        type="button"
                        onClick={() => setPdfTimeframeType('CUSTOM')}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                          pdfTimeframeType === 'CUSTOM'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Custom Range
                      </button>

                      <button
                        type="button"
                        onClick={() => setPdfTimeframeType('DATE')}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                          pdfTimeframeType === 'DATE'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Selected Date
                      </button>
                    </div>

                    {pdfTimeframeType === 'MONTH' && (
                      <div className="pt-1 animate-in fade-in">
                        <select
                          value={pdfSelectedMonth}
                          onChange={e => setPdfSelectedMonth(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-xs"
                        >
                          {availableMonthKeys.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {pdfTimeframeType === 'CUSTOM' && (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Start Date</span>
                          <input
                            type="date"
                            value={pdfCustomStartDate}
                            onChange={e => setPdfCustomStartDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">End Date</span>
                          <input
                            type="date"
                            value={pdfCustomEndDate}
                            onChange={e => setPdfCustomEndDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {pdfTimeframeType === 'DATE' && (
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs">
                        Using main screen selected date: <strong>{selectedDateString}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-slate-700">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={pdfIncludeOTBreakdown}
                        onChange={e => setPdfIncludeOTBreakdown(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Include Fair Work Overtime Details</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={pdfIncludeSignoff}
                        onChange={e => setPdfIncludeSignoff(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Include Certification &amp; Signature Lines</span>
                    </label>
                  </div>

                  <span className="text-slate-500 text-[11px] font-bold">
                    Found <strong>{pdfRecords.length}</strong> matching shift records
                  </span>
                </div>
              </div>

              {/* 2. PRINTABLE REPORT DOCUMENT CONTAINER */}
              <div id="printable-timecard-report" className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-300/80 shadow-md text-slate-900 space-y-6">
                
                {/* Printable Letterhead */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tight text-slate-900 uppercase">HsCreations Pty Ltd</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black uppercase">
                        Official Payroll Record
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Advanced Manufacturing &amp; Packaging Facility • Sydney NSW Australia
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ABN: 84 928 102 443 • Fair Work Manufacturing Award 2020 Compliance
                    </p>
                  </div>

                  <div className="text-left sm:text-right text-xs space-y-0.5 font-sans">
                    <p className="font-bold text-slate-900">
                      Report Period: <span className="font-mono text-blue-700 font-bold">
                        {pdfTimeframeType === 'MONTH' ? pdfSelectedMonth : pdfTimeframeType === 'CUSTOM' ? `${pdfCustomStartDate} to ${pdfCustomEndDate}` : selectedDateString}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Staff Scope: <strong className="text-slate-800">{pdfStaffScope === 'ALL' ? `All Staff Members (${employees.length})` : `${pdfSelectedStaffObj?.firstName} ${pdfSelectedStaffObj?.lastName} (ID: ${pdfSelectedStaffObj?.employeeNumber})`}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Generated: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* KPI Summary Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Shifts</span>
                    <span className="text-xl font-black text-slate-900 mt-0.5 block">{pdfRecords.length} Shifts</span>
                    <span className="text-[10px] text-slate-500 font-medium">Logged in timeframe</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Hours</span>
                    <span className="text-xl font-black text-emerald-700 mt-0.5 block">{pdfTotalHours.toFixed(1)} hrs</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Gross work duration</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Overtime</span>
                    <span className="text-xl font-black text-amber-600 mt-0.5 block">{pdfTotalOvertime.toFixed(1)} hrs</span>
                    <span className="text-[10px] text-amber-700 font-medium">1.5x / 2.0x audit</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Meal Breaks</span>
                    <span className="text-xl font-black text-blue-600 mt-0.5 block">{pdfTotalBreaks} mins</span>
                    <span className="text-[10px] text-blue-700 font-medium">Unpaid meal allowances</span>
                  </div>
                </div>

                {/* Detailed Printable Shift Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Employee Name &amp; ID</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Day &amp; Date</th>
                        <th className="py-2.5 px-3">Clock In</th>
                        <th className="py-2.5 px-3">Clock Out</th>
                        <th className="py-2.5 px-3">Break</th>
                        <th className="py-2.5 px-3">Paid Hours</th>
                        <th className="py-2.5 px-3">OT (hrs)</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-sans">
                      {pdfRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            No shift records found matching this timeframe criteria.
                          </td>
                        </tr>
                      ) : (
                        pdfRecords.map(t => {
                          const shiftIsWeekend = isWeekend(t.date);
                          return (
                            <tr key={t.id} className={shiftIsWeekend ? 'bg-amber-50/30' : ''}>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                <div>{t.employeeName}</div>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {t.employeeId}</span>
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-700 text-[11px]">
                                {t.department || 'Production'}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-800">{getDayOfWeek(t.date).slice(0, 3)}</span>, {t.date}
                                {shiftIsWeekend && <span className="text-[9px] text-amber-700 font-bold block">(Weekend Closed)</span>}
                              </td>
                              <td className="py-2 px-3 font-mono text-emerald-700 font-bold">{t.clockIn}</td>
                              <td className="py-2 px-3 font-mono text-slate-800 font-bold">{t.clockOut || 'Active'}</td>
                              <td className="py-2 px-3 font-mono">{t.breakMinutes}m</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{t.totalHours.toFixed(1)}h</td>
                              <td className="py-2 px-3 font-mono font-bold text-amber-700">
                                {t.overtimeHours > 0 ? `+${t.overtimeHours.toFixed(1)}h` : '0.0h'}
                              </td>
                              <td className="py-2 px-3 text-[10px]">
                                <span className="font-semibold text-slate-700">
                                  {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Adj' : t.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Fair Work Certified Signature Block */}
                {pdfIncludeSignoff && (
                  <div className="pt-4 border-t-2 border-slate-200 space-y-4">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      <strong>Fair Work Australia Statutory Compliance Declaration:</strong> This report represents an authentic electronic summary of hours worked, meal breaks taken, and overtime calculated in accordance with the Fair Work Act 2009 (Cth) and Modern Manufacturing Award. All records are maintained in the secure HsCreations cloud database.
                    </p>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                      <div className="border-t border-slate-400 pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Authorized Administrator Signature</span>
                        <p className="font-bold text-slate-900 text-xs mt-1">SuperAdmin Operations Manager</p>
                        <p className="text-[10px] text-slate-400 font-mono">HsCreations Plant Operations • Sydney</p>
                      </div>

                      <div className="border-t border-slate-400 pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Payroll Verification &amp; Date</span>
                        <p className="font-bold text-slate-900 text-xs mt-1">
                          Date: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold">Status: Verified for Pay Run</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Print summary automatically applies high-resolution A4 document formatting.
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer text-xs flex items-center gap-1.5 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM DELETE MODAL */}
      {/* ========================================================================= */}
      <ConfirmDeleteModal
        isOpen={!!deletingTimecard}
        title="Delete Shift Timecard Record?"
        itemName={deletingTimecard ? `${deletingTimecard.employeeName} (${deletingTimecard.date})` : undefined}
        description={deletingTimecard ? `Are you sure you want to delete this timecard record for ${deletingTimecard.employeeName} on ${deletingTimecard.date} (${deletingTimecard.clockIn} – ${deletingTimecard.clockOut || 'Active'})? This will permanently deduct ${deletingTimecard.totalHours?.toFixed(2) || '0.00'} logged hours from company payroll records.` : undefined}
        confirmButtonText="Delete Record"
        onConfirm={() => {
          if (deletingTimecard) {
            adminDeleteTimecard(deletingTimecard.id);
            setDeletingTimecard(null);
          }
        }}
        onCancel={() => setDeletingTimecard(null)}
      />

      {/* Custom Scoped Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-timecard-report, #printable-timecard-report * {
            visibility: visible !important;
          }
          #printable-timecard-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}

