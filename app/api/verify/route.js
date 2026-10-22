import { NextResponse } from 'next/server';
import { getRecord, saveRecord, TABLE_OF_KIND } from '@/lib/db';

// Confirms an email address from the link sent by email: /verify?type=…&id=…&token=…
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ status: 'invalid' }, { status: 400 }); }
  const { type, id, token } = body || {};
  const table = TABLE_OF_KIND[type] || null;
  if (!table || !id || !token) return NextResponse.json({ status: 'invalid' }, { status: 400 });
  const record = await getRecord(table, String(id));
  if (!record) return NextResponse.json({ status: 'notfound' }, { status: 404 });
  if (record.verified) return NextResponse.json({ status: 'success' });
  if (!record.verifyToken || record.verifyToken !== String(token)) return NextResponse.json({ status: 'mismatch' }, { status: 400 });
  await saveRecord(table, { ...record, verified: true, verifyToken: null });
  return NextResponse.json({ status: 'success' });
}
