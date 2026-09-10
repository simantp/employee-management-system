import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { AuditLog } from '@/types';
import { getStoredAuditLogs, saveStoredAuditLogs, getStoredSettings, getAuditLogTimestampMs, pruneLogsByDays } from '@/lib/serverData';

export async function GET() {
  const settings = await getStoredSettings();
  const retentionDays = Number(settings.auditRetentionDays) || 90;

  if (isDbConfigured) {
    try {
      // Auto-prune in MySQL
      try {
        await query('DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
      } catch (e) {}

      const rows = await query<any[]>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
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

      const { kept } = pruneLogsByDays(auditLogs, retentionDays);
      await saveStoredAuditLogs(kept);
      return NextResponse.json({ success: true, auditLogs: kept, retentionDays });
    } catch (err: any) {
      console.warn('MySQL audit fetch failed, using disk fallback:', err.message);
    }
  }

  const stored = await getStoredAuditLogs();
  const { kept, prunedCount } = pruneLogsByDays(stored, retentionDays);
  if (prunedCount > 0) {
    await saveStoredAuditLogs(kept);
  }

  return NextResponse.json({ success: true, auditLogs: kept, retentionDays });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a manual prune action
    if (body.action === 'PRUNE_AUDIT_LOGS' || body.action === 'prune') {
      const settings = await getStoredSettings();
      const retentionDays = Number(body.retentionDays || settings.auditRetentionDays || 90);
      const stored = await getStoredAuditLogs();
      const { kept, prunedCount } = pruneLogsByDays(stored, retentionDays);
      await saveStoredAuditLogs(kept);

      if (isDbConfigured) {
        try {
          await query('DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        message: `Pruned ${prunedCount} logs older than ${retentionDays} days.`,
        prunedCount,
        remainingCount: kept.length,
        auditLogs: kept,
      });
    }

    const id = body.id || `aud-${Date.now()}`;
    const newLog: AuditLog = {
      id,
      action: body.action || 'ACTIVITY',
      targetType: body.targetType || body.targetEntity || 'System',
      targetId: body.targetId || '',
      details: body.details || '',
      actorId: body.actorId || 'usr-1',
      actorName: body.actorName || body.performedBy || 'System',
      actorRole: body.actorRole || body.role || 'STAFF',
      timestamp: body.timestamp || new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) + ' AEST',
      ipAddress: body.ipAddress || '127.0.0.1 (Localhost)',
    };

    const settings = await getStoredSettings();
    const retentionDays = Number(settings.auditRetentionDays) || 90;
    const stored = await getStoredAuditLogs();
    const { kept } = pruneLogsByDays([newLog, ...stored], retentionDays);
    await saveStoredAuditLogs(kept);

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

        // Auto-prune in MySQL
        await query('DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
      } catch (err: any) {
        console.warn('MySQL audit insert/prune skipped:', err.message);
      }
    }

    return NextResponse.json({ success: true, id, auditLogs: kept });
  } catch (err: any) {
    console.error('Error logging audit entry:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days');
    const settings = await getStoredSettings();
    const retentionDays = Number(daysParam || settings.auditRetentionDays || 90);

    const stored = await getStoredAuditLogs();
    const { kept, prunedCount } = pruneLogsByDays(stored, retentionDays);
    await saveStoredAuditLogs(kept);

    if (isDbConfigured) {
      try {
        await query('DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: `Pruned ${prunedCount} audit records older than ${retentionDays} days.`,
      prunedCount,
      remainingCount: kept.length,
      auditLogs: kept,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

