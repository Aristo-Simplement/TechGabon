import crypto from 'node:crypto';

// Private documents (CV, diploma, certificates).
//
// On Vercel with Blob storage enabled (BLOB_READ_WRITE_TOKEN is added automatically when
// a Blob store is connected to the project), uploaded files go to PRIVATE blob storage:
// they have no public URL and are only ever served through /api/files to their owner.
// Without Blob storage (local development), the file content stays inside the record.

export const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

function decodeDataUrl(dataUrl) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUrl || '');
  if (!m) return null;
  return { type: m[1] || 'application/octet-stream', buffer: m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3])) };
}

const safeName = (name) => String(name || 'fichier').normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80);

// Moves a freshly uploaded file (still carrying its content) to private storage.
async function storeOne(f, folder) {
  if (!f || !f.dataUrl || !useBlob()) return f;
  const decoded = decodeDataUrl(f.dataUrl);
  if (!decoded) return null;
  const { put } = await import('@vercel/blob');
  const pathname = `${folder}/${crypto.randomBytes(12).toString('hex')}-${safeName(f.name)}`;
  const blob = await put(pathname, decoded.buffer, { access: 'private', contentType: f.type || decoded.type, addRandomSuffix: false });
  return { name: f.name, size: f.size, type: f.type || decoded.type, blobPath: blob.pathname };
}

export async function storeDocs(docs, recordId) {
  if (!docs) return docs;
  const folder = `documents/${recordId}`;
  return {
    cv: await storeOne(docs.cv, folder),
    diplome: await storeOne(docs.diplome, folder),
    certifs: (await Promise.all((docs.certifs || []).map((f) => storeOne(f, folder)))).filter(Boolean),
  };
}

const blobPaths = (docs) => [docs && docs.cv, docs && docs.diplome, ...((docs && docs.certifs) || [])]
  .filter((f) => f && f.blobPath).map((f) => f.blobPath);

// Deletes stored files that are no longer used (replaced, removed, or account deleted).
export async function deleteUnusedFiles(oldDocs, newDocs) {
  if (!useBlob()) return;
  const keep = new Set(blobPaths(newDocs));
  const gone = blobPaths(oldDocs).filter((p) => !keep.has(p));
  if (!gone.length) return;
  try {
    const { del } = await import('@vercel/blob');
    await del(gone);
  } catch (e) {
    console.error('[ONASKILL] suppression de fichiers échouée :', e && e.message);
  }
}

// Content of one stored file: { body (stream or buffer), type } — or null.
export async function readStoredFile(f) {
  if (!f) return null;
  if (f.blobPath) {
    const { get } = await import('@vercel/blob');
    const res = await get(f.blobPath, { access: 'private' });
    if (!res || !res.stream) return null;
    return { body: res.stream, type: f.type || 'application/octet-stream' };
  }
  const decoded = decodeDataUrl(f.dataUrl);
  return decoded ? { body: decoded.buffer, type: f.type || decoded.type } : null;
}

// The owner's view of their documents, without file contents (those are fetched from
// /api/files when opened).
export function docsWithoutContent(docs) {
  if (!docs) return docs;
  const strip = (f) => (f ? { name: f.name, size: f.size, type: f.type } : null);
  return { cv: strip(docs.cv), diplome: strip(docs.diplome), certifs: (docs.certifs || []).map(strip) };
}
