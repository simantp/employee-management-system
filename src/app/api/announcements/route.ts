import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { Announcement } from '@/types';
import { getStoredAnnouncements, saveStoredAnnouncements } from '@/lib/serverData';

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC');
      if (rows && rows.length > 0) {
        const announcements: Announcement[] = rows.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          author: r.author,
          authorRole: r.author_role || 'SUPER_ADMIN',
          date: r.date,
          category: r.category || undefined,
          isPinned: Boolean(r.is_pinned),
        }));
        await saveStoredAnnouncements(announcements);
        return NextResponse.json({ success: true, announcements });
      }
    } catch (err: any) {
      console.warn('MySQL announcements fetch failed, using disk fallback:', err.message);
    }
  }

  const announcements = await getStoredAnnouncements();
  return NextResponse.json({ success: true, announcements });
}

export async function POST(req: Request) {
  try {
    const a: Announcement = await req.json();
    const id = a.id || `ann-${Date.now()}`;
    const newAnn: Announcement = { 
      ...a, 
      id,
      date: a.date || new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      isPinned: a.isPinned !== undefined ? a.isPinned : true
    };

    const stored = await getStoredAnnouncements();
    const updated = [newAnn, ...stored.filter(x => x.id !== id)];
    await saveStoredAnnouncements(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO announcements (id, title, content, author, author_role, date, category, is_pinned)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            title = VALUES(title),
            content = VALUES(content),
            author = VALUES(author),
            author_role = VALUES(author_role),
            date = VALUES(date),
            category = VALUES(category),
            is_pinned = VALUES(is_pinned)
        `;
        await query(sql, [
          id, 
          newAnn.title, 
          newAnn.content, 
          newAnn.author || 'Admin User', 
          newAnn.authorRole || 'SUPER_ADMIN',
          newAnn.date, 
          newAnn.category || null, 
          newAnn.isPinned ? 1 : 0
        ]);
      } catch (err: any) {
        console.warn('MySQL announcement insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, announcement: newAnn, id });
  } catch (err: any) {
    console.error('Error saving announcement:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Announcement ID required' }, { status: 400 });
    }

    const stored = await getStoredAnnouncements();
    const existingIndex = stored.findIndex(a => a.id === id);
    if (existingIndex === -1 && !updates) {
      return NextResponse.json({ success: false, message: 'Announcement not found' }, { status: 404 });
    }

    const updatedAnnouncement: Announcement = existingIndex !== -1 
      ? { ...stored[existingIndex], ...updates }
      : { id, title: '', content: '', author: 'Admin User', authorRole: 'SUPER_ADMIN', date: '', ...updates };

    const updatedList = stored.map(a => a.id === id ? updatedAnnouncement : a);
    await saveStoredAnnouncements(updatedList);

    if (isDbConfigured) {
      try {
        const sql = `
          UPDATE announcements 
          SET title = ?, content = ?, author = ?, author_role = ?, date = ?, category = ?, is_pinned = ?
          WHERE id = ?
        `;
        await query(sql, [
          updatedAnnouncement.title,
          updatedAnnouncement.content,
          updatedAnnouncement.author || 'Admin User',
          updatedAnnouncement.authorRole || 'SUPER_ADMIN',
          updatedAnnouncement.date || new Date().toLocaleDateString('en-AU'),
          updatedAnnouncement.category || null,
          updatedAnnouncement.isPinned ? 1 : 0,
          id
        ]);
      } catch (err: any) {
        console.warn('MySQL announcement update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, announcement: updatedAnnouncement });
  } catch (err: any) {
    console.error('Error updating announcement:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    const stored = await getStoredAnnouncements();
    const updated = stored.filter(a => a.id !== id);
    await saveStoredAnnouncements(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM announcements WHERE id = ?', [id]);
      } catch (err: any) {
        console.warn('MySQL announcement delete skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting announcement:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
