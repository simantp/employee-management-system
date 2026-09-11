'use client';

import React, { useState, useEffect } from 'react';
import { Employee, TimecardRecord } from '@/types';
import { useApp } from '@/lib/store';

interface ActiveStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee) => void;
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

function getShiftInfo(emp: Employee, timecards: TimecardRecord[], nowMs: number) {
  const activeShift = timecards.find(
    t => ((emp.currentShiftId && t.id === emp.currentShiftId) || t.employeeId === emp.id) &&
         (t.status === 'CLOCKED_IN' || (!t.clockOut && t.status !== 'COMPLETED'))
  );

  let startEpoch = emp.clockInTimestamp || activeShift?.clockInTimestamp;
  if (!startEpoch && emp.lastClockIn) {
    const parsed = new Date(emp.lastClockIn).getTime();
    if (!isNaN(parsed) && parsed > 0) startEpoch = parsed;
  }

  // If no epoch, attempt to parse time string today
  if (!startEpoch && activeShift?.clockIn) {
    const inSec = parseTimeToSeconds(activeShift.clockIn);
    const now = new Date(nowMs);
    const shiftDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    startEpoch = shiftDate.getTime() + inSec * 1000;
  }

  // Display start time
  let startTime = activeShift?.clockIn;
  if (!startTime && startEpoch) {
    startTime = new Date(startEpoch).toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }
  if (!startTime) {
    startTime = '07:30 AM';
  }

  // Shift Date
  const dateStr = activeShift?.date || (startEpoch ? new Date(startEpoch).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : '');

  // Calculate gross elapsed time
  let grossSec = 0;
  if (startEpoch && startEpoch > 0) {
    grossSec = Math.max(0, Math.floor((nowMs - startEpoch) / 1000));
  } else {
    grossSec = 0;
  }

  // Break deduction rule:
  // If active shift was manually adjusted, use that break; otherwise if grossSec > 4 hours, assume 30m break.
  const isManual = Boolean(activeShift?.isBreakManuallyAdjusted || activeShift?.status === 'MANUALLY_ADJUSTED');
  let breakMinutes = 0;
  let isAssumedBreak = false;

  if (isManual) {
    breakMinutes = typeof activeShift?.breakMinutes === 'number' ? activeShift.breakMinutes : 0;
  } else {
    if (grossSec > 4 * 3600) {
      breakMinutes = 30;
      isAssumedBreak = true;
    } else {
      breakMinutes = 0;
    }
  }

  const breakSec = Math.max(0, breakMinutes * 60);
  const netSec = Math.max(0, grossSec - breakSec);
  const hms = formatSecondsToHMS(netSec);
  const decimalHours = (netSec / 3600).toFixed(2);

  return {
    startTime,
    dateStr,
    elapsedSec: netSec,
    grossSec,
    breakMinutes,
    isAssumedBreak,
    isManual,
    hms,
    decimalHours,
    activeShift,
  };
}

