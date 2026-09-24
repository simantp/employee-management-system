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
        isRequired: Boolean(r.is_required),
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
        await query('INSERT INTO document_types (id, name, category, has_expiry, is_required) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), has_expiry = VALUES(has_expiry), is_required = VALUES(is_required)', [
          id, dt.name, dt.category, dt.hasExpiry ? 1 : 0, dt.isRequired ? 1 : 0
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

export async function PUT(req: Request) {
  try {
    const body: Partial<DocumentTypeConfig> & { id: string } = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    const stored = await getStoredDocumentTypes();
    const updated = stored.map(d => d.id === body.id ? { ...d, ...body } : d);
    await saveStoredDocumentTypes(updated);

    if (isDbConfigured) {
      try {
        const updates: string[] = [];
        const params: any[] = [];
        if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
        if (body.category !== undefined) { updates.push('category = ?'); params.push(body.category); }
        if (body.hasExpiry !== undefined) { updates.push('has_expiry = ?'); params.push(body.hasExpiry ? 1 : 0); }
        if (body.isRequired !== undefined) { updates.push('is_required = ?'); params.push(body.isRequired ? 1 : 0); }
        if (updates.length > 0) {
          params.push(body.id);
          await query(`UPDATE document_types SET ${updates.join(', ')} WHERE id = ?`, params);
        }
      } catch (err: any) {
        console.warn('MySQL document-type update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating document type:', err);
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
