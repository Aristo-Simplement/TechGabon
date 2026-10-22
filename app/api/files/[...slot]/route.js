import { getRecord } from '@/lib/db';
import { currentAccount, jsonError } from '@/lib/auth';
import { readStoredFile } from '@/lib/files';

// Opens one of MY private documents — only for the logged-in owner.
//   /api/files/cv   /api/files/diplome   /api/files/certif/<n>
export async function GET(request, { params }) {
  const account = await currentAccount(request);
  if (!account || account.kind !== 'pro') return jsonError('Connectez-vous pour ouvrir vos documents.', 401);
  const record = await getRecord('professionals', account.record_id);
  const docs = (record && record.docs) || {};
  const [slot, index] = (await params).slot || [];
  const f = slot === 'cv' ? docs.cv : slot === 'diplome' ? docs.diplome : slot === 'certif' ? (docs.certifs || [])[Number(index)] : null;
  const file = await readStoredFile(f);
  if (!file) return jsonError('Document introuvable.', 404);
  // Only PDFs and images are shown in the browser; anything else is downloaded. The
  // sandbox policy means an uploaded file can never run scripts on this site.
  const viewable = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
  return new Response(file.body, {
    headers: {
      'Content-Type': viewable ? file.type : 'application/octet-stream',
      'Content-Disposition': `${viewable ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      'Content-Security-Policy': 'sandbox',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
