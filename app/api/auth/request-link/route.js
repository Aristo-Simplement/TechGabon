import { NextResponse } from 'next/server';
import { findAccountByEmail, findUnclaimedRecordByEmail, saveEmailToken, lastEmailTokenAt } from '@/lib/db';
import { newToken, hashToken, sameOrigin, jsonError, isEmail } from '@/lib/auth';
import { sendAccessLinkEmail, originOf } from '@/lib/email';

// "Mot de passe oublié / récupérer mon profil": emails a one-time link (valid 1 hour).
//   - the email has an account          → link to choose a new password
//   - a profile uses this email, no account (created before accounts existed)
//                                        → link to create the account for that profile
// The answer is always the same, so nobody can find out which emails are registered.

const SAME_ANSWER = { ok: true };

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  let body;
  try { body = await request.json(); } catch { return jsonError('JSON invalide', 400); }
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!isEmail(email)) return jsonError('Adresse e-mail invalide.', 400);

  try {
    if (Date.now() - (await lastEmailTokenAt(email)) < 60 * 1000) return NextResponse.json(SAME_ANSWER);

    const account = await findAccountByEmail(email);
    const unclaimed = account ? null : await findUnclaimedRecordByEmail(email);
    if (!account && !unclaimed) return NextResponse.json(SAME_ANSWER);

    const token = newToken();
    await saveEmailToken({
      token_hash: hashToken(token),
      email,
      purpose: account ? 'reset' : 'claim',
      account_id: account ? account.id : null,
      table_name: unclaimed ? unclaimed.table : null,
      record_id: unclaimed ? unclaimed.record.id : null,
      expires_at: Date.now() + 60 * 60 * 1000,
      created_at: new Date().toISOString(),
    });
    await sendAccessLinkEmail({ to: email, url: `${originOf(request)}/reset?token=${encodeURIComponent(token)}`, claim: !account });
    return NextResponse.json(SAME_ANSWER);
  } catch (e) {
    console.error('[ONASKILL] request-link error:', e);
    return jsonError('Une erreur est survenue, réessayez plus tard.', 500);
  }
}
