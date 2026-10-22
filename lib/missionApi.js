import { NextResponse } from 'next/server';
import { listRecords, getRecord, saveRecord, deleteRecord, uid } from '@/lib/db';
import { currentAccount, newToken, hashToken, sameOrigin, jsonError, TERMS_VERSION } from '@/lib/auth';
import { missionInput, publicMission } from '@/lib/records';
import { scoreMission } from '@/lib/scoring';

// Missions (requests). A logged-in company owns its missions through its account.
// A private individual publishes without an account: the server returns a secret
// "edit key" once, the browser keeps it, and only that key (stored hashed) can later
// modify or delete the request.

async function canManage(request, mission) {
  const account = await currentAccount(request);
  if (account && mission.ownerAccountId && mission.ownerAccountId === account.id) return true;
  const key = request.headers.get('x-mission-key');
  return !!(key && mission.ownerKeyHash && hashToken(key) === mission.ownerKeyHash);
}

export async function GET() {
  try {
    const rows = await listRecords('missions');
    return NextResponse.json(rows.filter((r) => !r.hidden).map(publicMission));
  } catch (e) {
    console.error('[ONASKILL] GET /api/missions error:', e);
    return jsonError('Chargement impossible', 500);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  let body;
  try { body = await request.json(); } catch { return jsonError('JSON invalide', 400); }
  const incoming = (body && body.record) || {};
  try {
    const existing = incoming.id ? await getRecord('missions', incoming.id) : null;

    if (existing) {
      if (!(await canManage(request, existing))) return jsonError('Vous ne pouvez modifier que vos propres demandes.', 403);
      const record = { ...existing, ...missionInput(incoming), id: existing.id };
      record.score = scoreMission(record).score;
      await saveRecord('missions', record);
      return NextResponse.json({ record: publicMission(record) });
    }

    const account = await currentAccount(request);
    const record = { ...missionInput(incoming), id: uid() };
    let key = null;
    if (account) {
      record.ownerAccountId = account.id;
      if (account.kind === 'particulier') record.clientType = 'particulier';
      if (account.kind === 'company') record.clientType = 'entreprise';
    } else {
      if (incoming.acceptTerms !== true) return jsonError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.", 400);
      record.termsAcceptedAt = new Date().toISOString();
      record.termsVersion = TERMS_VERSION;
      key = newToken();
      record.ownerKeyHash = hashToken(key);
      record.clientType = 'particulier';
    }
    record.score = scoreMission(record).score;
    await saveRecord('missions', record);
    return NextResponse.json({ record: publicMission(record), key }, { status: 201 });
  } catch (e) {
    console.error('[ONASKILL] POST /api/missions error:', e);
    return jsonError("Échec de l'enregistrement", 500);
  }
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) return jsonError('Origine refusée', 403);
  const { id } = await params;
  try {
    const mission = await getRecord('missions', id);
    if (!mission) return jsonError('Demande introuvable', 404);
    if (!(await canManage(request, mission))) return jsonError('Vous ne pouvez supprimer que vos propres demandes.', 403);
    await deleteRecord('missions', id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ONASKILL] DELETE /api/missions error:', e);
    return jsonError('Échec de la suppression', 500);
  }
}
