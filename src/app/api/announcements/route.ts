import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { Announcement } from '@/types';
import { getStoredAnnouncements, saveStoredAnnouncements } from '@/lib/serverData';

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC');
      const announcements: Announcement[] = rows.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        author: r.author,
        authorRole: r.author_role,
        date: r.date,
        category: r.category || undefined,
        isPinned: Boolean(r.is_pinned),
      }));
      await saveStoredAnnouncements(announcements);
      return NextResponse.json({ success: true, announcements });
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
    const newAnn: Announcement = { ...a, id };

    const stored = await getStoredAnnouncements();
    const updated = [newAnn, ...stored.filter(x => x.id !== id)];
    await saveStoredAnnouncements(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO announcements (id, title, content, author, author_role, date, category, is_pinned)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
          id, a.title, a.content, a.author, a.authorRole || 'SUPER_ADMIN',
          a.date || new Date().toLocaleDateString('en-AU'), a.category || null, a.isPinned ? 1 : 0
        ]);
      } catch (err: any) {
        console.warn('MySQL announcement insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving announcement:', err);
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
