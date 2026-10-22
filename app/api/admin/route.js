import { NextResponse } from 'next/server';
import { listRecords, listAccounts } from '@/lib/db';
import { currentAccount, isAdmin, sameOrigin, jsonError } from '@/lib/auth';
import { docsWithoutContent } from '@/lib/files';
import { deleteAnyRecord, setHidden } from '@/lib/moderation';

// Moderation space for the platform owner (emails listed in ADMIN_EMAILS).
// The owner can hide / show again / delete profiles and requests — not edit them: members
// stay responsible for their own information.

const TABLES = ['professionals', 'companies', 'particuliers', 'missions'];

async function requireAdmin(request) {
  const account = await currentAccount(request);
  return (await isAdmin(account)) ? account : null;
}

export async function GET(request) {
  if (!(await requireAdmin(request))) return jsonError('Accès réservé à l’administration.', 403);
  const accounts = await listAccounts();
  const byRecord = Object.fromEntries(accounts.map((a) => [a.record_id, a]));
  const out = {};
  for (const table of TABLES) {
    out[table] = (await listRecords(table)).map((r) => {
      const { verifyToken, ownerKeyHash, ...rest } = r; // eslint-disable-line no-unused-vars
      const owner = byRecord[r.id];
      return {
        ...rest,
        docs: rest.docs ? docsWithoutContent(rest.docs) : undefined,
        logo: rest.logo ? { name: rest.logo.name } : undefined,
        account: owner ? { email: owner.email, createdAt: owner.created_at } : null,
        ownerEmail: table === 'missions' ? (accounts.find((a) => a.id === r.ownerAccountId) || {}).email || null : undefined,
      };
    });
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Accès réservé à l’administration.', 403);
  let body;
  try { body = await request.json(); } catch { return jsonError('JSON invalide', 400); }
  const { action, table, id } = body || {};
  if (!TABLES.includes(table) || !id) return jsonError('Paramètres invalides', 400);
  try {
    if (action === 'delete') await deleteAnyRecord(table, String(id));
    else if (action === 'hide' || action === 'show') {
      if (!(await setHidden(table, String(id), action === 'hide', admin.email))) return jsonError('Introuvable', 404);
    } else return jsonError('Action inconnue', 400);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ONASKILL] admin action error:', e);
    return jsonError('Action impossible', 500);
  }
}
