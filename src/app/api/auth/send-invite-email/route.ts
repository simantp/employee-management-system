import { NextRequest, NextResponse } from 'next/server';
import { sendStaffInvitationEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, inviteUrl, department, jobTitle } = body;

    if (!email || !inviteUrl) {
      return NextResponse.json(
        { success: false, error: 'Email and invitation URL are required.' },
        { status: 400 }
      );
    }

    const result = await sendStaffInvitationEmail({
      email,
      firstName: firstName || 'Staff Member',
      lastName: lastName || '',
      inviteUrl,
      department,
      jobTitle,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API /api/auth/send-invite-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
