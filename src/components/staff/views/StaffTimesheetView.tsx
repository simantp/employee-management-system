'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { TimecardRecord } from '@/types';

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

export default function StaffTimesheetView() {
  const { currentStaff, timecards, leaveRequests, updateStaffKioskPin } = useApp();
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Live Sydney Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTimeMs(now.getTime());
      setCurrentTimeStr(now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Selected Month & Date State (Auto-selects Today's Date) ---
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(() => new Date().getMonth());
  const [selectedDateString, setSelectedDateString] = useState<string>(() => formatDateDisplay(new Date()));
  const [search, setSearch] = useState('');

  useEffect(() => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonthIndex(today.getMonth());
    setSelectedDateString(formatDateDisplay(today));
  }, []);

  // Filter staff's own timecard entries
  const staffTimecards = useMemo(() => {
    return timecards.filter(t => t.employeeId === currentStaff.id);
  }, [timecards, currentStaff.id]);

  // Current Month Label (e.g. "August 2026")
  const currentMonthLabel = `${MONTH_NAMES[selectedMonthIndex]} ${selectedYear}`;

  // Days in selected Month with shift counts for this staff member
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(selectedYear, selectedMonthIndex, day);
      const dateKey = formatDateDisplay(d);
      const dayName = d.toLocaleDateString('en-AU', { weekday: 'short' });
      const dayFullName = d.toLocaleDateString('en-AU', { weekday: 'long' });
      const weekend = d.getDay() === 0 || d.getDay() === 6;

      // Count shifts for this staff on this day
      const shiftsOnDay = staffTimecards.filter(t => {
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
  }, [selectedYear, selectedMonthIndex, staffTimecards]);

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

  // Filtered timecards for main view
  const filteredTimecards = useMemo(() => {
    return staffTimecards.filter(t => {
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

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchQ = 
          t.date.toLowerCase().includes(q) ||
          (t.department && t.department.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          t.status.toLowerCase().includes(q);
        if (!matchQ) return false;
      }

      return true;
    });
  }, [staffTimecards, selectedYear, selectedMonthIndex, selectedDateString, search]);

  // Filter staff's approved leaves to integrate into timecard history for this month/day
  const filteredLeaves = useMemo(() => {
    const staffApproved = leaveRequests.filter(r => r.employeeId === currentStaff.id && r.status === 'APPROVED');
    return staffApproved.filter(l => {
      const sDate = parseDateFlexible(l.startDate);
      const eDate = parseDateFlexible(l.endDate) || sDate;
      if (!sDate) return false;

      if (selectedDateString === 'ALL') {
        return (
          (sDate.getFullYear() === selectedYear && sDate.getMonth() === selectedMonthIndex) ||
          (eDate && eDate.getFullYear() === selectedYear && eDate.getMonth() === selectedMonthIndex)
        );
      } else {
        const selDate = parseDateFlexible(selectedDateString);
        if (!selDate) return false;
        return (sDate <= selDate && (eDate ? eDate >= selDate : sDate.getTime() === selDate.getTime()));
      }
    });
  }, [leaveRequests, currentStaff.id, selectedYear, selectedMonthIndex, selectedDateString]);

  // Selected date object & details
  const selectedDateObj = useMemo(() => {
    if (selectedDateString === 'ALL') return null;
    return parseDateFlexible(selectedDateString);
  }, [selectedDateString]);

  const isSelectedDateWeekend = selectedDateObj ? (selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6) : false;

  // Handle PIN Change
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 numeric digits (e.g. 4829).');
      return;
    }
    if (newPin !== pinConfirm) {
      setPinError('PINs do not match.');
      return;
    }
    updateStaffKioskPin(currentStaff.id, newPin);
    setShowPinModal(false);
    setNewPin('');
    setPinConfirm('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 text-xs font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Timecard &amp; Attendance Records</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
              Read-Only
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 font-bold hover:bg-orange-100 transition cursor-pointer shadow-xs"
          >
            <span>Terminal PIN: <strong className="font-mono">{currentStaff.kioskPin || '4829'}</strong></span>
          </button>
        </div>
      </div>

      {/* Live Shift Alert Banner if Clocked In */}
      {currentStaff.clockState === 'CLOCKED_IN' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-2 border-emerald-500/40 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-emerald-950 text-sm">You are Currently CLOCKED IN</h4>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-emerald-800 text-[11px]">
                Shift active since <strong>{currentStaff.lastClockIn ? new Date(currentStaff.lastClockIn).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'Today'} AEST</strong>. Remember to punch out via the Login Screen Terminal at shift end.
              </p>
            </div>
          </div>
          <div className="text-right font-mono hidden sm:block">
            <span className="text-[10px] text-emerald-700 font-bold block uppercase">Live Sydney Clock</span>
            <span className="text-lg font-black text-emerald-950">{currentTimeStr}</span>
          </div>
        </div>
      )}

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
                  ? `Showing all electronic punches across ${currentMonthLabel}.`
                  : isSelectedDateWeekend
                  ? 'Office & production floor are normally closed on Saturday and Sunday. Any shifts shown below are approved weekend overtime.'
                  : `Review clock in/out times, meal breaks, and live punch duration for ${selectedDateString}.`
                }
              </p>
            </div>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Search shifts, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 w-44 sm:w-56 font-medium"
            />
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SHIFTS TABLE OR CLEAN EMPTY STATE */}
        {/* ========================================================================= */}
        {filteredTimecards.length === 0 && filteredLeaves.length === 0 ? (
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
                  ? 'No punch records found on this weekend date.'
                  : `Clock in at the plant entrance using your 4-Digit PIN: ${currentStaff.kioskPin || '4829'}`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Day &amp; Date</th>
                  <th className="py-3 px-4">Shift Type / Location</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Break</th>
                  <th className="py-3 px-4">Total Hours (Live)</th>
                  <th className="py-3 px-4">Overtime</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {/* 1. Timecard Clock Logs */}
                {filteredTimecards.map(t => {
                  const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;
                  const shiftIsWeekend = isWeekend(t.date);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
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

                      {/* Shift Type / Location */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{t.department || currentStaff.department || 'Production (Riverwood)'}</span>
                        <span className="text-[10px] text-slate-400">{t.notes || 'Standard shift'}</span>
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
                            <span>{formatRunningDuration(t, currentTimeMs)}</span>
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
                          </div>
                        )}
                      </td>

                      {/* Overtime */}
                      <td className="py-3.5 px-4 font-bold text-orange-600">
                        {t.overtimeHours > 0 ? `+${t.overtimeHours}h` : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          t.status === 'CLOCKED_IN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          t.status === 'MANUALLY_ADJUSTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Verified' : t.status === 'CLOCKED_IN' ? 'Live on Shift' : t.status}
                        </span>
                        {t.notes && (
                          <span className="text-[9px] text-slate-400 block mt-0.5 max-w-[140px] truncate" title={t.notes}>
                            {t.notes}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* 2. Integrated Approved Leaves */}
                {filteredLeaves.map(l => (
                  <tr key={l.id} className="bg-indigo-50/30 hover:bg-indigo-50/60 transition border-l-4 border-indigo-500">
                    <td className="py-3.5 px-4 font-bold text-indigo-950">
                      <div>{l.startDate} – {l.endDate}</div>
                      <span className="text-[10px] text-indigo-600 font-bold">Approved Leave</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-900 block">
                        <span>{l.leaveType} LEAVE</span>
                      </span>
                      <span className="text-[10px] text-indigo-700">{l.reason}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400">—</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400">—</td>
                    <td className="py-3.5 px-4 text-indigo-400">—</td>
                    <td className="py-3.5 px-4 font-black text-indigo-950">{l.totalDays * 7.6}h ({l.totalDays}d)</td>
                    <td className="py-3.5 px-4 text-indigo-400">—</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Approved Leave
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions & Fair Work Compliance Note */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-950 flex items-start gap-3">
        <div className="space-y-1">
          <h4 className="font-black text-xs text-blue-900">Fair Work Australia Automated Attendance Record</h4>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            All hours recorded here reflect your electronic punches via the HsCreations Sydney Terminal. Under Fair Work regulations, timesheets cannot be altered directly by staff. If you forgot to clock in/out or need shift adjustments, notify your SuperAdmin or HR Lead.
          </p>
        </div>
      </div>

      {/* 4-Digit PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">Change 4-Digit Shift PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600">
                Current PIN: <strong className="font-mono text-orange-600 font-black">{currentStaff.kioskPin || '4829'}</strong>
                <p className="text-[10px] text-slate-400 mt-0.5">Use your 4-digit PIN at the login page Shift Terminal to punch shifts.</p>
              </div>

              {pinError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-[11px] font-bold border border-red-200">
                  {pinError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center text-2xl font-mono font-black py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  required
                  placeholder="••••"
                  value={pinConfirm}
                  onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center text-2xl font-mono font-black py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 cursor-pointer"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

