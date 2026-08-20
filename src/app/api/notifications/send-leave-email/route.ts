import { NextRequest, NextResponse } from 'next/server';
import { sendLeaveRequestEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeName, department, leaveType, startDate, endDate, totalDays, reason, submittedAt, adminEmail } = body;

    if (!employeeName || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required leave details' },
        { status: 400 }
      );
    }

    const result = await sendLeaveRequestEmail({
      employeeName,
      department,
      leaveType,
      startDate,
      endDate,
      totalDays: Number(totalDays) || 1,
      reason: reason || 'Not specified',
      submittedAt: submittedAt || new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
      adminEmail,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API /api/notifications/send-leave-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
