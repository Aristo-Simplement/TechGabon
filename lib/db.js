import fs from 'node:fs';
import path from 'node:path';
import { sql } from '@vercel/postgres';

// Data access for the API routes. Records (professionals, companies, missions) are
// stored as one JSONB blob each, keyed by id. Accounts (email + password hash) live in
// their own table and point to the one record they own.
//
// Local development without a database: when no POSTGRES_URL is configured and we are
// not running on Vercel, data is kept in a local file (.data/dev-db.json, not committed)
// so it survives restarts. On Vercel the real Postgres database is always used — a
// missing variable there fails loudly rather than silently losing data.

const RECORD_TABLES = new Set(['professionals', 'companies', 'particuliers', 'missions']);

// Which table holds the record of each kind of account.
export const TABLE_OF_KIND = { pro: 'professionals', company: 'companies', particulier: 'particuliers' };
export const KIND_OF_TABLE = { professionals: 'pro', companies: 'company', particuliers: 'particulier' };
const useMemory = !process.env.POSTGRES_URL && !process.env.VERCEL;
const DEV_FILE = path.join(process.cwd(), '.data', 'dev-db.json');
const STORES = ['professionals', 'companies', 'particuliers', 'missions', 'accounts', 'emailTokens'];

function loadDevFile() {
  const db = Object.fromEntries(STORES.map((k) => [k, new Map()]));
  try {
    const raw = JSON.parse(fs.readFileSync(DEV_FILE, 'utf8'));
    for (const k of STORES) for (const [id, v] of Object.entries(raw[k] || {})) db[k].set(id, v);
  } catch {
    // no file yet: start empty
  }
  return db;
}
const mem = useMemory ? (globalThis.__onaskillDevDb ||= loadDevFile()) : null;

function persist() {
  if (!useMemory) return;
  fs.mkdirSync(path.dirname(DEV_FILE), { recursive: true });
  const out = Object.fromEntries(STORES.map((k) => [k, Object.fromEntries(mem[k])]));
  fs.writeFileSync(DEV_FILE, JSON.stringify(out));
}

if (useMemory && !globalThis.__onaskillMemoryWarned) {
  globalThis.__onaskillMemoryWarned = true;
  console.warn('[ONASKILL] POSTGRES_URL absente : base de données locale de développement (.data/dev-db.json).');
}

let tablesReady = false;

