import { NextRequest, NextResponse } from 'next/server';
import { getStoredEmailLogs, saveStoredEmailLogs, appendStoredEmailLog } from '@/lib/serverData';
import { EmailLog } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const logs = await getStoredEmailLogs();
    return NextResponse.json({ success: true, emailLogs: logs }, { status: 200 });
  } catch (error: any) {
    console.error('API /api/emails GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch email logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newLog: EmailLog = {
      id: body.id || `eml-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: body.timestamp || new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
      recipientEmail: body.recipientEmail || '',
      recipientName: body.recipientName || 'Staff Member',
      subject: body.subject || 'Automated System Notification',
      category: body.category || 'EXPIRY_REMINDER',
      status: body.status || 'SENT',
      deliveryMode: body.deliveryMode || 'REAL_SMTP',
      messageId: body.messageId || '',
      previewSnippet: body.previewSnippet || '',
      htmlContent: body.htmlContent || '',
      details: body.details || '',
      actorId: body.actorId || 'system',
      actorName: body.actorName || 'Automated Compliance Bot',
      meta: body.meta || {},
    };

    await appendStoredEmailLog(newLog);
    return NextResponse.json({ success: true, emailLog: newLog }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/emails POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save email log' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await saveStoredEmailLogs([]);
    return NextResponse.json({ success: true, message: 'Email logs cleared successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API /api/emails DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear email logs' }, { status: 500 });
  }
}
