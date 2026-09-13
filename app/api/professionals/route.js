import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureTables, seedProfessionals } from '@/lib/db';

export async function GET() {
  await ensureTables();
  let { rows } = await sql`SELECT data FROM professionals ORDER BY created_at ASC`;

  if (rows.length === 0) {
    const seed = seedProfessionals();
    for (const record of seed) {
      await sql`INSERT INTO professionals (id, data) VALUES (${record.id}, ${JSON.stringify(record)}::jsonb)
                ON CONFLICT (id) DO NOTHING`;
    }
    rows = seed.map((data) => ({ data }));
  }

  return NextResponse.json(rows.map((r) => r.data));
}

export async function POST(request) {
  await ensureTables();
  let record;
  try {
    record = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  if (!record || !record.id) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }
  try {
    await sql`INSERT INTO professionals (id, data) VALUES (${record.id}, ${JSON.stringify(record)}::jsonb)
              ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(record)}::jsonb`;
    return NextResponse.json(record);
  } catch (e) {
    console.error('[TECHGABON] POST /api/professionals error:', e);
    return NextResponse.json({ error: "Échec de l'enregistrement" }, { status: 500 });
  }
}
