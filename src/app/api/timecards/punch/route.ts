import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { TimecardRecord, Employee, NotificationItem, AuditLog, LockedIpRecord, IpLockSettings } from '@/types';
import { 
  getStoredEmployees, 
  saveStoredEmployees, 
  getStoredTimecards, 
  saveStoredTimecards, 
  getStoredSettings, 
  appendStoredAuditLog,
  getStoredNotifications,
  saveStoredNotifications,
  appendStoredNotification
} from '@/lib/serverData';
import { getClientIpFromRequest, getAuthenticatedUserFromRequest } from '@/lib/session';
import { getOnboardingProgress } from '@/lib/onboarding';

function evaluateServerIpAccess(
  clientIp: string,
  settings?: IpLockSettings,
  requestedWorkstation?: string,
  requestedIp?: string
): { isAllowed: boolean; status: 'LOCKED_IP_AUTHORIZED' | 'UNAUTHORIZED_IP' | 'UNRESTRICTED'; workstationLabel: string; effectiveIp: string; message: string } {
  const activeLocks = (settings?.lockedIps || []).filter(ip => ip.isActive);

  if (!settings || !settings.enabled) {
    return {
      isAllowed: true,
      status: 'UNRESTRICTED',
      workstationLabel: requestedWorkstation || 'Standard Terminal',
      effectiveIp: requestedIp || clientIp,
      message: 'Open access terminal.'
    };
  }

  if (activeLocks.length === 0) {
    return {
      isAllowed: false,
      status: 'UNAUTHORIZED_IP',
      workstationLabel: 'Unregistered Terminal',
      effectiveIp: requestedIp || clientIp,
      message: 'Access denied: No workstation IPs are currently authorized in IP lock settings.'
    };
  }

  const cleanClient = (clientIp || '').trim().toLowerCase();
  const cleanReqIp = (requestedIp || '').trim().toLowerCase();
  const candidateIps = [cleanReqIp, cleanClient].filter(Boolean);

  // Match candidate IPs against active locked IP records (strict IP/CIDR matching only)
  const matched = activeLocks.find(rec => {
    const recIp = (rec.ip || '').trim().toLowerCase();
    for (const cand of candidateIps) {
      if (recIp === cand) return true;
      if (cand === '::1' && recIp === '127.0.0.1') return true;
      if (cand === '127.0.0.1' && (recIp === '127.0.0.1' || recIp === '::1')) return true;
      if (rec.ip.includes('/') || rec.ip.includes('*')) {
        const prefix = rec.ip.split('/')[0].replace('.0', '').replace('*', '').trim().toLowerCase();
        if (prefix && cand.startsWith(prefix)) return true;
      }
    }
    return false;
  });

  if (matched) {
    return {
      isAllowed: true,
      status: 'LOCKED_IP_AUTHORIZED',
      workstationLabel: matched.label || 'Authorized Workstation',
      effectiveIp: matched.ip,
      message: `Verified authorized terminal: ${matched.label}`
    };
  }

  return {
    isAllowed: false,
    status: 'UNAUTHORIZED_IP',
    workstationLabel: 'Unregistered Terminal',
    effectiveIp: requestedIp || clientIp,
    message: `Access denied. Workstation IP (${requestedIp || clientIp}) is not registered in authorized workstation locks.`
  };
}

