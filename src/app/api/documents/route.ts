import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { deleteUploadedFile } from '@/lib/uploadUtils';

export async function PUT(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Updated locally' });
  }

  try {
    const { docId, updates } = await req.json();
    if (!docId) {
      return NextResponse.json({ success: false, message: 'Document ID is required' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    const map: Record<string, string> = {
      name: 'name',
      type: 'type',
      documentNumber: 'document_number',
      expiryDate: 'expiry_date',
      status: 'status',
      fileSize: 'file_size',
      fileType: 'file_type',
      previewUrl: 'preview_url',
      rejectionReason: 'rejection_reason',
    };

    for (const [k, v] of Object.entries(updates)) {
      const col = map[k];
      if (col) {
        setClauses.push(`\`${col}\` = ?`);
        params.push(v ?? null);
      }
    }

    if (setClauses.length > 0) {
      params.push(docId);
      await query(`UPDATE employee_documents SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error('Error updating document in MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ success: false, message: 'Document ID required' }, { status: 400 });
    }

    if (isDbConfigured) {
      // Find file path to delete from disk
      const rows = await query<any[]>('SELECT file_path, preview_url FROM employee_documents WHERE id = ?', [docId]);
      if (rows.length > 0) {
        const filePath = rows[0].file_path || rows[0].preview_url;
        await deleteUploadedFile(filePath);
      }

      await query('DELETE FROM employee_documents WHERE id = ?', [docId]);
    }

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error('Error deleting document from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
