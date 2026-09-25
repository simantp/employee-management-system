import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { saveEmployeeFile } from '@/lib/uploadUtils';
import { EmployeeDocument } from '@/types';
import { getStoredEmployees, saveStoredEmployees, getStoredDocumentTypes } from '@/lib/serverData';
import { getOnboardingProgress } from '@/lib/onboarding';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let empId = '';
    let empName = 'Staff Member';
    let name = 'Document';
    let type = 'Identification';
    let documentNumber = '';
    let expiryDate = '';
    let status = 'Pending';
    let fileName = 'document.png';
    let filePayload: string | Buffer = '';

    let passedDocId = '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      empId = body.empId || body.employeeId || '';
      empName = body.empName || body.employeeName || 'Staff Member';
      name = body.name || 'Document';
      type = body.type || 'Identification';
      documentNumber = body.documentNumber || '';
      expiryDate = body.expiryDate || '';
      status = body.status || 'Pending';
      fileName = body.fileName || `${name}.png`;
      filePayload = body.fileData || body.previewUrl || '';
      passedDocId = body.documentId || body.docId || body.id || '';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      empId = (formData.get('empId') as string) || (formData.get('employeeId') as string) || '';
      empName = (formData.get('empName') as string) || (formData.get('employeeName') as string) || 'Staff Member';
      name = (formData.get('name') as string) || 'Document';
      type = (formData.get('type') as string) || 'Identification';
      documentNumber = (formData.get('documentNumber') as string) || '';
      expiryDate = (formData.get('expiryDate') as string) || '';
      status = (formData.get('status') as string) || 'Pending';
      passedDocId = (formData.get('documentId') as string) || (formData.get('id') as string) || '';
      
      const file = formData.get('file') as File | null;
      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        filePayload = Buffer.from(arrayBuffer);
      }
    }

    if (!empId) {
      return NextResponse.json({ success: false, message: 'Employee ID is required.' }, { status: 400 });
    }

    let filePath = '';
    let previewUrl = '';
    let fileSize = '1.8 MB';
    let fileType: 'image' | 'pdf' | 'doc' = 'image';

    if (filePayload) {
      if (typeof filePayload === 'string' && (filePayload.startsWith('http://') || filePayload.startsWith('https://') || filePayload.startsWith('/uploads/'))) {
        filePath = filePayload;
        previewUrl = filePayload;
        fileSize = '1.2 MB';
        fileType = filePayload.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
      } else {
        const saveResult = await saveEmployeeFile({
          employeeName: empName,
          employeeId: empId,
          fileName,
          dataUrlOrBuffer: filePayload,
        });

        filePath = saveResult.relativeFilePath;
        previewUrl = saveResult.relativeFilePath;
        fileSize = saveResult.fileSizeFormatted;
        fileType = saveResult.fileType;
      }
    } else {
      previewUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80';
    }

    const docId = passedDocId || `doc-${Date.now()}`;
    const uploadDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO employee_documents (
            id, employee_id, name, type, document_number, expiry_date,
            upload_date, status, file_size, file_type, file_path, preview_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await query(sql, [
          docId,
          empId,
          name,
          type,
          documentNumber || null,
          expiryDate || null,
          uploadDate,
          status,
          fileSize,
          fileType,
          filePath || null,
          previewUrl,
        ]);
      } catch (dbErr: any) {
        console.error('MySQL insert document error:', dbErr);
      }
    }

    const newDoc: EmployeeDocument = {
      id: docId,
      name,
      type,
      documentNumber: documentNumber || undefined,
      expiryDate: expiryDate || undefined,
      uploadDate,
      status: status as any,
      fileSize,
      fileType,
      previewUrl,
    };

    // Update disk JSON
    const stored = await getStoredEmployees();
    const serverDocTypes = await getStoredDocumentTypes();
    const nowIso = new Date().toISOString();
    let becameActive = false;
    const updated = stored.map(emp => {
      if (emp.id === empId) {
        const mergedDocs = [newDoc, ...(emp.documents || []).filter(d => d.id !== docId)];
        const updatedEmp = {
          ...emp,
          documents: mergedDocs,
        };
        const progress = getOnboardingProgress(updatedEmp, serverDocTypes);
        if (updatedEmp.status === 'Pending' && progress.isProfileInfoComplete) {
          updatedEmp.status = 'Active';
          updatedEmp.onboardingStatus = progress.missingDocuments.length === 0 ? 'COMPLETED' : 'PROFILE_COMPLETED';
          updatedEmp.profileCompletedAt = updatedEmp.profileCompletedAt || nowIso;
          becameActive = true;
        } else if (updatedEmp.status === 'Active' && progress.missingDocuments.length === 0 && updatedEmp.onboardingStatus !== 'COMPLETED') {
          updatedEmp.onboardingStatus = 'COMPLETED';
          becameActive = true;
        }
        return updatedEmp;
      }
      return emp;
    });
    await saveStoredEmployees(updated);

    if (becameActive && isDbConfigured) {
      try {
        await query(
          "UPDATE employees SET status = 'Active', onboarding_status = 'COMPLETED', profile_completed_at = ? WHERE id = ?",
          [nowIso, empId]
        );
      } catch (err: any) {
        console.warn('MySQL update employee active on doc upload skipped:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      document: newDoc,
      fileUrl: filePath || previewUrl,
      relativeFilePath: filePath,
      becameActive,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