export default function ActiveStaffModal({
  isOpen,
  onClose,
  onSelectEmployee
}: ActiveStaffModalProps) {
  const { employees, timecards, adminClockOutStaff } = useApp();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Clock Out confirmation dialog state
  const [clockOutTarget, setClockOutTarget] = useState<Employee | null>(null);
  const [breakMinutesInput, setBreakMinutesInput] = useState<number>(0);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [isClockingOut, setIsClockingOut] = useState<boolean>(false);

  // Real-time ticking every second
  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter staff currently on shift (excluding any archived)
  const activeStaff = employees.filter(e => e.clockState === 'CLOCKED_IN' && e.status !== 'Archived');

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

  // Calculate total active floor shift hours
  const totalShiftSeconds = activeStaff.reduce((acc, emp) => {
    const info = getShiftInfo(emp, timecards, nowMs);
    return acc + info.elapsedSec;
  }, 0);
  const totalFloorHours = (totalShiftSeconds / 3600).toFixed(1);

  // Open clock-out dialog for specific employee
  const handleOpenClockOut = (emp: Employee) => {
    const info = getShiftInfo(emp, timecards, nowMs);
    setClockOutTarget(emp);
    setBreakMinutesInput(info.breakMinutes);
    setAdminNoteInput('');
  };

  // Perform administrative clock-out
  const handleConfirmClockOut = () => {
    if (!clockOutTarget) return;
    setIsClockingOut(true);
    try {
      adminClockOutStaff(clockOutTarget.id, {
        breakMinutes: Number(breakMinutesInput) || 0,
        note: adminNoteInput.trim() || 'Administrative Clock-Out via Active Floor Staff Modal',
      });
      setClockOutTarget(null);
    } finally {
      setIsClockingOut(false);
    }
  };

  // Info for target in clock out confirmation dialog
  const targetInfo = clockOutTarget ? getShiftInfo(clockOutTarget, timecards, nowMs) : null;
  const targetEffectiveBreakSec = Math.max(0, (Number(breakMinutesInput) || 0) * 60);
  const targetNetSec = targetInfo ? Math.max(0, targetInfo.grossSec - targetEffectiveBreakSec) : 0;
  const targetNetHms = formatSecondsToHMS(targetNetSec);
  const targetNetHours = (targetNetSec / 3600).toFixed(2);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs shadow-black/20 flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Active On-Shift Staff</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeStaff.length} Clocked In
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                  {totalFloorHours} total floor hrs
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
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer font-bold text-xs"
            title="Close"
          >
            Close
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              const info = getShiftInfo(emp, timecards, nowMs);

              return (
                <div
                  key={emp.id}
                  className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-2xl bg-white hover:bg-slate-50/90 transition-all border border-slate-100 hover:border-slate-200/90 shadow-2xs"
                >
                  {/* Employee Identity & Department */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <img
                        src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={emp.firstName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-xs"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          {emp.employeeNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ON SHIFT
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium truncate">
                        {emp.jobTitle} • <strong className="text-slate-700">{emp.department || 'Production'}</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>{emp.workLocation || 'Sydney Plant'}</span>
                        <span>PIN: <strong className="font-mono text-slate-700">{emp.kioskPin || '4829'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Start Time, Live Hours Counter & Admin Clock Out Action */}
                  <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-center justify-between md:justify-end">
                    {/* Shift Start Time Card */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 flex flex-col items-start min-w-[110px] shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Start Time
                      </span>
                      <span className="font-mono font-extrabold text-slate-800 text-xs mt-0.5">
                        {info.startTime}
                      </span>
                      {info.dateStr && (
                        <span className="text-[9px] text-slate-400 font-medium">{info.dateStr}</span>
                      )}
                    </div>

                    {/* Live Working Hours Counter */}
                    <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-3.5 py-2 flex flex-col items-start min-w-[135px] shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Working Time
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="font-mono font-black text-emerald-800 text-sm tracking-tight">
                          {info.hms}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 font-mono">
                          ({info.decimalHours}h)
                        </span>
                      </div>
                      {info.breakMinutes > 0 && (
                        <span className="text-[9px] text-emerald-700 font-medium font-sans mt-0.5">
                          -{info.breakMinutes}m break deducted
                        </span>
                      )}
                    </div>

                    {/* Admin Clock Out Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenClockOut(emp)}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group min-w-[100px]"
                      title={`Clock out ${emp.firstName} ${emp.lastName}`}
                    >
                      <span>Clock Out</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live sync active with Sydney plant timecard registry.
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

      {/* Admin Clock-Out Confirmation Modal */}
      {clockOutTarget && targetInfo && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => !isClockingOut && setClockOutTarget(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden animate-in zoom-in-95 duration-150 text-xs shadow-black/30 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Admin Clock-Out Confirmation</h3>
                <p className="text-slate-500 text-[11px]">Finalize active shift and record end timestamp</p>
              </div>
              <button
                type="button"
                onClick={() => !isClockingOut && setClockOutTarget(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer font-bold text-xs"
              >
                Close
              </button>
            </div>

            {/* Target Employee Identity Card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <img
                src={clockOutTarget.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={clockOutTarget.firstName}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {clockOutTarget.firstName} {clockOutTarget.lastName}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                    {clockOutTarget.employeeNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {clockOutTarget.jobTitle} • <strong className="text-slate-700">{clockOutTarget.department || 'Production'}</strong>
                </p>
              </div>
            </div>

            {/* Shift Metrics & Deductions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Start Time</span>
                <p className="font-mono font-extrabold text-slate-800 text-sm">{targetInfo.startTime}</p>
                <span className="text-[10px] text-slate-400">{targetInfo.dateStr || 'Today'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gross Elapsed Time</span>
                <p className="font-mono font-extrabold text-emerald-900 text-sm">
                  {formatSecondsToHMS(targetInfo.grossSec)}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium">({(targetInfo.grossSec / 3600).toFixed(2)} hrs gross)</span>
              </div>
            </div>

            {/* Meal Break Adjustment */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 text-xs">
                  Meal Break Deduction (Minutes)
                </label>
                <span className="text-[10px] font-semibold text-slate-500">
                  {targetInfo.grossSec > 4 * 3600 ? 'Auto-suggested 30m (>4h shift)' : '0m default'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="5"
                  value={breakMinutesInput}
                  onChange={e => setBreakMinutesInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-28 px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-rose-500/20"
                />
                <span className="text-[11px] text-slate-500 font-medium">
                  Resulting Net Paid: <strong className="text-emerald-700 font-mono font-bold">{targetNetHours} hrs</strong> ({targetNetHms})
                </span>
              </div>
            </div>

            {/* Admin Audit Note */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs">
                Admin Reason / Audit Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Shift concluded, supervisor Dave approved clock-out"
                value={adminNoteInput}
                onChange={e => setAdminNoteInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
              />
            </div>

            {/* Notice */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              <p>
                Clocking out this staff member will finalize their active shift in the Sydney timecard register, update their status to <strong>CLOCKED OUT</strong>, and log an administrative audit entry.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClockOutTarget(null)}
                disabled={isClockingOut}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClockOut}
                disabled={isClockingOut}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-rose-600/30 disabled:opacity-50"
              >
                {isClockingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Clocking Out...</span>
                  </>
                ) : (
                  <span>Confirm Clock Out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


