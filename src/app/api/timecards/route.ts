import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { TimecardRecord } from '@/types';
import { getStoredTimecards, saveStoredTimecards } from '@/lib/serverData';

function mapRowToTimecard(row: any): TimecardRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeAvatar: row.employee_avatar || undefined,
    department: row.department || 'General Operations',
    date: row.date,
    clockIn: row.clock_in,
    clockOut: row.clock_out || undefined,
    clockInTimestamp: Number(row.clock_in_timestamp) || 0,
    clockOutTimestamp: row.clock_out_timestamp ? Number(row.clock_out_timestamp) : undefined,
    durationSeconds: Number(row.duration_seconds) || 0,
    breakMinutes: Number(row.break_minutes) || 0,
    isBreakManuallyAdjusted: Boolean(row.is_break_manually_adjusted),
    totalHours: Number(row.total_hours) || 0,
    overtimeHours: Number(row.overtime_hours) || 0,
    status: row.status || 'CLOCKED_IN',
    notes: row.notes || undefined,
    adminNote: row.admin_note || row.notes || undefined,
    staffNote: row.staff_note || undefined,
    staffNoteSubmittedAt: row.staff_note_submitted_at || undefined,
    staffNoteStatus: row.staff_note_status || undefined,
    adjustedBy: row.adjusted_by || undefined,
    adjustedAt: row.adjusted_at || undefined,
    ipAddress: row.ip_address || row.ipAddress || undefined,
    workstationLabel: row.workstation_label || row.workstationLabel || undefined,
    deviceInfo: row.device_info || row.deviceInfo || undefined,
    ipStatus: row.ip_status || row.ipStatus || undefined,
  };
}

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM timecards ORDER BY clock_in_timestamp DESC');
      const timecards = rows.map(mapRowToTimecard);
      await saveStoredTimecards(timecards);
      return NextResponse.json({ success: true, timecards });
    } catch (err: any) {
      console.warn('MySQL timecards fetch failed, using disk fallback:', err.message);
    }
  }

  const timecards = await getStoredTimecards();
  return NextResponse.json({ success: true, timecards });
}

export async function POST(req: Request) {
  try {
    const t: TimecardRecord = await req.json();
    const id = t.id || `tc-${Date.now()}`;
    const newRecord: TimecardRecord = { ...t, id };

    const stored = await getStoredTimecards();
    const existingIndex = stored.findIndex(item => item.id === id);
    let updated: TimecardRecord[];
    if (existingIndex >= 0) {
      updated = stored.map((item, idx) => idx === existingIndex ? newRecord : item);
    } else {
      updated = [newRecord, ...stored];
    }
    await saveStoredTimecards(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO timecards (
            id, employee_id, employee_name, employee_avatar, department,
            date, clock_in, clock_out, clock_in_timestamp, clock_out_timestamp,
            duration_seconds, break_minutes, total_hours, overtime_hours,
            status, notes, adjusted_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            clock_out = VALUES(clock_out),
            clock_out_timestamp = VALUES(clock_out_timestamp),
            duration_seconds = VALUES(duration_seconds),
            break_minutes = VALUES(break_minutes),
            total_hours = VALUES(total_hours),
            overtime_hours = VALUES(overtime_hours),
            status = VALUES(status),
            notes = VALUES(notes),
            adjusted_by = VALUES(adjusted_by)
        `;
        await query(sql, [
          id, t.employeeId, t.employeeName, t.employeeAvatar || null, t.department || 'General Operations',
          t.date, t.clockIn, t.clockOut || null, t.clockInTimestamp || Date.now(), t.clockOutTimestamp || null,
          t.durationSeconds || 0, t.breakMinutes || 0, t.totalHours || 0, t.overtimeHours || 0,
          t.status || 'CLOCKED_IN', t.notes || null, t.adjustedBy || null
        ]);
      } catch (err: any) {
        console.warn('MySQL timecard save skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving timecard:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, updates } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Timecard ID required' }, { status: 400 });
    }

    const stored = await getStoredTimecards();
    const updated = stored.map(tc => tc.id === id ? { ...tc, ...updates } : tc);
    await saveStoredTimecards(updated);

    if (isDbConfigured) {
      try {
        const setClauses: string[] = [];
        const params: any[] = [];
        const map: Record<string, string> = {
          clockIn: 'clock_in', clockOut: 'clock_out', clockInTimestamp: 'clock_in_timestamp',
          clockOutTimestamp: 'clock_out_timestamp', durationSeconds: 'duration_seconds',
          breakMinutes: 'break_minutes', totalHours: 'total_hours', overtimeHours: 'overtime_hours',
          status: 'status', notes: 'notes', adminNote: 'admin_note', adjustedBy: 'adjusted_by',
          adjustedAt: 'adjusted_at', staffNote: 'staff_note', staffNoteSubmittedAt: 'staff_note_submitted_at',
          staffNoteStatus: 'staff_note_status', ipAddress: 'ip_address', workstationLabel: 'workstation_label',
          deviceInfo: 'device_info', ipStatus: 'ip_status'
        };
        for (const [k, v] of Object.entries(updates)) {
          if (map[k]) {
            setClauses.push(`\`${map[k]}\` = ?`);
            params.push(v ?? null);
          }
        }
        if (setClauses.length > 0) {
          params.push(id);
          await query(`UPDATE timecards SET ${setClauses.join(', ')} WHERE id = ?`, params);
        }
      } catch (err: any) {
        console.warn('MySQL timecard update skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating timecard:', err);
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

    const stored = await getStoredTimecards();
    const updated = stored.filter(t => t.id !== id);
    await saveStoredTimecards(updated);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM timecards WHERE id = ?', [id]);
      } catch (err: any) {
        console.warn('MySQL timecard delete skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting timecard:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
