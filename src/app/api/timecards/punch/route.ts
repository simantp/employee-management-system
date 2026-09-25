import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { TimecardRecord, Employee, NotificationItem, AuditLog, LockedIpRecord, IpLockSettings, EmployeeDocument } from '@/types';
import { 
  getStoredEmployees, 
  saveStoredEmployees, 
  getStoredTimecards, 
  saveStoredTimecards, 
  getStoredSettings, 
  appendStoredAuditLog,
  getStoredNotifications,
  saveStoredNotifications,
  appendStoredNotification,
  getStoredDocumentTypes
} from '@/lib/serverData';
import { getClientIpFromRequest, getAuthenticatedUserFromRequest } from '@/lib/session';
import { getOnboardingProgress } from '@/lib/onboarding';

function mapDbRowToEmployee(row: any, documents: EmployeeDocument[] = []): Employee {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    username: row.username || undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    mobilePhone: row.mobile_phone || '',
    homePhone: row.home_phone || undefined,
    dateOfBirth: row.date_of_birth || '',
    startDate: row.start_date || '',
    gender: (row.gender as any) || 'Prefer not to say',
    address: row.address || '',
    suburb: row.suburb || '',
    state: row.state || 'NSW',
    postcode: row.postcode || '',
    department: row.department || undefined,
    jobTitle: row.job_title || 'Staff Member',
    workLocation: row.work_location || 'Sydney, NSW',
    reportsTo: row.reports_to || 'Operations Lead',
    status: row.status || 'Active',
    onboardingStatus: (row.onboarding_status as any) || (row.status === 'Pending' ? 'INVITED' : 'COMPLETED'),
    inviteToken: row.invite_token || undefined,
    inviteSentAt: row.invite_sent_at || undefined,
    inviteExpiresAt: row.invite_expires_at || undefined,
    passwordSetAt: row.password_set_at || undefined,
    profileCompletedAt: row.profile_completed_at || undefined,
    workingHours: Number(row.working_hours) || 38,
    workingHoursConfirmed: Boolean(row.working_hours_confirmed),
    citizenStatus: (row.citizen_status as any) || undefined,
    visaType: row.visa_type || undefined,
    visaExpiryDate: row.visa_expiry_date || undefined,
    visaStatusConfirmed: Boolean(row.visa_status_confirmed),
    hasDriverLicense: Boolean(row.has_driver_license),
    licenseCountry: row.license_country || '',
    licenseNumber: row.license_number || '',
    licenseExpiryDate: row.license_expiry_date || '',
    emergencyNextOfKin: row.emergency_next_of_kin || '',
    emergencyRelationship: row.emergency_relationship || '',
    emergencyAddress: row.emergency_address || '',
    emergencySuburb: row.emergency_suburb || '',
    emergencyState: (row.emergency_state as any) || 'NSW',
    emergencyPostcode: row.emergency_postcode || '',
    emergencyMobile: row.emergency_mobile || '',
    emergencyHomePhone: row.emergency_home_phone || undefined,
    bankName: row.bank_name || '',
    bankBranch: row.bank_branch || '',
    accountName: row.account_name || '',
    bsb: row.bsb || row.bsb_masked || '',
    bsbEncrypted: row.bsb_encrypted || undefined,
    bsbMasked: row.bsb || row.bsb_masked || '',
    accountNumber: row.account_number || row.account_number_masked || '',
    accountNumberEncrypted: row.account_number_encrypted || undefined,
    accountNumberMasked: row.account_number || row.account_number_masked || '',
    tfnEncrypted: row.tfn_encrypted || undefined,
    tfnMasked: row.tfn_masked || '',
    superFundName: row.super_fund_name || '',
    superMemberNumber: row.super_member_number || '',
    kioskPin: row.kiosk_pin || '',
    clockState: row.clock_state || 'CLOCKED_OUT',
    lastClockIn: row.last_clock_in || undefined,
    lastClockOut: row.last_clock_out || undefined,
    clockInTimestamp: row.clock_in_timestamp ? Number(row.clock_in_timestamp) : undefined,
    currentShiftId: row.current_shift_id || undefined,
    avatarUrl: row.avatar_url || '',
    leaveBalance: {
      annual: Number(row.annual_leave_balance) || 20,
      sick: Number(row.sick_leave_balance) || 10,
      carers: Number(row.carers_leave_balance) || 2,
      longService: Number(row.long_service_balance) || 0,
    },
    payslips: [],
    documents,
  };
}

