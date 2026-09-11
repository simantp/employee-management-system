'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { TimecardRecord, Employee, Department } from '@/types';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import { 
  formatSecondsToHMS, 
  parseTimeToSeconds, 
  getShiftGrossSeconds, 
  getShiftBreakAndDuration, 
  calculateManualShiftDuration 
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

function formatDateToDDMMYYYY(d: Date | string | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
      const [y, m, day] = d.trim().split('-');
      return `${day}/${m}/${y}`;
    }
    const parsed = parseDateFlexible(d);
    if (parsed && !isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return d;
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return '';
}

function time12To24(time12: string): string {
  if (!time12) return '07:30';
  const match = time12.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!match) return '07:30';
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const mer = match[4] ? match[4].toUpperCase() : null;
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function time24To12(time24: string): string {
  if (!time24) return '07:30 AM';
  const parts = time24.split(':');
  if (parts.length < 2) return '07:30 AM';
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return '07:30 AM';
  const mer = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${mer}`;
}

function adjustTimeByMinutes(timeStr: string, deltaMinutes: number): string {
  const totalSec = parseTimeToSeconds(timeStr);
  let newSec = (totalSec + deltaMinutes * 60) % (24 * 3600);
  if (newSec < 0) newSec += 24 * 3600;
  const h = Math.floor(newSec / 3600);
  const m = Math.floor((newSec % 3600) / 60);
  const mer = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${mer}`;
}

function parseTime12(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  if (!timeStr) return { hour: 7, minute: 30, period: 'AM' };
  const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!match) return { hour: 7, minute: 30, period: 'AM' };
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) || 0;
  let p: 'AM' | 'PM' = 'AM';
  if (match[4]) {
    p = match[4].toUpperCase() === 'PM' ? 'PM' : 'AM';
  } else {
    p = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
  }
  if (h > 12) h = h % 12 || 12;
  if (h === 0) h = 12;
  return { hour: h, minute: m, period: p };
}

