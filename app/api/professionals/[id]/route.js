import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureTables } from '@/lib/db';

export async function DELETE(request, { params }) {
  await ensureTables();
  const { id } = await params;
  try {
    await sql`DELETE FROM professionals WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[TECHGABON] DELETE /api/professionals/[id] error:', e);
    return NextResponse.json({ error: 'Échec de la suppression' }, { status: 500 });
  }
}
