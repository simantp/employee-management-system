import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { NotificationItem } from '@/types';
import { getStoredNotifications, saveStoredNotifications } from '@/lib/serverData';
import { getAuthenticatedUserFromRequest } from '@/lib/session';

function mapRowToNotification(row: any): NotificationItem {
  return {
    id: row.id,
    recipient: row.recipient || 'ALL',
    recipientId: row.recipient_id || undefined,
    title: row.title,
    message: row.message,
    type: row.type || 'GENERAL',
    timestamp: row.timestamp || 'Just now',
    read: Boolean(row.read_status !== undefined ? row.read_status : row.read),
    actionUrl: row.action_url || undefined,
  };
}

export async function GET(req: Request) {
  const auth = await getAuthenticatedUserFromRequest(req);
  let allNotifs: NotificationItem[] = [];

  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM notifications ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        allNotifs = rows.map(mapRowToNotification);
        await saveStoredNotifications(allNotifs);
      }
    } catch (err: any) {
      console.warn('MySQL notifications fetch failed, using disk fallback:', err.message);
    }
  }

  if (allNotifs.length === 0) {
    allNotifs = await getStoredNotifications();
  }

  // Scoped Data Visibility:
  // If caller is authenticated as STAFF, return only notifications addressed to them or ALL
  if (auth.authenticated && auth.isStaff && !auth.isAdmin) {
    const staffId = auth.user?.staffId;
    const userId = auth.user?.id;
    const email = auth.user?.email.toLowerCase();
    const scoped = allNotifs.filter(n => {
      if (n.recipient === 'ADMIN') return false;
      if (n.recipient === 'ALL' || n.recipient === 'STAFF') {
        if (!n.recipientId) return true;
      }
      return (
        n.recipientId === staffId ||
        n.recipientId === userId ||
        (email && n.recipientId?.toLowerCase() === email)
      );
    });
    return NextResponse.json({ success: true, notifications: scoped });
  }

  // If caller is ADMIN, return notifications for ADMIN and ALL
  if (auth.authenticated && auth.isAdmin) {
    const scoped = allNotifs.filter(n => n.recipient === 'ADMIN' || n.recipient === 'ALL');
    return NextResponse.json({ success: true, notifications: scoped });
  }

  return NextResponse.json({ success: true, notifications: allNotifs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stored = await getStoredNotifications();

    // Check if bulk insert or single item
    const items: NotificationItem[] = Array.isArray(body) ? body : [body];
    const preparedItems: NotificationItem[] = items.map(item => ({
      ...item,
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: item.timestamp || new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      read: item.read !== undefined ? item.read : false,
    }));

    const updated = [...preparedItems, ...stored.filter(s => !preparedItems.some(p => p.id === s.id))];
    await saveStoredNotifications(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO notifications (id, recipient, recipient_id, title, message, type, timestamp, read_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            message = VALUES(message),
            read_status = VALUES(read_status)
        `;
        for (const item of preparedItems) {
          await query(sql, [
            item.id,
            item.recipient || 'ALL',
            item.recipientId || null,
            item.title,
            item.message,
            item.type || 'GENERAL',
            item.timestamp,
            item.read ? 1 : 0
          ]);
        }
      } catch (err: any) {
        console.warn('MySQL notification insert skipped:', err.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      notifications: updated, 
      inserted: preparedItems.length === 1 ? preparedItems[0] : preparedItems 
    });
  } catch (err: any) {
    console.error('Error saving notification:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const stored = await getStoredNotifications();
    let updated: NotificationItem[] = [];

    if (body.markAllRead) {
      // Mark absolutely all notifications as read
      updated = stored.map(n => ({ ...n, read: true }));
      if (isDbConfigured) {
        try {
          await query('UPDATE notifications SET read_status = 1');
        } catch (e) {}
      }
    } else if (body.recipient) {
      // Mark read for specific recipient type ('ADMIN' or 'STAFF' or 'ALL')
      const targetRec = body.recipient;
      updated = stored.map(n => {
        if (n.recipient === targetRec || n.recipient === 'ALL') {
          return { ...n, read: true };
        }
        return n;
      });
      if (isDbConfigured) {
        try {
          await query('UPDATE notifications SET read_status = 1 WHERE recipient = ? OR recipient = ?', [targetRec, 'ALL']);
        } catch (e) {}
      }
    } else if (body.recipientId) {
      // Mark read for specific staff member ID
      const targetId = body.recipientId;
      updated = stored.map(n => {
        if (n.recipientId === targetId || n.recipient === 'ALL') {
          return { ...n, read: true };
        }
        return n;
      });
      if (isDbConfigured) {
        try {
          await query('UPDATE notifications SET read_status = 1 WHERE recipient_id = ? OR recipient = ?', [targetId, 'ALL']);
        } catch (e) {}
      }
    } else if (body.id) {
      // Mark single notification read or update
      const targetId = body.id;
      const readVal = body.read !== undefined ? Boolean(body.read) : true;
      updated = stored.map(n => n.id === targetId ? { ...n, read: readVal } : n);
      if (isDbConfigured) {
        try {
          await query('UPDATE notifications SET read_status = ? WHERE id = ?', [readVal ? 1 : 0, targetId]);
        } catch (e) {}
      }
    } else {
      updated = stored;
    }

    await saveStoredNotifications(updated);
    return NextResponse.json({ success: true, notifications: updated });
  } catch (err: any) {
    console.error('Error updating notification:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Notification ID required' }, { status: 400 });
    }

    const stored = await getStoredNotifications();
    const updated = stored.filter(n => n.id !== id);
    await saveStoredNotifications(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM notifications WHERE id = ?', [id]);
      } catch (err: any) {
        console.warn('MySQL notification deletion skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    console.error('Error deleting notification:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
