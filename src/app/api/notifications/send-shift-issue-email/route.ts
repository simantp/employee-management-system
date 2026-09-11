import { NextRequest, NextResponse } from 'next/server';
import { sendShiftIssueEmailToAdmin } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeName, employeeEmail, department, shiftDate, clockIn, clockOut, breakMinutes, message } = body;

    if (!employeeName || !message || !shiftDate) {
      return NextResponse.json(
        { success: false, error: 'Employee name, shift date, and message are required.' },
        { status: 400 }
      );
    }

    const result = await sendShiftIssueEmailToAdmin({
      employeeName,
      employeeEmail,
      department,
      shiftDate,
      clockIn: clockIn || '07:30 AM',
      clockOut,
      breakMinutes,
      message,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API /api/notifications/send-shift-issue-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
