import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    let detectedIp = 
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-client-ip') ||
      '127.0.0.1';

    // Normalize IPv6 localhost
    if (detectedIp === '::1' || detectedIp === '::ffff:127.0.0.1') {
      detectedIp = '127.0.0.1';
    }

    return NextResponse.json({
      success: true,
      ip: detectedIp,
      userAgent: req.headers.get('user-agent') || 'Browser Workstation',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, ip: '127.0.0.1', message: error.message },
      { status: 500 }
    );
  }
}
