import { NextResponse } from 'next/server';
import { checkTavilyKey } from '@/lib/tavily';

export async function GET() {
  const result = checkTavilyKey();

  return NextResponse.json({
    valid: result.valid,
    message: result.message,
  });
}