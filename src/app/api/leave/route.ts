import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { LeaveRequest } from '@/types';
import { getStoredLeaveRequests, saveStoredLeaveRequests } from '@/lib/serverData';

function mapRowToLeave(row: any): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeAvatar: row.employee_avatar || undefined,
    department: row.department,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: Number(row.total_days) || 1,
    reason: row.reason,
    status: row.status,
    certificateUrl: row.certificate_url || undefined,
    certificateUploaded: Boolean(row.certificate_uploaded),
    adminNotes: row.admin_notes || undefined,
    submittedAt: row.submitted_at,
    isAdvanceNoticeMet: Boolean(row.is_advance_notice_met),
    advanceNoticeDays: Number(row.advance_notice_days) || 0,
    reminderCount: Number(row.reminder_count) || 0,
  };
}

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM leave_requests ORDER BY created_at DESC');
      const leaveRequests = rows.map(mapRowToLeave);
      await saveStoredLeaveRequests(leaveRequests);
      return NextResponse.json({ success: true, leaveRequests });
    } catch (err: any) {
      console.warn('MySQL leave fetch failed, using disk fallback:', err.message);
    }
  }

  const leaveRequests = await getStoredLeaveRequests();
  return NextResponse.json({ success: true, leaveRequests });
}

export async function POST(req: Request) {
  try {
    const r: LeaveRequest = await req.json();
    const id = r.id || `leave-${Date.now()}`;
    const newReq: LeaveRequest = { ...r, id };

    const stored = await getStoredLeaveRequests();
    const updated = [newReq, ...stored.filter(x => x.id !== id)];
    await saveStoredLeaveRequests(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO leave_requests (
            id, employee_id, employee_name, employee_avatar, department,
            leave_type, start_date, end_date, total_days, reason,
            status, certificate_url, certificate_uploaded, admin_notes,
            submitted_at, is_advance_notice_met, advance_notice_days, reminder_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
          id, r.employeeId, r.employeeName, r.employeeAvatar || null, r.department,
          r.leaveType, r.startDate, r.endDate, r.totalDays, r.reason,
          r.status || 'PENDING', r.certificateUrl || null, r.certificateUploaded ? 1 : 0,
          r.adminNotes || null, r.submittedAt || new Date().toISOString(),
          r.isAdvanceNoticeMet ? 1 : 0, r.advanceNoticeDays || 0, r.reminderCount || 0
        ]);
      } catch (err: any) {
        console.warn('MySQL leave insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving leave request:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes, ...rest } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    const stored = await getStoredLeaveRequests();
    const updated = stored.map(r => {
      if (r.id === id) {
        return {
          ...r,
          ...(status !== undefined ? { status } : {}),
          ...(notes !== undefined ? { adminNotes: notes } : {}),
          ...rest,
        };
      }
      return r;
    });
    await saveStoredLeaveRequests(updated);

    if (isDbConfigured) {
      try {
        if (status !== undefined || notes !== undefined) {
          await query('UPDATE leave_requests SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes) WHERE id = ?', [status || null, notes || null, id]);
        }
      } catch (err: any) {
        console.warn('MySQL leave update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error reviewing leave request:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
