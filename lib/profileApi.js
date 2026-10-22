import { NextResponse } from 'next/server';
import { listRecords, getRecord, saveRecord, deleteRecord, uid, findAccountByEmail, createAccount } from '@/lib/db';
import { deleteAccountData } from '@/lib/moderation';
import {
  currentAccount, hashPassword, newToken, setSessionCookie, clearSessionCookie, sameOrigin,
  jsonError, publicAccount, isEmail, PASSWORD_MIN, TERMS_VERSION,
} from '@/lib/auth';
import { sendVerificationEmail, originOf } from '@/lib/email';
import { storeDocs, deleteUnusedFiles, docsWithoutContent } from '@/lib/files';

// Shared API for the two kinds of account-owned records: professional profiles and
// company profiles. One account owns exactly one record.
//
//   GET    /api/<table>        → public list (no private data)
//   POST   /api/<table>        → not logged in: sign up (record + account + session)
//                                logged in: update the caller's own record only
//   DELETE /api/<table>/<id>   → owner only; also deletes the account and logs out
//
// `cfg`: { table, kind, input(body, stored), publicView(record), score(record), displayName(record) }

// The owner's own view of their record: everything except the confirmation token.
function ownView(record) {
  const { verifyToken, ...own } = record; // eslint-disable-line no-unused-vars
  if (own.docs) own.docs = docsWithoutContent(own.docs); // documents are opened via /api/files
  return own;
}

export function profileHandlers(cfg) {
  async function GET() {
    try {
      const rows = await listRecords(cfg.table);
      // Records hidden by moderation are not shown to visitors.
      return NextResponse.json(rows.filter((r) => !r.hidden).map(cfg.publicView));
    } catch (e) {
      console.error(`[ONASKILL] GET /api/${cfg.table} error:`, e);
      return jsonError('Chargement impossible', 500);
    }
  }

  async function POST(request) {
    if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
    let body;
    try { body = await request.json(); } catch { return jsonError('JSON invalide', 400); }
    const incoming = (body && body.record) || {};

    try {
      const account = await currentAccount(request);

      // ---- update: only your own record ----
      if (account) {
        if (account.kind !== cfg.kind || (incoming.id && incoming.id !== account.record_id)) {
          return jsonError('Vous ne pouvez modifier que votre propre fiche.', 403);
        }
        const stored = await getRecord(cfg.table, account.record_id);
        if (!stored) return jsonError('Fiche introuvable', 404);
        const record = {
          ...stored,
          ...cfg.input(incoming, stored),
          id: stored.id,
        };
        if (record.docs) record.docs = await storeDocs(record.docs, record.id);
        record.score = cfg.score(record).score;
        await saveRecord(cfg.table, record);
        await deleteUnusedFiles(stored.docs, record.docs);
        return NextResponse.json({ record: ownView(record), account: publicAccount(account) });
      }

      // ---- sign up ----
      const email = String(incoming.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!isEmail(email)) return jsonError('Adresse e-mail invalide.', 400);
      if (password.length < PASSWORD_MIN) return jsonError(`Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`, 400);
      if (incoming.acceptTerms !== true) return jsonError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.", 400);
      if (await findAccountByEmail(email)) return jsonError('Un compte existe déjà avec cette adresse e-mail. Connectez-vous.', 409);

      const token = newToken();
      const record = {
        ...cfg.input(incoming, null),
        id: uid(),
        email,
        verified: false,
        verifyToken: token,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: TERMS_VERSION,
        ...(cfg.kind === 'pro' ? { missionsTerminees: 0, note: null } : {}),
      };
      if (record.docs) record.docs = await storeDocs(record.docs, record.id);
      record.score = cfg.score(record).score;
      await saveRecord(cfg.table, record);

      let created;
      try {
        created = await createAccount({ email, passwordHash: hashPassword(password), kind: cfg.kind, recordId: record.id });
      } catch (e) {
        await deleteRecord(cfg.table, record.id);
        if (e.code === 'EMAIL_TAKEN') return jsonError('Un compte existe déjà avec cette adresse e-mail. Connectez-vous.', 409);
        throw e;
      }

      await sendVerificationEmail({
        to: email, nom: cfg.displayName(record), type: cfg.kind,
        id: record.id, token, origin: originOf(request),
      });

      const res = NextResponse.json({ record: ownView(record), account: publicAccount(created) }, { status: 201 });
      return setSessionCookie(res, created.id);
    } catch (e) {
      console.error(`[ONASKILL] POST /api/${cfg.table} error:`, e);
      return jsonError("Échec de l'enregistrement", 500);
    }
  }

  async function DELETE(request, { params }) {
    if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
    const { id } = await params;
    try {
      const account = await currentAccount(request);
      if (!account || account.kind !== cfg.kind || account.record_id !== id) {
        return jsonError('Vous ne pouvez supprimer que votre propre fiche.', 403);
      }
      await deleteAccountData(account);
      return clearSessionCookie(NextResponse.json({ ok: true }));
    } catch (e) {
      console.error(`[ONASKILL] DELETE /api/${cfg.table}/${id} error:`, e);
      return jsonError('Échec de la suppression', 500);
    }
  }

  return { GET, POST, DELETE };
}
