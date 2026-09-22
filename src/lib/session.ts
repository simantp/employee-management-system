import crypto from 'crypto';
import { AuthUser, UserSession, AuditLog } from '@/types';
import { getStoredSessions, saveStoredSessions, appendStoredAuditLog } from './serverData';

export const SESSION_COOKIE_NAME = 'ems_session_token';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extract client IP address from request headers
 */
export function getClientIpFromRequest(req?: Request): string {
  if (!req) return '192.168.1.100 (Sydney, AU)';
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '192.168.1.100 (Sydney, AU)';
}

/**
 * Extract User-Agent header from request
 */
export function getUserAgentFromRequest(req?: Request): string {
  if (!req) return 'Workforce Portal Desktop';
  return req.headers.get('user-agent') || 'Workforce Portal Web Client';
}

/**
 * Create and persist a new user session
 */
export async function createSession(user: AuthUser, req?: Request): Promise<UserSession> {
  const token = generateSessionToken();
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;
  const ipAddress = getClientIpFromRequest(req);
  const userAgent = getUserAgentFromRequest(req);

  const session: UserSession = {
    id: `sess-${now}-${crypto.randomBytes(4).toString('hex')}`,
    token,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    role: user.role,
    staffId: user.staffId,
    createdAt: now,
    expiresAt,
    ipAddress,
    userAgent,
    lastActiveAt: now,
  };

  const currentSessions = await getStoredSessions();
  // Filter out expired sessions and any old sessions for this user if needed
  const activeSessions = currentSessions.filter(s => s.expiresAt > now);
  await saveStoredSessions([session, ...activeSessions]);

  return session;
}

/**
 * Verify and retrieve an active session by token
 */
export async function verifySession(token: string): Promise<UserSession | null> {
  if (!token || typeof token !== 'string') return null;

  const sessions = await getStoredSessions();
  const now = Date.now();
  const matched = sessions.find(s => s.token === token && s.expiresAt > now);

  if (!matched) return null;

  // Update lastActiveAt periodically (e.g. if last active was > 5 minutes ago)
  if (now - matched.lastActiveAt > 5 * 60 * 1000) {
    matched.lastActiveAt = now;
    await saveStoredSessions(sessions);
  }

  return matched;
}

/**
 * Invalidate a session by token (logout)
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  const sessions = await getStoredSessions();
  const remaining = sessions.filter(s => s.token !== token);
  await saveStoredSessions(remaining);
}

/**
 * Invalidate all sessions for a specific user ID
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  const sessions = await getStoredSessions();
  const remaining = sessions.filter(s => s.userId !== userId);
  await saveStoredSessions(remaining);
}

/**
 * Extract session token from Request (Cookie or Authorization header)
 */
export function extractSessionToken(req: Request): string | null {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Check Cookie header
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
        const token = cookie.substring(SESSION_COOKIE_NAME.length + 1).trim();
        if (token) return token;
      }
    }
  }

  return null;
}

/**
 * Format Cookie string for Set-Cookie header
 */
export function createSessionCookie(token: string, maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax; ${isProd ? 'Secure; ' : ''}HttpOnly`;
}

/**
 * Format Cookie string to clear session cookie
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
}
