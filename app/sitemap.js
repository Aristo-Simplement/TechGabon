import { SITE_URL } from '@/lib/site';
import { listRecords } from '@/lib/db';
import { profilePath } from '@/lib/routes';

// List of pages for search engines: the main pages plus every public profile.
export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const pages = ['/', '/recherche', '/inscription', '/conditions', '/confidentialite', '/mentions-legales']
    .map((path) => ({ url: SITE_URL + path, changeFrequency: 'weekly', priority: path === '/' ? 1 : 0.5 }));
  let profiles = [];
  try {
    profiles = (await listRecords('professionals'))
      .filter((p) => !p.demo && !p.hidden)
      .map((p) => ({ url: SITE_URL + profilePath(p), changeFrequency: 'weekly', priority: 0.7 }));
  } catch (e) {
    console.error('[ONASKILL] sitemap: profils indisponibles', e && e.message);
  }
  return [...pages, ...profiles];
}
