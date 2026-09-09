import { NextRequest, NextResponse } from 'next/server';
import { sendExpiryReminderEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      employeeName, 
      employeeEmail, 
      documentType, 
      documentName, 
      documentNumber, 
      expiryDate, 
      daysRemaining, 
      severity,
      workRestrictions 
    } = body;

    if (!employeeName || !employeeEmail || !expiryDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required expiry reminder parameters' },
        { status: 400 }
      );
    }

    const result = await sendExpiryReminderEmail({
      employeeName,
      employeeEmail,
      documentType: documentType || 'VISA',
      documentName: documentName || (documentType === 'VISA' ? 'Visa Grant Notice' : 'Driver Licence'),
      documentNumber,
      expiryDate,
      daysRemaining: Number(daysRemaining) || 0,
      severity: severity || (Number(daysRemaining) <= 30 ? 'CRITICAL' : 'WARNING'),
      workRestrictions,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API /api/notifications/send-expiry-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
