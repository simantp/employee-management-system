import { TimecardRecord } from '@/types';

/**
 * Format raw seconds into digital clock display (HH:MM:SS)
 */
export function formatSecondsToHMS(totalSec: number): string {
  const safeSec = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Parse time string (e.g. "07:30 AM", "04:15 PM", "14:30") to seconds since midnight
 */
export function parseTimeToSeconds(timeStr: string): number {
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

/**
 * Get gross elapsed seconds for an active or completed shift (before break deduction)
 */
export function getShiftGrossSeconds(t: TimecardRecord, nowMs: number = Date.now()): number {
  const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;

  if (isClockedIn) {
    if (t.clockInTimestamp && t.clockInTimestamp > 0) {
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
      let diffSec = Math.floor((nowMs - start.getTime()) / 1000);

      if (diffSec < 0) {
        // If clockIn time is later than current time today, it likely started earlier or on previous day
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, h, m, s);
        const yDiff = Math.floor((nowMs - yesterdayStart.getTime()) / 1000);
        if (yDiff >= 0 && yDiff < 24 * 3600) {
          return yDiff;
        }
        // Fallback: active ticking relative to now
        const elapsedSinceEpoch = Math.floor((nowMs - (start.getTime() - 4 * 3600 * 1000)) / 1000);
        return Math.max(0, elapsedSinceEpoch);
      }

      if (diffSec >= 0) {
        return diffSec;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  // Completed shift
  if (t.clockIn && t.clockOut) {
    const inSec = parseTimeToSeconds(t.clockIn);
    let outSec = parseTimeToSeconds(t.clockOut);
    if (outSec < inSec) {
      outSec += 24 * 3600; // overnight shift
    }
    return Math.max(0, outSec - inSec);
  }

  if (t.clockInTimestamp && t.clockOutTimestamp) {
    return Math.max(0, Math.floor((t.clockOutTimestamp - t.clockInTimestamp) / 1000));
  }

  if (t.durationSeconds !== undefined && t.durationSeconds > 0) {
    return t.durationSeconds + (t.breakMinutes || 0) * 60;
  }

  return Math.max(0, Math.round((t.totalHours || 0) * 3600) + (t.breakMinutes || 0) * 60);
}

/**
 * Calculates effective break minutes and real net duration/total hours for any shift record.
 * 
 * RULE:
 * 1. If admin manually adjusted the timecard (status === 'MANUALLY_ADJUSTED' or isBreakManuallyAdjusted === true),
 *    the exact breakMinutes entered by admin is used.
 * 2. Otherwise (standard unadjusted shift), if gross worked time is MORE THAN 4 hours (> 14400s),
 *    it is assumed they took 30 minutes of break (30m is deducted from total hours).
 *    If gross worked time is <= 4 hours, break is 0 minutes.
 */
export function getShiftBreakAndDuration(t: TimecardRecord, nowMs: number = Date.now()): {
  isClockedIn: boolean;
  grossSeconds: number;
  effectiveBreakMinutes: number;
  netSeconds: number;
  totalHours: number;
  isManual: boolean;
  isAssumedBreak: boolean;
} {
  const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;
  const grossSeconds = getShiftGrossSeconds(t, nowMs);

  const isManual = Boolean(t.isBreakManuallyAdjusted || t.status === 'MANUALLY_ADJUSTED');

  let effectiveBreakMinutes = 0;
  let isAssumedBreak = false;

  if (isManual) {
    effectiveBreakMinutes = typeof t.breakMinutes === 'number' ? t.breakMinutes : 0;
    isAssumedBreak = false;
  } else {
    // Gross worked > 4 hours => Assumed 30 min break
    if (grossSeconds > 4 * 3600) {
      effectiveBreakMinutes = 30;
      isAssumedBreak = true;
    } else {
      effectiveBreakMinutes = 0;
      isAssumedBreak = false;
    }
  }

  const breakSec = Math.max(0, effectiveBreakMinutes * 60);
  const netSeconds = Math.max(0, grossSeconds - breakSec);
  const exactHours = netSeconds / 3600;
  const totalHours = parseFloat(exactHours.toFixed(4));

  return {
    isClockedIn,
    grossSeconds,
    effectiveBreakMinutes,
    netSeconds,
    totalHours,
    isManual,
    isAssumedBreak,
  };
}

/**
 * Calculate duration when an admin manually specifies punch times and meal break
 */
export function calculateManualShiftDuration(
  clockIn: string,
  clockOut: string,
  breakMinutes: number
): {
  grossSeconds: number;
  breakMinutes: number;
  netSeconds: number;
  totalHours: number;
  durationSeconds: number;
  overtimeHours: number;
} {
  const inSec = parseTimeToSeconds(clockIn);
  let outSec = parseTimeToSeconds(clockOut);
  if (outSec < inSec) {
    outSec += 24 * 3600; // overnight shift
  }
  const grossSeconds = Math.max(0, outSec - inSec);
  const breakSec = Math.max(0, (breakMinutes || 0) * 60);
  const netSeconds = Math.max(0, grossSeconds - breakSec);
  const exactHours = netSeconds / 3600;
  const totalHours = parseFloat(exactHours.toFixed(4));

  return {
    grossSeconds,
    breakMinutes: Math.max(0, breakMinutes || 0),
    netSeconds,
    totalHours,
    durationSeconds: netSeconds,
    overtimeHours: 0,
  };
}
