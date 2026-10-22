// Public address of the site. Set NEXT_PUBLIC_SITE_URL in Vercel once a domain name is
// connected (e.g. https://onaskill.com); until then the Vercel address is used.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tech-gabon.vercel.app').replace(/\/+$/, '');
