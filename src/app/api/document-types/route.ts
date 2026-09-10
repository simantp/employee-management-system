import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { DocumentTypeConfig } from '@/types';
import { getStoredDocumentTypes, saveStoredDocumentTypes } from '@/lib/serverData';

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM document_types ORDER BY name ASC');
      const documentTypes: DocumentTypeConfig[] = rows.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        hasExpiry: Boolean(r.has_expiry),
      }));
      await saveStoredDocumentTypes(documentTypes);
      return NextResponse.json({ success: true, documentTypes });
    } catch (err: any) {
      console.warn('MySQL document-types fetch failed, using disk fallback:', err.message);
    }
  }

  const documentTypes = await getStoredDocumentTypes();
  return NextResponse.json({ success: true, documentTypes });
}

export async function POST(req: Request) {
  try {
    const dt: DocumentTypeConfig = await req.json();
    const id = dt.id || `dt-${Date.now()}`;
    const newDt: DocumentTypeConfig = { ...dt, id };

    const stored = await getStoredDocumentTypes();
    const updated = [...stored.filter(x => x.id !== id), newDt];
    await saveStoredDocumentTypes(updated);

    if (isDbConfigured) {
      try {
        await query('INSERT INTO document_types (id, name, category, has_expiry) VALUES (?, ?, ?, ?)', [
          id, dt.name, dt.category, dt.hasExpiry ? 1 : 0
        ]);
      } catch (err: any) {
        console.warn('MySQL document-type insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving document type:', err);
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

    const stored = await getStoredDocumentTypes();
    const updated = stored.filter(d => d.id !== id);
    await saveStoredDocumentTypes(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM document_types WHERE id = ?', [id]);
      } catch (err: any) {
        console.warn('MySQL document-type delete skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting document type:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
