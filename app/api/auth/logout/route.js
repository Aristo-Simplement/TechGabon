import { NextResponse } from 'next/server';
import { clearSessionCookie, sameOrigin, jsonError } from '@/lib/auth';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