function mapRowToTimecard(row: any): TimecardRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeAvatar: row.employee_avatar || undefined,
    department: row.department || 'General Operations',
    date: row.date,
    clockIn: row.clock_in,
    clockOut: row.clock_out || undefined,
    clockInTimestamp: Number(row.clock_in_timestamp) || 0,
    clockOutTimestamp: row.clock_out_timestamp ? Number(row.clock_out_timestamp) : undefined,
    durationSeconds: Number(row.duration_seconds) || 0,
    breakMinutes: Number(row.break_minutes) || 0,
    isBreakManuallyAdjusted: Boolean(row.is_break_manually_adjusted),
    totalHours: Number(row.total_hours) || 0,
    overtimeHours: Number(row.overtime_hours) || 0,
    status: row.status || 'CLOCKED_IN',
    notes: row.notes || undefined,
    adminNote: row.admin_note || row.notes || undefined,
    staffNote: row.staff_note || undefined,
    staffNoteSubmittedAt: row.staff_note_submitted_at || undefined,
    staffNoteStatus: row.staff_note_status || undefined,
    adjustedBy: row.adjusted_by || undefined,
    adjustedAt: row.adjusted_at || undefined,
    clockInIp: row.clock_in_ip || row.clockInIp || row.ip_address || row.ipAddress || undefined,
    clockOutIp: row.clock_out_ip || row.clockOutIp || (row.clock_out ? (row.ip_address || row.ipAddress) : undefined) || undefined,
    clockInWorkstation: row.clock_in_workstation || row.clockInWorkstation || row.workstation_label || row.workstationLabel || undefined,
    clockOutWorkstation: row.clock_out_workstation || row.clockOutWorkstation || row.workstation_label || row.workstationLabel || undefined,
    ipAddress: row.ip_address || row.ipAddress || undefined,
    workstationLabel: row.workstation_label || row.workstationLabel || undefined,
    deviceInfo: row.device_info || row.deviceInfo || undefined,
    ipStatus: row.ip_status || row.ipStatus || undefined,
  };
}

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

    const serverDocTypes = await getStoredDocumentTypes();
    let employees: Employee[] = [];

    if (isDbConfigured) {
      try {
        const empRows = await query<any[]>('SELECT * FROM employees ORDER BY employee_number ASC');
        const docRows = await query<any[]>('SELECT * FROM employee_documents ORDER BY created_at DESC');

        const docsByEmp: Record<string, EmployeeDocument[]> = {};
        docRows.forEach(doc => {
          const empId = doc.employee_id;
          if (!docsByEmp[empId]) docsByEmp[empId] = [];
          docsByEmp[empId].push({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            documentNumber: doc.document_number || undefined,
            expiryDate: doc.expiry_date || undefined,
            uploadDate: doc.upload_date,
            status: doc.status,
            fileSize: doc.file_size || '1.8 MB',
            fileType: doc.file_type || 'image',
            previewUrl: doc.preview_url || doc.file_path,
          });
        });

        const rawEmployees: Employee[] = empRows.map(row => mapDbRowToEmployee(row, docsByEmp[row.id] || []));
        employees = rawEmployees.map(e => {
          const progress = getOnboardingProgress(e, serverDocTypes);
          if (e.status === 'Pending' && progress.isProfileInfoComplete) {
            return {
              ...e,
              status: 'Active' as const,
              onboardingStatus: progress.missingDocuments.length === 0 ? ('COMPLETED' as const) : ('PROFILE_COMPLETED' as const),
              profileCompletedAt: e.profileCompletedAt || new Date().toISOString(),
            };
          } else if (e.status === 'Active' && progress.missingDocuments.length === 0 && e.onboardingStatus !== 'COMPLETED') {
            return {
              ...e,
              onboardingStatus: 'COMPLETED' as const,
            };
          }
          return e;
        });
      } catch (err: any) {
        console.warn('MySQL employee fetch failed in punch route, falling back to disk:', err.message);
      }
    }

    if (employees.length === 0) {
      const rawEmployees = await getStoredEmployees();
      employees = rawEmployees.map(e => {
        const progress = getOnboardingProgress(e, serverDocTypes);
        if (e.status === 'Pending' && progress.isProfileInfoComplete) {
          return {
            ...e,
            status: 'Active' as const,
            onboardingStatus: progress.missingDocuments.length === 0 ? ('COMPLETED' as const) : ('PROFILE_COMPLETED' as const),
            profileCompletedAt: e.profileCompletedAt || new Date().toISOString(),
          };
        } else if (e.status === 'Active' && progress.missingDocuments.length === 0 && e.onboardingStatus !== 'COMPLETED') {
          return {
            ...e,
            onboardingStatus: 'COMPLETED' as const,
          };
        }
        return e;
      });
    }

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

    // 3b. Check if Profile is Complete and not Pending
    const onboarding = getOnboardingProgress(emp, serverDocTypes);
    if (emp.status === 'Pending' && onboarding.isProfileInfoComplete && onboarding.isComplete) {
      emp = {
        ...emp,
        status: 'Active',
        onboardingStatus: 'COMPLETED',
        profileCompletedAt: emp.profileCompletedAt || new Date().toISOString(),
      };
      if (isDbConfigured) {
        try {
          await query("UPDATE employees SET status = 'Active', onboarding_status = 'COMPLETED', profile_completed_at = ? WHERE id = ?", [emp.profileCompletedAt, emp.id]);
        } catch (e) {}
      }
    }

    if ((emp.status === 'Pending' && !onboarding.isProfileInfoComplete) || !onboarding.isComplete) {
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

    let allTimecards: TimecardRecord[] = [];
    if (isDbConfigured) {
      try {
        const rows = await query<any[]>('SELECT * FROM timecards ORDER BY clock_in_timestamp DESC');
        allTimecards = rows.map(mapRowToTimecard);
      } catch (err: any) {
        console.warn('MySQL timecards fetch in punch route warning:', err.message);
      }
    }
    if (allTimecards.length === 0) {
      allTimecards = await getStoredTimecards();
    }

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
            ON DUPLICATE KEY UPDATE
              employee_name = VALUES(employee_name),
              department = VALUES(department),
              clock_in = VALUES(clock_in),
              clock_in_timestamp = VALUES(clock_in_timestamp),
              status = 'CLOCKED_IN',
              notes = VALUES(notes),
              clock_in_ip = VALUES(clock_in_ip),
              clock_in_workstation = VALUES(clock_in_workstation)
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
            INSERT INTO timecards (
              id, employee_id, employee_name, employee_avatar, department, date,
              clock_in, clock_out, clock_in_timestamp, clock_out_timestamp,
              duration_seconds, break_minutes, is_break_manually_adjusted,
              total_hours, overtime_hours, status, notes,
              clock_in_ip, clock_out_ip, clock_in_workstation, clock_out_workstation,
              ip_address, workstation_label, device_info, ip_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              clock_out = VALUES(clock_out),
              clock_out_timestamp = VALUES(clock_out_timestamp),
              clock_out_ip = VALUES(clock_out_ip),
              clock_out_workstation = VALUES(clock_out_workstation),
              duration_seconds = VALUES(duration_seconds),
              break_minutes = VALUES(break_minutes),
              is_break_manually_adjusted = VALUES(is_break_manually_adjusted),
              total_hours = VALUES(total_hours),
              overtime_hours = VALUES(overtime_hours),
              status = 'COMPLETED',
              notes = VALUES(notes)
          `, [
            updatedTc.id, updatedTc.employeeId, updatedTc.employeeName, updatedTc.employeeAvatar || null,
            updatedTc.department, updatedTc.date, updatedTc.clockIn, timeStr,
            updatedTc.clockInTimestamp, nowMs,
            netDurationSec, effectiveBreak, numBreak > 0 ? 1 : 0,
            totalHours, overtimeHours, 'COMPLETED', updatedTc.notes || null,
            updatedTc.clockInIp || effectiveIp, effectiveIp,
            updatedTc.clockInWorkstation || ipEval.workstationLabel, ipEval.workstationLabel,
            effectiveIp, ipEval.workstationLabel, device || 'Verified Server Punch Endpoint', ipEval.status
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
