import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { AuditLog } from '@/types';
import { getStoredAuditLogs, saveStoredAuditLogs } from '@/lib/serverData';

export async function GET() {
  if (isDbConfigured) {
    try {
      const rows = await query<any[]>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
      const auditLogs: AuditLog[] = rows.map(r => ({
        id: r.id,
        action: r.action,
        targetType: r.target_entity || r.target_type || 'System',
        targetId: r.target_id || '',
        details: r.details || '',
        actorId: r.actor_id || 'usr-1',
        actorName: r.performed_by || r.actor_name || 'System',
        actorRole: r.role || r.actor_role || 'STAFF',
        timestamp: r.timestamp || new Date().toISOString(),
        ipAddress: r.ip_address || '127.0.0.1 (Localhost)',
      }));
      await saveStoredAuditLogs(auditLogs);
      return NextResponse.json({ success: true, auditLogs });
    } catch (err: any) {
      console.warn('MySQL audit fetch failed, using disk fallback:', err.message);
    }
  }

  const auditLogs = await getStoredAuditLogs();
  return NextResponse.json({ success: true, auditLogs });
}

export async function POST(req: Request) {
  try {
    const log = await req.json();
    const id = log.id || `aud-${Date.now()}`;
    const newLog: AuditLog = {
      id,
      action: log.action || 'ACTIVITY',
      targetType: log.targetType || log.targetEntity || 'System',
      targetId: log.targetId || '',
      details: log.details || '',
      actorId: log.actorId || 'usr-1',
      actorName: log.actorName || log.performedBy || 'System',
      actorRole: log.actorRole || log.role || 'STAFF',
      timestamp: log.timestamp || new Date().toISOString(),
      ipAddress: log.ipAddress || '127.0.0.1 (Localhost)',
    };

    const stored = await getStoredAuditLogs();
    const updated = [newLog, ...stored].slice(0, 500);
    await saveStoredAuditLogs(updated);

    if (isDbConfigured) {
      try {
        const sql = `
          INSERT INTO audit_logs (id, action, target_entity, target_id, details, performed_by, role, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
          id, newLog.action, newLog.targetType, newLog.targetId, newLog.details,
          newLog.actorName, newLog.actorRole, newLog.timestamp
        ]);
      } catch (err: any) {
        console.warn('MySQL audit insert skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error logging audit entry:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
