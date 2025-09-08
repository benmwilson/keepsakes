import { NextResponse } from 'next/server';
import { checkConnection } from '@/lib/database';

export async function GET() {
  try {
    const isConnected = await checkConnection();
    
    return NextResponse.json({
      connected: isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
