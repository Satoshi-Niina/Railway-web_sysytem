import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== TST API CALLD ===');
  console.log('nvironment variables:');
  console.log('DATABAS_URL:', process.env.DATABAS_URL ? '✅ Set' : '❌ Not set');
  console.log('NOD_NV:', process.env.NOD_NV);
  
  return NextResponse.json({
    status: 'ok',
    databaseUrl: process.env.DATABAS_URL ? 'Set (hidden)' : 'Not set',
    nodenv: process.env.NOD_NV,
    timestamp: new Date().toISOString()
  });
}
