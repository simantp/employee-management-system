import { NextResponse } from 'next/server';
import { 
  extractSessionToken, 
  verifySession, 
  invalidateSession, 
  clearSessionCookie,
  getClientIpFromRequest 
} from '@/lib/session';
import { appendStoredAuditLog } from '@/lib/serverData';
import { AuditLog } from '@/types';

export async function POST(req: Request) {
  const clientIp = getClientIpFromRequest(req);
  const nowAest = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST';

  try {
    const token = extractSessionToken(req);
    let sessionUser: { name: string; role: string; id: string } | null = null;

    if (token) {
      const session = await verifySession(token);
      if (session) {
        sessionUser = {
          id: session.userId,
          name: session.userName,
          role: session.role,
        };
      }
      await invalidateSession(token);
    }

    // Record Logout in Audit Trail
    if (sessionUser) {
      const logoutAudit: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: nowAest,
        actorId: sessionUser.id,
        actorName: sessionUser.name,
        actorRole: sessionUser.role,
        action: 'USER_LOGOUT',
        targetType: 'User',
        targetId: sessionUser.id,
        details: `User ${sessionUser.name} (${sessionUser.role}) logged out from IP ${clientIp}. Session terminated.`,
        ipAddress: clientIp,
      };
      await appendStoredAuditLog(logoutAudit);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    response.headers.set('Set-Cookie', clearSessionCookie());
    return response;
  } catch (err: any) {
    console.error('Logout error:', err);
    const response = NextResponse.json(
      { success: true, message: 'Logged out.' }
    );
    response.headers.set('Set-Cookie', clearSessionCookie());
    return response;
  }
}

export async function GET(req: Request) {
  return POST(req);
}
