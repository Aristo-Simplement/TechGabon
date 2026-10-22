// One web address per screen of the site, shared by the browser (navigation, back button)
// and the server (what to pre-render for a given address).
//
//   /                               home
//   /recherche                      search
//   /pro/<id>/<prenom-nom-metier>   a professional's profile (the name part is cosmetic)
//   /demande/<id>                   a request and its recommended profiles
//   /demande/<id>/modifier          edit a request
//   /publier-une-demande            new request
//   /mon-profil                     create / edit my professional profile
//   /ma-fiche-entreprise            create / edit my company profile
//   /espace/professionnel           my professional space
//   /espace/entreprise              my company space
//   /mon-compte                     create / edit my private-individual account
//   /espace/particulier             my private-individual space (my requests)
//   /administration                 moderation space (platform owner only)
//   /inscription                    choose an account type
//   /inscription/confirmation       "check your inbox" after sign-up
//   /connexion                      log in / forgot password
//   /conditions                     terms of use
//   /confidentialite                privacy policy
//   /mentions-legales               legal notice

const STATIC = {
  home: '/',
  search: '/recherche',
  missionform: '/publier-une-demande',
  proform: '/mon-profil',
  companyform: '/ma-fiche-entreprise',
  dashpro: '/espace/professionnel',
  dashcompany: '/espace/entreprise',
  particulierform: '/mon-compte',
  dashpart: '/espace/particulier',
  admin: '/administration',
  choosetype: '/inscription',
  checkemail: '/inscription/confirmation',
  login: '/connexion',
  terms: '/conditions',
  privacy: '/confidentialite',
  legal: '/mentions-legales',
};
const BY_PATH = Object.fromEntries(Object.entries(STATIC).map(([screen, path]) => [path, screen]));

export function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function profilePath(p) {
  return `/pro/${encodeURIComponent(p.id)}/${slugify(`${p.prenom} ${p.nom} ${p.metier}`)}`;
}

export function pathFor(screen, id, professionals = []) {
  if (screen === 'profile' && id) {
    const p = professionals.find((x) => x.id === id);
    return p ? profilePath(p) : `/pro/${encodeURIComponent(id)}`;
  }
  if (screen === 'matching' && id) return `/demande/${encodeURIComponent(id)}`;
  if (screen === 'missionform' && id) return `/demande/${encodeURIComponent(id)}/modifier`;
  return STATIC[screen] || '/';
}

// { screen, id } for an address, or null if the address isn't a page of the site.
export function parsePath(pathname) {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  if (BY_PATH[path]) return { screen: BY_PATH[path], id: null };
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'pro' && parts[1] && parts.length <= 3) return { screen: 'profile', id: parts[1] };
  if (parts[0] === 'demande' && parts[1] && parts.length === 2) return { screen: 'matching', id: parts[1] };
  if (parts[0] === 'demande' && parts[1] && parts[2] === 'modifier' && parts.length === 3) return { screen: 'missionform', id: parts[1] };
  return null;
}

export const SCREEN_TITLES = {
  home: null,
  search: 'Trouver un professionnel',
  missionform: 'Publier une demande',
  proform: 'Mon profil professionnel',
  companyform: 'Ma fiche entreprise',
  dashpro: 'Mon espace professionnel',
  dashcompany: 'Mon espace entreprise',
  particulierform: 'Mon compte particulier',
  dashpart: 'Mon espace particulier',
  admin: 'Administration',
  choosetype: 'Créer un compte',
  checkemail: 'Vérifiez votre boîte mail',
  login: 'Connexion',
  terms: "Conditions générales d'utilisation",
  privacy: 'Politique de confidentialité',
  legal: 'Mentions légales',
  matching: 'Demande',
};
