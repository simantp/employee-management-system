import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { TimecardRecord } from '@/types';

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
    totalHours: Number(row.total_hours) || 0,
    overtimeHours: Number(row.overtime_hours) || 0,
    status: row.status || 'CLOCKED_IN',
    notes: row.notes || undefined,
    adjustedBy: row.adjusted_by || undefined,
  };
}

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' });
  }

  try {
    const rows = await query<any[]>('SELECT * FROM timecards ORDER BY clock_in_timestamp DESC');
    const timecards = rows.map(mapRowToTimecard);
    return NextResponse.json({ success: true, timecards });
  } catch (err: any) {
    console.error('Error fetching timecards from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Saved locally' });
  }

  try {
    const t: TimecardRecord = await req.json();
    const id = t.id || `tc-${Date.now()}`;

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
      id,
      t.employeeId,
      t.employeeName,
      t.employeeAvatar || null,
      t.department || 'General Operations',
      t.date,
      t.clockIn,
      t.clockOut || null,
      t.clockInTimestamp || Date.now(),
      t.clockOutTimestamp || null,
      t.durationSeconds || 0,
      t.breakMinutes || 0,
      t.totalHours || 0,
      t.overtimeHours || 0,
      t.status || 'CLOCKED_IN',
      t.notes || null,
      t.adjustedBy || null,
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving timecard to MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Updated locally' });
  }

  try {
    const { id, updates } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Timecard ID required' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    const map: Record<string, string> = {
      clockIn: 'clock_in',
      clockOut: 'clock_out',
      clockInTimestamp: 'clock_in_timestamp',
      clockOutTimestamp: 'clock_out_timestamp',
      durationSeconds: 'duration_seconds',
      breakMinutes: 'break_minutes',
      totalHours: 'total_hours',
      overtimeHours: 'overtime_hours',
      status: 'status',
      notes: 'notes',
      adjustedBy: 'adjusted_by',
    };

    for (const [k, v] of Object.entries(updates)) {
      const col = map[k];
      if (col) {
        setClauses.push(`\`${col}\` = ?`);
        params.push(v ?? null);
      }
    }

    if (setClauses.length > 0) {
      params.push(id);
      await query(`UPDATE timecards SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating timecard in MySQL:', err);
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

    await query('DELETE FROM timecards WHERE id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting timecard from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
