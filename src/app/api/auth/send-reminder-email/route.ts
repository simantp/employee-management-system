import { NextRequest, NextResponse } from 'next/server';
import { sendProfileCompletionReminderEmail, sendMissingDocumentsReminderEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      loginUrl,
      missingSections,
      missingDocuments,
      reminderType,
      completedCount,
      totalSections,
      department,
      jobTitle,
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Staff email address is required.' },
        { status: 400 }
      );
    }

    const resolvedLoginUrl = loginUrl || `${req.nextUrl.origin}/?login=true`;

    if (reminderType === 'DOCUMENTS' && Array.isArray(missingDocuments) && missingDocuments.length > 0) {
      const result = await sendMissingDocumentsReminderEmail({
        email,
        firstName: firstName || 'Staff Member',
        lastName: lastName || '',
        missingDocuments,
        loginUrl: resolvedLoginUrl,
        department,
        jobTitle,
      });
      return NextResponse.json(result, { status: 200 });
    }

    const result = await sendProfileCompletionReminderEmail({
      email,
      firstName: firstName || 'Staff Member',
      lastName: lastName || '',
      loginUrl: resolvedLoginUrl,
      missingSections: Array.isArray(missingSections) ? missingSections : [],
      completedCount: typeof completedCount === 'number' ? completedCount : 0,
      totalSections: typeof totalSections === 'number' ? totalSections : 4,
      department,
      jobTitle,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API /api/auth/send-reminder-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
