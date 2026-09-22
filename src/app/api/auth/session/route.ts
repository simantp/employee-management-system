import { NextResponse } from 'next/server';
import { 
  extractSessionToken, 
  verifySession, 
  createSessionCookie, 
  getClientIpFromRequest 
} from '@/lib/session';
import { getStoredUsers, getStoredEmployees } from '@/lib/serverData';
import { sanitizeUser } from '@/lib/passwordSecurity';

export async function GET(req: Request) {
  try {
    const token = extractSessionToken(req);

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: 'No session token provided.' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'Session has expired or is invalid.' },
        { status: 401 }
      );
    }

    // Fetch fresh user details
    const users = await getStoredUsers();
    let user = users.find(u => u.id === session.userId || u.email.toLowerCase() === session.userEmail.toLowerCase());

    if (!user) {
      const employees = await getStoredEmployees();
      const emp = employees.find(e => e.id === session.staffId || e.email.toLowerCase() === session.userEmail.toLowerCase());
      if (emp) {
        user = {
          id: 'usr-' + emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email,
          username: emp.username,
          role: session.role || 'STAFF',
          isEmailVerified: true,
          staffId: emp.id,
          avatarUrl: emp.avatarUrl,
          department: emp.department || 'Production (Riverwood)',
          createdAt: emp.startDate || new Date().toLocaleDateString('en-AU'),
        };
      }
    }

    const returnedUser = user ? sanitizeUser(user) : {
      id: session.userId,
      name: session.userName,
      email: session.userEmail,
      role: session.role,
      staffId: session.staffId,
      isEmailVerified: true,
      createdAt: new Date(session.createdAt).toLocaleDateString('en-AU'),
    };

    return NextResponse.json({
      authenticated: true,
      user: returnedUser,
      session: {
        id: session.id,
        token: session.token,
        role: session.role,
        expiresAt: session.expiresAt,
        lastActiveAt: session.lastActiveAt,
      },
    });
  } catch (err: any) {
    console.error('Session verification error:', err);
    return NextResponse.json(
      { authenticated: false, message: 'Failed to verify session.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Support refreshing or explicitly checking session with token in body
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || extractSessionToken(req);

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: 'No session token provided.' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'Session is invalid or expired.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      authenticated: true,
      session,
    });
    response.headers.set('Set-Cookie', createSessionCookie(session.token));
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, message: 'Session refresh error.' },
      { status: 500 }
    );
  }
}
