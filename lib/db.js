import { sql } from '@vercel/postgres';

// Each record is stored as a single JSONB blob keyed by its own id — this mirrors
// exactly how the app already shapes its data (the same objects that used to be
// JSON.stringify'd into localStorage), so almost nothing about the record SHAPE had
// to change for this migration, only where it's read from / written to.
let tablesReady = false;

export async function ensureTables() {
  if (tablesReady) return; // avoid re-running this on every request in the same warm serverless instance
  await sql`CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  tablesReady = true;
}

function uid() { return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// One-time bootstrap content so the site isn't empty on a brand new database —
// identical to the demo data the app used to seed into each visitor's own browser.
// Real signups simply get added alongside these; any of these can be deleted from
// the dashboards like any other record.
export function seedProfessionals() {
  return [
    { id: uid(), nom: 'Mabiala', prenom: 'Jean', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Bord de mer', dispo: 'now', metier: 'Technicien maintenance industrielle', experience: 7, note: 4.8, missionsTerminees: 14, secteurs: ['Industrie', 'Maintenance'], competences: [{ name: 'Mécanique industrielle', level: 5 }, { name: 'Pompes', level: 5 }], certifications: [{ name: 'HSE', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 74 12 34 56', email: 'jean.mabiala@email.com', whatsapp: '+24174123456', linkedin: '', verified: true },
    { id: uid(), nom: 'Nzeng', prenom: 'Serge', province: 'Estuaire', ville: 'Libreville', quartier: 'Nzeng-Ayong', dispo: 'now', metier: 'Plombier', experience: 8, note: 4.7, missionsTerminees: 22, secteurs: ['Bâtiment', 'Services domestiques'], competences: [{ name: 'Tuyauterie PVC', level: 5 }], certifications: [{ name: 'CAP Plomberie', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 62 33 44 55', email: 'serge.n@email.com', whatsapp: '+24162334455', linkedin: '', verified: true },
    { id: uid(), nom: 'Lendoye', prenom: 'Marius', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Grand Village', dispo: 'now', metier: 'Soudeur', experience: 12, note: 4.9, missionsTerminees: 27, secteurs: ['Industrie', 'Oil & Gas', 'BTP'], competences: [{ name: "Soudure à l'arc", level: 5 }], certifications: [{ name: 'Qualification soudure', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 65 77 88 99', email: 'marius.l@email.com', whatsapp: '+24165778899', linkedin: '', verified: true },
    { id: uid(), nom: 'Moussavou', prenom: 'Chantal', province: 'Estuaire', ville: 'Libreville', quartier: 'Glass', dispo: 'now', metier: 'Coiffure / Coiffeur(se)', experience: 6, note: 4.8, missionsTerminees: 40, secteurs: ['Coiffure & Beauté'], competences: [{ name: 'Coiffure afro', level: 5 }], certifications: [{ name: 'CAP Coiffure', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 66 22 33 11', email: '', whatsapp: '+24166223311', linkedin: '', verified: true },
  ];
}

export function seedCompanies() {
  return [
    { id: uid(), nom: 'SOBRAGA — Service PET', province: 'Estuaire', ville: 'Libreville', quartier: 'Oloumi', annee: 1978, effectif: '200+', site: '', nif: '', secteurs: ['Industrie', 'Maintenance'], description: 'Production de boissons en bouteilles plastiques.', logo: null, contact: 'Service Maintenance PET', telephone: '+241 74 00 00 00', email: '', whatsapp: '', verified: true },
  ];
}

export function seedMissions() {
  return [
    { id: uid(), clientType: 'entreprise', clientName: 'SOBRAGA', titre: 'Recherche technicien instrumentation', metier: 'Instrumentiste', experienceMin: 3, competences: ['Calibration', 'Pression'], secteur: 'Oil & Gas', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: '', duree: '5 jours', date: '25/08/2026', statut: 'active', budget: 'À discuter', description: 'Intervention sur instruments de mesure...' },
  ];
}
