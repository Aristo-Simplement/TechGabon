import { notFound } from 'next/navigation';
import App from '@/components/App';
import { parsePath, profilePath, SCREEN_TITLES } from '@/lib/routes';
import { listRecords } from '@/lib/db';
import { publicProfessional } from '@/lib/records';

// Every other address of the site (see lib/routes.js). Profile pages are rendered on the
// server with the professional's details, so they can be shared and found on Google.
export const dynamic = 'force-dynamic';

async function resolve(params) {
  const { path } = await params;
  const pathname = '/' + (path || []).join('/');
  const route = parsePath(pathname);
  if (!route) notFound();
  let professionals = [];
  if (route.screen === 'profile') {
    professionals = (await listRecords('professionals')).filter((p) => !p.hidden).map(publicProfessional);
    if (!professionals.some((p) => p.id === route.id)) notFound();
  }
  return { pathname, route, professionals };
}

export async function generateMetadata({ params }) {
  const { route, professionals } = await resolve(params);
  if (route.screen === 'profile') {
    const p = professionals.find((x) => x.id === route.id);
    const title = `${p.prenom} ${p.nom} — ${p.metier} à ${p.ville} | ONASKILL`;
    const description = `${p.prenom} ${p.nom}, ${p.metier.toLowerCase()} à ${p.ville} (${p.province}), ${p.experience} ans d'expérience. Contactez ce professionnel sur ONASKILL.`;
    return {
      title, description,
      alternates: { canonical: profilePath(p) },
      openGraph: { title, description, type: 'profile', url: profilePath(p) },
      // Fictional demo profiles stay out of search results.
      robots: p.demo ? { index: false, follow: true } : undefined,
    };
  }
  const t = SCREEN_TITLES[route.screen];
  const privateScreens = ['proform', 'companyform', 'particulierform', 'dashpro', 'dashcompany', 'dashpart', 'admin', 'checkemail', 'login', 'missionform'];
  const { pathname } = await resolve(params);
  return {
    title: t ? `${t} | ONASKILL` : undefined,
    alternates: { canonical: pathname },
    robots: privateScreens.includes(route.screen) ? { index: false, follow: true } : undefined,
  };
}

export default async function SitePage({ params }) {
  const { pathname, professionals } = await resolve(params);
  return <App initialPath={pathname} initialProfessionals={professionals} />;
}
