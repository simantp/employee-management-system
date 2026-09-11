import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userName, resetUrl, expiresInMinutes } = body;

    if (!email || !resetUrl) {
      return NextResponse.json(
        { success: false, error: 'Email and reset URL are required.' },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetEmail({
      email,
      userName: userName || 'Staff Member',
      resetUrl,
      expiresInMinutes: expiresInMinutes || 5,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API /api/auth/send-reset-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
