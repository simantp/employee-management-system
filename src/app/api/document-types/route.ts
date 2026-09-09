import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { DocumentTypeConfig } from '@/types';

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' });
  }

  try {
    const rows = await query<any[]>('SELECT * FROM document_types ORDER BY created_at ASC');
    const documentTypes: DocumentTypeConfig[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      hasExpiry: Boolean(r.has_expiry),
    }));

    return NextResponse.json({ success: true, documentTypes });
  } catch (err: any) {
    console.error('Error fetching document types from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Saved locally' });
  }

  try {
    const dt: DocumentTypeConfig = await req.json();
    const id = dt.id || `dt-${Date.now()}`;

    const sql = `
      INSERT INTO document_types (id, name, category, has_expiry)
      VALUES (?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      dt.name,
      dt.category || 'General',
      dt.hasExpiry ? 1 : 0,
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving document type in MySQL:', err);
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

    await query('DELETE FROM document_types WHERE id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting document type from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
