import { NextRequest, NextResponse } from 'next/server';
import { getStoredUsers, saveStoredUsers, getStoredAuditLogs, saveStoredAuditLogs } from '@/lib/serverData';
import { hashPassword } from '@/lib/passwordSecurity';
import { query, isDbConfigured } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword, token } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getStoredUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'No user account found matching this email address.' },
        { status: 404 }
      );
    }

    // Hash new password using bcrypt
    const hashedPassword = await hashPassword(newPassword);
    users[userIndex].passwordHash = hashedPassword;
    delete (users[userIndex] as any).password;
    users[userIndex].isEmailVerified = true;
    await saveStoredUsers(users);

    if (isDbConfigured) {
      try {
        await query(
          'UPDATE users SET password_hash = ?, password = NULL, is_email_verified = 1 WHERE id = ? OR email = ?',
          [hashedPassword, users[userIndex].id, cleanEmail]
        );
      } catch (dbErr: any) {
        console.warn('MySQL password reset update failed:', dbErr.message);
      }
    }

    // Record audit log
    try {
      const logs = await getStoredAuditLogs();
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
        actorId: users[userIndex].id,
        actorName: users[userIndex].name || cleanEmail,
        actorRole: users[userIndex].role || 'STAFF',
        action: 'PASSWORD_RESET_COMPLETED',
        targetType: 'AUTH_CREDENTIALS',
        targetId: users[userIndex].id,
        details: `Password reset successfully completed and secured with bcrypt hash for ${cleanEmail}.`,
        ipAddress: '127.0.0.1 (Sydney NSW)',
      };
      await saveStoredAuditLogs([newLog, ...logs]);
    } catch (e) {
      console.warn('Audit logging failed for password reset:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        role: users[userIndex].role,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('API /api/auth/reset-password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
