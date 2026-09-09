'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { TimecardRecord } from '@/types';

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
    return 0; // Starts from 00:00:00!
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

  // Filter staff's own timecard entries
  const staffTimecards = timecards.filter(t => t.employeeId === currentStaff.id);

  // Filter staff's approved leaves to integrate into timecard history
  const staffLeaves = leaveRequests.filter(r => r.employeeId === currentStaff.id && r.status === 'APPROVED');

  // Compute total hours and overtime for current pay cycle
  const totalLoggedHours = staffTimecards.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const totalOvertime = staffTimecards.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
  const standardHours = currentStaff.workingHours || 38.0;

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

  // CSV Export for staff
  const exportTimesheetCSV = () => {
    const headers = ['Date', 'Day', 'Clock In', 'Clock Out', 'Meal Break (min)', 'Paid Hours', 'Overtime Hours', 'Status', 'Notes'];
    const rows = staffTimecards.map(t => [
      `"${t.date}"`,
      `"${new Date(t.date).toLocaleDateString('en-AU', { weekday: 'long' })}"`,
      `"${t.clockIn}"`,
      `"${t.clockOut || 'Active Shift'}"`,
      t.breakMinutes,
      t.totalHours,
      t.overtimeHours,
      `"${t.status}"`,
      `"${t.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HsCreations_Timesheet_${currentStaff.employeeNumber}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <p className="text-slate-500 mt-0.5">
            Fair Work Australia standard 38.0h week • Real-time electronic punch log at {currentStaff.workLocation || 'Sydney NSW'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 font-bold hover:bg-orange-100 transition cursor-pointer shadow-xs"
          >
            <span>Kiosk PIN: <strong className="font-mono">{currentStaff.kioskPin || '4829'}</strong></span>
          </button>

          <button
            onClick={exportTimesheetCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <span>Print Timesheet</span>
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
                Shift active since <strong>{currentStaff.lastClockIn ? new Date(currentStaff.lastClockIn).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'Today'} AEST</strong>. Remember to punch out via the Login Screen Kiosk at shift end.
              </p>
            </div>
          </div>
          <div className="text-right font-mono hidden sm:block">
            <span className="text-[10px] text-emerald-700 font-bold block uppercase">Live Sydney Clock</span>
            <span className="text-lg font-black text-emerald-950">{currentTimeStr}</span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Logged Hours</span>
          <span className="text-2xl font-black text-slate-900 block">{totalLoggedHours.toFixed(1)} hrs</span>
          <span className="text-[11px] text-emerald-600 font-bold">
            {((totalLoggedHours / standardHours) * 100).toFixed(0)}% of {standardHours}h standard
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Overtime (1.5x / 2.0x)</span>
          <span className="text-2xl font-black text-orange-600 block">{totalOvertime.toFixed(1)} hrs</span>
          <span className="text-[11px] text-slate-500">Fair Work penalty tier</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Approved Leaves</span>
          <span className="text-2xl font-black text-indigo-600 block">{staffLeaves.length} Shifts</span>
          <span className="text-[11px] text-indigo-700 font-semibold">Annual &amp; Sick recorded</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Security &amp; Integrity</span>
          <span className="text-2xl font-black text-emerald-600 block">Verified</span>
          <span className="text-[11px] text-slate-500">Supervisor: {currentStaff.reportsTo || 'Operations Lead'}</span>
        </div>
      </div>

      {/* Main Electronic Timecard Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span>Official Electronic Punch Card</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              Tamper-proof record generated from Kiosk punches. Contact SuperAdmin for adjustments.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Sydney AEST Timezone</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Shift Type / Location</th>
                <th className="py-3.5 px-5">Clock In</th>
                <th className="py-3.5 px-5">Clock Out</th>
                <th className="py-3.5 px-5">Break</th>
                <th className="py-3.5 px-5">Paid Hours</th>
                <th className="py-3.5 px-5">Overtime</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* 1. Timecard Clock logs */}
              {staffTimecards.map(t => {
                const isClockedIn = t.status === 'CLOCKED_IN' || !t.clockOut;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div>{t.date}</div>
                      <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 inline-block mt-0.5">
                        {new Date(t.date).toLocaleDateString('en-AU', { weekday: 'long' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-800 block">{t.department || currentStaff.department || 'Production'}</span>
                      <span className="text-[10px] text-slate-400">{t.notes || 'Standard shift'}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">{t.clockIn}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                      {t.clockOut || (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold animate-pulse">
                          Active Now
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-medium">{t.breakMinutes}m</td>
                    <td className="py-3.5 px-5">
                      {isClockedIn ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>{formatRunningDuration(t, currentTimeMs)}</span>
                          <span className="text-[9px] text-emerald-600 font-sans font-bold">LIVE</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono font-black text-slate-900 text-sm block">
                            {formatCompletedDuration(t)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({t.totalHours >= 1 ? `${t.totalHours.toFixed(1)}h` : `${(t.totalHours * 60).toFixed(0)}m`})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-orange-600">
                      {t.overtimeHours > 0 ? `+${t.overtimeHours}h` : '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        t.status === 'CLOCKED_IN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        t.status === 'MANUALLY_ADJUSTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {t.status === 'MANUALLY_ADJUSTED' ? 'Admin Verified' : t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* 2. Integrated Approved Leaves */}
              {staffLeaves.map(l => (
                <tr key={l.id} className="bg-indigo-50/30 hover:bg-indigo-50/60 transition border-l-4 border-indigo-500">
                  <td className="py-3.5 px-5 font-bold text-indigo-950">
                    <div>{l.startDate} – {l.endDate}</div>
                    <span className="text-[10px] text-indigo-600 font-bold">Approved Leave</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-indigo-900 block">
                      <span>{l.leaveType} LEAVE</span>
                    </span>
                    <span className="text-[10px] text-indigo-700">{l.reason}</span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-indigo-400">—</td>
                  <td className="py-3.5 px-5 font-mono text-indigo-400">—</td>
                  <td className="py-3.5 px-5 text-indigo-400">—</td>
                  <td className="py-3.5 px-5 font-black text-indigo-950">{l.totalDays * 7.6}h ({l.totalDays}d)</td>
                  <td className="py-3.5 px-5 text-indigo-400">—</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Approved Leave
                    </span>
                  </td>
                </tr>
              ))}

              {staffTimecards.length === 0 && staffLeaves.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-600">No punch records found for this period</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Clock in at the plant entrance using your 4-Digit PIN: <strong>{currentStaff.kioskPin || '4829'}</strong></p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions & Fair Work Compliance Note */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-950 flex items-start gap-3">
        <div className="space-y-1">
          <h4 className="font-black text-xs text-blue-900">Fair Work Australia Automated Attendance Record</h4>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            All hours recorded here reflect your biometric/electronic punches via the HsCreations Sydney Kiosk. Under Fair Work regulations, timesheets cannot be altered directly by staff. If you forgot to clock in/out or need shift adjustments, notify your SuperAdmin or HR Lead.
          </p>
        </div>
      </div>

      {/* 4-Digit PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">Change 4-Digit Kiosk PIN</h3>
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
                <p className="text-[10px] text-slate-400 mt-0.5">Use your 4-digit PIN at the login page Kiosk to punch shifts.</p>
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
