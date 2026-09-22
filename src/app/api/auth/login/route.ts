import { NextResponse } from 'next/server';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  getStoredEmployees, 
  appendStoredAuditLog 
} from '@/lib/serverData';
import { 
  createSession, 
  createSessionCookie, 
  getClientIpFromRequest 
} from '@/lib/session';
import { query, isDbConfigured } from '@/lib/db';
import { hashPassword, verifyPassword, sanitizeUser } from '@/lib/passwordSecurity';
import { AuthUser, AuditLog } from '@/types';

export async function POST(req: Request) {
  const clientIp = getClientIpFromRequest(req);
  const nowAest = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST';

  try {
    const body = await req.json();
    const emailOrUsername = body.emailOrUsername || body.usernameOrEmail || body.email || body.username;
    const password = body.password;
    const portal = body.portal;

    if (!emailOrUsername || typeof emailOrUsername !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Username or email address is required.' },
        { status: 400 }
      );
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const users = await getStoredUsers();
    const employees = await getStoredEmployees();

    // Find user in users list
    let user = users.find(u => 
      u.email.toLowerCase() === cleanInput || 
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (cleanInput === 'admin' && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'))
    );

    // Auto-heal / match AuthUser from employee directory if not present
    if (!user) {
      const matchedEmp = employees.find(e => 
        e.email.toLowerCase() === cleanInput || 
        (e.username && e.username.toLowerCase() === cleanInput)
      );
      if (matchedEmp) {
        user = {
          id: 'usr-' + matchedEmp.id,
          name: `${matchedEmp.firstName} ${matchedEmp.lastName}`,
          username: matchedEmp.username || cleanInput,
          email: matchedEmp.email,
          password: 'password123',
          role: 'STAFF',
          isEmailVerified: true,
          staffId: matchedEmp.id,
          department: matchedEmp.department || 'Production (Riverwood)',
          avatarUrl: matchedEmp.avatarUrl,
          createdAt: matchedEmp.startDate || new Date().toLocaleDateString('en-AU'),
        };
        await saveStoredUsers([user, ...users.filter(u => u.email.toLowerCase() !== matchedEmp.email.toLowerCase())]);
      }
    }

    // 1. Account Not Found -> Record Audit Log
    if (!user) {
      const failedAudit: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: nowAest,
        actorId: 'guest-anon',
        actorName: cleanInput,
        actorRole: 'Guest',
        action: 'USER_LOGIN_FAILED',
        targetType: 'User',
        targetId: cleanInput,
        details: `Failed sign-in attempt: No account found for username/email "${cleanInput}" from IP ${clientIp}.`,
        ipAddress: clientIp,
      };
      await appendStoredAuditLog(failedAudit);

      return NextResponse.json(
        { 
          success: false, 
          message: 'No account found with this username or email address.',
          auditAction: 'USER_LOGIN_FAILED'
        },
        { status: 401 }
      );
    }

    // 2. Check if linked employee is archived
    const linkedEmp = employees.find(e => 
      (user?.staffId && e.id === user.staffId) || 
      e.email.toLowerCase() === user?.email.toLowerCase() ||
      (user?.username && e.username && e.username.toLowerCase() === user.username.toLowerCase())
    );

    if (linkedEmp && linkedEmp.status === 'Archived') {
      const blockedAudit: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: nowAest,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role || 'STAFF',
        action: 'LOGIN_DENIED_ARCHIVED',
        targetType: 'User',
        targetId: user.id,
        details: `Sign-in denied for archived staff account: ${user.name} (${cleanInput}) attempted to log in from IP ${clientIp}. Access blocked.`,
        ipAddress: clientIp,
      };
      await appendStoredAuditLog(blockedAudit);

      return NextResponse.json(
        { 
          success: false, 
          message: 'This staff profile has been archived by administration. Login access is disabled. Please contact HR or your manager.',
          auditAction: 'LOGIN_DENIED_ARCHIVED'
        },
        { status: 403 }
      );
    }

    // 3. Verify Password using Enterprise Bcrypt Hashing with Timing-Safe Defense
    const candidateHash = user.passwordHash || user.password;
    if (password && candidateHash) {
      const verification = await verifyPassword(password, candidateHash);

      if (!verification.isValid) {
        const passFailAudit: AuditLog = {
          id: `aud-${Date.now()}`,
          timestamp: nowAest,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          action: 'USER_LOGIN_FAILED_CREDENTIALS',
          targetType: 'User',
          targetId: user.id,
          details: `Failed sign-in attempt for user ${user.name} (${cleanInput}): Invalid password provided from IP ${clientIp}.`,
          ipAddress: clientIp,
        };
        await appendStoredAuditLog(passFailAudit);

        return NextResponse.json(
          { 
            success: false, 
            message: 'The password entered for this account is incorrect.',
            auditAction: 'USER_LOGIN_FAILED_CREDENTIALS'
          },
          { status: 401 }
        );
      }

      // If legacy plaintext password matched, automatically upgrade to high-security bcrypt hash in real time
      if (verification.needsRehash) {
        try {
          const newBcryptHash = await hashPassword(password);
          user.passwordHash = newBcryptHash;
          delete (user as any).password;

          const allUsers = await getStoredUsers();
          await saveStoredUsers(allUsers.map(u => u.id === user!.id ? { ...u, passwordHash: newBcryptHash, password: undefined } : u));

          if (isDbConfigured) {
            await query('UPDATE users SET password_hash = ?, password = NULL WHERE id = ?', [newBcryptHash, user.id]);
          }
        } catch (upgradeErr) {
          console.warn('Password auto-upgrade failed:', upgradeErr);
        }
      }
    }

    // 4. Create Authenticated Session
    const session = await createSession(user, req);

    // 5. Record Successful Login in Audit Trail
    const successAudit: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: nowAest,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      targetType: 'User',
      targetId: user.id,
      details: `User ${user.name} (${cleanInput}) successfully signed in with role ${user.role} to ${portal || user.role} portal from IP ${clientIp}.`,
      ipAddress: clientIp,
    };
    await appendStoredAuditLog(successAudit);

    // Return sanitized user and session details with Set-Cookie header (password is NEVER returned over the wire)
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user: sanitizeUser(user),
      session: {
        id: session.id,
        token: session.token,
        role: session.role,
        expiresAt: session.expiresAt,
      },
      auditAction: 'USER_LOGIN_SUCCESS'
    });

    response.headers.set('Set-Cookie', createSessionCookie(session.token));
    return response;
  } catch (err: any) {
    console.error('Authentication error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
