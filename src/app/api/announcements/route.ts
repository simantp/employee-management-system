import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { Announcement } from '@/types';

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' });
  }

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

    return NextResponse.json({ success: true, announcements });
  } catch (err: any) {
    console.error('Error fetching announcements from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Saved locally' });
  }

  try {
    const a: Announcement = await req.json();
    const id = a.id || `ann-${Date.now()}`;

    const sql = `
      INSERT INTO announcements (id, title, content, author, author_role, date, category, is_pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      a.title,
      a.content,
      a.author,
      a.authorRole || 'SUPER_ADMIN',
      a.date || new Date().toLocaleDateString('en-AU'),
      a.category || null,
      a.isPinned ? 1 : 0,
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving announcement in MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Deleted locally' });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    await query('DELETE FROM announcements WHERE id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting announcement from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
