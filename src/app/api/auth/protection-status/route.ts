import { NextResponse } from 'next/server';
import { getPasswordProtectionStatus } from '@/actions/auth-config';

export async function GET() {
  try {
    const enabled = await getPasswordProtectionStatus();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error checking password protection status:', error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