export async function ensureTables() {
  if (useMemory || tablesReady) return; // avoid re-running on every request in the same warm instance
  for (const table of RECORD_TABLES) {
    await sql.query(`CREATE TABLE IF NOT EXISTS ${table} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  }
  await sql`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    kind TEXT NOT NULL,
    record_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS email_tokens (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    account_id TEXT,
    table_name TEXT,
    record_id TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  tablesReady = true;
}

function checkTable(table) {
  if (!RECORD_TABLES.has(table)) throw new Error(`Table inconnue : ${table}`);
}

export function uid() { return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

const SEEDS = { professionals: seedProfessionals, companies: seedCompanies, particuliers: () => [], missions: seedMissions };

/* ---------- records ---------- */

export async function listRecords(table) {
  checkTable(table);
  await ensureTables();
  if (useMemory) {
    if (mem[table].size === 0) { for (const r of SEEDS[table]()) mem[table].set(r.id, r); persist(); }
    return Promise.all([...mem[table].values()].map((r) => migrateDemo(table, r)));
  }
  const { rows } = await sql.query(`SELECT data FROM ${table} ORDER BY created_at ASC`);
  if (rows.length) return Promise.all(rows.map((r) => migrateDemo(table, r.data)));
  // One-time bootstrap content so a brand new database isn't empty.
  const seed = SEEDS[table]();
  for (const record of seed) await saveRecord(table, record);
  return seed;
}

export async function getRecord(table, id) {
  checkTable(table);
  await ensureTables();
  if (useMemory) return mem[table].get(id) || null;
  const { rows } = await sql.query(`SELECT data FROM ${table} WHERE id = $1`, [id]);
  return rows[0] ? rows[0].data : null;
}

export async function saveRecord(table, record) {
  checkTable(table);
  await ensureTables();
  if (useMemory) { mem[table].set(record.id, record); persist(); return record; }
  const json = JSON.stringify(record);
  await sql.query(
    `INSERT INTO ${table} (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = $2::jsonb`,
    [record.id, json]
  );
  return record;
}

export async function deleteRecord(table, id) {
  checkTable(table);
  await ensureTables();
  if (useMemory) { mem[table].delete(id); persist(); return; }
  await sql.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

/* ---------- accounts ---------- */

export async function findAccountByEmail(email) {
  await ensureTables();
  const e = String(email || '').trim().toLowerCase();
  if (useMemory) return [...mem.accounts.values()].find((a) => a.email === e) || null;
  const { rows } = await sql`SELECT * FROM accounts WHERE email = ${e}`;
  return rows[0] || null;
}

export async function getAccount(id) {
  if (!id) return null;
  await ensureTables();
  if (useMemory) return mem.accounts.get(id) || null;
  const { rows } = await sql`SELECT * FROM accounts WHERE id = ${id}`;
  return rows[0] || null;
}

// Throws an Error with code 'EMAIL_TAKEN' if the email already has an account.
export async function createAccount({ email, passwordHash, kind, recordId }) {
  await ensureTables();
  const account = { id: uid(), email: String(email).trim().toLowerCase(), password_hash: passwordHash, kind, record_id: recordId };
  if (useMemory) {
    if ([...mem.accounts.values()].some((a) => a.email === account.email)) throw Object.assign(new Error('EMAIL_TAKEN'), { code: 'EMAIL_TAKEN' });
    mem.accounts.set(account.id, account);
    persist();
    return account;
  }
  try {
    await sql`INSERT INTO accounts (id, email, password_hash, kind, record_id)
              VALUES (${account.id}, ${account.email}, ${account.password_hash}, ${kind}, ${recordId})`;
  } catch (e) {
    if (String(e && e.code) === '23505') throw Object.assign(new Error('EMAIL_TAKEN'), { code: 'EMAIL_TAKEN' });
    throw e;
  }
  return account;
}

export async function deleteAccount(id) {
  await ensureTables();
  if (useMemory) { mem.accounts.delete(id); persist(); return; }
  await sql`DELETE FROM accounts WHERE id = ${id}`;
}

export async function updatePassword(accountId, passwordHash) {
  await ensureTables();
  if (useMemory) {
    const a = mem.accounts.get(accountId);
    if (a) { a.password_hash = passwordHash; persist(); }
    return;
  }
  await sql`UPDATE accounts SET password_hash = ${passwordHash} WHERE id = ${accountId}`;
}

export async function listAccounts() {
  await ensureTables();
  if (useMemory) return [...mem.accounts.values()];
  const { rows } = await sql`SELECT id, email, kind, record_id, created_at FROM accounts ORDER BY created_at ASC`;
  return rows;
}

export async function findAccountByRecord(recordId) {
  await ensureTables();
  if (useMemory) return [...mem.accounts.values()].find((a) => a.record_id === recordId) || null;
  const { rows } = await sql`SELECT * FROM accounts WHERE record_id = ${recordId}`;
  return rows[0] || null;
}

// Ids of records that belong to an account (records without one are demo or legacy).
export async function accountRecordIds() {
  await ensureTables();
  if (useMemory) return new Set([...mem.accounts.values()].map((a) => a.record_id));
  const { rows } = await sql`SELECT record_id FROM accounts`;
  return new Set(rows.map((r) => r.record_id));
}

// A professional or company record using this email that no account owns yet
// (created before accounts existed). Returns { table, kind, record } or null.
export async function findUnclaimedRecordByEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return null;
  const owned = await accountRecordIds();
  for (const [table, kind] of [['professionals', 'pro'], ['companies', 'company']]) {
    let rows;
    if (useMemory) rows = [...mem[table].values()];
    else rows = (await sql.query(`SELECT data FROM ${table} WHERE lower(data->>'email') = $1`, [e])).rows.map((r) => r.data);
    const record = rows.find((r) => !r.demo && String(r.email || '').trim().toLowerCase() === e && !owned.has(r.id));
    if (record) return { table, kind, record };
  }
  return null;
}

/* ---------- one-time email links (password reset / claim an existing profile) ---------- */

export async function saveEmailToken(t) {
  await ensureTables();
  if (useMemory) { mem.emailTokens.set(t.token_hash, t); persist(); return; }
  await sql`INSERT INTO email_tokens (token_hash, email, purpose, account_id, table_name, record_id, expires_at)
            VALUES (${t.token_hash}, ${t.email}, ${t.purpose}, ${t.account_id || null}, ${t.table_name || null}, ${t.record_id || null}, ${new Date(t.expires_at).toISOString()})`;
}

// Returns the token (and deletes it) if it exists and hasn't expired — single use.
export async function consumeEmailToken(tokenHash) {
  await ensureTables();
  let t;
  if (useMemory) {
    t = mem.emailTokens.get(tokenHash) || null;
    mem.emailTokens.delete(tokenHash);
    persist();
  } else {
    const { rows } = await sql`DELETE FROM email_tokens WHERE token_hash = ${tokenHash} RETURNING *`;
    t = rows[0] || null;
  }
  if (!t || new Date(t.expires_at).getTime() < Date.now()) return null;
  return t;
}

// When the last link was sent to this email (to avoid flooding someone's inbox).
export async function lastEmailTokenAt(email) {
  await ensureTables();
  const e = String(email || '').trim().toLowerCase();
  if (useMemory) {
    const times = [...mem.emailTokens.values()].filter((t) => t.email === e).map((t) => new Date(t.created_at).getTime());
    return times.length ? Math.max(...times) : 0;
  }
  const { rows } = await sql`SELECT max(created_at) AS last FROM email_tokens WHERE email = ${e}`;
  return rows[0] && rows[0].last ? new Date(rows[0].last).getTime() : 0;
}

/* ---------- demo content ---------- */

// Records created by earlier versions of the demo content get flagged as demo (so they
// are labelled "Exemple" and can't be claimed), and the real company name previously
// used in the demo is replaced by a fictional one.
const DEMO_PROS = new Set(['Jean Mabiala', 'Serge Nzeng', 'Marius Lendoye', 'Chantal Moussavou']);
async function migrateDemo(table, r) {
  if (r.demo) return r;
  let patch = null;
  // Demo professionals used placeholder addresses (…@email.com) or none.
  const placeholderEmail = !r.email || String(r.email).endsWith('@email.com');
  if (table === 'professionals' && DEMO_PROS.has(`${r.prenom} ${r.nom}`) && placeholderEmail) patch = { demo: true };
  if (table === 'companies' && String(r.nom || '').startsWith('SOBRAGA')) patch = { demo: true, nom: 'Entreprise exemple — Maintenance industrielle', description: 'Fiche de démonstration : une entreprise fictive qui recrute régulièrement des techniciens.', telephone: '', contact: 'Service maintenance' };
  if (table === 'missions' && r.clientName === 'SOBRAGA' && r.titre === 'Recherche technicien instrumentation') patch = { demo: true, clientName: 'Entreprise exemple' };
  if (!patch) return r;
  const updated = { ...r, ...patch };
  await saveRecord(table, updated);
  return updated;
}
// Demo profiles have no account, so nobody can edit or delete them from the site.

export function seedProfessionals() {
  return [
    { id: uid(), nom: 'Mabiala', prenom: 'Jean', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Bord de mer', dispo: 'now', metier: 'Maintenancier industriel', experience: 7, note: 4.8, missionsTerminees: 14, secteurs: ['Industrie', 'Maintenance & Services industriels'], competences: [{ name: 'Mécanique industrielle', level: 5 }, { name: 'Pompes', level: 5 }], certifications: [{ name: 'HSE', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 74 12 34 56', email: 'jean.mabiala@email.com', whatsapp: '+24174123456', linkedin: '', verified: true, demo: true },
    { id: uid(), nom: 'Nzeng', prenom: 'Serge', province: 'Estuaire', ville: 'Libreville', quartier: 'Nzeng-Ayong', dispo: 'now', metier: 'Plombier', experience: 8, note: 4.7, missionsTerminees: 22, secteurs: ['Bâtiment', 'Services à la personne'], competences: [{ name: 'Tuyauterie PVC', level: 5 }], certifications: [{ name: 'CAP Plomberie', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 62 33 44 55', email: 'serge.n@email.com', whatsapp: '+24162334455', linkedin: '', verified: true, demo: true },
    { id: uid(), nom: 'Lendoye', prenom: 'Marius', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Grand Village', dispo: 'now', metier: 'Soudeur', experience: 12, note: 4.9, missionsTerminees: 27, secteurs: ['Industrie', 'Pétrole & Gaz', 'BTP'], competences: [{ name: "Soudure à l'arc", level: 5 }], certifications: [{ name: 'Qualification soudure', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 65 77 88 99', email: 'marius.l@email.com', whatsapp: '+24165778899', linkedin: '', verified: true, demo: true },
    { id: uid(), nom: 'Moussavou', prenom: 'Chantal', province: 'Estuaire', ville: 'Libreville', quartier: 'Glass', dispo: 'now', metier: 'Coiffeur / Coiffeuse', experience: 6, note: 4.8, missionsTerminees: 40, secteurs: ['Beauté & Bien-être'], competences: [{ name: 'Coiffure afro', level: 5 }], certifications: [{ name: 'CAP Coiffure', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 66 22 33 11', email: '', whatsapp: '+24166223311', linkedin: '', verified: true, demo: true },
  ];
}

export function seedCompanies() {
  return [
    { id: uid(), nom: 'Entreprise exemple — Maintenance industrielle', province: 'Estuaire', ville: 'Libreville', quartier: 'Oloumi', annee: 2005, effectif: '51-200', site: '', nif: '', secteurs: ['Industrie', 'Maintenance & Services industriels'], description: 'Fiche de démonstration : une entreprise fictive qui recrute régulièrement des techniciens.', logo: null, contact: 'Service maintenance', telephone: '', email: '', whatsapp: '', verified: true, demo: true },
  ];
}

export function seedMissions() {
  return [
    { id: uid(), demo: true, clientType: 'entreprise', clientName: 'Entreprise exemple', titre: 'Recherche technicien instrumentation', metier: 'Instrumentiste', experienceMin: 3, competences: ['Calibration', 'Pression'], secteur: 'Pétrole & Gaz', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: '', duree: '5 jours', date: '25/08/2026', statut: 'active', budget: 'À discuter', description: 'Intervention sur instruments de mesure...' },
  ];
}
