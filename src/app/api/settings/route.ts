import { NextResponse } from 'next/server';
import { getStoredSettings, saveStoredSettings, getStoredAuditLogs, saveStoredAuditLogs, pruneLogsByDays } from '@/lib/serverData';
import { query, isDbConfigured } from '@/lib/db';

export async function GET() {
  const settings = await getStoredSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = await getStoredSettings();
    const merged = { ...current, ...body };
    await saveStoredSettings(merged);

    // If retention days were updated, automatically prune audit logs immediately
    if (body.auditRetentionDays !== undefined) {
      const retentionDays = Number(body.auditRetentionDays) || 90;
      const stored = await getStoredAuditLogs();
      const { kept, prunedCount } = pruneLogsByDays(stored, retentionDays);
      await saveStoredAuditLogs(kept);

      if (isDbConfigured) {
        try {
          await query('DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [retentionDays]);
        } catch (e) {}
      }
    }

    return NextResponse.json({ success: true, settings: merged });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

