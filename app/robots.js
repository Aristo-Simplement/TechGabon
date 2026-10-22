import { SITE_URL } from '@/lib/site';

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/verify", "/reset", "/espace/", "/mon-profil", "/ma-fiche-entreprise", "/mon-compte", "/administration"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
