'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { TimecardRecord } from '@/types';
import { 
  formatSecondsToHMS, 
  getShiftBreakAndDuration 
} from '@/lib/timecardUtils';

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

export default function StaffTimesheetView() {
  const { currentStaff, timecards, leaveRequests, updateStaffUsername, updateStaffKioskPin, submitTimecardStaffNote } = useApp();
  
  // Credentials modal state
  const currentUsername = currentStaff.username || (currentStaff.email ? currentStaff.email.split('@')[0] : 'staff');
  const currentPin = currentStaff.kioskPin || '4829';
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newPin, setNewPin] = useState(currentPin);
  const [showPin, setShowPin] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);

  useEffect(() => {
    setNewUsername(currentStaff.username || (currentStaff.email ? currentStaff.email.split('@')[0] : 'staff'));
    setNewPin(currentStaff.kioskPin || '4829');
  }, [currentStaff]);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(null);

    const cleanUser = newUsername.trim().toLowerCase();
    const cleanPin = newPin.trim();

    if (!cleanUser || cleanUser.length < 3) {
      setCredError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(cleanUser)) {
      setCredError('Username can only contain lowercase letters, numbers, dots, hyphens, and underscores.');
      return;
    }
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setCredError('PIN must be exactly 4 numeric digits.');
      return;
    }

    const res = updateStaffUsername(currentStaff.id, cleanUser);
    if (!res.success) {
      setCredError(res.message || 'Failed to update username.');
      return;
    }

    updateStaffKioskPin(currentStaff.id, cleanPin);
    setCredSuccess('Shift punch credentials updated successfully!');
    setTimeout(() => {
      setShowCredsModal(false);
      setCredSuccess(null);
    }, 1500);
  };

  // Staff Error Message / Shift Note State
  const [messagingShift, setMessagingShift] = useState<TimecardRecord | null>(null);
  const [staffMessageText, setStaffMessageText] = useState('');

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
          <p className="text-slate-500 mt-0.5">
            Sydney Electronic Timesheets, Shift Details &amp; Attendance Register
          </p>
        </div>
      </div>

      {/* Shift Clock Access & Punch Credentials Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Facility Shift Clock Punch Access
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Required to Punch IN / OUT
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm font-bold text-white">
                Username: <strong className="font-mono text-cyan-400 font-black">@{currentUsername}</strong>
              </span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                PIN: <span className="font-mono text-emerald-400 font-black tracking-widest">{showPin ? currentPin : '••••'}</span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer ml-1"
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enter both your unique username and 4-digit PIN at the Shift Terminal screen to record shift punches.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewUsername(currentStaff.username || (currentStaff.email ? currentStaff.email.split('@')[0] : 'staff'));
            setNewPin(currentStaff.kioskPin || '4829');
            setCredError(null);
            setCredSuccess(null);
            setShowCredsModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5 shrink-0 cursor-pointer"
        >
          Change Username / PIN
        </button>
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
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Operational Daily (Mon–Sun • Open Everyday)</span>
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
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected 
                      ? 'text-blue-100' 
                      : 'text-slate-400'
                  }`}>
                    {day.dayName}
                  </span>

                  <span className="text-base font-black leading-tight mt-0.5">
                    {String(day.dayNumber).padStart(2, '0')}
                  </span>

                  {/* Shift Count Indicator */}
                  <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : hasShifts
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'text-slate-400'
                  }`}>
                    {hasShifts ? `${day.shiftCount} shf` : '—'}
                  </span>
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

                {selectedDateString !== 'ALL' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Standard Operations (Open Everyday)
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDateString === 'ALL'
                  ? `Showing all electronic punches across ${currentMonthLabel}.`
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

        {/* ========================================================================= */}
        {/* 2. SHIFTS TABLE OR CLEAN EMPTY STATE */}
        {/* ========================================================================= */}
        {filteredTimecards.length === 0 && filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50/40 border-t border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                {selectedDateString !== 'ALL'
                  ? `No Shifts Recorded for ${selectedDateString}`
                  : `No Timecard Records for this Selection`
                }
              </h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                {`Clock in at the plant entrance using your 4-Digit PIN: ${currentStaff.kioskPin || '4829'}`}
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
                  <th className="py-3 px-4">Workstation IP</th>
                  <th className="py-3 px-4">Total Hours (Live)</th>
                  <th className="py-3 px-4">Status &amp; Notes</th>
                  <th className="py-3 px-4 text-right">Actions / Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {/* 1. Timecard Clock Logs */}
                {filteredTimecards.map(t => {
                  const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;
                  const shiftInfo = getShiftBreakAndDuration(t, currentTimeMs);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Day & Date */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-900">{t.date}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {getDayOfWeek(t.date)}
                        </span>
                      </td>

                      {/* Location / Department */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {(t as any).location || currentStaff.department || 'Production (Riverwood)'}
                        </span>
                        <span className="text-[10px] text-slate-400">Plant Shift Log</span>
                      </td>

                      {/* Clock In */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {t.clockIn}
                      </td>

                      {/* Clock Out */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isClockedIn ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Shift
                          </span>
                        ) : (
                          <span className="text-slate-700">{t.clockOut}</span>
                        )}
                      </td>

                      {/* Workstation IP (Clocked In IP & Clocked Out IP) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                              In
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {t.clockInIp || t.ipAddress || '127.0.0.1'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                              isClockedIn
                                ? 'text-blue-700 bg-blue-50 border-blue-200'
                                : 'text-slate-700 bg-slate-100 border-slate-200'
                            }`}>
                              Out
                            </span>
                            {isClockedIn ? (
                              <span className="text-[10px] font-sans font-bold text-blue-600 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                On Shift
                              </span>
                            ) : (
                              <span className="font-bold text-slate-700 truncate">
                                {t.clockOutIp || t.ipAddress || '127.0.0.1'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Live Gross / Net Hours */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          {formatSecondsToHMS(shiftInfo.netSeconds)}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          {shiftInfo.totalHours.toFixed(2)} paid hrs
                        </span>
                      </td>

                      {/* Status & Messages */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              t.status === 'CLOCKED_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse' :
                              t.status === 'MANUALLY_ADJUSTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Adjusted' : t.status === 'CLOCKED_IN' ? 'Live on Shift' : t.status}
                            </span>
                          </div>

                          {/* Admin Adjustment Message if Manually Adjusted */}
                          {t.status === 'MANUALLY_ADJUSTED' && (t.adminNote || t.notes) && (
                            <div className="p-2 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-950 text-[10px] max-w-[220px] shadow-2xs">
                              <span className="font-bold text-purple-800 flex items-center gap-1 text-[9px] mb-0.5">
                                <span>Admin Note:</span>
                                {t.adjustedBy && <span className="text-purple-600 font-normal">({t.adjustedBy})</span>}
                              </span>
                              <p className="italic text-purple-900 leading-snug break-words">"{t.adminNote || t.notes}"</p>
                            </div>
                          )}

                          {/* Staff Error Report / Note if present */}
                          {t.staffNote && (
                            <div className={`p-2.5 rounded-xl border text-[10px] max-w-[240px] shadow-2xs ${
                              t.staffNoteStatus === 'RESOLVED'
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                                : 'bg-amber-50 border-amber-300 text-amber-950'
                            }`}>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`font-extrabold flex items-center gap-1 text-[9px] ${
                                  t.staffNoteStatus === 'RESOLVED' ? 'text-emerald-900' : 'text-amber-900'
                                }`}>
                                  <span>{t.staffNoteStatus === 'RESOLVED' ? 'Shift Query Resolved:' : 'Your Message:'}</span>
                                </span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                  t.staffNoteStatus === 'RESOLVED'
                                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                    : 'bg-amber-200 text-amber-900 border border-amber-300 animate-pulse'
                                }`}>
                                  {t.staffNoteStatus === 'RESOLVED' ? 'Resolved' : 'Pending Review'}
                                </span>
                              </div>
                              <p className="italic text-slate-900 font-medium leading-snug break-words">"{t.staffNote}"</p>
                              {t.staffNoteStatus === 'RESOLVED' && (t.adminNote || t.notes) && (
                                <div className="mt-1.5 pt-1.5 border-t border-emerald-200/80 text-[9px] text-emerald-900">
                                  <span className="font-bold">Admin Response:</span>
                                  <span className="italic ml-1">"{t.adminNote || t.notes}"</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* General notes if standard completed without staff note */}
                          {t.status !== 'MANUALLY_ADJUSTED' && !t.staffNote && t.notes && (
                            <span className="text-[9px] text-slate-400 block mt-0.5 max-w-[140px] truncate" title={t.notes}>
                              {t.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions / Report Issue */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setMessagingShift(t);
                            setStaffMessageText(t.staffNote || '');
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 ml-auto border shadow-2xs ${
                            t.staffNoteStatus === 'RESOLVED'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                              : t.staffNote
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-200'
                          }`}
                          title={t.staffNoteStatus === 'RESOLVED' ? 'View resolved shift inquiry' : 'Report a punch error, forgot clock-out, or message supervisor about this shift'}
                        >
                          <span>{t.staffNoteStatus === 'RESOLVED' ? 'Resolved Query' : t.staffNote ? 'Edit Message' : 'Report Error / Note'}</span>
                        </button>
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
                    <td className="py-3.5 px-4 font-black text-indigo-950">{(l.totalDays * 7.6).toFixed(2)} hrs ({l.totalDays}d)</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Approved Leave
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-indigo-400 text-right">—</td>
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
            All hours recorded here reflect your electronic punches via the HsCreations Sydney Terminal. If there is an error on any shift or you forgot to punch in/out, click <strong>"Report Error / Note"</strong> on that shift to notify the administrator for review and adjustment.
          </p>
        </div>
      </div>

      {/* Staff Shift Error / Note Modal */}
      {messagingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">Message Admin / Report Shift Issue</h3>
                <p className="text-[10px] text-slate-500">Shift on {messagingShift.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setMessagingShift(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Shift Date:</span>
                <strong className="text-slate-900">{messagingShift.date}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recorded Clock Times:</span>
                <strong className="text-slate-900 font-mono">{messagingShift.clockIn} – {messagingShift.clockOut || 'Currently Active'}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Meal Break:</span>
                <strong className="text-slate-900">{messagingShift.breakMinutes} mins</strong>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!messagingShift || !staffMessageText.trim()) return;
              submitTimecardStaffNote(messagingShift.id, staffMessageText.trim());
              setMessagingShift(null);
              setStaffMessageText('');
            }} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Explain Issue / Message for Supervisor &amp; Admin *
                </label>
                <textarea
                  required
                  rows={4}
                  value={staffMessageText}
                  onChange={e => setStaffMessageText(e.target.value)}
                  placeholder="e.g. I forgot to clock out at 4:00 PM because of emergency machine cleaning, or I started at 07:00 AM instead of 07:30 AM..."
                  className="w-full p-3 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 text-xs leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This message will be sent to the Admin Notification Center and attached to your shift record for administrative adjustment.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMessagingShift(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>Submit Message to Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Credentials Modal */}
      {showCredsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in" onClick={() => setShowCredsModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl max-w-md w-full animate-in zoom-in-95 text-xs" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Staff Shift Authentication
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Update Shift Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCredsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="mt-4 space-y-4">
              {credError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
                  {credError}
                </div>
              )}

              {credSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                  {credSuccess}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1 text-xs">
                  Shift Username *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="e.g. suman.thapa"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Only lowercase letters, numbers, dots, and hyphens (3-30 characters).
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800 text-xs">
                    4-Digit Quick PIN *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Exactly 4 numeric digits
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={4}
                  inputMode="numeric"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full text-center text-xl font-mono font-black tracking-widest py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCredsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

