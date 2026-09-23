import { NextResponse } from 'next/server';
import { getStoredSettings, saveStoredSettings, getStoredAuditLogs, saveStoredAuditLogs, pruneLogsByDays } from '@/lib/serverData';
import { query, isDbConfigured } from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/session';

import { getEnvSmtpConfig } from '@/lib/smtpConfig';

export async function GET(req: Request) {
  const auth = await getAuthenticatedUserFromRequest(req);
  const settings = await getStoredSettings();

  const envSmtp = getEnvSmtpConfig();
  let effectiveSmtp = settings.smtpSettings || {};

  if (envSmtp && envSmtp.isConfigured) {
    effectiveSmtp = {
      ...effectiveSmtp,
      host: envSmtp.host,
      port: envSmtp.port,
      secure: envSmtp.secure,
      user: envSmtp.user,
      pass: envSmtp.pass,
      fromEmail: envSmtp.fromEmail,
      fromName: envSmtp.fromName,
      enableSmtp: true,
      source: 'ENV_VARS',
      isEnvConfigured: true,
    };
  }

  // If calling user is non-admin staff, mask confidential SMTP passwords
  if (auth.authenticated && auth.isStaff && !auth.isAdmin) {
    const maskedSettings = {
      ...settings,
      smtpSettings: effectiveSmtp ? {
        ...effectiveSmtp,
        pass: '••••••••',
      } : undefined
    };
    return NextResponse.json({ success: true, settings: maskedSettings });
  }

  return NextResponse.json({ 
    success: true, 
    settings: {
      ...settings,
      smtpSettings: effectiveSmtp,
    }
  });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (auth.authenticated && auth.isStaff && !auth.isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden: Administrator privileges required.' }, { status: 403 });
    }

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

