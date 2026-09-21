import { NextResponse } from 'next/server';
import { getStoredEmailLogs, saveStoredEmailLogs, appendStoredEmailLog } from '@/lib/serverData';
import { EmailLog } from '@/types';

export async function GET() {
  try {
    const logs = await getStoredEmailLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to get email logs:', error);
    return NextResponse.json({ error: 'Failed to read email logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const logData = await request.json();
    const newLog: EmailLog = {
      id: logData.id || `eml-${Date.now()}`,
      timestamp: logData.timestamp || new Date().toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      recipientEmail: logData.recipientEmail,
      recipientName: logData.recipientName,
      subject: logData.subject,
      category: logData.category || 'GENERAL',
      status: logData.status || 'SENT',
      deliveryMode: logData.deliveryMode || 'MOCK_SMTP',
      messageId: logData.messageId || `msg-${Date.now()}`,
      previewSnippet: logData.previewSnippet || '',
      htmlContent: logData.htmlContent,
      details: logData.details,
      actorId: logData.actorId,
      actorName: logData.actorName,
      meta: logData.meta
    };

    await appendStoredEmailLog(newLog);
    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error('Failed to append email log:', error);
    return NextResponse.json({ error: 'Failed to record email log' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await saveStoredEmailLogs([]);
    return NextResponse.json({ success: true, message: 'All email logs cleared' });
  } catch (error) {
    console.error('Failed to clear email logs:', error);
    return NextResponse.json({ error: 'Failed to clear email logs' }, { status: 500 });
  }
}
