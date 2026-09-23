import { NextResponse } from 'next/server';
import { sendTestSmtpEmail, getEffectiveSmtpConfig } from '@/lib/emailService';

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
    let { host, port, secure, user, pass, fromEmail, fromName, testRecipient } = body || {};

    // If host or user or pass are not provided (or masked), fallback to effective saved config
    if (!host || !user || !pass || pass === '••••••••') {
      const saved = await getEffectiveSmtpConfig();
      if (!saved.isConfigured) {
        return NextResponse.json({
          success: false,
          message: 'No SMTP configuration provided or stored. Please configure SMTP in your Hostinger environment variables (.env) or enter details.'
        }, { status: 400 });
      }
      host = host || saved.host;
      port = port || saved.port;
      secure = secure !== undefined ? secure : saved.secure;
      user = user || saved.user;
      pass = (!pass || pass === '••••••••') ? saved.pass : pass;
      fromEmail = fromEmail || saved.fromEmail;
      fromName = fromName || saved.fromName;
    }

    if (!testRecipient) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a test recipient email address.'
      }, { status: 400 });
    }

    const result = await sendTestSmtpEmail({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      user,
      pass,
      fromEmail,
      fromName,
      testRecipient,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: result.message,
    });
  } catch (err: any) {
    console.error('SMTP test error:', err);
    let errorMessage = err.message || 'Unknown SMTP error';

    // Provide friendly diagnostics for common mail server errors
    if (err.code === 'EAUTH' || errorMessage.includes('Invalid login') || errorMessage.includes('Username and Password not accepted')) {
      errorMessage = `Authentication failed (${err.code || 'Invalid login'}). For Gmail, please generate a 16-character App Password (with 2FA enabled). Check your username and password.`;
    } else if (err.code === 'ESOCKET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      errorMessage = `Connection failed (${err.code || 'Timeout'}). Could not connect to mail server at ${body?.host}:${body?.port}. Please check the hostname, port, and firewall rules.`;
    }

    return NextResponse.json({
      success: false,
      message: errorMessage,
      code: err.code,
    }, { status: 500 });
  }
}
