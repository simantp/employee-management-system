import { NextResponse } from 'next/server';
import { 
  getStoredEmployees, 
  saveStoredEmployees, 
  getStoredUsers, 
  saveStoredUsers, 
  appendStoredAuditLog 
} from '@/lib/serverData';
import { query, isDbConfigured } from '@/lib/db';
import { hashPassword, sanitizeUser } from '@/lib/passwordSecurity';
import { createSession, createSessionCookie, getClientIpFromRequest } from '@/lib/session';
import { Employee, AuthUser, AuditLog } from '@/types';

function checkTokenExpired(emp: Employee): boolean {
  if (emp.inviteExpiresAt) {
    return Date.now() > new Date(emp.inviteExpiresAt).getTime();
  }
  if (emp.inviteSentAt) {
    return Date.now() - new Date(emp.inviteSentAt).getTime() > 60 * 60 * 1000;
  }
  if (emp.inviteToken && emp.inviteToken.startsWith('inv-')) {
    const parts = emp.inviteToken.split('-');
    const timestamp = parseInt(parts[1], 10);
    if (!isNaN(timestamp) && timestamp > 1000000000000) {
      return Date.now() - timestamp > 60 * 60 * 1000;
    }
  }
  return false;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = (searchParams.get('token') || searchParams.get('invite') || '').trim();
    const rawEmail = (searchParams.get('email') || '').trim().toLowerCase();

    let cleanToken = rawToken;
    if (cleanToken.includes('invite=')) {
      const match = cleanToken.match(/invite=([^&]+)/);
      if (match) cleanToken = match[1];
    }

    if (!cleanToken && !rawEmail) {
      return NextResponse.json(
        { success: false, message: 'Invitation token or email is required.' },
        { status: 400 }
      );
    }

    let employees = await getStoredEmployees();
    if (isDbConfigured) {
      try {
        const rows = await query<any[]>('SELECT * FROM employees');
        if (Array.isArray(rows) && rows.length > 0) {
          const empMap = new Map<string, Employee>();
          employees.forEach(e => empMap.set(e.id, e));
          rows.forEach(r => {
            const existing = empMap.get(r.id) || ({} as any);
            empMap.set(r.id, {
              ...existing,
              id: r.id,
              employeeNumber: r.employee_number || existing.employeeNumber,
              username: r.username || existing.username,
              firstName: r.first_name || existing.firstName,
              lastName: r.last_name || existing.lastName,
              email: r.email || existing.email,
              mobilePhone: r.mobile_phone || existing.mobilePhone,
              status: r.status || existing.status,
              onboardingStatus: r.onboarding_status || existing.onboardingStatus,
              inviteToken: r.invite_token || existing.inviteToken,
              inviteSentAt: r.invite_sent_at || existing.inviteSentAt,
              inviteExpiresAt: r.invite_expires_at || existing.inviteExpiresAt,
              passwordSetAt: r.password_set_at || existing.passwordSetAt,
              department: r.department || existing.department,
              jobTitle: r.job_title || existing.jobTitle,
              kioskPin: r.kiosk_pin || existing.kioskPin,
            });
          });
          employees = Array.from(empMap.values());
        }
      } catch (err: any) {
        console.warn('MySQL employee fetch in activate-invite GET warning:', err.message);
      }
    }

    const cleanTokenLower = cleanToken.toLowerCase();
    const match = employees.find(e => 
      (cleanToken && e.inviteToken && (
        e.inviteToken.toLowerCase() === cleanTokenLower ||
        cleanTokenLower.includes(e.inviteToken.toLowerCase()) ||
        e.inviteToken.toLowerCase().includes(cleanTokenLower)
      )) ||
      (cleanToken && e.id.toLowerCase() === cleanTokenLower) ||
      (rawEmail && e.email.toLowerCase() === rawEmail)
    );

    if (!match) {
      return NextResponse.json(
        { success: false, message: 'Could not find an employee invitation matching this link.' },
        { status: 404 }
      );
    }

    if (match.status === 'Archived') {
      return NextResponse.json(
        { success: false, message: 'This staff record has been archived by administration.' },
        { status: 403 }
      );
    }

    const isExpired = checkTokenExpired(match);

    return NextResponse.json({
      success: true,
      expired: isExpired,
      employee: {
        id: match.id,
        firstName: match.firstName,
        lastName: match.lastName,
        email: match.email,
        department: match.department || 'Production',
        jobTitle: match.jobTitle || 'Staff Member',
        username: match.username || `${match.firstName}.${match.lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
        kioskPin: match.kioskPin || '4829',
        status: match.status,
        onboardingStatus: match.onboardingStatus,
      }
    });
  } catch (err: any) {
    console.error('API /api/auth/activate-invite GET error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const clientIp = getClientIpFromRequest(req);
  const nowAest = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST';

  try {
    const body = await req.json();
    const { token, email, password, username, kioskPin } = body;

    let cleanToken = (token || '').trim();
    if (cleanToken.includes('invite=')) {
      const match = cleanToken.match(/invite=([^&]+)/);
      if (match) cleanToken = match[1];
    }
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    let employees = await getStoredEmployees();
    if (isDbConfigured) {
      try {
        const rows = await query<any[]>('SELECT * FROM employees');
        if (Array.isArray(rows) && rows.length > 0) {
          const empMap = new Map<string, Employee>();
          employees.forEach(e => empMap.set(e.id, e));
          rows.forEach(r => {
            const existing = empMap.get(r.id) || ({} as any);
            empMap.set(r.id, {
              ...existing,
              id: r.id,
              employeeNumber: r.employee_number || existing.employeeNumber,
              username: r.username || existing.username,
              firstName: r.first_name || existing.firstName,
              lastName: r.last_name || existing.lastName,
              email: r.email || existing.email,
              mobilePhone: r.mobile_phone || existing.mobilePhone,
              status: r.status || existing.status,
              onboardingStatus: r.onboarding_status || existing.onboardingStatus,
              inviteToken: r.invite_token || existing.inviteToken,
              inviteSentAt: r.invite_sent_at || existing.inviteSentAt,
              inviteExpiresAt: r.invite_expires_at || existing.inviteExpiresAt,
              passwordSetAt: r.password_set_at || existing.passwordSetAt,
              department: r.department || existing.department,
              jobTitle: r.job_title || existing.jobTitle,
              kioskPin: r.kiosk_pin || existing.kioskPin,
            });
          });
          employees = Array.from(empMap.values());
        }
      } catch (err: any) {
        console.warn('MySQL employee fetch in activate-invite POST warning:', err.message);
      }
    }

    const cleanTokenLower = cleanToken.toLowerCase();
    const match = employees.find(e => 
      (cleanToken && e.inviteToken && (
        e.inviteToken.toLowerCase() === cleanTokenLower ||
        cleanTokenLower.includes(e.inviteToken.toLowerCase()) ||
        e.inviteToken.toLowerCase().includes(cleanTokenLower)
      )) ||
      (cleanToken && e.id.toLowerCase() === cleanTokenLower) ||
      (cleanEmail && e.email.toLowerCase() === cleanEmail)
    );

    if (!match) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired invitation token.' },
        { status: 404 }
      );
    }

    if (match.status === 'Archived') {
      return NextResponse.json(
        { success: false, message: 'This staff record has been archived by administration.' },
        { status: 403 }
      );
    }

    const isExpired = checkTokenExpired(match);
    if (isExpired) {
      return NextResponse.json(
        { success: false, expired: true, message: 'This invitation link has expired (1-hour validity). Please ask your manager to resend.' },
        { status: 400 }
      );
    }

    const finalUsername = (username || '').trim().toLowerCase() || match.username || `${match.firstName}.${match.lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const finalPin = (kioskPin || '').trim() || match.kioskPin || '4829';
    const passwordHash = await hashPassword(password);

    // 1. Update Employee Record
    const updatedEmployee: Employee = {
      ...match,
      username: finalUsername,
      kioskPin: finalPin,
      onboardingStatus: 'PASSWORD_SET',
      passwordSetAt: new Date().toISOString(),
    };

    const updatedEmployees = employees.map(e => e.id === match.id ? updatedEmployee : e);
    await saveStoredEmployees(updatedEmployees);

    if (isDbConfigured) {
      try {
        await query(
          'UPDATE employees SET username = ?, kiosk_pin = ?, onboarding_status = ?, password_set_at = ? WHERE id = ?',
          [finalUsername, finalPin, 'PASSWORD_SET', updatedEmployee.passwordSetAt, match.id]
        );
      } catch (err: any) {
        console.warn('MySQL employee activation update skipped:', err.message);
      }
    }

    // 2. Create or Update AuthUser Record
    const users = await getStoredUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === match.email.toLowerCase() || u.id === 'usr-' + match.id);

    const authUser: AuthUser = {
      id: existingUser?.id || `usr-${match.id}`,
      name: `${match.firstName} ${match.lastName}`,
      username: finalUsername,
      email: match.email.toLowerCase(),
      passwordHash,
      role: 'STAFF',
      isEmailVerified: true,
      staffId: match.id,
      department: (match.department as any) || 'Production (Riverwood)',
      avatarUrl: match.avatarUrl,
      createdAt: match.startDate || new Date().toLocaleDateString('en-AU'),
    };

    const updatedUsers = [authUser, ...users.filter(u => u.id !== authUser.id && u.email.toLowerCase() !== authUser.email.toLowerCase())];
    await saveStoredUsers(updatedUsers);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO users (id, email, username, name, role, password_hash, password, is_email_verified, staff_id, avatar_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            username = VALUES(username),
            password_hash = VALUES(password_hash),
            password = NULL,
            is_email_verified = 1
        `;
        await query(sql, [
          authUser.id, authUser.email, authUser.username || null, authUser.name,
          authUser.role, passwordHash, authUser.staffId || null, authUser.avatarUrl || null,
          authUser.createdAt
        ]);
      } catch (err: any) {
        console.warn('MySQL user activation insert skipped:', err.message);
      }
    }

    // 3. Create active session cookie so employee is immediately logged in
    const session = await createSession(authUser, req);

    // 4. Record Audit Trail
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: nowAest,
      actorId: authUser.id,
      actorName: authUser.name,
      actorRole: 'STAFF',
      action: 'STAFF_PASSWORD_SET',
      targetType: 'User',
      targetId: authUser.id,
      details: `Staff member ${authUser.name} (@${finalUsername}) created password and activated profile from IP ${clientIp}.`,
      ipAddress: clientIp,
    };
    await appendStoredAuditLog(audit);

    const response = NextResponse.json({
      success: true,
      message: 'Account password created successfully. Welcome to HsCreations!',
      user: sanitizeUser(authUser),
      employee: updatedEmployee,
      session: {
        id: session.id,
        token: session.token,
        role: session.role,
        expiresAt: session.expiresAt,
      }
    });

    response.headers.set('Set-Cookie', createSessionCookie(session.token));
    return response;
  } catch (err: any) {
    console.error('API /api/auth/activate-invite POST error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
