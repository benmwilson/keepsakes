import { NextResponse } from 'next/server';

export async function HEAD() {
  // Simple network test endpoint
  // Returns minimal response to measure network latency
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export async function GET() {
  // Return network test data
  return NextResponse.json({
    timestamp: Date.now(),
    server: 'firebase-optimized',
    region: process.env.VERCEL_REGION || 'unknown'
  });
}