function formatTime12(hour: number, minute: number, period: 'AM' | 'PM'): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${pad(h)}:${pad(minute)} ${period}`;
}

function InteractiveClockPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dialRef = React.useRef<HTMLDivElement>(null);

  const { hour, minute, period } = useMemo(() => parseTime12(value), [value]);

  // Click outside listener to dismiss clock face popover
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleHourSelect = (h: number) => {
    onChange(formatTime12(h, minute, period));
    // Auto advance to minute selection for swift UX
    setMode('minute');
  };

  const handleMinuteSelect = (m: number) => {
    onChange(formatTime12(hour, m, period));
  };

  const handlePeriodToggle = (p: 'AM' | 'PM') => {
    onChange(formatTime12(hour, minute, p));
  };

  const handleDialClickOrDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Angle in degrees clockwise from 12 o'clock
    const angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360;

    if (mode === 'hour') {
      let rawH = Math.round(angle / 30);
      if (rawH === 0) rawH = 12;
      handleHourSelect(rawH);
    } else {
      const rawM = Math.round(angle / 6) % 60;
      handleMinuteSelect(rawM);
    }
  };

  // Clock Hand Rotation Angle
  const handAngle = mode === 'hour' ? (hour % 12) * 30 : minute * 6;

  // 12 Radial positions
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 block text-xs flex items-center gap-1.5">
          <span>{label}</span>
        </label>
        <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
          {value || '07:30 AM'}
        </span>
      </div>

      {/* Main Interactive Trigger: Click to open Small Clock Face Popover */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setMode('hour');
        }}
        className={`w-full py-2 px-3 border rounded-xl font-mono font-bold text-sm text-center cursor-pointer shadow-2xs transition flex items-center justify-between gap-2 ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/30'
            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="tracking-wide font-black">{value || '07:30 AM'}</span>
        </div>
        <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180 text-blue-200' : 'text-slate-400'}`}>
          ▼
        </span>
      </button>

      {/* ========================================================================= */}
      {/* DYNAMIC SMALL CLOCK POPOVER DIAL FACE */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[70] w-[270px] p-4 bg-white rounded-3xl shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Time Display & Mode Tabs + AM/PM Switch */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            {/* Hour : Minute Clickable Digital Display */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('hour')}
                className={`px-2.5 py-1 rounded-xl font-mono text-base font-black transition cursor-pointer ${
                  mode === 'hour'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                {String(hour).padStart(2, '0')}
              </button>
              <span className="font-mono font-bold text-slate-400 text-base animate-pulse">:</span>
              <button
                type="button"
                onClick={() => setMode('minute')}
                className={`px-2.5 py-1 rounded-xl font-mono text-base font-black transition cursor-pointer ${
                  mode === 'minute'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                {String(minute).padStart(2, '0')}
              </button>
            </div>

            {/* AM / PM Segmented Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handlePeriodToggle('AM')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  period === 'AM'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle('PM')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  period === 'PM'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Mode Indicator Hint */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">
            <span>{mode === 'hour' ? 'Select Hour (1-12)' : 'Select Minute (00-55)'}</span>
            <span className="text-blue-600 font-mono font-black">{mode === 'hour' ? `${hour}:--` : `--:${String(minute).padStart(2, '0')}`}</span>
          </div>

          {/* Circular Clock Dial Face Container */}
          <div
            ref={dialRef}
            onClick={handleDialClickOrDrag}
            className="w-[200px] h-[200px] mx-auto rounded-full bg-slate-50/90 border-2 border-slate-200 relative select-none cursor-pointer shadow-inner flex items-center justify-center"
          >
            {/* Center Pivot Dot */}
            <div className="w-3 h-3 rounded-full bg-blue-600 absolute z-20 shadow-xs ring-2 ring-white" />

            {/* Clock Hand / Pointer */}
            <div
              className="absolute top-1/2 left-1/2 w-0.5 bg-blue-600 origin-bottom z-10 transition-transform duration-100 pointer-events-none"
              style={{
                height: '74px',
                transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
              }}
            >
              {/* Glowing Indicator at tip */}
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center absolute -top-3.5 left-1/2 -translate-x-1/2 shadow-md ring-2 ring-blue-400">
                {mode === 'hour' ? hour : String(minute).padStart(2, '0')}
              </div>
            </div>

            {/* Dial Numbers: Radial Positioning */}
            {mode === 'hour' ? (
              hourNumbers.map(h => {
                const angleDeg = (h * 30) - 90;
                const angleRad = (angleDeg * Math.PI) / 180;
                const radius = 72;
                const x = 100 + radius * Math.cos(angleRad) - 13;
                const y = 100 + radius * Math.sin(angleRad) - 13;
                const isSelected = hour === h;

                return (
                  <button
                    key={h}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHourSelect(h);
                    }}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    className={`w-[26px] h-[26px] rounded-full absolute flex items-center justify-center text-xs font-bold font-mono transition cursor-pointer z-20 ${
                      isSelected
                        ? 'text-white font-black scale-110'
                        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {h}
                  </button>
                );
              })
            ) : (
              minuteNumbers.map(m => {
                const angleDeg = (m * 6) - 90;
                const angleRad = (angleDeg * Math.PI) / 180;
                const radius = 72;
                const x = 100 + radius * Math.cos(angleRad) - 13;
                const y = 100 + radius * Math.sin(angleRad) - 13;
                const isSelected = minute === m;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMinuteSelect(m);
                    }}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    className={`w-[26px] h-[26px] rounded-full absolute flex items-center justify-center text-[11px] font-bold font-mono transition cursor-pointer z-20 ${
                      isSelected
                        ? 'text-white font-black scale-110'
                        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                );
              })
            )}
          </div>

          {/* Fine Tuning +/- 1 Minute Buttons & Actions */}
          <div className="flex items-center justify-between gap-1.5 pt-3 mt-3 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(adjustTimeByMinutes(value, -1))}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition cursor-pointer"
                title="Subtract 1 minute"
              >
                -1m
              </button>
              <button
                type="button"
                onClick={() => onChange(adjustTimeByMinutes(value, 1))}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition cursor-pointer"
                title="Add 1 minute"
              >
                +1m
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTimecardManagement() {
  const { 
    timecards, 
    employees, 
    adminAdjustTimecard, 
    resolveTimecardStaffNote,
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
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Count total shifts with staff messages
  const staffMessagesCount = useMemo(() => {
    return timecards.filter(t => Boolean(t.staffNote && t.staffNote.trim())).length;
  }, [timecards]);

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

  // --- PDF Summary Modal Filter State (Defaults: Single Staff Member & Custom Range) ---
  const [pdfStaffScope, setPdfStaffScope] = useState<'ALL' | 'SPECIFIC'>('SPECIFIC');
  const [pdfSelectedStaffId, setPdfSelectedStaffId] = useState<string>('');
  const [pdfCustomStartDate, setPdfCustomStartDate] = useState<string>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const y = firstDay.getFullYear();
    const m = String(firstDay.getMonth() + 1).padStart(2, '0');
    const d = String(firstDay.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [pdfCustomEndDate, setPdfCustomEndDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Auto-select first staff member for PDF single staff scope if not selected yet
  useEffect(() => {
    if (!pdfSelectedStaffId && employees.length > 0) {
      setPdfSelectedStaffId(employees[0].id);
    }
  }, [employees, pdfSelectedStaffId]);

  // Active Floor Staff
  const activeStaff = employees.filter(e => e.clockState === 'CLOCKED_IN');

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

      // Status / Adjustments (Staff Messages) filter
      if (statusFilter === 'ADJUSTMENTS') {
        if (!t.staffNote || t.staffNote.trim() === '') {
          return false;
        }
      } else if (statusFilter === 'ADMIN_ADJUSTED') {
        if (t.status !== 'MANUALLY_ADJUSTED') return false;
      } else if (statusFilter === 'CLOCKED_IN') {
        if (t.status !== 'CLOCKED_IN' && !(!t.clockOut)) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (t.status !== 'COMPLETED') return false;
      }

      return true;
    });
  }, [timecards, selectedYear, selectedMonthIndex, selectedDateString, staffFilter, departmentFilter, statusFilter]);

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

    const { totalHours, durationSeconds } = calculateManualShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);

    adminAdjustTimecard(editingRecord.id, {
      clockIn: formClockIn,
      clockOut: formClockOut,
      breakMinutes: Number(formBreak) || 0,
      totalHours,
      durationSeconds,
      overtimeHours: 0,
      isBreakManuallyAdjusted: true,
      notes: formNotes || editingRecord.notes,
      adminNote: formNotes || editingRecord.adminNote || editingRecord.notes
    });

    setEditingRecord(null);
  };

  // Manual Shift Save
  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === formEmployeeId);
    if (!targetEmp) return;

    const { totalHours, durationSeconds } = calculateManualShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);

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
      overtimeHours: 0,
      isBreakManuallyAdjusted: true,
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

      // 2. Date Range
      const tDate = parseDateFlexible(t.date);
      if (!tDate) return false;

      if (pdfCustomStartDate) {
        const [sy, sm, sd] = pdfCustomStartDate.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        if (tDate < start) return false;
      }
      if (pdfCustomEndDate) {
        const [ey, em, ed] = pdfCustomEndDate.split('-').map(Number);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        if (tDate > end) return false;
      }

      return true;
    });
  }, [timecards, pdfStaffScope, pdfSelectedStaffId, pdfCustomStartDate, pdfCustomEndDate]);

  const pdfTotalHours = pdfRecords.reduce((acc, curr) => acc + getShiftBreakAndDuration(curr, currentTime).totalHours, 0);
  const pdfSelectedStaffObj = employees.find(e => e.id === pdfSelectedStaffId);

  // Trigger browser printing with custom styling
  const handlePrintReport = () => {
    window.print();
  };

  const handleOpenPdfModal = () => {
    setPdfStaffScope('SPECIFIC');
    if (staffFilter !== 'ALL') {
      setPdfSelectedStaffId(staffFilter);
    } else if (!pdfSelectedStaffId && employees.length > 0) {
      setPdfSelectedStaffId(employees[0].id);
    }
    setShowPdfModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Electronic Timecard &amp; Shift Register
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Live attendance tracking, biometric PIN punch terminal, and Fair Work certified timesheet reporting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenPdfModal}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            Export &amp; Print Timesheets
          </button>

          <button
            type="button"
            onClick={() => {
              setFormEmployeeId('');
              setFormDate(selectedDateString !== 'ALL' ? selectedDateString : formatDateDisplay(new Date()));
              setFormClockIn('07:30 AM');
              setFormClockOut('04:00 PM');
              setFormBreak(30);
              setFormNotes('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            Manual Shift Entry
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Month & Date Calendar Navigation Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Previous Month"
              >
                ◀
              </button>
              <span className="px-3 text-xs font-black tracking-wide">
                {currentMonthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Next Month"
              >
                ▶
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
                  ? `Showing all shifts across ${currentMonthLabel}. Filter by staff or department below.`
                  : `Review clock in/out times, meal breaks, and live punch duration for ${selectedDateString}.`
                }
              </p>
            </div>
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status & Adjustments Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-none transition border ${
                statusFilter === 'ADJUSTMENTS'
                  ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="ALL">All Shifts</option>
              <option value="ADJUSTMENTS">
                Adjustments {staffMessagesCount > 0 ? `(${staffMessagesCount})` : ''}
              </option>
              <option value="ADMIN_ADJUSTED">Admin Adjusted</option>
              <option value="CLOCKED_IN">Live on Shift</option>
              <option value="COMPLETED">Completed</option>
            </select>

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

        {/* ========================================================================= */}
        {/* 2. SHIFTS TABLE OR CLEAN EMPTY STATE */}
        {/* ========================================================================= */}
        {filteredTimecards.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50/40 border-t border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                {statusFilter === 'ADJUSTMENTS'
                  ? `No Staff Messages or Adjustment Inquiries Found`
                  : selectedDateString !== 'ALL'
                  ? `No Shifts Recorded for ${selectedDateString}`
                  : `No Timecard Records for this Selection`
                }
              </h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                {statusFilter === 'ADJUSTMENTS'
                  ? 'There are no shifts matching this date or staff selection with messages or error reports submitted by staff.'
                  : 'No employee shift records match the selected date or filter criteria. You can log a shift manually.'
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
                  const shiftInfo = getShiftBreakAndDuration(t, currentTime);

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

                      {/* Day & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200/80">
                            {getDayOfWeek(t.date).slice(0, 3)}
                          </span>
                          <span className="font-mono font-medium text-slate-800">
                            {t.date}
                          </span>
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">{shiftInfo.effectiveBreakMinutes}m</span>
                          {shiftInfo.isAssumedBreak && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold" title="Auto 30-min break assumed for shift > 4 hours">
                              auto 30m
                            </span>
                          )}
                          {shiftInfo.isManual && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-semibold" title="Break manually set by Admin">
                              manual
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Hours (Live) - Calculated accurately without rounding */}
                      <td className="py-3.5 px-4">
                        {isClockedIn ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 w-fit shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{formatSecondsToHMS(shiftInfo.netSeconds)}</span>
                              <span className="text-[9px] text-emerald-600 uppercase font-sans font-bold ml-0.5">LIVE</span>
                            </div>
                            <span className="text-[10px] text-emerald-800 font-mono font-bold pl-1">
                              {shiftInfo.totalHours.toFixed(2)} hrs
                              {shiftInfo.effectiveBreakMinutes > 0 && (
                                <span className="text-[9px] font-normal text-slate-400 font-sans ml-1">
                                  (-{shiftInfo.effectiveBreakMinutes}m break)
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              {formatSecondsToHMS(shiftInfo.netSeconds)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold font-mono">
                              {shiftInfo.totalHours.toFixed(2)} hrs
                              {shiftInfo.effectiveBreakMinutes > 0 && (
                                <span className="text-[9px] font-normal text-slate-400 font-sans ml-1">
                                  (-{shiftInfo.effectiveBreakMinutes}m break)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status & Messages */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            t.status === 'CLOCKED_IN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            t.status === 'MANUALLY_ADJUSTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Adjusted' : t.status === 'CLOCKED_IN' ? 'Live on Shift' : t.status}
                          </span>

                          {/* Admin Adjustment Message if Manually Adjusted */}
                          {t.status === 'MANUALLY_ADJUSTED' && (t.adminNote || t.notes) && (
                            <div className="p-2 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-950 text-[10px] max-w-[220px] shadow-2xs">
                              <span className="font-bold text-purple-800 flex items-center gap-1 text-[9px] mb-0.5">
                                <span>Admin Message:</span>
                                {t.adjustedBy && <span className="text-purple-600 font-normal">({t.adjustedBy})</span>}
                              </span>
                              <p className="italic text-purple-900 leading-snug break-words">"{t.adminNote || t.notes}"</p>
                            </div>
                          )}

                          {/* Staff Error Report / Shift Note if present */}
                          {t.staffNote && (
                            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[10px] max-w-[220px] shadow-2xs">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-extrabold text-amber-900 flex items-center gap-1 text-[9px]">
                                  <span>Staff Message:</span>
                                </span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                  t.staffNoteStatus === 'RESOLVED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-200 text-amber-900 border border-amber-300 animate-pulse'
                                }`}>
                                  {t.staffNoteStatus === 'RESOLVED' ? 'Resolved' : 'Review Needed'}
                                </span>
                              </div>
                              <p className="italic text-slate-900 font-medium leading-snug break-words">"{t.staffNote}"</p>
                              {t.staffNoteSubmittedAt && (
                                <span className="text-[8px] text-slate-400 block mt-1">
                                  Sent {new Date(t.staffNoteSubmittedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
                                </span>
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingRecord(t);
                              setFormClockIn(t.clockIn);
                              setFormClockOut(t.clockOut || '04:00 PM');
                              setFormBreak(shiftInfo.effectiveBreakMinutes);
                              setFormNotes(t.adminNote || t.notes || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            Adjust
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingTimecard(t)}
                            className="px-2 py-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-[11px] transition cursor-pointer"
                            title="Delete timecard entry"
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
      {/* 3. MODALS (Add / Adjust / Delete / PDF Timesheet Summary) */}
      {/* ========================================================================= */}

      {/* ========================================================================= */}
      {/* MODAL 1: SUPERADMIN ADJUST TIMECARD */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
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

            {/* Staff Reported Issue Box */}
            {editingRecord.staffNote && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
                    <span>Message from Staff ({editingRecord.employeeName})</span>
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    editingRecord.staffNoteStatus === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-200 text-amber-900 border border-amber-300'
                  }`}>
                    {editingRecord.staffNoteStatus === 'RESOLVED' ? 'Resolved' : 'Pending Review'}
                  </span>
                </div>
                <p className="italic text-slate-900 font-medium bg-white/70 p-2 rounded-xl border border-amber-200/80">
                  "{editingRecord.staffNote}"
                </p>
                <p className="text-[10px] text-amber-800">
                  Saving this adjustment will resolve this inquiry and send your admin message/reason to the employee.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InteractiveClockPicker
                  label="Clock In Time (AEST)"
                  value={formClockIn}
                  onChange={setFormClockIn}
                />

                <InteractiveClockPicker
                  label="Clock Out Time (AEST)"
                  value={formClockOut}
                  onChange={setFormClockOut}
                />
              </div>

              {/* Meal Break container */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block text-xs">
                    Meal Break (minutes)
                  </label>
                  <span className="font-mono text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    {formBreak} mins
                  </span>
                </div>

                <input
                  type="number"
                  required
                  min={0}
                  value={formBreak}
                  onChange={e => setFormBreak(Number(e.target.value) || 0)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 text-sm shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. 30"
                />
              </div>

              {/* Real-time Calculated Live Net Shift Duration Banner */}
              {(() => {
                const calc = calculateManualShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);
                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Net Shift Duration</span>
                      <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                        {formatSecondsToHMS(calc.netSeconds)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Net Paid Hours</span>
                      <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">
                        {calc.totalHours.toFixed(2)} hrs
                      </span>
                      {calc.breakMinutes > 0 && (
                        <span className="text-[9px] text-slate-500 font-medium">(-{calc.breakMinutes}m break deducted)</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Audit Reason / Note for Staff</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Employee forgot punch-out; supervisor Dave confirmed 07:30 - 16:00 shift."
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {editingRecord.staffNote && editingRecord.staffNoteStatus !== 'RESOLVED' ? (
                  <button
                    type="button"
                    onClick={() => {
                      resolveTimecardStaffNote(editingRecord.id, formNotes || 'Reviewed and confirmed by Administration without time adjustments.');
                      setEditingRecord(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Mark as Resolved
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer shadow-md"
                  >
                    {editingRecord.staffNote && editingRecord.staffNoteStatus !== 'RESOLVED' ? 'Save & Resolve' : 'Save Adjustment'}
                  </button>
                </div>
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
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InteractiveClockPicker
                  label="Clock In Time (AEST)"
                  value={formClockIn}
                  onChange={setFormClockIn}
                />

                <InteractiveClockPicker
                  label="Clock Out Time (AEST)"
                  value={formClockOut}
                  onChange={setFormClockOut}
                />
              </div>

              {/* Meal Break container */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block text-xs">
                    Meal Break (minutes)
                  </label>
                  <span className="font-mono text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    {formBreak} mins
                  </span>
                </div>

                <input
                  type="number"
                  required
                  min={0}
                  value={formBreak}
                  onChange={e => setFormBreak(Number(e.target.value) || 0)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 text-sm shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. 30"
                />
              </div>

              {/* Real-time Calculated Live Net Shift Duration Banner */}
              {(() => {
                const calc = calculateManualShiftDuration(formClockIn, formClockOut, Number(formBreak) || 0);
                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Net Shift Duration</span>
                      <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                        {formatSecondsToHMS(calc.netSeconds)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Net Paid Hours</span>
                      <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">
                        {calc.totalHours.toFixed(2)} hrs
                      </span>
                      {calc.breakMinutes > 0 && (
                        <span className="text-[9px] text-slate-500 font-medium">(-{calc.breakMinutes}m break deducted)</span>
                      )}
                    </div>
                  </div>
                );
              })()}

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
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer shadow-md"
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
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 block text-xs">Timeframe Period</label>
                      <span className="text-[10px] text-slate-400 font-medium">Custom Date Range</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">Start Date</span>
                        <input
                          type="date"
                          value={pdfCustomStartDate}
                          onChange={e => setPdfCustomStartDate(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">End Date</span>
                        <input
                          type="date"
                          value={pdfCustomEndDate}
                          onChange={e => setPdfCustomEndDate(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100 text-slate-700">
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
                        {pdfCustomStartDate === pdfCustomEndDate 
                          ? formatDateToDDMMYYYY(pdfCustomStartDate)
                          : `${formatDateToDDMMYYYY(pdfCustomStartDate)} to ${formatDateToDDMMYYYY(pdfCustomEndDate)}`}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Staff Scope: <strong className="text-slate-800">{pdfStaffScope === 'ALL' ? `All Staff Members (${employees.length})` : `${pdfSelectedStaffObj?.firstName} ${pdfSelectedStaffObj?.lastName} (ID: ${pdfSelectedStaffObj?.employeeNumber})`}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Generated: {formatDateToDDMMYYYY(new Date())} at {new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* KPI Summary Metrics Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Shifts</span>
                    <span className="text-xl font-black text-slate-900 mt-0.5 block">{pdfRecords.length} Shifts</span>
                    <span className="text-[10px] text-slate-500 font-medium">Logged in timeframe</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Hours</span>
                    <span className="text-xl font-black text-emerald-700 mt-0.5 block">{pdfTotalHours.toFixed(2)} hrs</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Exact gross duration</span>
                  </div>
                </div>

                {/* Detailed Printable Shift Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Employee Name &amp; ID</th>
                        <th className="py-2.5 px-3">Day &amp; Date</th>
                        <th className="py-2.5 px-3">Clock In</th>
                        <th className="py-2.5 px-3">Clock Out</th>
                        <th className="py-2.5 px-3">Break</th>
                        <th className="py-2.5 px-3">Paid Hours</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-sans">
                      {pdfRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            No shift records found matching this timeframe criteria.
                          </td>
                        </tr>
                      ) : (
                        pdfRecords.map(t => {
                          const shiftInfo = getShiftBreakAndDuration(t, currentTime);
                          return (
                            <tr key={t.id}>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                <div>{t.employeeName}</div>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {t.employeeId}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-800">{getDayOfWeek(t.date).slice(0, 3)}</span>, {formatDateToDDMMYYYY(t.date)}
                              </td>
                              <td className="py-2 px-3 font-mono text-emerald-700 font-bold">{t.clockIn}</td>
                              <td className="py-2 px-3 font-mono text-slate-800 font-bold">{t.clockOut || 'Active'}</td>
                              <td className="py-2 px-3 font-mono">
                                {shiftInfo.effectiveBreakMinutes}m
                                {shiftInfo.isAssumedBreak && <span className="text-[9px] text-slate-400 ml-1">(auto)</span>}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{shiftInfo.totalHours.toFixed(2)} hrs</td>
                              <td className="py-2 px-3 text-[10px]">
                                <span className="font-semibold text-slate-700">
                                  {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Adj' : t.status}
                                </span>
                                {t.status === 'MANUALLY_ADJUSTED' && (t.adminNote || t.notes) && (
                                  <div className="text-[9px] text-purple-800 italic mt-0.5 max-w-[140px] leading-tight" title={t.adminNote || t.notes}>
                                    Note: {t.adminNote || t.notes}
                                  </div>
                                )}
                                {t.staffNote && (
                                  <div className="text-[9px] text-amber-800 italic mt-0.5 max-w-[140px] leading-tight" title={t.staffNote}>
                                    Staff: {t.staffNote}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right print:hidden">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRecord(t);
                                    setFormClockIn(t.clockIn);
                                    setFormClockOut(t.clockOut || '04:00 PM');
                                    setFormBreak(shiftInfo.effectiveBreakMinutes);
                                    setFormNotes(t.adminNote || t.notes || '');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer border border-blue-200"
                                >
                                  Adjust
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

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

