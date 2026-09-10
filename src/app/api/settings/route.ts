import { NextResponse } from 'next/server';
import { getStoredSettings, saveStoredSettings } from '@/lib/serverData';

export async function GET() {
  const settings = await getStoredSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = await getStoredSettings();
    const merged = { ...current, ...body };
    await saveStoredSettings(merged);
    return NextResponse.json({ success: true, settings: merged });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
