import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { AuditLog } from '@/types';

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({ success: false, message: 'Database not configured' });
  }

  try {
    const rows = await query<any[]>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    const auditLogs: AuditLog[] = rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      actorId: r.actor_id || 'sys-1',
      actorName: r.performed_by || r.actor_name || 'System',
      actorRole: r.role || r.actor_role || 'Staff',
      action: r.action,
      targetType: r.target_entity || r.target_type || 'System',
      targetId: r.target_id || '',
      details: r.details || '',
      ipAddress: r.ip_address || '203.14.182.91 (Sydney, AU)',
    }));

    return NextResponse.json({ success: true, auditLogs });
  } catch (err: any) {
    console.error('Error fetching audit logs from MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured) {
    return NextResponse.json({ success: true, message: 'Saved locally' });
  }

  try {
    const a: AuditLog = await req.json();
    const id = a.id || `audit-${Date.now()}`;

    const sql = `
      INSERT INTO audit_logs (id, action, target_entity, target_id, details, performed_by, role, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      a.action,
      a.targetType || 'System',
      a.targetId || '',
      a.details || '',
      a.actorName || 'System',
      a.actorRole || 'Staff',
      a.timestamp || new Date().toLocaleString('en-AU'),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error saving audit log in MySQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
