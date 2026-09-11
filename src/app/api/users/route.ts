import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { AuthUser } from '@/types';
import { getStoredUsers, saveStoredUsers } from '@/lib/serverData';

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM users ORDER BY created_at DESC');
      const users: AuthUser[] = rows.map(r => ({
        id: r.id,
        name: r.name,
        username: r.username || undefined,
        email: r.email,
        password: r.password || undefined,
        role: r.role,
        isEmailVerified: Boolean(r.is_email_verified),
        staffId: r.staff_id || undefined,
        avatarUrl: r.avatar_url || undefined,
        createdAt: r.created_at || new Date().toLocaleDateString('en-AU'),
      }));
      await saveStoredUsers(users);
      return NextResponse.json({ success: true, users });
    } catch (err: any) {
      console.warn('MySQL users fetch failed, using disk fallback:', err.message);
    }
  }

  const users = await getStoredUsers();
  return NextResponse.json({ success: true, users });
}

export async function POST(req: Request) {
  try {
    const user: AuthUser = await req.json();
    const stored = await getStoredUsers();
    const updated = [user, ...stored.filter(u => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase())];
    await saveStoredUsers(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO users (id, email, name, role, is_email_verified, staff_id, avatar_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), is_email_verified = VALUES(is_email_verified)
        `;
        await query(sql, [
          user.id, user.email, user.name, user.role, user.isEmailVerified ? 1 : 0,
          user.staffId || null, user.avatarUrl || null, user.createdAt
        ]);
      } catch (err: any) {
        console.warn('MySQL user insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id: user.id });
  } catch (err: any) {
    console.error('Error saving user:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, email, updates } = body;

    const stored = await getStoredUsers();
    const userIndex = stored.findIndex(u => (id && u.id === id) || (email && u.email.toLowerCase() === email.toLowerCase()));

    if (userIndex === -1) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updatedUser: AuthUser = {
      ...stored[userIndex],
      ...updates,
    };

    stored[userIndex] = updatedUser;
    await saveStoredUsers(stored);

    if (isDbConfigured) {
      try {
        const sql = `
          UPDATE users 
          SET name = ?, username = ?, role = ?, is_email_verified = ?, staff_id = ?, avatar_url = ?, password = ?
          WHERE id = ? OR email = ?
        `;
        await query(sql, [
          updatedUser.name,
          updatedUser.username || null,
          updatedUser.role,
          updatedUser.isEmailVerified ? 1 : 0,
          updatedUser.staffId || null,
          updatedUser.avatarUrl || null,
          updatedUser.password || null,
          updatedUser.id,
          updatedUser.email,
        ]);
      } catch (err: any) {
        console.warn('MySQL user update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });
    }

    const stored = await getStoredUsers();
    const updated = stored.filter(u => u.id !== id);
    await saveStoredUsers(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM users WHERE id = ?', [id]);
      } catch (err: any) {
        console.warn('MySQL user delete skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
