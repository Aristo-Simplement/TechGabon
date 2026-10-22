import { NextResponse } from 'next/server';
import { getRecord, TABLE_OF_KIND } from '@/lib/db';
import { currentAccount, publicAccount, isAdmin } from '@/lib/auth';
import { docsWithoutContent } from '@/lib/files';

// The logged-in account and its own full record (including its private fields and
// documents) — only ever returned to its owner. The confirmation token is never sent.
export async function GET(request) {
  const account = await currentAccount(request);
  if (!account) return NextResponse.json({ account: null, record: null });
  const record = await getRecord(TABLE_OF_KIND[account.kind], account.record_id);
  const { verifyToken, ...own } = record || {}; // eslint-disable-line no-unused-vars
  if (own.docs) own.docs = docsWithoutContent(own.docs); // opened via /api/files
  return NextResponse.json({ account: publicAccount(account, { isAdmin: await isAdmin(account) }), record: record ? own : null }, { headers: { 'Cache-Control': 'no-store' } });
}
