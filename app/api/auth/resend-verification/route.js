import { NextResponse } from 'next/server';
import { getRecord, TABLE_OF_KIND } from '@/lib/db';
import { currentAccount, sameOrigin, jsonError } from '@/lib/auth';
import { sendVerificationEmail, originOf } from '@/lib/email';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  const account = await currentAccount(request);
  if (!account) return jsonError('Connectez-vous pour renvoyer l’e-mail.', 401);
  const isPro = account.kind === 'pro';
  const record = await getRecord(TABLE_OF_KIND[account.kind], account.record_id);
  if (!record) return jsonError('Fiche introuvable', 404);
  if (record.verified) return NextResponse.json({ alreadyVerified: true });
  const result = await sendVerificationEmail({
    to: record.email, nom: account.kind === 'company' ? record.nom : record.prenom, type: account.kind,
    id: record.id, token: record.verifyToken, origin: originOf(request),
  });
  return NextResponse.json(result);
}
