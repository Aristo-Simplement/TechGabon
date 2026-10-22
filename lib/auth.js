import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAccount, getRecord, TABLE_OF_KIND } from '@/lib/db';

// Server-only helpers for accounts: password hashing (scrypt + random salt), a signed
// session cookie (HttpOnly, unreadable by page scripts), one-time tokens and a
// same-origin check for requests that change data.

const COOKIE = 'onaskill_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Signing key: SESSION_SECRET if set; otherwise derived from the database URL (already a
// secret only the server knows). Local development without a database uses a fixed key.
function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.POSTGRES_URL) {
    return crypto.createHash('sha256').update('onaskill-session:' + process.env.POSTGRES_URL).digest('hex');
  }
  if (process.env.VERCEL) throw new Error('SESSION_SECRET ou POSTGRES_URL manquant');
  return 'onaskill-local-development-only';
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [alg, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(String(password), Buffer.from(salt, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export function newToken() { return crypto.randomBytes(24).toString('base64url'); }
export function hashToken(token) { return crypto.createHash('sha256').update(String(token)).digest('hex'); }

function sign(value) { return crypto.createHmac('sha256', secret()).update(value).digest('base64url'); }

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const m = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

// Account id from a valid, unexpired session cookie — or null.
export function readSession(request) {
  const raw = readCookie(request, COOKIE);
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { a, e } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Date.now() < e ? a : null;
  } catch {
    return null;
  }
}

export async function currentAccount(request) {
  return getAccount(readSession(request));
}

export function setSessionCookie(response, accountId) {
  const payload = Buffer.from(JSON.stringify({ a: accountId, e: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  response.cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: !!process.env.VERCEL,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE, '', { httpOnly: true, secure: !!process.env.VERCEL, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}

// Requests that change data must come from the site itself (blocks cross-site forgery).
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}

export function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

// The platform owner(s): accounts whose email is listed in ADMIN_EMAILS (Vercel →
// Settings → Environment Variables, comma-separated) AND confirmed through the emailed
// link — so nobody can become administrator just by signing up first with that address.
export async function isAdmin(account) {
  if (!account) return false;
  const admins = String(process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!admins.includes(String(account.email).toLowerCase())) return false;
  const record = await getRecord(TABLE_OF_KIND[account.kind], account.record_id);
  return !!(record && record.verified);
}

// What the browser is allowed to know about the logged-in account. `isAdmin` is only
// computed by /api/auth/me.
export function publicAccount(account, extra = {}) {
  return account ? { email: account.email, kind: account.kind, recordId: account.record_id, id: account.id, isAdmin: false, ...extra } : null;
}

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
export const PASSWORD_MIN = 8;
// Version of the terms of use / privacy policy people accept when signing up.
export const TERMS_VERSION = '2026-10-17';
