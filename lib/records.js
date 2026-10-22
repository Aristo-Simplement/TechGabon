import { scoreProfessional, scoreCompany, scoreMission } from '@/lib/scoring';
import { canonicalTrade, canonicalSector, canonicalSectors } from '@/lib/taxonomy';

// What the browser may send (input whitelists) and what visitors may see (public views).
// Private, never sent to visitors: email, uploaded documents (CV, diploma, certificates —
// only "provided ✓" metadata is public), NIF, confirmation tokens, ownership secrets.
// Trust fields are server-controlled: email confirmation, completed missions, rating and
// "verified" certifications can't be set from the sign-up forms.

const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v, max = 30) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => x.trim().slice(0, 80)).slice(0, max) : []);

// Size limits match the forms: documents 1.5 Mo, logos 300 Ko (base64 is ~4/3 larger).
const MAX_DOC_DATAURL = Math.ceil(1.5 * 1024 * 1024 * 4 / 3) + 200;
const MAX_LOGO_DATAURL = Math.ceil(300 * 1024 * 4 / 3) + 200;

function file(f, maxDataUrl = MAX_DOC_DATAURL) {
  if (!f || typeof f !== 'object' || typeof f.name !== 'string') return null;
  const dataUrl = typeof f.dataUrl === 'string' ? f.dataUrl : undefined;
  if (dataUrl && dataUrl.length > maxDataUrl) return null; // too large: ignored
  return { name: f.name.slice(0, 200), size: Number(f.size) || 0, type: str(f.type, 100), dataUrl };
}
const meta = (f) => (f ? { name: f.name, size: f.size, type: f.type } : null);

// Keep the stored file (its content, or its private storage location) when the browser
// re-sends a file it already uploaded. A storage location is never accepted from the
// browser — only taken from what the server already stored for this record.
function keepContent(incoming, stored) {
  if (!incoming) return null;
  if (incoming.dataUrl) return incoming;
  if (stored && stored.name === incoming.name && (stored.dataUrl || stored.blobPath)) {
    return { name: incoming.name, size: stored.size, type: stored.type, dataUrl: stored.dataUrl, blobPath: stored.blobPath };
  }
  return null;
}

/* ---------- professionals ---------- */

export function professionalInput(body, stored) {
  const docsIn = body.docs || {};
  const storedDocs = (stored && stored.docs) || {};
  const storedCertifs = storedDocs.certifs || [];
  const verifiedNames = new Set(((stored && stored.certifications) || []).filter((c) => c.verified).map((c) => c.name));
  return {
    nom: str(body.nom, 80), prenom: str(body.prenom, 80),
    province: str(body.province, 60), ville: str(body.ville, 80), quartier: str(body.quartier, 80),
    dispo: ['now', 'soon', 'unavailable'].includes(body.dispo) ? body.dispo : 'now',
    metier: canonicalTrade(str(body.metier, 80)),
    experience: Math.max(0, Math.min(60, parseInt(body.experience, 10) || 0)),
    secteurs: canonicalSectors(strList(body.secteurs, 20)),
    competences: (Array.isArray(body.competences) ? body.competences : []).slice(0, 30)
      .map((c) => ({ name: str(c && c.name, 80), level: Math.max(1, Math.min(5, parseInt(c && c.level, 10) || 3)) }))
      .filter((c) => c.name),
    // "verified" is never accepted from the form; it is only kept if it was already set.
    certifications: (Array.isArray(body.certifications) ? body.certifications : []).slice(0, 20)
      .map((c) => ({ name: str(c && c.name, 120), verified: verifiedNames.has(str(c && c.name, 120)) }))
      .filter((c) => c.name),
    docs: {
      cv: keepContent(file(docsIn.cv), storedDocs.cv),
      diplome: keepContent(file(docsIn.diplome), storedDocs.diplome),
      certifs: (Array.isArray(docsIn.certifs) ? docsIn.certifs : []).slice(0, 10)
        .map((f) => keepContent(file(f), storedCertifs.find((s) => s.name === (f && f.name))))
        .filter(Boolean),
    },
    telephone: str(body.telephone, 40), whatsapp: str(body.whatsapp, 40), linkedin: str(body.linkedin, 300),
  };
}

export function publicProfessional(r) {
  const docs = r.docs || {};
  const { email, verifyToken, termsAcceptedAt, termsVersion, ...rest } = r; // eslint-disable-line no-unused-vars
  const pub = { ...rest, docs: { cv: meta(docs.cv), diplome: meta(docs.diplome), certifs: (docs.certifs || []).map(meta) } };
  return { ...pub, metier: canonicalTrade(pub.metier), secteurs: canonicalSectors(pub.secteurs), score: scoreProfessional(r).score };
}

/* ---------- companies ---------- */

export function companyInput(body, stored) {
  const logo = file(body.logo, MAX_LOGO_DATAURL);
  return {
    nom: str(body.nom, 120), province: str(body.province, 60), ville: str(body.ville, 80), quartier: str(body.quartier, 80),
    annee: Math.max(1900, Math.min(2100, parseInt(body.annee, 10) || new Date().getFullYear())),
    effectif: ['1-10', '11-50', '51-200', '200+'].includes(body.effectif) ? body.effectif : '1-10',
    site: str(body.site, 300), nif: str(body.nif, 60), secteurs: canonicalSectors(strList(body.secteurs, 20)),
    description: str(body.description, 3000),
    logo: keepContent(logo, stored && stored.logo),
    contact: str(body.contact, 120), telephone: str(body.telephone, 40), whatsapp: str(body.whatsapp, 40),
  };
}

export function publicCompany(r) {
  const { email, verifyToken, nif, termsAcceptedAt, termsVersion, ...rest } = r; // eslint-disable-line no-unused-vars
  return { ...rest, secteurs: canonicalSectors(rest.secteurs), hasNif: !!(nif && nif.trim()), score: scoreCompany(r).score };
}

/* ---------- private individuals (never shown publicly) ---------- */

export function particulierInput(body) {
  return {
    nom: str(body.nom, 80), prenom: str(body.prenom, 80),
    province: str(body.province, 60), ville: str(body.ville, 80), quartier: str(body.quartier, 80),
    telephone: str(body.telephone, 40), whatsapp: str(body.whatsapp, 40),
  };
}

/* ---------- missions ---------- */

export function missionInput(body) {
  return {
    clientType: body.clientType === 'particulier' ? 'particulier' : 'entreprise',
    clientName: str(body.clientName, 120), titre: str(body.titre, 160), metier: canonicalTrade(str(body.metier, 80)),
    experienceMin: Math.max(0, Math.min(40, parseInt(body.experienceMin, 10) || 0)),
    competences: strList(body.competences, 20), secteur: canonicalSector(str(body.secteur, 60)),
    province: str(body.province, 60), ville: str(body.ville, 80), quartier: str(body.quartier, 80),
    duree: str(body.duree, 60), date: str(body.date, 40),
    statut: ['active', 'pending', 'done'].includes(body.statut) ? body.statut : 'active',
    budget: str(body.budget, 80), description: str(body.description, 4000),
  };
}

export function publicMission(r) {
  const { ownerKeyHash, termsAcceptedAt, termsVersion, ...rest } = r; // eslint-disable-line no-unused-vars
  return { ...rest, metier: canonicalTrade(rest.metier), secteur: canonicalSector(rest.secteur), score: scoreMission(r).score };
}
