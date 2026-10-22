// Automatic profile scores (0–100), computed from what people fill in when they sign up.
// Used live in the sign-up forms (so people see how to improve) and recomputed by the
// API on save, so a stored score always matches the record and can't be typed in by hand.
//
// Each score is a sum of weighted parts; every part reports its points, its maximum and,
// when not full, a short tip telling the person what would raise it.
//
// In line with "avec ou sans diplôme": diplomas weigh little; experience, skills and a
// complete profile weigh more.

const round = (n) => Math.round(n);
const len = (s) => (s || '').trim().length;

function part(key, label, points, max, tip) {
  const p = Math.max(0, Math.min(max, round(points)));
  return { key, label, points: p, max, tip: p < max ? tip : null };
}

function total(parts) {
  return { score: parts.reduce((s, p) => s + p.points, 0), parts };
}

export function scoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'À compléter';
}

/* ---------- Professionnel ---------- */
export function scoreProfessional(p = {}) {
  const exp = Number(p.experience) || 0;
  const comps = p.competences || [];
  const certs = p.certifications || [];
  const docs = p.docs || {};
  const cv = docs.cv;

  // Expérience — 30 pts, full at 15 years.
  const experience = part('experience', 'Expérience', (Math.min(exp, 15) / 15) * 30, 30,
    'Indiquez vos années d’expérience.');

  // Compétences — 20 pts: up to 5 skills (12) + their average level (8).
  const avgLevel = comps.length ? comps.reduce((s, c) => s + (Number(c.level) || 3), 0) / comps.length : 0;
  const competences = part('competences', 'Compétences',
    (Math.min(comps.length, 5) / 5) * 12 + (avgLevel / 5) * 8, 20,
    'Ajoutez au moins 5 compétences avec leur niveau.');

  // Qualité du CV — 20 pts: CV present (10), readable format (PDF 5, Word 3),
  // substantial document (≥ 30 Ko: 5, ≥ 10 Ko: 2 — a near-empty file scores low).
  let cvPts = 0;
  let cvTip = 'Ajoutez votre CV.';
  if (cv && !cv.error) {
    cvPts = 10;
    const name = (cv.name || '').toLowerCase();
    const isPdf = cv.type === 'application/pdf' || name.endsWith('.pdf');
    const isWord = /\.(docx?)$/.test(name) || (cv.type || '').includes('word');
    cvPts += isPdf ? 5 : isWord ? 3 : 0;
    const kb = (cv.size || 0) / 1024;
    cvPts += kb >= 30 ? 5 : kb >= 10 ? 2 : 0;
    cvTip = !isPdf ? 'Un CV au format PDF est plus lisible pour les recruteurs.' : 'Votre CV semble très court : détaillez vos expériences.';
  }
  const cvPart = part('cv', 'Qualité du CV', cvPts, 20, cvTip);

  // Diplômes et certifications — 15 pts (optional by design).
  const certifsDocs = (docs.certifs || []).length;
  const verifiedCerts = certs.filter((c) => c.verified).length;
  const diplomes = part('diplomes', 'Diplômes et certifications',
    (docs.diplome ? 5 : 0) + (Math.min(certs.length, 3) / 3) * 5 + (certifsDocs ? 3 : 0) + (verifiedCerts ? 2 : 0), 15,
    'Facultatif : ajoutez un diplôme ou une certification et son justificatif.');

  // Profil complet et fiabilité — 15 pts.
  const missions = Number(p.missionsTerminees) || 0;
  const fiabilite = part('fiabilite', 'Profil complet',
    (len(p.telephone) ? 2 : 0) + (len(p.email) ? 2 : 0) + (len(p.whatsapp) ? 2 : 0) + (len(p.quartier) ? 1 : 0) +
    ((p.secteurs || []).length ? 3 : 0) + (len(p.linkedin) ? 2 : 0) + (missions > 0 && p.note ? (p.note / 5) * 3 : 0), 15,
    'Complétez WhatsApp, quartier et secteurs d’activité.');

  return total([experience, competences, cvPart, diplomes, fiabilite]);
}

/* ---------- Entreprise ---------- */
export function scoreCompany(c = {}, currentYear = new Date().getFullYear()) {
  const age = c.annee ? Math.max(0, currentYear - Number(c.annee)) : 0;
  const desc = len(c.description);

  const legal = part('legal', 'Identité légale (NIF / RCCM)', len(c.nif) >= 5 ? 25 : 0, 25,
    'Renseignez votre NIF ou RCCM.');
  const anciennete = part('anciennete', 'Ancienneté', (Math.min(age, 10) / 10) * 20, 20,
    'L’ancienneté de l’entreprise est prise en compte automatiquement.');
  const presentation = part('presentation', 'Présentation',
    (desc >= 200 ? 15 : desc >= 80 ? 8 : desc > 0 ? 4 : 0) + (c.logo ? 5 : 0), 20,
    'Décrivez votre activité en quelques phrases (200 caractères ou plus).');
  const enLigne = part('site', 'Site web', /^https?:\/\/\S+\.\S+/.test((c.site || '').trim()) ? 10 : 0, 10,
    'Ajoutez l’adresse de votre site web.');
  const contact = part('contact', 'Contact',
    (len(c.contact) ? 4 : 0) + (len(c.telephone) ? 4 : 0) + (len(c.email) ? 4 : 0) + (len(c.whatsapp) ? 3 : 0), 15,
    'Indiquez le nom d’un contact et un numéro WhatsApp.');
  const activite = part('activite', 'Activité', ((c.secteurs || []).length ? 5 : 0) + (c.effectif ? 5 : 0), 10,
    'Choisissez au moins un domaine d’activité.');

  return total([legal, anciennete, presentation, enLigne, contact, activite]);
}

/* ---------- Demande (particulier ou entreprise) ---------- */
export function scoreMission(m = {}) {
  const desc = len(m.description);
  const budget = (m.budget || '').trim().toLowerCase();

  const clarte = part('clarte', 'Clarté de la demande',
    (len(m.titre) >= 10 ? 10 : len(m.titre) ? 5 : 0) + (desc >= 150 ? 25 : desc >= 60 ? 15 : desc > 0 ? 8 : 0), 35,
    'Décrivez le travail à faire en détail (150 caractères ou plus).');
  const besoin = part('besoin', 'Besoin précis',
    (len(m.metier) ? 10 : 0) + (Math.min((m.competences || []).length, 3) / 3) * 10 + (m.experienceMin !== undefined && m.experienceMin !== '' ? 5 : 0), 25,
    'Précisez les compétences attendues.');
  const logistique = part('logistique', 'Lieu et date',
    (len(m.ville) ? 8 : 0) + (len(m.quartier) ? 4 : 0) + (len(m.date) ? 7 : 0) + (len(m.duree) ? 6 : 0), 25,
    'Indiquez le quartier et la date souhaitée.');
  const budgetPart = part('budget', 'Budget', !budget ? 0 : budget.includes('discuter') ? 8 : 15, 15,
    'Indiquer un budget attire plus de réponses.');

  return total([clarte, besoin, logistique, budgetPart]);
}
