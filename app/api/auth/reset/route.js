import { NextResponse } from 'next/server';
import { consumeEmailToken, getAccount, updatePassword, createAccount, getRecord, saveRecord, findAccountByEmail, TABLE_OF_KIND, KIND_OF_TABLE } from '@/lib/db';
import { hashToken, hashPassword, setSessionCookie, sameOrigin, jsonError, publicAccount, PASSWORD_MIN } from '@/lib/auth';

// Uses a link from /api/auth/request-link: sets the new password (or creates the account
// for an existing profile), confirms the email — the link proved the person owns it —
// and logs the person in.
export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  let body;
  try { body = await request.json(); } catch { return jsonError('JSON invalide', 400); }
  const password = String((body && body.password) || '');
  if (password.length < PASSWORD_MIN) return jsonError(`Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`, 400);

  try {
    const t = await consumeEmailToken(hashToken(String((body && body.token) || '')));
    if (!t) return jsonError('Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.', 400);

    let account;
    if (t.purpose === 'reset') {
      account = await getAccount(t.account_id);
      if (!account) return jsonError('Compte introuvable.', 404);
      await updatePassword(account.id, hashPassword(password));
    } else {
      if (await findAccountByEmail(t.email)) return jsonError('Un compte existe déjà avec cette adresse. Utilisez « Mot de passe oublié ».', 409);
      account = await createAccount({
        email: t.email, passwordHash: hashPassword(password),
        kind: KIND_OF_TABLE[t.table_name] || 'pro', recordId: t.record_id,
      });
    }

    const table = TABLE_OF_KIND[account.kind];
    const record = await getRecord(table, account.record_id);
    if (record && !record.verified) await saveRecord(table, { ...record, verified: true, verifyToken: null });

    return setSessionCookie(NextResponse.json({ account: publicAccount(account) }), account.id);
  } catch (e) {
    console.error('[ONASKILL] reset error:', e);
    return jsonError('Une erreur est survenue, réessayez plus tard.', 500);
  }
}