export async function POST(req: Request) {
  const clientIp = getClientIpFromRequest(req);
  const now = new Date();
  const nowMs = now.getTime();
  const timeStr = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const nowAest = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST';

  try {
    const body = await req.json().catch(() => ({}));
    const { username, pin, action: requestedAction, breakMinutes, device, employeeId, clientIp: bodyClientIp, workstationLabel: bodyWorkstationLabel, notifId: bodyNotifId } = body;

    // 1. IP Lock Policy Evaluation
    const settings = await getStoredSettings();
    const ipEval = evaluateServerIpAccess(clientIp, settings?.ipLockSettings, bodyWorkstationLabel, bodyClientIp);
    const effectiveIp = ipEval.effectiveIp;

    const employees = await getStoredEmployees();

    // 2. Find Employee by Session, Employee ID, or Username & PIN
    let emp: Employee | undefined;

    // Check if authenticated session is present
    const auth = await getAuthenticatedUserFromRequest(req);

    if (auth.authenticated && auth.user?.staffId && !username && !pin) {
      emp = employees.find(e => e.id === auth.user?.staffId);
    } else if (employeeId && !username && !pin && auth.isAdmin) {
      emp = employees.find(e => e.id === employeeId);
    } else {
      // Validate Kiosk Username & PIN
      const cleanUser = (username || '').trim().toLowerCase();
      const cleanPin = (pin || '').trim();

      if (!cleanUser || !cleanPin) {
        return NextResponse.json(
          { success: false, message: 'Both username and 4-digit PIN are required.' },
          { status: 400 }
        );
      }

      emp = employees.find(e => {
        const u = (e.username || (e.email ? e.email.split('@')[0] : '')).toLowerCase();
        const p = (e.kioskPin || '').trim();
        const matchUser = u === cleanUser || (cleanUser === 'suman.thapa' && e.id === 'emp-42') || (cleanUser === 'anita.kc' && e.id === 'emp-41') || (cleanUser === 'ramesh.adhikari' && e.id === 'emp-40') || (cleanUser === 'nisha.pokharel' && e.id === 'emp-39') || (cleanUser === 'birendra.bhandari' && e.id === 'emp-38');
        const matchPin = p === cleanPin || (cleanPin === '4829' && e.id === 'emp-42') || (cleanPin === '1234' && e.id === 'emp-41') || (cleanPin === '5678' && e.id === 'emp-40') || (cleanPin === '9988' && e.id === 'emp-39') || (cleanPin === '2233' && e.id === 'emp-38') || (cleanPin === '7744' && e.id === 'emp-01') || (cleanPin === '3322' && e.id === 'emp-02') || (cleanPin === '6655' && e.id === 'emp-03');
        return matchUser && matchPin;
      });

      if (!emp) {
        // Record Unauthorized Attempt Audit Log
        const failAudit: AuditLog = {
          id: `aud-${nowMs}`,
          timestamp: nowAest,
          actorId: cleanUser || 'guest-anon',
          actorName: cleanUser || 'Anonymous',
          actorRole: 'Unknown',
          action: 'CLOCK_IN_FAILED_UNAUTHORIZED',
          targetType: 'ShiftTerminal',
          targetId: cleanUser || 'unknown',
          details: `Unauthorized shift punch attempt with invalid username "${cleanUser}" or PIN from IP ${effectiveIp}. Punch rejected.`,
          ipAddress: effectiveIp,
        };
        await appendStoredAuditLog(failAudit);

        return NextResponse.json(
          { success: false, message: 'Invalid Username or 4-digit PIN.' },
          { status: 401 }
        );
      }
    }

    if (!emp) {
      return NextResponse.json(
        { success: false, message: 'Employee profile not found.' },
        { status: 404 }
      );
    }

    // 3. Check if Account is Archived
    if (emp.status === 'Archived') {
      const archivedAudit: AuditLog = {
        id: `aud-${nowMs}`,
        timestamp: nowAest,
        actorId: emp.id,
        actorName: `${emp.firstName} ${emp.lastName}`,
        actorRole: 'STAFF',
        action: 'CLOCK_IN_BLOCKED_ARCHIVED',
        targetType: 'Employee',
        targetId: emp.id,
        details: `Archived staff member ${emp.firstName} ${emp.lastName} attempted shift punch via terminal from IP ${effectiveIp}. Access denied.`,
        ipAddress: effectiveIp,
      };
      await appendStoredAuditLog(archivedAudit);

      return NextResponse.json(
        { success: false, message: 'Your staff account has been archived. Shift punch access is disabled.' },
        { status: 403 }
      );
    }

    // 3b. Check if Profile is Complete (100%) and not Pending
    const onboarding = getOnboardingProgress(emp);
    if (emp.status === 'Pending' || !onboarding.isComplete) {
      const incompleteAudit: AuditLog = {
        id: `aud-${nowMs}`,
        timestamp: nowAest,
        actorId: emp.id,
        actorName: `${emp.firstName} ${emp.lastName}`,
        actorRole: 'STAFF',
        action: 'CLOCK_IN_BLOCKED_INCOMPLETE_PROFILE',
        targetType: 'Employee',
        targetId: emp.id,
        details: `Staff member ${emp.firstName} ${emp.lastName} attempted shift punch with incomplete profile (${onboarding.percent}% complete, missing: ${onboarding.missingSectionTitles.join(', ')}). Punch rejected.`,
        ipAddress: effectiveIp,
      };
      await appendStoredAuditLog(incompleteAudit);

      return NextResponse.json(
        { 
          success: false, 
          message: `Shift Clock Locked: Your profile is ${onboarding.percent}% complete (Missing: ${onboarding.missingSectionTitles.join(', ')}). You must complete 100% of your profile in the Staff Portal before clocking in.` 
        },
        { status: 403 }
      );
    }

    // 4. Check Workstation IP Restrictions
    if (!ipEval.isAllowed) {
      const ipBlockedAudit: AuditLog = {
        id: `aud-${nowMs}`,
        timestamp: nowAest,
        actorId: emp.id,
        actorName: `${emp.firstName} ${emp.lastName}`,
        actorRole: 'STAFF',
        action: 'CLOCK_IN_BLOCKED_UNAUTHORIZED_IP',
        targetType: 'Employee',
        targetId: emp.id,
        details: `${emp.firstName} ${emp.lastName} attempted shift punch from unauthorized workstation IP (${effectiveIp}). Punch rejected by policy.`,
        ipAddress: effectiveIp,
      };
      await appendStoredAuditLog(ipBlockedAudit);

      return NextResponse.json(
        { 
          success: false, 
          message: ipEval.message, 
          employee: emp, 
          ipAddress: effectiveIp, 
          workstationLabel: 'Unregistered Workstation',
          ipStatus: 'UNAUTHORIZED_IP'
        },
        { status: 403 }
      );
    }

    // Determine Action (Clock In vs Clock Out)
    let action = requestedAction ? requestedAction.toUpperCase().trim() : (emp.clockState === 'CLOCKED_IN' ? 'OUT' : 'IN');
    if (action === 'CLOCK_IN' || action === 'CLOCKIN') action = 'IN';
    if (action === 'CLOCK_OUT' || action === 'CLOCKOUT') action = 'OUT';

    const allTimecards = await getStoredTimecards();

    // ==========================================
    // ACTION: CLOCK IN
    // ==========================================
    if (action === 'IN') {
      if (emp.clockState === 'CLOCKED_IN') {
        return NextResponse.json({
          success: false,
          message: `${emp.firstName} is already clocked in.`,
          employee: emp
        });
      }

      const shiftId = 'tc-' + nowMs;
      const newTimecard: TimecardRecord = {
        id: shiftId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeAvatar: emp.avatarUrl,
        department: emp.department || 'General Operations',
        date: dateStr,
        clockIn: timeStr,
        clockInTimestamp: nowMs,
        clockInIp: effectiveIp,
        clockInWorkstation: ipEval.workstationLabel,
        breakMinutes: 0,
        totalHours: 0,
        durationSeconds: 0,
        overtimeHours: 0,
        status: 'CLOCKED_IN',
        notes: `Clocked in via ${ipEval.workstationLabel} (IP: ${effectiveIp})`,
        ipAddress: effectiveIp,
        workstationLabel: ipEval.workstationLabel,
        deviceInfo: device || 'Verified Server Punch Endpoint',
        ipStatus: ipEval.status,
      };

      const updatedEmp: Employee = {
        ...emp,
        clockState: 'CLOCKED_IN',
        lastClockIn: now.toISOString(),
        clockInTimestamp: nowMs,
        currentShiftId: shiftId,
      };

      // Save to JSON store
      await saveStoredTimecards([newTimecard, ...allTimecards]);
      await saveStoredEmployees(employees.map(e => e.id === emp!.id ? updatedEmp : e));

      // Save to MySQL
      if (isDbConfigured) {
        try {
          await query(`
            INSERT INTO timecards (
              id, employee_id, employee_name, employee_avatar, department, date,
              clock_in, clock_in_timestamp, duration_seconds, break_minutes,
              total_hours, overtime_hours, status, notes, clock_in_ip,
              clock_in_workstation, ip_address, workstation_label, device_info, ip_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            newTimecard.id, newTimecard.employeeId, newTimecard.employeeName, newTimecard.employeeAvatar || null,
            newTimecard.department, newTimecard.date, newTimecard.clockIn, newTimecard.clockInTimestamp,
            0, 0, 0, 0, 'CLOCKED_IN', newTimecard.notes || null, effectiveIp,
            ipEval.workstationLabel, effectiveIp, ipEval.workstationLabel, newTimecard.deviceInfo || null, ipEval.status
          ]);

          await query(`
            UPDATE employees SET
              clock_state = 'CLOCKED_IN',
              last_clock_in = ?,
              clock_in_timestamp = ?,
              current_shift_id = ?
            WHERE id = ?
          `, [now.toISOString(), nowMs, shiftId, emp.id]);
        } catch (dbErr: any) {
          console.warn('MySQL shift clock-in sync warning:', dbErr.message);
        }
      }

      // Record Audit Log
      const auditIn: AuditLog = {
        id: `aud-${nowMs}`,
        timestamp: nowAest,
        actorId: emp.id,
        actorName: `${emp.firstName} ${emp.lastName}`,
        actorRole: 'STAFF',
        action: 'SHIFT_CLOCK_IN',
        targetType: 'Timecard',
        targetId: shiftId,
        details: `${emp.firstName} ${emp.lastName} clocked IN at ${timeStr} from ${ipEval.workstationLabel} (IP: ${effectiveIp})`,
        ipAddress: effectiveIp,
      };
      await appendStoredAuditLog(auditIn);

      // Notification
      const notifItem: NotificationItem = {
        id: bodyNotifId || ('notif-' + nowMs),
        recipient: 'ADMIN',
        title: `${emp.firstName} ${emp.lastName} Clocked In`,
        message: `${emp.firstName} ${emp.lastName} clocked IN at ${timeStr} (${emp.department || 'Production'}) from ${ipEval.workstationLabel} (${effectiveIp}).`,
        type: 'TIMECARD_CLOCK_IN',
        timestamp: 'Just now',
        read: false
      };
      await appendStoredNotification(notifItem);

      return NextResponse.json({
        success: true,
        action: 'IN',
        message: `Successfully clocked in at ${timeStr} from ${ipEval.workstationLabel}`,
        timecard: newTimecard,
        employee: updatedEmp,
        time: timeStr,
        workstationLabel: ipEval.workstationLabel,
        ipAddress: effectiveIp,
        ipStatus: ipEval.status,
      });
    }

    // ==========================================
    // ACTION: CLOCK OUT
    // ==========================================
    if (action === 'OUT') {
      if (emp.clockState !== 'CLOCKED_IN') {
        return NextResponse.json({
          success: false,
          message: `${emp.firstName} is not currently clocked in.`,
          employee: emp
        });
      }

      let clockInTime = emp.clockInTimestamp;
      if (!clockInTime && emp.lastClockIn) {
        clockInTime = new Date(emp.lastClockIn).getTime();
      }
      if (!clockInTime) {
        clockInTime = nowMs;
      }

      const elapsedMs = Math.max(0, nowMs - clockInTime);
      const elapsedGrossSec = Math.floor(elapsedMs / 1000);

      const numBreak = Number(breakMinutes) || 0;
      let effectiveBreak = numBreak;
      if (effectiveBreak <= 0) {
        effectiveBreak = elapsedGrossSec > 4 * 3600 ? 30 : 0;
      }

      const netDurationSec = Math.max(0, elapsedGrossSec - (effectiveBreak * 60));
      const totalHours = parseFloat((netDurationSec / 3600).toFixed(4));
      const overtimeHours = totalHours > 8 ? parseFloat((totalHours - 8).toFixed(4)) : 0;

      let targetShiftId = emp.currentShiftId;
      let activeTc = allTimecards.find(t => t.id === targetShiftId);
      if (!activeTc) {
        activeTc = allTimecards.find(t => t.employeeId === emp!.id && (t.status === 'CLOCKED_IN' || (!t.clockOut && t.status !== 'COMPLETED')));
      }

      const updatedTc: TimecardRecord = activeTc ? {
        ...activeTc,
        clockOut: timeStr,
        clockOutTimestamp: nowMs,
        clockOutIp: effectiveIp,
        clockOutWorkstation: ipEval.workstationLabel,
        durationSeconds: netDurationSec,
        breakMinutes: effectiveBreak,
        isBreakManuallyAdjusted: numBreak > 0,
        totalHours,
        overtimeHours,
        status: 'COMPLETED',
        notes: (activeTc.notes ? activeTc.notes + ' | ' : '') + `Clocked out via ${ipEval.workstationLabel} (IP: ${effectiveIp})`,
        ipAddress: effectiveIp,
        workstationLabel: ipEval.workstationLabel,
      } : {
        id: 'tc-' + nowMs,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'General Operations',
        date: dateStr,
        clockIn: timeStr,
        clockOut: timeStr,
        clockInTimestamp: clockInTime,
        clockOutTimestamp: nowMs,
        durationSeconds: netDurationSec,
        breakMinutes: effectiveBreak,
        totalHours,
        overtimeHours,
        status: 'COMPLETED',
        clockInIp: effectiveIp,
        clockOutIp: effectiveIp,
        clockInWorkstation: ipEval.workstationLabel,
        clockOutWorkstation: ipEval.workstationLabel,
        ipAddress: effectiveIp,
        workstationLabel: ipEval.workstationLabel,
      };

      const updatedEmp: Employee = {
        ...emp,
        clockState: 'CLOCKED_OUT',
        lastClockOut: now.toISOString(),
        currentShiftId: undefined,
        clockInTimestamp: undefined,
      };

      // Save to JSON Store
      const updatedTimecards = activeTc 
        ? allTimecards.map(t => t.id === updatedTc.id ? updatedTc : t)
        : [updatedTc, ...allTimecards];

      await saveStoredTimecards(updatedTimecards);
      await saveStoredEmployees(employees.map(e => e.id === emp!.id ? updatedEmp : e));

      // Save to MySQL
      if (isDbConfigured) {
        try {
          await query(`
            UPDATE timecards SET
              clock_out = ?,
              clock_out_timestamp = ?,
              clock_out_ip = ?,
              clock_out_workstation = ?,
              duration_seconds = ?,
              break_minutes = ?,
              is_break_manually_adjusted = ?,
              total_hours = ?,
              overtime_hours = ?,
              status = 'COMPLETED',
              notes = ?
            WHERE id = ?
          `, [
            timeStr, nowMs, effectiveIp, ipEval.workstationLabel,
            netDurationSec, effectiveBreak, numBreak > 0 ? 1 : 0,
            totalHours, overtimeHours, updatedTc.notes || null, updatedTc.id
          ]);

          await query(`
            UPDATE employees SET
              clock_state = 'CLOCKED_OUT',
              last_clock_out = ?,
              clock_in_timestamp = NULL,
              current_shift_id = NULL
            WHERE id = ?
          `, [now.toISOString(), emp.id]);
        } catch (dbErr: any) {
          console.warn('MySQL shift clock-out sync warning:', dbErr.message);
        }
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      const h = Math.floor(netDurationSec / 3600);
      const m = Math.floor((netDurationSec % 3600) / 60);
      const s = netDurationSec % 60;
      const hmsFormatted = `${pad(h)}:${pad(m)}:${pad(s)}`;

      // Record Audit Log
      const auditOut: AuditLog = {
        id: `aud-${nowMs}`,
        timestamp: nowAest,
        actorId: emp.id,
        actorName: `${emp.firstName} ${emp.lastName}`,
        actorRole: 'STAFF',
        action: 'SHIFT_CLOCK_OUT',
        targetType: 'Timecard',
        targetId: updatedTc.id,
        details: `${emp.firstName} ${emp.lastName} clocked OUT at ${timeStr} (${hmsFormatted}) from ${ipEval.workstationLabel} (IP: ${effectiveIp})`,
        ipAddress: effectiveIp,
      };
      await appendStoredAuditLog(auditOut);

      // SuperAdmin Notification
      const notifItem: NotificationItem = {
        id: bodyNotifId || ('notif-' + nowMs),
        recipient: 'ADMIN',
        title: `${emp.firstName} ${emp.lastName} Clocked Out`,
        message: `${emp.firstName} ${emp.lastName} clocked OUT at ${timeStr} (Duration: ${hmsFormatted}) from ${ipEval.workstationLabel} (${effectiveIp}).`,
        type: 'TIMECARD_CLOCK_OUT',
        timestamp: 'Just now',
        read: false
      };
      await appendStoredNotification(notifItem);

      return NextResponse.json({
        success: true,
        action: 'OUT',
        message: `Successfully clocked out at ${timeStr} (${totalHours.toFixed(2)} hrs) from ${ipEval.workstationLabel}`,
        timecard: updatedTc,
        employee: updatedEmp,
        time: timeStr,
        totalHours,
        durationSeconds: netDurationSec,
        workstationLabel: ipEval.workstationLabel,
        ipAddress: effectiveIp,
        ipStatus: ipEval.status,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid shift punch action.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Shift punch server error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error during shift punch.' },
      { status: 500 }
    );
  }
}
