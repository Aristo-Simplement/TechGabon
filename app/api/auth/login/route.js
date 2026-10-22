import { NextResponse } from 'next/server';
import { findAccountByEmail } from '@/lib/db';
import { verifyPassword, setSessionCookie, sameOrigin, jsonError, publicAccount } from '@/lib/auth';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  let body;
  try { body = await request.json(); } catch { return jsonError('JSON invalide', 400); }
  const account = await findAccountByEmail(body && body.email);
  // Same answer and similar timing whether the email exists or not.
  const ok = verifyPassword(String((body && body.password) || ''), account ? account.password_hash : 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==');
  if (!account || !ok) {
    await new Promise((r) => setTimeout(r, 400)); // slows down password guessing
    return jsonError('E-mail ou mot de passe incorrect.', 401);
  }
  return setSessionCookie(NextResponse.json({ account: publicAccount(account) }), account.id);
}
