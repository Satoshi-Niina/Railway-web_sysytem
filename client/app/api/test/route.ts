import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== TEST API CALLED ===');
  console.log('Environment variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  return NextResponse.json({
    status: 'ok',
    databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
