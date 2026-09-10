import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { EmployeeDocument } from '@/types';
import { getStoredEmployees, saveStoredEmployees } from '@/lib/serverData';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, document } = body;
    if (!employeeId || !document) {
      return NextResponse.json({ success: false, message: 'Missing employeeId or document' }, { status: 400 });
    }

    const docId = document.id || `doc-${Date.now()}`;
    const newDoc: EmployeeDocument = { ...document, id: docId };

    const stored = await getStoredEmployees();
    const updated = stored.map(emp => {
      if (emp.id === employeeId) {
        const docs = emp.documents || [];
        return {
          ...emp,
          documents: [newDoc, ...docs.filter(d => d.id !== docId)]
        };
      }
      return emp;
    });
    await saveStoredEmployees(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO employee_documents (
            id, employee_id, name, type, document_number, expiry_date,
            upload_date, status, file_size, file_type, file_path, preview_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
          docId, employeeId, newDoc.name, newDoc.type, newDoc.documentNumber || null,
          newDoc.expiryDate || null, newDoc.uploadDate, newDoc.status || 'Pending',
          newDoc.fileSize || '1.8 MB', newDoc.fileType || 'image',
          newDoc.previewUrl || null, newDoc.previewUrl || null
        ]);
      } catch (err: any) {
        console.warn('MySQL document insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error('Error saving document:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { docId, updates } = body;
    if (!docId) {
      return NextResponse.json({ success: false, message: 'Document ID required' }, { status: 400 });
    }

    const stored = await getStoredEmployees();
    const updated = stored.map(emp => ({
      ...emp,
      documents: (emp.documents || []).map(d => d.id === docId ? { ...d, ...updates } : d)
    }));
    await saveStoredEmployees(updated);

    if (isDbConfigured) {
      try {
        const setClauses: string[] = [];
        const params: any[] = [];
        const map: Record<string, string> = {
          name: 'name', type: 'type', documentNumber: 'document_number',
          expiryDate: 'expiry_date', status: 'status', rejectionReason: 'rejection_reason'
        };
        for (const [k, v] of Object.entries(updates)) {
          if (map[k]) {
            setClauses.push(`\`${map[k]}\` = ?`);
            params.push(v ?? null);
          }
        }
        if (setClauses.length > 0) {
          params.push(docId);
          await query(`UPDATE employee_documents SET ${setClauses.join(', ')} WHERE id = ?`, params);
        }
      } catch (err: any) {
        console.warn('MySQL document update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error('Error updating document:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId');
    if (!docId) {
      return NextResponse.json({ success: false, message: 'docId required' }, { status: 400 });
    }

    const stored = await getStoredEmployees();
    const updated = stored.map(emp => ({
      ...emp,
      documents: (emp.documents || []).filter(d => d.id !== docId)
    }));
    await saveStoredEmployees(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM employee_documents WHERE id = ?', [docId]);
      } catch (err: any) {
        console.warn('MySQL document delete skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
