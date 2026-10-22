'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import { scoreProfessional, scoreCompany, scoreMission, scoreLabel } from '@/lib/scoring';
import { pathFor, parsePath, profilePath, SCREEN_TITLES } from '@/lib/routes';
import { canonicalTrade, canonicalSector, canonicalSectors, SECTOR_ALIASES } from '@/lib/taxonomy';
import {
  Search, MapPin, Circle, Wrench, Building2, ShieldCheck, Zap,
  CheckCircle2, ArrowRight, Star, Award, Target, Quote, Clock, Menu, X, Upload,
  FileText, Trash2, Pencil, Plus, LayoutDashboard, LogIn, UserPlus, Phone, Mail,
  ExternalLink, MessageCircle, ChevronLeft, Flame, Snowflake, Droplet, Hammer, Scissors,
  Home, Smartphone, Sprout, ShoppingBag, Baby, Truck, Factory, Fuel, Mountain, Users, Car, AlertCircle, Pause, Play, Trees, UtensilsCrossed, HeartPulse, Shield, GraduationCap,
} from 'lucide-react';

/* =========================================================
   REFERENCE DATA
========================================================= */
// The 9 provinces of Gabon and their main towns (provincial capital first).
const GABON = {
  'Estuaire': ['Libreville', 'Owendo', 'Akanda', 'Ntoum', 'Kango', 'Cocobeach'],
  'Haut-Ogooué': ['Franceville', 'Moanda', 'Mounana', 'Okondja', 'Léconi', 'Akiéni', 'Bongoville', 'Boumango', 'Onga'],
  'Moyen-Ogooué': ['Lambaréné', 'Ndjolé'],
  'Ngounié': ['Mouila', 'Ndendé', 'Fougamou', 'Lébamba', 'Mbigou', 'Mimongo', 'Mandji'],
  'Nyanga': ['Tchibanga', 'Mayumba', 'Moulengui-Binza'],
  'Ogooué-Ivindo': ['Makokou', 'Booué', 'Ovan', 'Mékambo'],
  'Ogooué-Lolo': ['Koulamoutou', 'Lastoursville', 'Iboundji'],
  'Ogooué-Maritime': ['Port-Gentil', 'Omboué', 'Gamba'],
  'Woleu-Ntem': ['Oyem', 'Bitam', 'Mitzic', 'Minvoul', 'Medouneu'],
};
const PROVINCES = Object.keys(GABON);
const OTHER_CITY = '__autre__';

// Lower-case, accent-free text for forgiving comparisons ("Lambarene" finds "Lambaréné").
function norm(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Search filter values: 'all', an exact choice from the list, or 'q:<typed text>'.
// Location choices are 'prov:<Province>' (whole province) or a town name.
function matchesLocation(filter, item) {
  if (filter === 'all') return true;
  if (filter.startsWith('q:')) {
    const q = norm(filter.slice(2));
    return norm(item.ville).includes(q) || norm(item.province).includes(q);
  }
  if (filter.startsWith('prov:')) return item.province === filter.slice(5);
  return item.ville === filter;
}

function matchesTrade(filter, item) {
  if (filter === 'all') return true;
  item = { ...item, metier: canonicalTrade(item.metier) };
  // "Autre métier" finds everyone whose trade isn't in the list (typed by the person).
  if (filter === 'Autre métier') return !TRADES.includes(item.metier) || item.metier === 'Autre métier';
  if (filter.startsWith('q:')) return norm(item.metier).includes(norm(filter.slice(2)));
  return item.metier === filter;
}

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Tout le Gabon' },
  ...PROVINCES.flatMap((prov) => [
    { value: `prov:${prov}`, label: prov, hint: 'Province', strong: true },
    ...GABON[prov].map((c) => ({ value: c, label: c, hint: prov, keywords: prov, indent: true })),
  ]),
];

// Trades grouped by family. Names already used by existing profiles must not change
// (profiles store the trade name as text).
const TRADE_GROUPS = {
  'Pétrole, gaz & mines': [
    'Foreur (forage pétrolier)', 'Foreur de puits d\'eau', 'Accrocheur / Ouvrier de plancher', 'Chef de poste forage',
    'Opérateur de production pétrolière', 'Opérateur salle de contrôle', 'Instrumentiste', 'Tuyauteur', 'Échafaudeur',
    'Grutier', 'Inspecteur CND (contrôle non destructif)', 'Plongeur scaphandrier', 'Mineur', 'Géologue', 'Topographe', 'Agent HSE',
  ],
  'Industrie & maintenance': [
    'Maintenancier industriel', 'Mécanicien industriel', 'Automaticien', 'Électricien industriel', 'Soudeur',
    'Chaudronnier', 'Tourneur-fraiseur', 'Frigoriste / Climatisation', 'Agent de nettoyage industriel',
  ],
  'Bâtiment & travaux publics': [
    'Maçon', 'Carreleur', 'Électricien bâtiment', 'Plombier', 'Peintre en bâtiment', 'Menuisier', 'Charpentier', 'Couvreur',
    'Plâtrier / Staffeur', 'Ferronnier / Serrurier', 'Vitrier / Menuisier aluminium', 'Conducteur d\'engins', 'Chef de chantier',
    'Manœuvre / Ouvrier polyvalent', 'Installateur de panneaux solaires',
  ],
  'Forêt & bois': ['Bûcheron / Abatteur', 'Scieur', 'Ébéniste', 'Conducteur de débardeur', 'Agent forestier / Pépiniériste'],
  'Transport & mécanique': [
    'Chauffeur / Taximan', 'Chauffeur poids lourd', 'Mécanicien auto', 'Mécanicien engins lourds', 'Vulcanisateur / Pneumatique',
    'Électricien auto', 'Carrossier / Tôlier', 'Livreur / Coursier moto', 'Déménageur', 'Magasinier / Cariste', 'Transporteur',
  ],
  'Agriculture, pêche & élevage': ['Agriculteur', 'Éleveur', 'Pêcheur', 'Jardinier / Paysagiste', 'Technicien agricole'],
  'Services à la personne': [
    'Ménagère / Aide à domicile', "Nounou / Garde d'enfants", 'Cuisinier(ère)', 'Gardien / Agent de sécurité',
    'Blanchisseur / Repasseuse', 'Aide-soignant(e) / Infirmier(ère)',
  ],
  'Beauté & mode': ['Coiffeur / Coiffeuse', 'Barbier', 'Esthéticienne', 'Couturier / Tailleur', 'Cordonnier'],
  'Hôtellerie & restauration': ['Boulanger / Pâtissier', 'Serveur / Barman', 'Traiteur', 'Réceptionniste'],
  'Numérique & électronique': [
    'Dépanneur électronique', 'Réparateur de téléphones', 'Informaticien / Technicien réseau', 'Développeur web',
    'Infographiste', 'Installateur antennes / vidéosurveillance', 'Photographe / Vidéaste',
  ],
  'Commerce & services aux entreprises': [
    'Commerçant', 'Trader / Investisseur', 'Comptable', 'Secrétaire / Assistant(e)', 'Enseignant / Répétiteur', 'Traducteur / Interprète',
  ],
};
const TRADES = [...Object.values(TRADE_GROUPS).flat(), 'Autre métier'];

// Other words people use for a trade (spoken spellings, brands, local names), so typing
// them in the search still finds it.
const TRADE_SYNONYMS = {
  'Foreur (forage pétrolier)': 'fourreur foreur forage driller sondeur',
  "Foreur de puits d'eau": 'fourreur foreur forage puits eau sondeur',
  'Accrocheur / Ouvrier de plancher': 'roughneck floorman plancher',
  'Vulcanisateur / Pneumatique': 'michelin pneu pneus pneumatique vulcanisation crevaison',
  'Bûcheron / Abatteur': 'bucheron abattage tronçonneur foret',
  'Conducteur de débardeur': 'debardage skidder grumier',
  'Chauffeur / Taximan': 'taxi clando chauffeur',
  'Livreur / Coursier moto': 'moto livraison coursier',
  'Mécanicien auto': 'garagiste garage voiture',
  'Frigoriste / Climatisation': 'clim climatiseur froid frigo',
  'Coiffeur / Coiffeuse': 'coiffure tresses salon',
  'Maintenancier industriel': 'maintenance technicien maintenance',
  'Dépanneur électronique': 'depannage electronique reparation',
  'Ménagère / Aide à domicile': 'menage menagere bonne femme de menage',
  "Nounou / Garde d'enfants": 'babysitter baby-sitter enfants',
  'Gardien / Agent de sécurité': 'vigile gardiennage securite',
  'Réparateur de téléphones': 'portable smartphone telephone',
  'Couturier / Tailleur': 'couture couturiere',
  'Plongeur scaphandrier': 'plongee offshore',
};

const TRADE_OPTIONS = [
  { value: 'all', label: 'Tous les métiers' },
  ...Object.entries(TRADE_GROUPS).flatMap(([group, trades]) => trades.map((t) => ({ value: t, label: t, hint: group, keywords: `${group} ${TRADE_SYNONYMS[t] || ''}` }))),
  { value: 'Autre métier', label: 'Autre métier' },
];

const SECTOR_KEYS = [
  'Pétrole & Gaz', 'Industrie', 'BTP', 'Mines', 'Énergie', 'Maintenance & Services industriels',
  'Transport & Logistique', 'Bâtiment', 'Agriculture & Élevage', 'Commerce & Distribution',
  'Services à la personne', 'Numérique & Télécoms', 'Beauté & Bien-être',
  'Forêt & Bois', 'Hôtellerie & Restauration', 'Santé', 'Sécurité & Gardiennage', 'Éducation & Formation',
];

// Old sector names and common words still find the sector when typed.
const SECTOR_KEYWORDS = {
  'Pétrole & Gaz': 'oil gas petrolier offshore', 'Beauté & Bien-être': 'coiffure esthetique', 'Numérique & Télécoms': 'informatique electronique telephonie',
  'Services à la personne': 'domestique menage', 'Agriculture & Élevage': 'ferme peche', 'Commerce & Distribution': 'vente boutique marche',
  'Maintenance & Services industriels': 'maintenance', 'Forêt & Bois': 'foret exploitation forestiere scierie',
};
const SECTOR_OPTIONS = [
  { value: 'all', label: 'Tous les secteurs' },
  ...SECTOR_KEYS.map((k) => ({
    value: k, label: k,
    keywords: [SECTOR_KEYWORDS[k] || '', ...Object.keys(SECTOR_ALIASES).filter((old) => SECTOR_ALIASES[old] === k)].join(' '),
  })),
];

function matchesSector(filter, item) {
  if (filter === 'all') return true;
  const secteurs = canonicalSectors(item.secteurs);
  if (filter.startsWith('q:')) return secteurs.some((x) => norm(x).includes(norm(filter.slice(2))));
  return secteurs.includes(canonicalSector(filter));
}

// Photos: Unsplash (free commercial licence), served from /public/images — see
// public/images/CREDITS.md for the photographer of each one.

// Showcase — "Nos Métiers": real photos of professionals mid-activity, one per trade.
const PHOTO_SHOWCASE = [
  { title: 'Soudeur', trade: 'Soudeur', subtitle: 'Soudure industrielle', Icon: Flame, img: '/images/metiers/soudure-industrielle.jpg' },
  { title: 'Électricien', trade: 'Électricien industriel', subtitle: 'Électricité industrielle', Icon: Zap, img: '/images/metiers/electricite-industrielle.jpg' },
  { title: 'Frigoriste / Climaticien', trade: 'Frigoriste / Climatisation', subtitle: 'Climatisation', Icon: Snowflake, img: '/images/metiers/climatisation-industrielle.jpg' },
  { title: 'Plombier', trade: 'Plombier', subtitle: 'Plomberie', Icon: Droplet, img: '/images/metiers/plomberie.jpg' },
  { title: 'Maçon', trade: 'Maçon', subtitle: 'Maçonnerie', Icon: Hammer, img: '/images/metiers/maconnerie-btp.jpg' },
  { title: 'Chauffeur / Taximan', trade: 'Chauffeur / Taximan', subtitle: 'Transport', Icon: Car, img: '/images/metiers/transport-taxi.jpg' },
  { title: 'Coiffeur / Coiffeuse', trade: 'Coiffeur / Coiffeuse', subtitle: 'Coiffure', Icon: Scissors, img: '/images/metiers/coiffure.jpg' },
  { title: 'Aide à domicile', trade: 'Ménagère / Aide à domicile', subtitle: 'Services à la personne', Icon: Home, img: '/images/metiers/services-domestiques.jpg' },
  { title: 'Dépanneur électronique', trade: 'Dépanneur électronique', subtitle: 'Électronique', Icon: Smartphone, img: '/images/metiers/depannage-electronique.jpg' },
  { title: 'Agriculteur', trade: 'Agriculteur', subtitle: 'Agriculture', Icon: Sprout, img: '/images/metiers/agriculture.jpg' },
  { title: 'Commerçant', trade: 'Commerçant', subtitle: 'Commerce', Icon: ShoppingBag, img: '/images/metiers/commerce.jpg' },
  { title: 'Nounou', trade: "Nounou / Garde d'enfants", subtitle: "Garde d'enfants", Icon: Baby, img: '/images/metiers/garde-d-enfants.jpg' },
];

// Secteurs d'activité — one photo per sector.
const PHOTO_SECTORS = {
  'Pétrole & Gaz': { Icon: Fuel, img: '/images/secteurs/oil-gas.jpg' },
  'Industrie': { Icon: Factory, img: '/images/secteurs/industrie.jpg' },
  'BTP': { Icon: Hammer, img: '/images/secteurs/btp.jpg' },
  'Mines': { Icon: Mountain, img: '/images/secteurs/mines.jpg' },
  'Énergie': { Icon: Zap, img: '/images/secteurs/energie.jpg' },
  'Maintenance & Services industriels': { Icon: Wrench, img: '/images/secteurs/maintenance.jpg' },
  'Transport & Logistique': { Icon: Truck, img: '/images/secteurs/transport-logistique.jpg' },
  'Bâtiment': { Icon: Building2, img: '/images/secteurs/batiment.jpg' },
  'Agriculture & Élevage': { Icon: Sprout, img: '/images/secteurs/agriculture.jpg' },
  'Commerce & Distribution': { Icon: ShoppingBag, img: '/images/secteurs/commerce.jpg' },
  'Services à la personne': { Icon: Home, img: '/images/secteurs/services-domestiques.jpg' },
  'Numérique & Télécoms': { Icon: Smartphone, img: '/images/secteurs/electronique-informatique.jpg' },
  'Beauté & Bien-être': { Icon: Scissors, img: '/images/secteurs/coiffure-beaute.jpg' },
};

// Icon of each sector (sectors with a photo use the photo's icon).
const SECTOR_ICONS = {
  'Forêt & Bois': Trees, 'Hôtellerie & Restauration': UtensilsCrossed, 'Santé': HeartPulse,
  'Sécurité & Gardiennage': Shield, 'Éducation & Formation': GraduationCap,
};
const sectorIcon = (k) => (PHOTO_SECTORS[k] ? PHOTO_SECTORS[k].Icon : SECTOR_ICONS[k]);

// Hero scroller — portraits interleaved with every trade photo.
const HERO_PEOPLE = [
  { trade: 'Chef de chantier', city: 'BTP', img: '/images/hero/hero-2.jpg' },
  { trade: 'Maintenancier', city: 'Maintenance industrielle', img: '/images/hero/hero-3.jpg' },
];

// Every trade photo once, plus the portraits slotted in — no image appears twice.
const HERO_ITEMS = PHOTO_SHOWCASE.flatMap((m, i) => {
  const item = { title: m.title, subtitle: m.subtitle, img: m.img };
  const person = i % 6 === 2 && HERO_PEOPLE[(i - 2) / 6];
  return person ? [{ title: person.trade, subtitle: person.city, img: person.img }, item] : [item];
});

const WEIGHTS = { competences: 35, experience: 20, certifications: 15, secteur: 10, localisation: 10, disponibilite: 10 };
const MAX_FILE_BYTES = 1.5 * 1024 * 1024; // per file; a sign-up request must stay under ~4 Mo in total

/* =========================================================
   HELPERS
========================================================= */
function uid() { return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function fmtSize(bytes) { if (!bytes) return ''; const kb = bytes / 1024; if (kb < 1024) return Math.round(kb) + ' Ko'; return (kb / 1024).toFixed(1) + ' Mo'; }
function toggleInArray(arr, val) { return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]; }

function readFileAsDataUrl(file, maxBytes = MAX_FILE_BYTES) {
  return new Promise((resolve) => {
    if (file.size > maxBytes) { resolve({ error: `"${file.name}" dépasse ${fmtSize(maxBytes)} et n'a pas été ajouté.` }); return; }
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: r.result });
    r.onerror = () => resolve({ error: `Impossible de lire "${file.name}".` });
    r.readAsDataURL(file);
  });
}

function computeScore(pro, mission) {
  const reqSkills = mission.competences || [];
  const proSkillNames = (pro.competences || []).map((s) => s.name.toLowerCase());
  const matched = reqSkills.filter((s) => proSkillNames.includes(s.toLowerCase())).length;
  const competences = reqSkills.length ? Math.round((matched / reqSkills.length) * 100) : 60;
  const experience = mission.experienceMin ? Math.min(100, Math.round((pro.experience / mission.experienceMin) * 100)) : 80;
  let certifications = 50;
  if ((pro.certifications || []).length) {
    const verifiedCount = pro.certifications.filter((c) => c.verified).length;
    certifications = Math.round((verifiedCount / pro.certifications.length) * 100);
  }
  const secteur = (pro.secteurs || []).includes(mission.secteur) ? 100 : 0;
  const localisation = (pro.province || '').toLowerCase() === (mission.province || '').toLowerCase() ? 100 : 40;
  const disponibilite = pro.dispo === 'now' ? 100 : pro.dispo === 'soon' ? 50 : 0;
  const criteres = { competences, experience, certifications, secteur, localisation, disponibilite };
  const score = Math.round(Object.keys(WEIGHTS).reduce((sum, k) => sum + (criteres[k] * WEIGHTS[k]) / 100, 0));
  return { score, criteres };
}

function FileField({ label, hint, accept, multiple, value, onChange, maxBytes }) {
  const inputRef = useRef(null);
  const [warn, setWarn] = useState('');

  const handleFiles = async (fileList) => {
    setWarn('');
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const results = await Promise.all(files.map((f) => readFileAsDataUrl(f, maxBytes)));
    const errors = results.filter((r) => r.error).map((r) => r.error);
    const okItems = results.filter((r) => !r.error);
    if (errors.length) setWarn(errors.join(' '));
    if (multiple) onChange([...(Array.isArray(value) ? value : []), ...okItems]);
    else onChange(okItems[0] || null);
  };

  const removeOne = (idx) => {
    if (multiple) onChange((value || []).filter((_, i) => i !== idx));
    else onChange(null);
  };

  const items = multiple ? (value || []) : (value ? [value] : []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Upload className="h-4 w-4" />
        {multiple ? 'Ajouter un ou plusieurs fichiers' : 'Choisir un fichier'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={!!multiple}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {warn && <p className="text-xs text-destructive">{warn}</p>}
      {items.length > 0 && (
        <div className="space-y-2 pt-1">
          {items.map((d, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-xs">
              <a href={d.dataUrl} download={d.name} className="flex items-center gap-2 truncate text-primary hover:underline">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{d.name}</span>
                <span className="flex-shrink-0 text-muted-foreground">({fmtSize(d.size)})</span>
              </a>
              <button type="button" onClick={() => removeOne(i)} className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TagAdder({ label, placeholder, items, onChange, withLevel, withVerified }) {
  const [name, setName] = useState('');
  const inputId = useId();
  const [level, setLevel] = useState('5');

  const add = () => {
    const v = name.trim();
    if (!v) return;
    if (withLevel) onChange([...items, { name: v, level: parseInt(level, 10) }]);
    else if (withVerified) onChange([...items, { name: v, verified: false }]);
    else onChange([...items, v]);
    setName('');
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex gap-2">
        <Input id={inputId} value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        {withLevel && (
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n}/5</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button type="button" variant="outline" onClick={add}>Ajouter</Button>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {items.length === 0 && <span className="text-xs text-muted-foreground">Aucun élément ajouté.</span>}
        {items.map((it, i) => (
          <Badge key={i} variant="secondary" className="cursor-pointer gap-1" onClick={() => remove(i)}>
            {withLevel ? `${it.name} · ${it.level}/5` : withVerified ? `${it.name} · ${it.verified ? '🟢' : '🟡'}` : it}
            <X className="h-3 w-3" />
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Used only for the light-on-dark hero/CTA buttons. Built with plain inline styles and
// JS-tracked hover state instead of the shadcn Button + Tailwind override combo, which
// was silently losing the color override to the component's own default classes in some
// builds (a class-merge/cascade-order issue, not something a person using this button
// should have to think about — this version sidesteps it completely and always renders
// correctly, regardless of Tailwind version).
function HeroButton({ outline, onClick, icon: Icon, children }) {
  const [hover, setHover] = useState(false);
  const style = outline
    ? {
        backgroundColor: hover ? '#ffffff' : 'transparent',
        color: hover ? '#0b1b36' : '#ffffff',
        border: '1.5px solid rgba(255,255,255,0.7)',
      }
    : {
        backgroundColor: hover ? '#f0d08a' : '#e5b85a',
        color: '#0b1b36',
        border: '1.5px solid transparent',
        boxShadow: '0 10px 30px -10px rgba(229, 184, 90, 0.6)',
      };
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-center text-[0.95rem] leading-tight sm:whitespace-nowrap font-semibold transition-colors"
      style={style}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

// Section heading: small gold eyebrow, bold title, muted subtitle.
function SectionTitle({ eyebrow, title, subtitle, dark }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-gold-400' : 'text-gold-700'}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-extrabold tracking-tight md:text-[2.6rem] md:leading-tight ${dark ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
      <span className="mx-auto mt-5 block h-1 w-14 rounded-full bg-gold-400" />
      {subtitle && <p className={`mt-4 text-lg ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{subtitle}</p>}
    </div>
  );
}

function Req() {
  return <span className="text-destructive" aria-hidden="true"> *</span>;
}

// Live score shown at the top of each sign-up form: total out of 100, one bar per
// criterion, and the tips that would raise it the most.
function ScoreCard({ result, title, note }) {
  const { score, parts } = result;
  const tips = parts.filter((p) => p.tip).sort((a, b) => (b.max - b.points) - (a.max - a.points)).slice(0, 3);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-xl border border-gold-400/40 bg-gold-400/5 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-navy-900/10" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} className="text-gold-500 transition-[stroke-dashoffset] duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold leading-none text-navy-900">{score}</span>
            <span className="text-[0.65rem] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-900">{title} · <span className="text-gold-700">{scoreLabel(score)}</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {parts.map((pt) => (
              <div key={pt.key}>
                <div className="flex justify-between text-xs"><span className="text-foreground/80">{pt.label}</span><span className="font-medium text-navy-900">{pt.points}/{pt.max}</span></div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-navy-900/10">
                  <div className="h-full rounded-full bg-gold-500 transition-all duration-500" style={{ width: `${(pt.points / pt.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {tips.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-gold-400/30 pt-3 text-xs text-foreground/80">
          {tips.map((t) => (
            <li key={t.key} className="flex gap-2"><span className="font-semibold text-gold-700">+{t.max - t.points}</span>{t.tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Demo content shipped with the site (fictional people / company) is labelled as such.
// Right of access: the owner gets a copy of everything stored about them.
function downloadMyData(account, record) {
  const data = { compte: { email: account.email, type: KIND_LABEL[account.kind] }, fiche: record, exporte_le: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mes-donnees-onaskill.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function MyDataCard({ account, record, onDelete }) {
  return (
    <Card className="mt-8">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h3 className="font-semibold">Mes données personnelles</h3>
          <p className="mt-1 text-sm text-muted-foreground">Téléchargez une copie de tout ce que nous conservons sur vous, ou supprimez définitivement votre compte.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadMyData(account, record)}>Télécharger mes données</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>Supprimer mon compte et mes données</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DemoBadge() {
  return (
    <span title="Profil fictif présenté à titre d'exemple" className="flex-shrink-0 rounded-full border border-navy-900/15 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      Exemple
    </span>
  );
}

// Score shown to visitors: the server's (it can see private parts of the profile),
// otherwise computed from what is visible.
function proScore(p) {
  return typeof p.score === 'number' ? p.score : scoreProfessional(p).score;
}

// Email + password fields shown when someone creates an account.
function PasswordFields({ password, setPassword, confirm, setConfirm }) {
  return (
    <div className="space-y-3 rounded-lg border border-navy-900/10 bg-secondary/60 p-4">
      <p className="text-sm font-semibold">Votre compte</p>
      <p className="text-xs text-muted-foreground">Vous vous connecterez avec votre e-mail et ce mot de passe pour modifier votre fiche. Personne d'autre ne pourra la modifier.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="f2">Mot de passe <Req /></Label><Input id="f2" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" /></div>
        <div className="space-y-2"><Label htmlFor="f3">Confirmer le mot de passe <Req /></Label><Input id="f3" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
      </div>
    </div>
  );
}

// Trade picker: the list of trades, plus "Autre métier" which reveals a text field.
// `value` / `onChange` carry the final trade name (the typed one for "Autre métier");
// an empty value means "not chosen yet" (or "Autre métier" not yet specified).
function TradeField({ id, label, value: rawValue, onChange, required }) {
  const value = canonicalTrade(rawValue);
  const known = TRADES.includes(value) && value !== 'Autre métier';
  const [choice, setChoice] = useState(known ? value : value ? 'Autre métier' : '');
  const [custom, setCustom] = useState(known ? '' : value || '');
  const otherId = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} {required && <Req />}</Label>
      <Select value={choice} onValueChange={(v) => { setChoice(v); onChange(v === 'Autre métier' ? custom.trim() : v); }}>
        <SelectTrigger id={id}><SelectValue placeholder="Choisir un métier" /></SelectTrigger>
        <SelectContent className="max-h-80">{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      {choice === 'Autre métier' && (
        <Input
          id={otherId}
          aria-label="Précisez votre métier"
          autoFocus
          value={custom}
          onChange={(e) => { setCustom(e.target.value); onChange(e.target.value.trim()); }}
          placeholder="Précisez votre métier (ex. : Tapissier, Horloger…)"
        />
      )}
    </div>
  );
}

// Sector picker: the sector buttons plus "Autre", which reveals a text field. The typed
// sector is stored alongside the chosen ones.
function SectorPicker({ label, value: rawValue, onChange, required }) {
  const value = canonicalSectors(rawValue);
  const customs = (value || []).filter((x) => !SECTOR_KEYS.includes(x));
  const [otherOn, setOtherOn] = useState(customs.length > 0);
  const [other, setOther] = useState(customs.join(', '));
  const chosen = (value || []).filter((x) => SECTOR_KEYS.includes(x));
  const emit = (list, otherText, on) => onChange([...list, ...(on && otherText.trim() ? [otherText.trim()] : [])]);
  const btn = (active) => `flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${active ? 'border-primary bg-primary/5 text-primary' : 'border-muted-foreground/20'}`;
  return (
    <div className="space-y-2" role="group" aria-label={label}>
      <Label>{label} {required && <Req />}</Label>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {SECTOR_KEYS.map((k) => (
          <button type="button" key={k} aria-pressed={chosen.includes(k)} onClick={() => emit(toggleInArray(chosen, k), other, otherOn)} className={btn(chosen.includes(k))}>
            {chosen.includes(k) && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />} {k}
          </button>
        ))}
        <button type="button" aria-pressed={otherOn} onClick={() => { setOtherOn(!otherOn); emit(chosen, other, !otherOn); }} className={btn(otherOn)}>
          {otherOn && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />} Autre
        </button>
      </div>
      {otherOn && (
        <Input
          aria-label="Précisez votre domaine d'activité"
          autoFocus
          value={other}
          onChange={(e) => { setOther(e.target.value); emit(chosen, e.target.value, true); }}
          placeholder="Précisez votre domaine d'activité"
        />
      )}
    </div>
  );
}

// "I accept the terms" — required to create an account or publish without one.
function ConsentCheckbox({ checked, onChange, go }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-navy-900/10 p-4">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#0b1b36]" />
      <label htmlFor={id} className="text-sm text-foreground/80">
        J'accepte les{' '}
        <button type="button" className="font-medium text-navy-900 underline" onClick={() => window.open('/conditions', '_blank')}>conditions générales d'utilisation</button>{' '}
        et la{' '}
        <button type="button" className="font-medium text-navy-900 underline" onClick={() => window.open('/confidentialite', '_blank')}>politique de confidentialité</button>. <Req />
      </label>
    </div>
  );
}

function passwordProblems(isSignup, password, confirm) {
  if (!isSignup) return [];
  if (password.length < 8) return ['Mot de passe (8 caractères minimum)'];
  if (password !== confirm) return ['Les deux mots de passe ne correspondent pas'];
  return [];
}

function FormErrorBanner({ errors }) {
  if (!errors || !errors.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>
        <p className="font-medium">Merci de renseigner les champs suivants :</p>
        <ul className="mt-1 list-disc pl-4">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </div>
    </div>
  );
}

function LocationFields({ province, ville, quartier, onProvince, onVille, onQuartier, villeRequired }) {
  const cities = GABON[province] || [];
  // A town outside the province's list (typed by hand, or older records) shows the free-text field.
  const [custom, setCustom] = useState(!!ville && !cities.includes(ville));
  const villeChoice = custom ? OTHER_CITY : (cities.includes(ville) ? ville : '');
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="f4">Province</Label>
        <Select value={province} onValueChange={(p) => { onProvince(p); onVille(''); setCustom(false); }}>
          <SelectTrigger id="f4"><SelectValue placeholder="Choisir une province" /></SelectTrigger>
          <SelectContent>
            {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f5">Ville {villeRequired && <Req />}</Label>
        <Select value={villeChoice} onValueChange={(v) => { setCustom(v === OTHER_CITY); onVille(v === OTHER_CITY ? '' : v); }}>
          <SelectTrigger id="f5"><SelectValue placeholder="Choisir une ville" /></SelectTrigger>
          <SelectContent>
            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            <SelectItem value={OTHER_CITY}>Autre ville…</SelectItem>
          </SelectContent>
        </Select>
        {villeChoice === OTHER_CITY && (
          <Input value={ville} onChange={(e) => onVille(e.target.value)} placeholder="Nom de la ville" />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="f6">Quartier</Label>
        <Input id="f6" value={quartier} onChange={(e) => onQuartier(e.target.value)} placeholder="Nzeng-Ayong, Glass..." />
      </div>
    </div>
  );
}

// Search field you can type into: suggestions filter as you type (accent-insensitive),
// pick one with the mouse or arrows + Entrée. Text that matches nothing exactly is kept as
// a free-text search ('q:<text>').
function SearchCombobox({ id, value, onChange, options, placeholder, icon: Icon }) {
  const selectedLabel = value.startsWith('q:') ? value.slice(2) : (options.find((o) => o.value === value)?.label || '');
  const [text, setText] = useState(value === 'all' ? '' : selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const listId = useId();

  useEffect(() => { setText(value === 'all' ? '' : selectedLabel); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = norm(text);
  const typing = q && q !== norm(selectedLabel);
  const shown = typing
    ? options.filter((o) => o.value !== 'all' && (norm(o.label).includes(q) || norm(o.keywords).includes(q)))
    : options;

  function choose(o) {
    onChange(o.value);
    setText(o.value === 'all' ? '' : o.label);
    setOpen(false);
  }
  function commitText() {
    if (!q) { onChange('all'); return; }
    const exact = options.find((o) => norm(o.label) === q);
    if (exact) choose(exact);
    else { onChange('q:' + text.trim()); setOpen(false); }
  }
  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      if (open && shown[active]) { e.preventDefault(); choose(shown[active]); }
      else commitText();
    } else if (e.key === 'Escape') setOpen(false);
  }
  useEffect(() => {
    const el = listRef.current && listRef.current.children[active];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
      <input
        id={id}
        aria-label={id ? undefined : placeholder}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={text}
        placeholder={placeholder}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => { setOpen(true); setActive(0); }}
        onBlur={() => { setOpen(false); if (norm(text) !== norm(selectedLabel) || (!q && value !== 'all')) commitText(); }}
        onKeyDown={onKeyDown}
        className={`h-10 w-full rounded-md border border-input bg-background pr-8 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 ${Icon ? 'pl-9' : 'pl-3'}`}
      />
      {text && (
        <button type="button" aria-label="Effacer" onMouseDown={(e) => e.preventDefault()} onClick={() => { setText(''); onChange('all'); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
      {open && (
        <ul ref={listRef} id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-lg border bg-popover py-1 text-sm shadow-xl">
          {shown.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground">Aucune suggestion — Entrée pour rechercher « {text} »</li>
          )}
          {shown.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 py-2 pr-3 ${o.indent && !typing ? 'pl-7' : 'pl-3'} ${i === active ? 'bg-gold-400/15' : ''} ${o.strong ? 'font-semibold text-navy-900' : ''}`}
            >
              <span>{o.label}</span>
              {o.hint && (typing || o.strong) && <span className="text-xs text-muted-foreground">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// "Nos métiers" / "Secteurs d'activité": a photo mosaic (one featured photo, small
// thumbnails with a slight zoom on hover) on one side, the full list on the other.
// `reverse` puts the photos on the right. Clicking a photo or a list item runs that search.
function GallerySection({ eyebrow, title, subtitle, text, tiles, onCta, ctaLabel, tinted, reverse }) {
  return (
    <section className={`relative overflow-hidden py-20 md:py-28 ${tinted ? 'bg-secondary' : ''}`}>
      <div className="container mx-auto grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={`relative ${reverse ? 'lg:order-2' : ''}`}>
          <div className={`pointer-events-none absolute -inset-6 -z-0 rounded-[2rem] bg-gradient-to-br from-gold-400/25 via-gold-400/5 to-transparent blur-2xl ${reverse ? 'scale-x-[-1]' : ''}`} />
          <RotatingTrio tiles={tiles} />
        </div>

        <div className={reverse ? 'lg:order-1' : ''}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 md:text-[2.4rem] md:leading-tight">{title}</h2>
          <span className="mt-5 block h-1 w-14 rounded-full bg-gold-400" />
          {subtitle && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{subtitle}</p>}
          {text && <p className="mt-6 leading-relaxed text-foreground/80">{text}</p>}
          {onCta && (
            <Button onClick={onCta} className="mt-8 h-11 rounded-full bg-navy-900 px-6 font-semibold hover:bg-navy-800">
              {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// Three photos shown at once (one tall, two stacked). Every 4 seconds one of the three
// slots, picked at random, fades to a photo that isn't currently on screen. No scrolling.
// The first three photos are rendered on the server; the random swaps only start in the browser.
// Changes on its own; the small pause button is only there for visitors who need it.
function RotatingTrio({ tiles }) {
  const [shown, setShown] = useState([0, 1, 2]);
  const [stopped, setStopped] = useState(false);
  const paused = stopped;

  // Visitors who ask their system for less motion get still photos.
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setStopped(true);
  }, []);

  useEffect(() => {
    if (paused || tiles.length <= 3) return undefined;
    const id = setInterval(() => {
      setShown((cur) => {
        const free = tiles.map((_, i) => i).filter((i) => !cur.includes(i));
        const slot = Math.floor(Math.random() * cur.length);
        const next = [...cur];
        next[slot] = free[Math.floor(Math.random() * free.length)];
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [paused, tiles.length]);

  return (
    <div
      className="relative grid h-[22rem] grid-cols-2 grid-rows-2 gap-3 sm:h-[28rem] sm:gap-4"
    >
      {shown.map((index, slot) => (
        <PhotoTile key={slot} tile={tiles[index]} big={slot === 0} className={slot === 0 ? 'row-span-2' : ''} />
      ))}
      <PauseButton paused={stopped} onToggle={() => setStopped((v) => !v)} label="le changement automatique des photos" className="absolute bottom-3 left-3 z-10" />
    </div>
  );
}

// Pause / resume control for anything that moves on its own (WCAG 2.2.2).
function PauseButton({ paused, onToggle, label, className = '', dark }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? `Relancer ${label}` : `Mettre en pause ${label}`}
      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md ring-1 transition-colors ${dark ? 'bg-navy-950/80 text-white ring-white/20 hover:bg-navy-900' : 'bg-white/90 text-navy-900 ring-black/10 hover:bg-white'} ${className}`}
    >
      {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
    </button>
  );
}

function PhotoTile({ tile, className = '', big }) {
  return (
    <button
      type="button"
      onClick={tile.onClick}
      className={`group/thumb relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${className}`}
    >
      {/* key = photo: a new photo remounts and fades in */}
      <span key={tile.img} className="photo-swap absolute inset-0">
        <img src={tile.img} alt={tile.title} loading="lazy" decoding="async" width={600} height={600} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/5 to-transparent" />
        <span className={`absolute text-right font-semibold leading-tight text-white ${big ? 'inset-x-5 bottom-5 text-lg sm:text-xl' : 'inset-x-4 bottom-4 text-sm sm:text-base'}`}>
          {tile.title}
        </span>
      </span>
    </button>
  );
}

function CheckEmailScreen({ context, go, openProfile, resendVerification }) {
  if (!context) {
    return (
      <div className="container mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <h1 className="mb-2 text-2xl font-bold">Confirmation d'inscription</h1>
        <p className="mb-8 text-muted-foreground">Le lien de confirmation est envoyé par e-mail juste après l'inscription. Vous pouvez vous connecter ou créer un compte.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => go('login')}>Se connecter</Button>
          <Button onClick={() => go('choosetype')}>Créer un compte</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/15">
        <Mail className="h-8 w-8 text-gold-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Votre compte est créé</h1>
      <p className="mb-1 text-muted-foreground">
        Un lien de confirmation a été envoyé à <span className="font-medium text-foreground">{context.email}</span>.
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Cliquez sur le lien reçu pour confirmer votre adresse. Pensez à vérifier vos courriers indésirables.
        Vous êtes déjà connecté : vous pouvez {context.type === 'particulier' ? 'publier vos demandes' : `compléter ${context.type === 'pro' ? 'votre profil' : 'votre fiche'}`} dès maintenant.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={resendVerification}>Renvoyer l'email</Button>
        <Button onClick={() => (context.type === 'pro' ? openProfile(context.id) : go(context.type === 'company' ? 'dashcompany' : 'dashpart'))}>
          {context.type === 'pro' ? 'Voir mon profil' : 'Aller à mon espace'}
        </Button>
      </div>
    </div>
  );
}


function ScreenHeader({ eyebrow, title, onBack }) {
  return (
    <div className="border-b bg-slate-50 py-8 dark:bg-slate-900/30">
      <div className="container mx-auto">
        {onBack && (
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>
        )}
        {eyebrow && <p className="mb-1 text-sm font-medium text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */
// The whole site is this one client component; each screen has its own web address
// (see lib/routes.js). `initialPath` is the address the visitor opened, and
// `initialProfessionals` lets the server pre-render a profile page.
export default function App({ initialPath = '/', initialProfessionals = [] }) {
  const initialRoute = parsePath(initialPath) || { screen: 'home', id: null };
  const [screen, setScreen] = useState(initialRoute.screen);
  const [menuOpen, setMenuOpen] = useState(false);

  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [companies, setCompanies] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // Logged-in account ({ email, kind, recordId, id }) and its own full record.
  const [me, setMe] = useState({ account: null, record: null });
  const myProId = me.account && me.account.kind === 'pro' ? me.account.recordId : null;
  const myCompanyId = me.account && me.account.kind === 'company' ? me.account.recordId : null;
  const myPartId = me.account && me.account.kind === 'particulier' ? me.account.recordId : null;
  const [checkEmailContext, setCheckEmailContext] = useState(null);

  const [toast, setToast] = useState('');

  const [currentProfileId, setCurrentProfileId] = useState(initialRoute.screen === 'profile' ? initialRoute.id : null);
  const [editingMissionId, setEditingMissionId] = useState(initialRoute.screen === 'missionform' ? initialRoute.id : null);
  const [currentMatchMissionId, setCurrentMatchMissionId] = useState(initialRoute.screen === 'matching' ? initialRoute.id : null);
  const [missionDefaultClientType, setMissionDefaultClientType] = useState('entreprise');

  // homepage quick search
  const [searchTrade, setSearchTrade] = useState('all');
  const [searchCity, setSearchCity] = useState('all');
  const [searchAvailability, setSearchAvailability] = useState('all');
  const [searchSector, setSearchSector] = useState('all');
  const [searchSort, setSearchSort] = useState('pertinence');

  async function loadData() {
    try {
      const [profRes, compRes, missRes] = await Promise.all([
        fetch('/api/professionals'),
        fetch('/api/companies'),
        fetch('/api/missions'),
      ]);
      if (!profRes.ok || !compRes.ok || !missRes.ok) throw new Error('API error');
      const [profData, compData, missData] = await Promise.all([profRes.json(), compRes.json(), missRes.json()]);
      setProfessionals(profData);
      setCompanies(compData);
      setMissions(missData);
    } catch (e) {
      console.error('[ONASKILL] chargement des données échoué:', e);
      showToast('Impossible de charger les données — vérifiez la connexion à la base de données');
    }
  }
  async function loadMe() {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setMe({ account: data.account || null, record: data.record || null });
    } catch (e) {
      setMe({ account: null, record: null });
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([loadData(), loadMe()]);
      setLoaded(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Requests published without an account: the secret edit key returned by the server
  // is kept in this browser, and only that key can later modify or delete the request.
  function missionKeys() {
    try { return JSON.parse(localStorage.getItem('onaskill:missionKeys') || '{}'); } catch (e) { return {}; }
  }
  function setMissionKey(id, key) {
    try {
      const keys = missionKeys();
      if (key) keys[id] = key; else delete keys[id];
      localStorage.setItem('onaskill:missionKeys', JSON.stringify(keys));
    } catch (e) {}
  }
  function canManageMission(m) {
    if (!m) return false;
    if (me.account && m.ownerAccountId === me.account.id) return true;
    return !!missionKeys()[m.id];
  }

  async function postJson(url, payload, extraHeaders) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erreur');
    return data;
  }

  async function login(email, password) {
    const data = await postJson('/api/auth/login', { email, password });
    await loadMe();
    showToast('Vous êtes connecté');
    go({ pro: 'dashpro', company: 'dashcompany', particulier: 'dashpart' }[data.account.kind]);
  }
  async function logout() {
    try { await postJson('/api/auth/logout', {}); } catch (e) {}
    setMe({ account: null, record: null });
    showToast('Vous êtes déconnecté');
    go('home');
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2600); }
  // Show a screen; `id` is the profile / request it is about. Updates the address bar so
  // links can be shared and the browser's back button works.
  function applyRoute(s, id) {
    setScreen(s);
    if (s === 'profile') setCurrentProfileId(id);
    if (s === 'matching') setCurrentMatchMissionId(id);
    if (s === 'missionform') setEditingMissionId(id || null);
    setMenuOpen(false);
  }
  function go(s, id) {
    const path = pathFor(s, id, professionals);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    applyRoute(s, id);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const onPop = () => {
      const r = parsePath(window.location.pathname) || { screen: 'home', id: null };
      applyRoute(r.screen, r.id);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Browser tab title for the current screen (the server sets it for the first page).
  useEffect(() => {
    let t = SCREEN_TITLES[screen];
    if (screen === 'profile') {
      const p = professionals.find((x) => x.id === currentProfileId);
      t = p ? `${p.prenom} ${p.nom} — ${p.metier}` : 'Profil';
    }
    document.title = t ? `${t} | ONASKILL` : 'ONASKILL — Chaque savoir-faire mérite une opportunité';
  }, [screen, currentProfileId, professionals]);
  // Once profiles are loaded, give a bare /pro/<id> address its readable form.
  useEffect(() => {
    if (screen !== 'profile') return;
    const p = professionals.find((x) => x.id === currentProfileId);
    if (p && window.location.pathname !== profilePath(p)) window.history.replaceState({}, '', profilePath(p));
  }, [screen, currentProfileId, professionals]);
  function scrollToSection(id) {
    go('home');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function handleSearch(e) {
    e.preventDefault();
    go('search');
  }

  function openProfile(id) { go('profile', id); }
  function openProForm() { go('proform'); }
  function openCompanyForm() { go('companyform'); }
  function openParticulierForm() { go('particulierform'); }
  function openMissionForm(id, defaultType) { setMissionDefaultClientType(defaultType || 'entreprise'); go('missionform', id || null); }
  function openMatching(missionId) { go('matching', missionId); }

  async function saveProfessional(data, password) {
    const isNew = !me.account;
    try {
      const saved = await postJson('/api/professionals', { record: data, password });
      setMe({ account: saved.account, record: saved.record });
      await loadData();
      if (isNew) {
        setCheckEmailContext({ email: saved.record.email, type: 'pro', id: saved.record.id });
        go('checkemail');
      } else {
        showToast('Profil mis à jour');
        openProfile(saved.record.id);
      }
      return null;
    } catch (e) {
      return e.message;
    }
  }
  async function deleteProfessional() {
    if (!window.confirm('Supprimer définitivement votre profil et votre compte ?')) return;
    try {
      const res = await fetch(`/api/professionals/${myProId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
      setMe({ account: null, record: null });
      await loadData();
      showToast('Profil et compte supprimés');
      go('home');
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  }
  async function resendVerification() {
    try {
      const r = await postJson('/api/auth/resend-verification', {});
      showToast(r.alreadyVerified ? 'Votre e-mail est déjà confirmé' : 'E-mail de confirmation renvoyé');
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  }

  async function saveCompany(data, password) {
    const isNew = !me.account;
    try {
      const saved = await postJson('/api/companies', { record: data, password });
      setMe({ account: saved.account, record: saved.record });
      await loadData();
      if (isNew) {
        setCheckEmailContext({ email: saved.record.email, type: 'company', id: saved.record.id });
        go('checkemail');
      } else {
        showToast('Fiche entreprise mise à jour');
        go('dashcompany');
      }
      return null;
    } catch (e) {
      return e.message;
    }
  }
  async function deleteCompany() {
    if (!window.confirm('Supprimer définitivement votre fiche entreprise et votre compte ?')) return;
    try {
      const res = await fetch(`/api/companies/${myCompanyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
      setMe({ account: null, record: null });
      await loadData();
      showToast('Fiche entreprise et compte supprimés');
      go('home');
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  }

  async function saveParticulier(data, password) {
    const isNew = !me.account;
    try {
      const saved = await postJson('/api/particuliers', { record: data, password });
      setMe({ account: saved.account, record: saved.record });
      if (isNew) {
        setCheckEmailContext({ email: saved.record.email, type: 'particulier', id: saved.record.id });
        go('checkemail');
      } else {
        showToast('Compte mis à jour');
        go('dashpart');
      }
      return null;
    } catch (e) {
      return e.message;
    }
  }
  async function deleteParticulier() {
    if (!window.confirm('Supprimer définitivement votre compte, vos informations et toutes vos demandes ?')) return;
    try {
      const res = await fetch(`/api/particuliers/${myPartId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
      setMe({ account: null, record: null });
      await loadData();
      showToast('Compte et données supprimés');
      go('home');
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  }

  async function saveMission(data) {
    try {
      const key = data.id ? missionKeys()[data.id] : null;
      const saved = await postJson('/api/missions', { record: data }, key ? { 'x-mission-key': key } : null);
      if (saved.key) setMissionKey(saved.record.id, saved.key);
      setMissions((prev) => {
        const idx = prev.findIndex((m) => m.id === saved.record.id);
        if (idx > -1) { const next = [...prev]; next[idx] = saved.record; return next; }
        return [...prev, saved.record];
      });
      showToast(data.id ? 'Demande mise à jour' : 'Demande publiée');
      openMatching(saved.record.id);
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  }
  async function deleteMission(id) {
    if (!window.confirm('Supprimer définitivement cette demande ?')) return;
    try {
      const key = missionKeys()[id];
      const res = await fetch(`/api/missions/${id}`, { method: 'DELETE', headers: key ? { 'x-mission-key': key } : {} });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
      setMissionKey(id, null);
      setMissions((prev) => prev.filter((m) => m.id !== id));
      showToast('Demande supprimée');
      go(me.account ? 'dashcompany' : 'home');
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  }

  // No full-page loading gate: the home page renders immediately (and is pre-rendered
  // on the server, so search engines and link previews see the real content); the
  // database-backed lists fill in once the fetch above completes.
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900 focus:shadow-lg">
        Aller au contenu principal
      </a>
      <Toast message={toast} />
      <SiteHeader screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} account={me.account} logout={logout} />
      {me.account && me.record && me.record.hidden && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900" role="status">
          Votre {me.account.kind === 'company' ? 'fiche' : 'profil'} est actuellement masqué par la modération d'ONASKILL et n'apparaît plus aux visiteurs. Contactez-nous pour en savoir plus.
        </div>
      )}

      <main id="contenu" className="flex-1">
        {screen === 'home' && (
          <HomeScreen
            go={go}
            professionals={professionals}
            searchTrade={searchTrade} setSearchTrade={setSearchTrade}
            searchCity={searchCity} setSearchCity={setSearchCity}
            searchAvailability={searchAvailability} setSearchAvailability={setSearchAvailability}
            searchSector={searchSector} setSearchSector={setSearchSector}
            handleSearch={handleSearch}
            openMissionForm={openMissionForm}
            openProForm={openProForm}
            openCompanyForm={openCompanyForm}
          />
        )}

        {screen === 'search' && (
          <SearchScreen
            professionals={professionals}
            searchTrade={searchTrade} setSearchTrade={setSearchTrade}
            searchCity={searchCity} setSearchCity={setSearchCity}
            searchAvailability={searchAvailability} setSearchAvailability={setSearchAvailability}
            searchSector={searchSector} setSearchSector={setSearchSector}
            searchSort={searchSort} setSearchSort={setSearchSort}
            openProfile={openProfile}
            go={go}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            pro={professionals.find((p) => p.id === currentProfileId)}
            own={currentProfileId && currentProfileId === myProId ? me.record : null}
            go={go}
            openProForm={openProForm}
            deleteProfessional={deleteProfessional}
            openMissionForm={openMissionForm}
            resendVerification={resendVerification}
          />
        )}

        {['proform', 'companyform', 'particulierform', 'missionform', 'dashpro', 'dashcompany', 'dashpart', 'admin', 'matching'].includes(screen) && !loaded && (
          <div className="container mx-auto py-24 text-center text-muted-foreground">Chargement…</div>
        )}

        {screen === 'proform' && loaded && (
          me.account && me.account.kind !== 'pro'
            ? <WrongAccountType go={go} kind={me.account.kind} />
            : (
              <ProForm
                key={myProId || 'new'}
                existing={myProId ? me.record : null}
                isSignup={!me.account}
                onCancel={() => go(me.account ? 'dashpro' : 'home')}
                onSave={saveProfessional}
                go={go}
              />
            )
        )}

        {screen === 'companyform' && loaded && (
          me.account && me.account.kind !== 'company'
            ? <WrongAccountType go={go} kind={me.account.kind} />
            : (
              <CompanyForm
                key={myCompanyId || 'new'}
                existing={myCompanyId ? me.record : null}
                isSignup={!me.account}
                onCancel={() => go(me.account ? 'dashcompany' : 'home')}
                onSave={saveCompany}
                onDelete={myCompanyId ? deleteCompany : null}
                go={go}
              />
            )
        )}

        {screen === 'checkemail' && (
          <CheckEmailScreen
            context={checkEmailContext}
            go={go}
            openProfile={openProfile}
            resendVerification={resendVerification}
          />
        )}

        {screen === 'missionform' && loaded && editingMissionId && !canManageMission(missions.find((m) => m.id === editingMissionId)) && (
          <NotAvailable go={go} title="Modification impossible" text="Cette demande n'existe pas, ou elle a été publiée depuis un autre compte ou un autre appareil : seul son auteur peut la modifier." />
        )}

        {screen === 'missionform' && loaded && (!editingMissionId || canManageMission(missions.find((m) => m.id === editingMissionId))) && (
          <MissionForm
            key={editingMissionId || 'new'}
            existing={canManageMission(missions.find((m) => m.id === editingMissionId)) ? missions.find((m) => m.id === editingMissionId) : null}
            defaultClientType={myCompanyId ? 'entreprise' : myPartId ? 'particulier' : missionDefaultClientType}
            defaultClientName={myCompanyId && me.record ? me.record.nom : myPartId && me.record ? `${me.record.prenom} ${me.record.nom}` : ''}
            lockedType={myCompanyId ? 'entreprise' : myPartId ? 'particulier' : null}
            anonymous={!me.account}
            onCancel={() => go(me.account ? 'dashcompany' : 'home')}
            onSave={saveMission}
            onDelete={editingMissionId && canManageMission(missions.find((m) => m.id === editingMissionId)) ? () => deleteMission(editingMissionId) : null}
          />
        )}

        {screen === 'matching' && loaded && (
          <MatchingScreen
            mission={missions.find((m) => m.id === currentMatchMissionId)}
            professionals={professionals}
            go={go}
            openProfile={openProfile}
            openMissionForm={openMissionForm}
            deleteMission={deleteMission}
            canManage={canManageMission(missions.find((m) => m.id === currentMatchMissionId))}
            back={() => go(me.account ? 'dashcompany' : 'home')}
          />
        )}

        {screen === 'dashcompany' && loaded && (
          <CompanyDashboard
            account={me.account}
            company={myCompanyId ? me.record : null}
            myMissions={missions.filter(canManageMission)}
            professionals={professionals}
            openCompanyForm={openCompanyForm}
            openMissionForm={openMissionForm}
            openMatching={openMatching}
            deleteMission={deleteMission}
            deleteCompany={deleteCompany}
            resendVerification={resendVerification}
            go={go}
          />
        )}

        {screen === 'particulierform' && loaded && (
          me.account && me.account.kind !== 'particulier'
            ? <WrongAccountType go={go} kind={me.account.kind} />
            : (
              <ParticulierForm
                key={myPartId || 'new'}
                existing={myPartId ? me.record : null}
                isSignup={!me.account}
                onCancel={() => go(me.account ? 'dashpart' : 'home')}
                onSave={saveParticulier}
                go={go}
              />
            )
        )}

        {screen === 'dashpart' && loaded && (
          <ParticulierDashboard
            account={me.account}
            me={myPartId ? me.record : null}
            myMissions={missions.filter(canManageMission)}
            openParticulierForm={openParticulierForm}
            openMissionForm={openMissionForm}
            openMatching={openMatching}
            deleteMission={deleteMission}
            deleteParticulier={deleteParticulier}
            resendVerification={resendVerification}
            go={go}
          />
        )}

        {screen === 'admin' && loaded && <AdminScreen account={me.account} go={go} openProfile={openProfile} openMatching={openMatching} reload={loadData} showToast={showToast} />}

        {screen === 'dashpro' && loaded && (
          <ProDashboard
            account={me.account}
            pro={myProId ? me.record : null}
            openProfile={openProfile}
            openProForm={openProForm}
            deleteProfessional={deleteProfessional}
            resendVerification={resendVerification}
            go={go}
          />
        )}

        {screen === 'choosetype' && (
          <ChooseAccountType go={go} account={me.account} openProForm={openProForm} openCompanyForm={openCompanyForm} openParticulierForm={openParticulierForm} openMissionForm={openMissionForm} />
        )}

        {screen === 'privacy' && <PrivacyScreen go={go} />}
        {screen === 'legal' && <LegalScreen go={go} />}
        {screen === 'terms' && <TermsScreen go={go} />}

        {screen === 'login' && <LoginScreen go={go} login={login} account={me.account} />}
      </main>

      <SiteFooter go={go} scrollToSection={scrollToSection} openProForm={openProForm} openCompanyForm={openCompanyForm} />
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */
function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-xl" style={{ zIndex: 100 }}>
      {message}
    </div>
  );
}

/* =========================================================
   HEADER / FOOTER
========================================================= */
function SiteHeader({ screen, go, menuOpen, setMenuOpen, account, logout }) {
  const mySpace = account ? { pro: 'dashpro', company: 'dashcompany', particulier: 'dashpart' }[account.kind] : null;
  const links = [
    { id: 'home', label: 'Accueil' },
    { id: 'search', label: 'Trouver un professionnel' },
    { id: 'dashcompany', label: 'Espace entreprise' },
    { id: 'dashpro', label: 'Espace professionnel' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-6 py-3">
        <button onClick={() => go('home')} aria-label="ONASKILL — Accueil" className="flex-shrink-0">
          <Logo className="h-9 w-auto sm:h-10" />
        </button>
        <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium text-muted-foreground lg:flex">
          {links.map((l) => (
            <button key={l.id} onClick={() => go(l.id)} className={screen === l.id ? 'text-primary' : 'hover:text-foreground'}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {account ? (
            <>
              <Button variant="ghost" size="sm" onClick={logout}>Déconnexion</Button>
              {account.isAdmin && <Button variant="outline" size="sm" onClick={() => go('admin')}><ShieldCheck className="mr-1.5 h-4 w-4" />Administration</Button>}
              <Button size="sm" onClick={() => go(mySpace)}><LayoutDashboard className="mr-1.5 h-4 w-4" />Mon espace</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => go('login')}><LogIn className="mr-1.5 h-4 w-4" />Connexion</Button>
              <Button size="sm" onClick={() => go('choosetype')}><UserPlus className="mr-1.5 h-4 w-4" />Créer un compte</Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
        <button aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <button key={l.id} onClick={() => go(l.id)} className="rounded-md px-2 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-slate-50">
                {l.label}
              </button>
            ))}
            <div className="mt-2 flex gap-2">
              {account ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1" onClick={logout}>Déconnexion</Button>
                  {account.isAdmin && <Button variant="outline" size="sm" className="flex-1" onClick={() => go('admin')}>Administration</Button>}
                  <Button size="sm" className="flex-1" onClick={() => go(mySpace)}>Mon espace</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => go('login')}>Connexion</Button>
                  <Button size="sm" className="flex-1" onClick={() => go('choosetype')}>Créer un compte</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter({ go, scrollToSection, openProForm, openCompanyForm }) {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="container mx-auto grid grid-cols-1 gap-10 py-14 md:grid-cols-[3fr_2fr] lg:gap-24">
        <div>
          <Logo dark className="mb-4 h-10 w-auto" />
          {/* Same words as the top of the home page (hero title + paragraph). */}
          <p className="max-w-lg text-sm font-semibold leading-relaxed text-white">
            Diplômé, formé ou autodidacte, chaque savoir‑faire mérite une opportunité.
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
            Avec ou sans diplôme, faites connaître votre savoir‑faire sur ONASKILL : créez votre profil et recevez des missions d’entreprises et de particuliers partout au Gabon.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:border-accent hover:text-accent"><MessageCircle className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:border-accent hover:text-accent text-xs font-bold">f</a>
            <a href="#" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:border-accent hover:text-accent"><ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Contact</h5>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 flex-shrink-0 text-accent" /> Libreville, Gabon</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0 text-accent" /> +241 00 00 00 00</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0 text-accent" /> contact@onaskill.com</li>
          </ul>
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Newsletter</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input placeholder="Votre email" className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500" />
              <Button type="submit" size="sm">OK</Button>
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ONASKILL — Phase pilote Port-Gentil · Libreville / Owendo
        <span className="mx-2">·</span>
        <button onClick={() => go('legal')} className="hover:text-white">Mentions légales</button>
        <span className="mx-2">·</span>
        <button onClick={() => go('terms')} className="hover:text-white">Conditions d'utilisation</button>
        <span className="mx-2">·</span>
        <button onClick={() => go('privacy')} className="hover:text-white">Confidentialité</button>
      </div>
    </footer>
  );
}

/* =========================================================
   HOME SCREEN
========================================================= */
function HomeScreen({ go, professionals, searchTrade, setSearchTrade, searchCity, setSearchCity, searchAvailability, setSearchAvailability, searchSector, setSearchSector, handleSearch, openMissionForm, openProForm, openCompanyForm }) {
  const searchTradeFor = (trade) => { setSearchTrade(trade); setSearchSector('all'); go('search'); };
  const searchSectorFor = (sector) => { setSearchSector(sector); setSearchTrade('all'); go('search'); };
  const [heroPaused, setHeroPaused] = useState(false);

  return (
    <div className="flex flex-col">
      <style>{`
        @keyframes techgabon-left { from { transform: translateX(0); } to { transform: translateX(calc(-50% - 0.5rem)); } }
        .animate-scroll-left { animation: techgabon-left 38s linear infinite; }
        .animate-scroll-left-slow { animation: techgabon-left 48s linear infinite; }
        .hero-scroller.is-paused .animate-scroll-left, .hero-scroller.is-paused .animate-scroll-left-slow { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-left, .animate-scroll-left-slow { animation: none; }
        }
      `}</style>

      {/* Hero: trade photos scroll right-to-left in the background (two rows), under a
          navy overlay that is darker on the text side so the text stays readable while the
          photos remain clearly visible. */}
      <section className={`hero-scroller relative overflow-hidden bg-navy-950 text-white ${heroPaused ? 'is-paused' : ''}`}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 py-6" aria-hidden="true">
          {[HERO_ITEMS.filter((_, i) => i % 2 === 0), HERO_ITEMS.filter((_, i) => i % 2 === 1)].map((row, r) => (
            <div key={r} className={`flex w-max gap-4 ${r === 0 ? 'animate-scroll-left' : 'animate-scroll-left-slow'}`}>
              {[...row, ...row].map((item, i) => (
                <figure key={i} className="relative h-44 w-64 flex-shrink-0 overflow-hidden rounded-2xl sm:h-56 sm:w-80 lg:h-64 lg:w-96">
                  <img src={item.img} alt="" decoding="async" className="h-full w-full object-cover" />
                  <figcaption className="absolute bottom-3 right-3 hidden rounded-full bg-navy-950/70 px-3 py-1 text-xs font-medium text-white/90 lg:block">{item.title}</figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
        {/* Overlay: uniform on small screens (text spans the width), stronger on the left on large ones. */}
        <div className="pointer-events-none absolute inset-0 bg-navy-950/55 lg:bg-transparent lg:bg-gradient-to-r lg:from-navy-950/95 lg:via-navy-950/70 lg:to-navy-950/25" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />

        <div className="container relative mx-auto max-w-7xl pb-32 pt-20 md:pt-28 lg:pb-44">
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-balance text-[1.75rem] font-extrabold leading-[1.15] tracking-tight drop-shadow-[0_2px_10px_rgba(7,18,38,0.95)] sm:text-4xl lg:text-[2.6rem]">
              Diplômé, formé ou autodidacte, <span className="text-gold-400">chaque savoir‑faire mérite une opportunité.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(7,18,38,1)] sm:text-lg lg:mx-0">
              Avec ou sans diplôme, faites connaître votre savoir‑faire sur ONASKILL : créez votre profil et recevez des missions d’entreprises et de particuliers partout au Gabon.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <HeroButton onClick={() => go('search')} icon={Search}>Je recherche un professionnel</HeroButton>
              <HeroButton outline onClick={() => openProForm()} icon={Wrench}>Je suis un professionnel</HeroButton>
            </div>
          </div>
        </div>
        <PauseButton paused={heroPaused} onToggle={() => setHeroPaused((v) => !v)} label="le défilement des photos" className="absolute bottom-24 right-4 z-10 lg:bottom-28" dark />
      </section>

      {/* Search bar, overlapping the hero */}
      <section className="relative z-10 -mt-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <Card className="rounded-2xl border-0 shadow-2xl shadow-navy-950/20">
            <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label htmlFor="f7" className="text-sm font-medium text-foreground">Métier / compétence</label>
                      <SearchCombobox id="f7" value={searchTrade} onChange={setSearchTrade} options={TRADE_OPTIONS} icon={Search} placeholder="Ex. plombier, soudeur…" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="f8" className="text-sm font-medium text-foreground">Localisation</label>
                      <SearchCombobox id="f8" value={searchCity} onChange={setSearchCity} options={LOCATION_OPTIONS} icon={MapPin} placeholder="Province ou ville (ex. Estuaire, Oyem)" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="home-sector" className="text-sm font-medium text-foreground">Secteur d'activité</label>
                      <SearchCombobox id="home-sector" value={searchSector} onChange={setSearchSector} options={SECTOR_OPTIONS} icon={Building2} placeholder="Ex. BTP, Pétrole & Gaz…" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="f9" className="text-sm font-medium text-foreground">Disponibilité</label>
                      <Select value={searchAvailability} onValueChange={setSearchAvailability}>
                        <SelectTrigger id="f9"><Circle className="mr-2 h-3 w-3 fill-green-500 text-green-500" /><SelectValue placeholder="Toutes" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="now">Disponible maintenant</SelectItem>
                          <SelectItem value="soon">Disponible bientôt</SelectItem>
                          <SelectItem value="unavailable">Indisponible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="h-12 w-full rounded-full bg-navy-900 text-base font-semibold hover:bg-navy-800">
                    <Search className="mr-2 h-5 w-5" /> Rechercher
                  </Button>
                </form>
            </CardContent>
          </Card>

          <dl className="mt-8 grid grid-cols-2 gap-y-6 rounded-2xl border border-navy-900/5 bg-white/60 px-4 py-6 text-center sm:grid-cols-4 sm:divide-x sm:divide-navy-900/10">
            {[
              { value: TRADES.length, label: 'métiers' },
              { value: SECTOR_KEYS.length, label: "secteurs d'activité" },
              { value: PROVINCES.length, label: 'provinces couvertes' },
              { value: PROVINCES.reduce((n, p) => n + GABON[p].length, 0), label: 'villes' },
            ].map((f) => (
              <div key={f.label} className="px-2">
                <dt className="sr-only">{f.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight text-navy-900">{f.value}</dd>
                <dd className="mt-1 text-sm text-muted-foreground">{f.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Nos métiers: photos left (named after the trade), short text right */}
      <GallerySection
        eyebrow="Nos métiers"
        title="Des professionnels pour chaque besoin"
        subtitle="Du maintenancier au coiffeur, en passant par le plombier, le soudeur ou le foreur."
        text={`Près de ${Math.round((TRADES.length - 1) / 10) * 10} métiers, manuels comme techniques, exercés par des talents diplômés, formés ou autodidactes. Chaque professionnel présente son expérience, ses compétences et ses disponibilités : trouvez la bonne personne, près de chez vous, et contactez-la directement.`}
        tiles={PHOTO_SHOWCASE.map((m) => ({ title: m.title, img: m.img, onClick: () => searchTradeFor(m.trade) }))}
        ctaLabel="Voir tous les professionnels"
        onCta={() => searchTradeFor('all')}
      />

      {/* How It Works — compact band: title left, three short steps right */}
      <section id="howitworks" className="bg-navy-950 py-14 text-white md:py-16">
        <div className="container mx-auto grid items-center gap-10 lg:grid-cols-[1fr_3fr] lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Comment ça marche</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">Simple, en trois étapes</h2>
          </div>
          <ol className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              { title: 'Publiez votre besoin', text: 'Métier, lieu et durée de la mission.' },
              { title: 'Recevez des profils', text: 'Les talents les plus adaptés vous sont proposés.' },
              { title: 'Contactez et collaborez', text: 'Échangez directement, par message ou WhatsApp.' },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-400 text-base font-extrabold text-navy-900">{i + 1}</span>
                <div>
                  <p className="font-semibold leading-snug">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Secteurs d'activité: short text left, photos right (named after the sector) */}
      <GallerySection
        tinted
        reverse
        eyebrow="Secteurs d'activité"
        title="Partout où l'économie gabonaise avance"
        subtitle="Des compétences pour tous les secteurs d'activité, des grandes entreprises aux particuliers."
        text="Pétrole et gaz, mines, BTP, forêt et bois, énergie, industrie, agriculture, commerce ou services à la personne : ONASKILL réunit les talents dont chaque secteur a besoin, de Libreville à Port-Gentil, de Franceville à Oyem."
        tiles={SECTOR_KEYS.filter((k) => PHOTO_SECTORS[k]).map((k) => ({ title: k, img: PHOTO_SECTORS[k].img, onClick: () => searchSectorFor(k) }))}
        ctaLabel="Explorer par secteur"
        onCta={() => go('search')}
      />

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto">
          <div
            className="relative overflow-hidden rounded-3xl bg-navy-900 text-center text-white shadow-2xl"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
            <div className="relative p-10 md:p-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#ffffff' }}>Prêt à saisir votre prochaine opportunité ?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>Talents avec ou sans diplôme, entreprises et particuliers : rejoignez ONASKILL pour valoriser un savoir-faire ou trouver les compétences qu'il vous faut.</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <HeroButton onClick={() => openCompanyForm()} icon={Building2}>Inscrire mon entreprise</HeroButton>
                <HeroButton outline onClick={() => openProForm()} icon={Wrench}>Créer un profil professionnel</HeroButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SEARCH / DIRECTORY
========================================================= */
function SearchScreen({ professionals, searchTrade, setSearchTrade, searchCity, setSearchCity, searchAvailability, setSearchAvailability, searchSector, setSearchSector, searchSort, setSearchSort, openProfile, go }) {
  let results = professionals.filter((p) => {
    if (!matchesTrade(searchTrade, p)) return false;
    if (!matchesLocation(searchCity, p)) return false;
    if (searchAvailability !== 'all' && p.dispo !== searchAvailability) return false;
    if (!matchesSector(searchSector, p)) return false;
    return true;
  });
  if (searchSort === 'experience') results = [...results].sort((a, b) => b.experience - a.experience);
  else if (searchSort === 'note') results = [...results].sort((a, b) => (b.note || 0) - (a.note || 0));
  else if (searchSort === 'score') results = [...results].sort((a, b) => proScore(b) - proScore(a));

  return (
    <div>
      <ScreenHeader eyebrow="Annuaire" title="Trouver un professionnel" />
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-5">
            <SearchCombobox value={searchTrade} onChange={setSearchTrade} options={TRADE_OPTIONS} icon={Search} placeholder="Métier" />
            <SearchCombobox value={searchCity} onChange={setSearchCity} options={LOCATION_OPTIONS} icon={MapPin} placeholder="Province ou ville" />
            <SearchCombobox value={searchSector} onChange={setSearchSector} options={SECTOR_OPTIONS} icon={Building2} placeholder="Secteur" />
            <Select value={searchAvailability} onValueChange={setSearchAvailability}>
              <SelectTrigger><SelectValue placeholder="Disponibilité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="now">Disponible maintenant</SelectItem>
                <SelectItem value="soon">Disponible bientôt</SelectItem>
                <SelectItem value="unavailable">Indisponible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={searchSort} onValueChange={setSearchSort}>
              <SelectTrigger><SelectValue placeholder="Trier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pertinence">Pertinence</SelectItem>
                <SelectItem value="experience">Expérience</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="score">Score du profil</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
          <Button size="sm" variant="outline" onClick={() => go('choosetype')}><Plus className="mr-1.5 h-4 w-4" />Rejoindre ONASKILL</Button>
        </div>

        {results.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Aucun professionnel ne correspond à cette recherche.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((p) => (
              <Card key={p.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-5">
                  <Avatar className="h-14 w-14 flex-shrink-0"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{(p.prenom[0] || '') + (p.nom[0] || '')}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openProfile(p.id)}>
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{p.prenom} {p.nom}</h3>
                      {p.demo && <DemoBadge />}
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${p.dispo === 'now' ? 'bg-green-500' : p.dispo === 'soon' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                    <p className="text-sm text-muted-foreground">{p.metier}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.ville} · {p.province} · {p.experience} ans d'expérience</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-xs font-semibold text-navy-900">Score {proScore(p)}/100</span>
                      {(p.competences || []).slice(0, 3).map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s.name}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */
function ProfileScreen({ pro, own, go, openProForm, deleteProfessional, openMissionForm, resendVerification }) {
  if (own) pro = { ...pro, ...own };
  if (!pro) return <div className="container mx-auto py-16 text-center text-muted-foreground">Ce profil n'existe plus. <Button variant="link" onClick={() => go('search')}>Retour</Button></div>;

  const wa = (pro.whatsapp || '').replace(/[^\d]/g, '');
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent('Bonjour ' + pro.prenom + ', je vous contacte via ONASKILL.')}` : null;
  const docs = pro.docs || { cv: null, diplome: null, certifs: [] };

  return (
    <div>
      <ScreenHeader eyebrow="Profil professionnel" title={`${pro.prenom} ${pro.nom}`} onBack={() => go('search')} />
      <div className="container mx-auto grid grid-cols-1 gap-8 py-10 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-6">
              <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{(pro.prenom[0] || '') + (pro.nom[0] || '')}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{pro.metier}</h2>
                  {pro.demo && <DemoBadge />}
                  {pro.verified === false ? (
                    <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Email non confirmé</Badge>
                  ) : pro.verified ? (
                    <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Vérifié</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{pro.ville} · {pro.quartier} · {pro.province}</p>
                <p className="text-sm text-muted-foreground">{pro.experience} ans d'expérience · {pro.missionsTerminees > 0 && pro.note ? `⭐ ${pro.note}/5 (${pro.missionsTerminees} missions)` : 'Nouveau profil'}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-gold-400/15 px-2.5 py-0.5 text-xs font-semibold text-navy-900">
                  Score du profil : {proScore(pro)}/100 · {scoreLabel(proScore(pro))}
                </p>
                {own && pro.verified === false && (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={resendVerification}>Renvoyer l'email de confirmation</Button>
                )}
              </div>
              {own && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openProForm}><Pencil className="mr-1.5 h-3.5 w-3.5" />Modifier</Button>
                  <Button variant="destructive" size="sm" onClick={deleteProfessional}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Supprimer</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold">Compétences</h3>
              <div className="space-y-2">
                {(pro.competences || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-40 flex-shrink-0">{s.name}</span>
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-1.5 w-5 rounded ${n <= s.level ? 'bg-primary' : 'bg-muted'}`} />)}</div>
                  </div>
                ))}
                {(pro.competences || []).length === 0 && <p className="text-sm text-muted-foreground">Aucune compétence renseignée.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-1 font-semibold">Documents</h3>
              <p className="mb-4 text-xs text-muted-foreground">{own ? 'Vos documents restent privés : vous seul pouvez les ouvrir.' : 'Les documents restent privés. Seule leur présence est indiquée.'}</p>
              <div className="space-y-2">
                {[docs.cv && { ...docs.cv, label: 'CV', href: '/api/files/cv' }, docs.diplome && { ...docs.diplome, label: 'Diplôme', href: '/api/files/diplome' }, ...((docs.certifs || []).map((d, n) => (d ? { ...d, label: 'Certification', href: `/api/files/certif/${n}` } : null)))].filter(Boolean).map((d, i) => (
                  own ? (
                    <a key={i} href={d.href} target="_blank" rel="noopener" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-primary hover:bg-slate-50">
                      <FileText className="h-4 w-4" /> {d.label} — {d.name} <span className="text-xs text-muted-foreground">({fmtSize(d.size)})</span>
                    </a>
                  ) : (
                    <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" /> {d.label} fourni
                    </div>
                  )
                ))}
                {!docs.cv && !docs.diplome && (docs.certifs || []).length === 0 && <p className="text-sm text-muted-foreground">Aucun document déposé.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-2 p-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</h4>
              {pro.telephone && <a href={`tel:${pro.telephone}`} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-slate-50"><Phone className="h-4 w-4" />{pro.telephone}</a>}
              {pro.email && <a href={`mailto:${pro.email}`} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-slate-50"><Mail className="h-4 w-4" />{pro.email}</a>}
              <Button className="w-full" disabled={!waLink} onClick={() => waLink && window.open(waLink, '_blank')}>
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp{!waLink && ' (non renseigné)'}
              </Button>
              {pro.linkedin && <a href={pro.linkedin} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full"><ExternalLink className="mr-2 h-4 w-4" />LinkedIn</Button></a>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Certifications</h4>
              <div className="space-y-2">
                {(pro.certifications || []).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm"><span>{c.name}</span><Badge variant={c.verified ? 'default' : 'secondary'}>{c.verified ? 'Vérifié' : 'En cours'}</Badge></div>
                ))}
                {(pro.certifications || []).length === 0 && <p className="text-sm text-muted-foreground">Aucune certification.</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secteurs</h4>
              <div className="flex flex-wrap gap-2">{(pro.secteurs || []).map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}</div>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => openMissionForm(null, 'particulier')}>Proposer une mission</Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFESSIONAL FORM
========================================================= */
function ProForm({ existing, isSignup, onCancel, onSave, go }) {
  const [nom, setNom] = useState(existing ? existing.nom : '');
  const [prenom, setPrenom] = useState(existing ? existing.prenom : '');
  const [province, setProvince] = useState(existing ? existing.province : 'Estuaire');
  const [ville, setVille] = useState(existing ? existing.ville : '');
  const [quartier, setQuartier] = useState(existing ? existing.quartier : '');
  const [dispo, setDispo] = useState(existing ? existing.dispo : 'now');
  const [metier, setMetier] = useState(existing ? existing.metier : '');
  const [experience, setExperience] = useState(existing ? String(existing.experience) : '');
  const [secteurs, setSecteurs] = useState(existing ? existing.secteurs : []);
  const [competences, setCompetences] = useState(existing ? existing.competences : []);
  const [certifications, setCertifications] = useState(existing ? existing.certifications : []);
  const [telephone, setTelephone] = useState(existing ? existing.telephone : '');
  const [email, setEmail] = useState(existing ? existing.email : '');
  const [whatsapp, setWhatsapp] = useState(existing ? existing.whatsapp : '');
  const [linkedin, setLinkedin] = useState(existing ? existing.linkedin : '');
  const [docs, setDocs] = useState(existing && existing.docs ? existing.docs : { cv: null, diplome: null, certifs: [] });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // Completed missions and rating are set by the platform, never typed in the form.
  const buildRecord = () => ({
    id: existing ? existing.id : undefined,
    nom: nom.trim(), prenom: prenom.trim(), province, ville: ville.trim(), quartier: quartier.trim(),
    dispo, metier: metier.trim(), experience: parseInt(experience, 10) || 0,
    secteurs, competences, certifications, docs,
    telephone: telephone.trim(), email: email.trim(), whatsapp: whatsapp.trim(), linkedin: linkedin.trim(),
  });
  const live = scoreProfessional({ ...buildRecord(), missionsTerminees: existing ? existing.missionsTerminees : 0, note: existing ? existing.note : null });

  const submit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!nom.trim()) missing.push('Nom');
    if (!prenom.trim()) missing.push('Prénom');
    if (!ville.trim()) missing.push('Ville');
    if (!metier.trim() || metier === 'Autre métier') missing.push('Métier principal (précisez-le si vous avez choisi « Autre métier »)');
    if (!telephone.trim()) missing.push('Téléphone');
    if (!email.trim()) missing.push('Email (nécessaire pour la confirmation de compte)');
    if (!docs.cv) missing.push('CV');
    const newBytes = [docs.cv, docs.diplome, ...(docs.certifs || [])].filter((f) => f && f.dataUrl).reduce((n, f) => n + (f.size || 0), 0);
    if (newBytes > 3 * 1024 * 1024) missing.push('Documents : 3 Mo au total maximum par envoi (ajoutez les justificatifs en plusieurs fois)');
    missing.push(...passwordProblems(isSignup, password, confirm));
    if (isSignup && !accepted) missing.push("Acceptation des conditions d'utilisation");
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    setSaving(true);
    const problem = await onSave({ ...buildRecord(), acceptTerms: isSignup ? accepted : undefined }, isSignup ? password : undefined);
    setSaving(false);
    if (problem) { setErrors([problem]); window.scrollTo(0, 0); }
  };

  return (
    <div>
      <ScreenHeader eyebrow={existing ? 'Édition du profil' : 'Inscription professionnel'} title={existing ? 'Modifier le profil' : 'Créer votre profil professionnel'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            <ScoreCard result={live} title="Score de votre profil" note="Calculé automatiquement selon votre expérience, vos compétences, la qualité de votre CV et la complétude du profil." />
            <p className="text-xs text-muted-foreground">Les champs marqués d'une <Req /> sont obligatoires.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="f10">Nom <Req /></Label><Input id="f10" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Mabiala" /></div>
              <div className="space-y-2"><Label htmlFor="f11">Prénom <Req /></Label><Input id="f11" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" /></div>
            </div>

            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} villeRequired />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TradeField id="f12" label="Métier principal" value={metier} onChange={setMetier} required />
              <div className="space-y-2">
                <Label htmlFor="f13">Disponibilité</Label>
                <Select value={dispo} onValueChange={setDispo}>
                  <SelectTrigger id="f13"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">🟢 Disponible maintenant</SelectItem>
                    <SelectItem value="soon">🟠 Disponible bientôt</SelectItem>
                    <SelectItem value="unavailable">🔴 Indisponible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="f14">Années d'expérience</Label><Input id="f14" type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="5" /></div>
            </div>
            <p className="text-xs text-muted-foreground">Les missions réalisées et la note sont ajoutées par ONASKILL à partir des avis de vos clients : elles ne peuvent pas être saisies ici.</p>

            <SectorPicker label="Secteurs d'activité" value={secteurs} onChange={setSecteurs} />

            <TagAdder label="Compétences" placeholder="Ex : Pompes, Tuyauterie PVC..." items={competences} onChange={setCompetences} withLevel />
            <TagAdder label="Certifications (texte)" placeholder="Ex : BOSIET, Habilitation électrique..." items={certifications} onChange={setCertifications} withVerified />

            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-semibold">Documents (CV, diplôme, certifications)</p>
              <FileField label={<>CV (PDF / Word) <Req /></>} accept=".pdf,.doc,.docx" value={docs.cv} onChange={(v) => setDocs({ ...docs, cv: v })} />
              <FileField label="Diplôme principal (PDF / Image)" accept=".pdf,.jpg,.jpeg,.png" value={docs.diplome} onChange={(v) => setDocs({ ...docs, diplome: v })} />
              <FileField label="Justificatifs de certification" accept=".pdf,.jpg,.jpeg,.png" multiple value={docs.certifs} onChange={(v) => setDocs({ ...docs, certifs: v })} />
              <p className="text-xs text-muted-foreground">PDF, Word ou image, 1,5 Mo maximum par fichier. Vos documents restent privés : vous seul pouvez les ouvrir. Les visiteurs voient seulement « CV fourni ».</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold">Contact</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="f15">Téléphone <Req /></Label><Input id="f15" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+241 XX XX XX XX" /></div>
                <div className="space-y-2"><Label htmlFor="f16">Email <Req /></Label><Input id="f16" type="email" autoComplete="email" value={email} disabled={!isSignup} onChange={(e) => setEmail(e.target.value)} placeholder="jean.mabiala@email.com" /></div>
                <div className="space-y-2"><Label htmlFor="f17">WhatsApp</Label><Input id="f17" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+241XXXXXXXX" /></div>
                <div className="space-y-2"><Label htmlFor="f18">LinkedIn</Label><Input id="f18" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/..." /></div>
              </div>
              <p className="text-xs text-muted-foreground">Le téléphone et WhatsApp sont affichés sur votre profil pour que les clients vous contactent. L'email sert à vous connecter et n'est jamais affiché publiquement.</p>
            </div>

            {isSignup && <PasswordFields password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />}
            {isSignup && <ConsentCheckbox checked={accepted} onChange={setAccepted} go={go} />}
            {isSignup && <p className="text-xs text-muted-foreground">Déjà inscrit ? <button type="button" className="font-medium text-navy-900 underline" onClick={() => go('login')}>Connectez-vous</button></p>}

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : isSignup ? 'Créer mon compte' : 'Enregistrer'}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

/* =========================================================
   COMPANY FORM
========================================================= */
function CompanyForm({ existing, isSignup, onCancel, onSave, onDelete, go }) {
  const currentYear = 2026;
  const [nom, setNom] = useState(existing ? existing.nom : '');
  const [province, setProvince] = useState(existing ? existing.province : 'Estuaire');
  const [ville, setVille] = useState(existing ? existing.ville : '');
  const [quartier, setQuartier] = useState(existing ? existing.quartier : '');
  const [annee, setAnnee] = useState(existing ? String(existing.annee) : '2020');
  const [effectif, setEffectif] = useState(existing ? existing.effectif : '1-10');
  const [site, setSite] = useState(existing ? existing.site : '');
  const [nif, setNif] = useState(existing ? existing.nif || '' : '');
  const [secteurs, setSecteurs] = useState(existing ? existing.secteurs : []);
  const [description, setDescription] = useState(existing ? existing.description : '');
  const [logo, setLogo] = useState(existing ? existing.logo : null);
  const [contact, setContact] = useState(existing ? existing.contact : '');
  const [telephone, setTelephone] = useState(existing ? existing.telephone : '');
  const [email, setEmail] = useState(existing ? existing.email : '');
  const [whatsapp, setWhatsapp] = useState(existing ? existing.whatsapp : '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const years = [];
  for (let y = currentYear; y >= 1955; y--) years.push(y);

  const buildRecord = () => ({
    id: existing ? existing.id : undefined,
    nom: nom.trim(), province, ville: ville.trim(), quartier: quartier.trim(),
    annee: parseInt(annee, 10), effectif, site: site.trim(), nif: nif.trim(), secteurs, description: description.trim(), logo,
    contact: contact.trim(), telephone: telephone.trim(), email: email.trim(), whatsapp: whatsapp.trim(),
  });
  const live = scoreCompany(buildRecord(), currentYear);

  const submit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!nom.trim()) missing.push("Nom de l'entreprise");
    if (!ville.trim()) missing.push('Ville');
    if (!secteurs.length) missing.push("Au moins un domaine d'activité (précisez-le si vous avez choisi « Autre »)");
    if (!telephone.trim()) missing.push('Téléphone');
    if (!email.trim()) missing.push('Email (nécessaire pour la confirmation de compte)');
    if (!logo) missing.push("Logo de l'entreprise");
    missing.push(...passwordProblems(isSignup, password, confirm));
    if (isSignup && !accepted) missing.push("Acceptation des conditions d'utilisation");
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    setSaving(true);
    const problem = await onSave({ ...buildRecord(), acceptTerms: isSignup ? accepted : undefined }, isSignup ? password : undefined);
    setSaving(false);
    if (problem) { setErrors([problem]); window.scrollTo(0, 0); }
  };

  return (
    <div>
      <ScreenHeader eyebrow={existing ? 'Édition' : 'Inscription entreprise'} title={existing ? 'Modifier la fiche entreprise' : 'Créer ma fiche entreprise'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            <ScoreCard result={live} title="Score de votre entreprise" note="Calculé automatiquement selon l'identité légale, l'ancienneté, la présentation et les moyens de contact." />
            <p className="text-xs text-muted-foreground">Les champs marqués d'une <Req /> sont obligatoires.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="f19">Nom de l'entreprise <Req /></Label><Input id="f19" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="SOBRAGA, Assala Energy..." /></div>
              <div className="space-y-2"><Label htmlFor="f20">Site web (optionnel)</Label><Input id="f20" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://..." /></div>
            </div>

            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} villeRequired />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="f21">Année de création</Label>
                <Select value={annee} onValueChange={setAnnee}>
                  <SelectTrigger id="f21"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="f22">Effectif</Label>
                <Select value={effectif} onValueChange={setEffectif}>
                  <SelectTrigger id="f22"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 à 10 salariés</SelectItem>
                    <SelectItem value="11-50">11 à 50 salariés</SelectItem>
                    <SelectItem value="51-200">51 à 200 salariés</SelectItem>
                    <SelectItem value="200+">Plus de 200 salariés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="f23">NIF / RCCM (optionnel)</Label>
                <Input id="f23" value={nif} onChange={(e) => setNif(e.target.value)} placeholder="Numéro d'identification fiscale" />
              </div>
            </div>

            <SectorPicker label="Domaines d'activité" value={secteurs} onChange={setSecteurs} required />

            <div className="space-y-2"><Label htmlFor="f24">Description de l'activité</Label><Textarea id="f24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Présentez votre entreprise et vos besoins récurrents en compétences techniques." /></div>

            <FileField label={<>Logo de l'entreprise <Req /></>} accept=".jpg,.jpeg,.png" value={logo} onChange={setLogo} maxBytes={300 * 1024} hint="Image JPG ou PNG, 300 Ko maximum." />

            <div className="space-y-4">
              <p className="text-sm font-semibold">Contact</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="f25">Nom du contact</Label><Input id="f25" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Responsable RH / Achats" /></div>
                <div className="space-y-2"><Label htmlFor="f26">Téléphone <Req /></Label><Input id="f26" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+241 XX XX XX XX" /></div>
                <div className="space-y-2"><Label htmlFor="f27">Email <Req /></Label><Input id="f27" type="email" autoComplete="email" value={email} disabled={!isSignup} onChange={(e) => setEmail(e.target.value)} placeholder="contact@entreprise.ga" /></div>
                <div className="space-y-2"><Label htmlFor="f28">WhatsApp</Label><Input id="f28" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+241XXXXXXXX" /></div>
              </div>
              <p className="text-xs text-muted-foreground">L'email sert à vous connecter et n'est jamais affiché publiquement. Le NIF / RCCM reste privé.</p>
            </div>

            {isSignup && <PasswordFields password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />}
            {isSignup && <ConsentCheckbox checked={accepted} onChange={setAccepted} go={go} />}
            {isSignup && <p className="text-xs text-muted-foreground">Déjà inscrit ? <button type="button" className="font-medium text-navy-900 underline" onClick={() => go('login')}>Connectez-vous</button></p>}

            <div className="flex items-center justify-between border-t pt-6">
              {onDelete ? <Button type="button" variant="destructive" onClick={onDelete}>Supprimer ma fiche et mon compte</Button> : <span />}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : isSignup ? 'Créer mon compte' : 'Enregistrer'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

/* =========================================================
   MISSION FORM
========================================================= */
function MissionForm({ existing, defaultClientType, defaultClientName, lockedType, anonymous, onCancel, onSave, onDelete }) {
  const [clientType, setClientType] = useState(existing ? existing.clientType : defaultClientType);
  const [clientName, setClientName] = useState(existing ? existing.clientName : defaultClientName);
  const [titre, setTitre] = useState(existing ? existing.titre : '');
  const [metier, setMetier] = useState(existing ? existing.metier : '');
  const [experienceMin, setExperienceMin] = useState(existing ? String(existing.experienceMin) : '3');
  const [competences, setCompetences] = useState(existing ? existing.competences : []);
  const [secteur, setSecteur] = useState(existing ? existing.secteur : SECTOR_KEYS[0]);
  const [province, setProvince] = useState(existing ? existing.province : 'Estuaire');
  const [ville, setVille] = useState(existing ? existing.ville : '');
  const [quartier, setQuartier] = useState(existing ? existing.quartier : '');
  const [duree, setDuree] = useState(existing ? existing.duree : '5 jours');
  const [date, setDate] = useState(existing ? existing.date : '');
  const [statut, setStatut] = useState(existing ? existing.statut : 'active');
  const [budget, setBudget] = useState(existing ? existing.budget : '');
  const [description, setDescription] = useState(existing ? existing.description : '');
  const [errors, setErrors] = useState([]);
  const [accepted, setAccepted] = useState(false);

  const buildRecord = () => ({
    id: existing ? existing.id : undefined,
    clientType: anonymous ? 'particulier' : lockedType || clientType, clientName: clientName.trim(), titre: titre.trim(), metier: metier.trim(),
    experienceMin: parseInt(experienceMin, 10) || 0, competences, secteur,
    province, ville: ville.trim(), quartier: quartier.trim(), duree, date, statut, budget: budget.trim(), description: description.trim(),
  });
  const live = scoreMission(buildRecord());

  const submit = (e) => {
    e.preventDefault();
    const missing = [];
    if (!titre.trim()) missing.push('Titre');
    if (!metier.trim() || metier === 'Autre métier') missing.push('Métier (précisez-le si vous avez choisi « Autre métier »)');
    if (!ville.trim()) missing.push('Localisation (ville)');
    if (anonymous && !existing && !accepted) missing.push("Acceptation des conditions d'utilisation");
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    onSave({ ...buildRecord(), acceptTerms: anonymous && !existing ? accepted : undefined });
  };

  return (
    <div>
      <ScreenHeader eyebrow={existing ? 'Édition' : 'Nouvelle mission'} title={existing ? 'Modifier la mission' : 'Publier une mission'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            {anonymous && !existing && (
              <p className="rounded-lg border border-navy-900/10 bg-secondary/60 p-3 text-xs text-muted-foreground">
                Vous publiez sans compte : seul ce navigateur pourra ensuite modifier ou supprimer votre demande.
              </p>
            )}
            <ScoreCard
              result={live}
              title={clientType === 'particulier' ? 'Score de votre demande' : 'Score de la mission'}
              note="Calculé automatiquement selon la clarté de la demande, la précision du besoin, le lieu, la date et le budget. Une demande bien notée reçoit plus de réponses."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`space-y-2 ${lockedType || anonymous ? 'hidden' : ''}`}>
                <Label htmlFor="f29">Publié par</Label>
                <Select value={clientType} onValueChange={setClientType}>
                  <SelectTrigger id="f29"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="entreprise">Entreprise</SelectItem><SelectItem value="particulier">Particulier</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="f30">Nom (entreprise ou contact)</Label><Input id="f30" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom de l'entreprise ou votre nom" /></div>
            </div>

            <div className="space-y-2"><Label htmlFor="f31">Titre</Label><Input id="f31" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Recherche technicien instrumentation" /></div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TradeField id="f32" label="Métier recherché" value={metier} onChange={setMetier} required />
              <div className="space-y-2"><Label htmlFor="f33">Expérience minimum (ans)</Label><Input id="f33" type="number" min="0" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} /></div>
            </div>

            <TagAdder label="Compétences nécessaires" placeholder="Ex : Calibration" items={competences} onChange={setCompetences} />

            <div className="space-y-2">
              <Label htmlFor="f34">Secteur</Label>
              <Select value={secteur} onValueChange={setSecteur}>
                <SelectTrigger id="f34"><SelectValue /></SelectTrigger>
                <SelectContent>{SECTOR_KEYS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="f35">Durée</Label>
                <Select value={duree} onValueChange={setDuree}>
                  <SelectTrigger id="f35"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 jour">1 jour</SelectItem>
                    <SelectItem value="2-3 jours">2 à 3 jours</SelectItem>
                    <SelectItem value="5 jours">5 jours</SelectItem>
                    <SelectItem value="1-2 semaines">1 à 2 semaines</SelectItem>
                    <SelectItem value="1 mois">1 mois</SelectItem>
                    <SelectItem value="Mission longue durée">Mission longue durée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="f36">Date de début</Label><Input id="f36" value={date} onChange={(e) => setDate(e.target.value)} placeholder="25/08/2026" /></div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="f37">Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger id="f37"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="done">Terminée</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="f38">Budget</Label><Input id="f38" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="À discuter" /></div>
            </div>

            <div className="space-y-2"><Label htmlFor="f39">Description</Label><Textarea id="f39" value={description} onChange={(e) => setDescription(e.target.value)} /></div>

            {anonymous && !existing && <ConsentCheckbox checked={accepted} onChange={setAccepted} />}

            <div className="flex items-center justify-between border-t pt-6">
              {onDelete ? <Button type="button" variant="destructive" onClick={onDelete}>Supprimer la mission</Button> : <span />}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Publier / enregistrer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

/* =========================================================
   MATCHING
========================================================= */
function MatchingScreen({ mission, professionals, go, openProfile, openMissionForm, deleteMission, canManage, back }) {
  if (!mission) return <NotAvailable go={go} title="Demande introuvable" text="Cette demande n'existe pas ou a été supprimée par son auteur." />;

  const ranked = professionals.map((p) => ({ p, ...computeScore(p, mission) })).sort((a, b) => b.score - a.score);

  return (
    <div>
      <ScreenHeader eyebrow={mission.demo ? 'Mission d’exemple' : 'Mission'} title={`Profils recommandés — ${mission.titre}`} onBack={back} />
      <div className="container mx-auto max-w-3xl py-8">
        <p className="mb-6 text-sm text-muted-foreground">{mission.ville || '—'} · {mission.province} · {mission.date || '—'} · {mission.duree} · score pondéré sur 6 critères</p>
        {ranked.length === 0 && <Card><CardContent className="p-10 text-center text-muted-foreground">Aucun professionnel enregistré.</CardContent></Card>}
        <div className="space-y-4">
          {ranked.map(({ p, score, criteres }, i) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-5">
                <span className="w-8 text-2xl font-bold text-muted-foreground/30">{i + 1}</span>
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-primary/20 font-mono text-sm font-bold text-primary">{score}%</div>
                <div className="flex-1" style={{ minWidth: '180px' }}>
                  <h3 className="font-semibold">{p.prenom} {p.nom} — {p.metier}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {mission.competences.filter((s) => p.competences.some((ps) => ps.name.toLowerCase() === s.toLowerCase())).map((s, idx) => <Badge key={idx} variant="secondary">{s}</Badge>)}
                    <span>{p.ville} · {p.experience} ans</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => openProfile(p.id)}>Voir profil</Button>
              </CardContent>
              {i === 0 && (
                <CardContent className="border-t pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Détail du score</p>
                  {Object.keys(WEIGHTS).map((k) => {
                    const labels = { competences: 'Compétences', experience: 'Expérience', certifications: 'Certifications', secteur: 'Secteur', localisation: 'Localisation', disponibilite: 'Disponibilité' };
                    return (
                      <div key={k} className="mb-2 flex items-center gap-3 text-xs">
                        <span className="w-32 text-muted-foreground">{labels[k]} · {WEIGHTS[k]}%</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${criteres[k]}%` }} /></div>
                        <span className="w-8 text-right">{criteres[k]}%</span>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        {canManage && (
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => openMissionForm(mission.id)}>Modifier la demande</Button>
            <Button variant="destructive" onClick={() => deleteMission(mission.id)}>Supprimer la demande</Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   COMPANY DASHBOARD
========================================================= */
function CompanyDashboard({ account, company, myMissions, professionals, openCompanyForm, openMissionForm, openMatching, deleteMission, deleteCompany, resendVerification, go }) {
  const statusLabel = { active: 'Active', pending: 'En attente', done: 'Terminée' };
  const statusColor = { active: 'bg-primary/10 text-primary', pending: 'bg-amber-500/10 text-amber-600', done: 'bg-green-500/10 text-green-600' };

  if (!account || account.kind !== 'company') {
    return (
      <div>
        <ScreenHeader eyebrow="Espace entreprise" title="Espace entreprise" />
        <div className="container mx-auto max-w-xl py-16 text-center">
          <p className="mb-6 text-muted-foreground">
            {account ? `Vous êtes connecté avec un compte ${KIND_LABEL[account.kind]}. L’espace entreprise est réservé aux comptes entreprise.` : 'Connectez-vous à votre compte entreprise, ou créez-en un, pour gérer votre fiche et vos missions.'}
          </p>
          {!account && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => go('login')}>Se connecter</Button>
              <Button onClick={openCompanyForm}>Créer un compte entreprise</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Mes missions', value: myMissions.length },
    { label: 'Missions actives', value: myMissions.filter((m) => m.statut === 'active').length },
    { label: 'Missions terminées', value: myMissions.filter((m) => m.statut === 'done').length },
    { label: 'Professionnels inscrits', value: professionals.length },
  ];

  return (
    <div>
      <ScreenHeader eyebrow="Espace entreprise" title="Tableau de bord entreprise" />
      <div className="container mx-auto py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Connecté en tant que <span className="font-medium text-foreground">{account.email}</span></p>
          <Button onClick={() => openMissionForm()}><Plus className="mr-1.5 h-4 w-4" />Publier une mission</Button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}><CardContent className="p-5"><div className="text-2xl font-bold">{k.value}</div><div className="mt-1 text-xs text-muted-foreground">{k.label}</div></CardContent></Card>
          ))}
        </div>

        {company && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Ma fiche entreprise</h3>
                <Button variant="outline" size="sm" onClick={openCompanyForm}><Pencil className="mr-1.5 h-3.5 w-3.5" />Modifier</Button>
              </div>
              <div className="flex flex-wrap items-start gap-4">
                <Avatar className="h-14 w-14 flex-shrink-0"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{company.nom.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1" style={{ minWidth: '220px' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{company.nom}</h4>
                    {company.verified ? (
                      <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />E-mail confirmé</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />E-mail non confirmé</Badge>
                    )}
                    <span className="rounded-full bg-gold-400/15 px-2.5 py-0.5 text-xs font-semibold text-navy-900">Score {scoreCompany(company).score}/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{company.ville} · {company.province} · Créée en {company.annee} · {company.effectif} salariés</p>
                  <p className="mt-2 text-sm text-muted-foreground">{company.description || 'Aucune description renseignée.'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{(company.secteurs || []).map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}</div>
                  {!company.verified && (
                    <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={resendVerification}>Renvoyer l'email de confirmation</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Mes missions</h3>
            {myMissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune mission publiée.</p>
            ) : (
              <div className="space-y-2">
                {myMissions.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 border-b py-3 text-sm last:border-0">
                    <div className="flex-1" style={{ minWidth: '200px' }}>
                      <span className="font-medium">{m.titre}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{m.clientType === 'particulier' ? 'Particulier' : 'Entreprise'}</Badge>
                    </div>
                    <span className="w-32 text-muted-foreground">{m.ville || '—'}</span>
                    <span className="w-28 text-muted-foreground">{m.date || '—'}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[m.statut]}`}>{statusLabel[m.statut]}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Profils recommandés" onClick={() => openMatching(m.id)}><Target className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Modifier" onClick={() => openMissionForm(m.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Supprimer" onClick={() => deleteMission(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {company && <MyDataCard account={account} record={company} onDelete={deleteCompany} />}
      </div>
    </div>
  );
}

/* =========================================================
   PROFESSIONAL DASHBOARD
========================================================= */
function ProDashboard({ account, pro, openProfile, openProForm, deleteProfessional, resendVerification, go }) {
  if (!account || account.kind !== 'pro') {
    return (
      <div>
        <ScreenHeader eyebrow="Espace professionnel" title="Espace professionnel" />
        <div className="container mx-auto max-w-xl py-16 text-center">
          <p className="mb-6 text-muted-foreground">
            {account ? `Vous êtes connecté avec un compte ${KIND_LABEL[account.kind]}. L’espace professionnel est réservé aux comptes professionnels.` : 'Connectez-vous à votre compte professionnel, ou créez-en un, pour gérer votre profil.'}
          </p>
          {!account && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => go('login')}>Se connecter</Button>
              <Button onClick={openProForm}>Créer mon profil</Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <ScreenHeader eyebrow="Espace professionnel" title="Tableau de bord professionnel" />
      <div className="container mx-auto max-w-3xl py-8">
        <p className="mb-6 text-sm text-muted-foreground">Connecté en tant que <span className="font-medium text-foreground">{account.email}</span></p>
        {pro && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{(pro.prenom[0] || '') + (pro.nom[0] || '')}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openProfile(pro.id)}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate font-medium">{pro.prenom} {pro.nom}</p>
                  {pro.verified ? (
                    <Badge className="gap-1 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5" />E-mail confirmé</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-[10px]"><AlertCircle className="h-2.5 w-2.5" />E-mail non confirmé</Badge>
                  )}
                  <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[11px] font-semibold text-navy-900">Score {proScore(pro)}/100</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{pro.metier} · {pro.ville}</p>
                {!pro.verified && <button type="button" className="mt-1 text-xs font-medium text-navy-900 underline" onClick={(e) => { e.stopPropagation(); resendVerification(); }}>Renvoyer l'email de confirmation</button>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={openProForm}><Pencil className="mr-1.5 h-3.5 w-3.5" />Modifier</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={deleteProfessional}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {pro && <MyDataCard account={account} record={pro} onDelete={deleteProfessional} />}
      </div>
    </div>
  );
}

/* =========================================================
   LOGIN PLACEHOLDER
========================================================= */
function ChooseAccountType({ go, account, openProForm, openCompanyForm, openParticulierForm, openMissionForm }) {
  const options = [
    { icon: Wrench, title: 'Professionnel', desc: "Créez votre profil, ajoutez CV, diplômes et certifications, soyez visible et contacté directement.", action: () => openProForm() },
    { icon: Building2, title: 'Entreprise', desc: "Créez votre fiche entreprise (secteur, année de création, effectif) et publiez vos missions.", action: () => openCompanyForm() },
    { icon: Users, title: 'Particulier', desc: "Publiez vos besoins (plomberie, électricité, ménage…) et gérez vos demandes depuis votre espace, sur n'importe quel appareil.", action: () => openParticulierForm() },
  ];
  return (
    <div>
      <ScreenHeader eyebrow="Créer un compte" title="Quel type de compte souhaitez-vous créer ?" onBack={() => go('home')} />
      <div className="container mx-auto max-w-3xl py-10">
        {account ? (
          <p className="mb-6 rounded-lg border border-gold-400/40 bg-gold-400/5 p-3 text-sm text-foreground/80">Vous êtes déjà connecté ({account.email}). Un compte correspond à un seul profil : déconnectez-vous pour en créer un autre.</p>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">Choisissez le profil qui correspond à votre situation. Vous pourrez compléter vos informations à l'étape suivante.</p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {options.map((opt) => (
            <button key={opt.title} onClick={opt.action} className="rounded-xl border p-6 text-left transition-colors hover:border-primary hover:bg-primary/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <opt.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{opt.title}</h3>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
        {!account && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Besoin ponctuel ?{' '}
            <button type="button" className="font-medium text-navy-900 underline" onClick={() => openMissionForm(null, 'particulier')}>Publier une demande sans créer de compte</button>
            {' '}(modifiable uniquement depuis cet appareil).
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PRIVATE INDIVIDUAL — account form and personal space
========================================================= */
function ParticulierForm({ existing, isSignup, onCancel, onSave, go }) {
  const [nom, setNom] = useState(existing ? existing.nom : '');
  const [prenom, setPrenom] = useState(existing ? existing.prenom : '');
  const [province, setProvince] = useState(existing ? existing.province : 'Estuaire');
  const [ville, setVille] = useState(existing ? existing.ville : '');
  const [quartier, setQuartier] = useState(existing ? existing.quartier : '');
  const [telephone, setTelephone] = useState(existing ? existing.telephone : '');
  const [whatsapp, setWhatsapp] = useState(existing ? existing.whatsapp : '');
  const [email, setEmail] = useState(existing ? existing.email : '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const ids = { nom: useId(), prenom: useId(), tel: useId(), wa: useId(), email: useId() };

  const submit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!nom.trim()) missing.push('Nom');
    if (!prenom.trim()) missing.push('Prénom');
    if (!ville.trim()) missing.push('Ville');
    if (!telephone.trim()) missing.push('Téléphone');
    if (isSignup && !email.trim()) missing.push('Email');
    missing.push(...passwordProblems(isSignup, password, confirm));
    if (isSignup && !accepted) missing.push("Acceptation des conditions d'utilisation");
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    setSaving(true);
    const problem = await onSave({
      id: existing ? existing.id : undefined,
      nom: nom.trim(), prenom: prenom.trim(), province, ville: ville.trim(), quartier: quartier.trim(),
      telephone: telephone.trim(), whatsapp: whatsapp.trim(), email: email.trim(),
      acceptTerms: isSignup ? accepted : undefined,
    }, isSignup ? password : undefined);
    setSaving(false);
    if (problem) { setErrors([problem]); window.scrollTo(0, 0); }
  };

  return (
    <div>
      <ScreenHeader eyebrow={isSignup ? 'Inscription particulier' : 'Mon compte'} title={isSignup ? 'Créer mon compte particulier' : 'Modifier mes informations'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            <p className="text-sm text-muted-foreground">Avec un compte, vous publiez vos demandes et les gérez (modifier, supprimer) depuis n'importe quel appareil. Vos informations ne sont jamais affichées publiquement.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor={ids.nom}>Nom <Req /></Label><Input id={ids.nom} value={nom} onChange={(e) => setNom(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor={ids.prenom}>Prénom <Req /></Label><Input id={ids.prenom} value={prenom} onChange={(e) => setPrenom(e.target.value)} /></div>
            </div>
            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} villeRequired />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor={ids.tel}>Téléphone <Req /></Label><Input id={ids.tel} value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+241 XX XX XX XX" /></div>
              <div className="space-y-2"><Label htmlFor={ids.wa}>WhatsApp</Label><Input id={ids.wa} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+241XXXXXXXX" /></div>
              <div className="space-y-2"><Label htmlFor={ids.email}>Email <Req /></Label><Input id={ids.email} type="email" autoComplete="email" value={email} disabled={!isSignup} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            {isSignup && <PasswordFields password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />}
            {isSignup && <ConsentCheckbox checked={accepted} onChange={setAccepted} />}
            {isSignup && <p className="text-xs text-muted-foreground">Déjà inscrit ? <button type="button" className="font-medium text-navy-900 underline" onClick={() => go('login')}>Connectez-vous</button></p>}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : isSignup ? 'Créer mon compte' : 'Enregistrer'}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function ParticulierDashboard({ account, me, myMissions, openParticulierForm, openMissionForm, openMatching, deleteMission, deleteParticulier, resendVerification, go }) {
  if (!account || account.kind !== 'particulier') {
    return (
      <div>
        <ScreenHeader eyebrow="Espace particulier" title="Espace particulier" />
        <div className="container mx-auto max-w-xl py-16 text-center">
          <p className="mb-6 text-muted-foreground">
            {account ? `Vous êtes connecté avec un compte ${KIND_LABEL[account.kind]}. L’espace particulier est réservé aux comptes particuliers.` : 'Connectez-vous à votre compte particulier, ou créez-en un, pour gérer vos demandes.'}
          </p>
          {!account && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => go('login')}>Se connecter</Button>
              <Button onClick={openParticulierForm}>Créer mon compte</Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  const statusLabel = { active: 'Active', pending: 'En attente', done: 'Terminée' };
  return (
    <div>
      <ScreenHeader eyebrow="Espace particulier" title="Mon espace" />
      <div className="container mx-auto max-w-3xl py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Connecté en tant que <span className="font-medium text-foreground">{account.email}</span></p>
          <Button onClick={() => openMissionForm(null, 'particulier')}><Plus className="mr-1.5 h-4 w-4" />Publier une demande</Button>
        </div>
        {me && (
          <Card className="mb-8">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <h3 className="font-semibold">{me.prenom} {me.nom}</h3>
                <p className="text-sm text-muted-foreground">{me.ville}{me.quartier ? ` · ${me.quartier}` : ''} · {me.telephone}</p>
                {!me.verified && <button type="button" className="mt-1 text-xs font-medium text-navy-900 underline" onClick={resendVerification}>Confirmer mon e-mail (renvoyer le lien)</button>}
              </div>
              <Button variant="outline" size="sm" onClick={openParticulierForm}><Pencil className="mr-1.5 h-3.5 w-3.5" />Modifier mes informations</Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Mes demandes</h3>
            {myMissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vous n'avez publié aucune demande.</p>
            ) : (
              <div className="space-y-2">
                {myMissions.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 border-b py-3 text-sm last:border-0">
                    <div className="flex-1" style={{ minWidth: '200px' }}>
                      <span className="font-medium">{m.titre}</span>
                      <span className="ml-2 text-muted-foreground">{m.metier} · {m.ville || '—'}</span>
                      {m.hidden && <Badge variant="secondary" className="ml-2">Masquée par la modération</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{statusLabel[m.statut]}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Profils recommandés" onClick={() => openMatching(m.id)}><Target className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Modifier" onClick={() => openMissionForm(m.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Supprimer" onClick={() => deleteMission(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {me && <MyDataCard account={account} record={me} onDelete={deleteParticulier} />}
      </div>
    </div>
  );
}

/* =========================================================
   ADMINISTRATION — moderation space of the platform owner
========================================================= */
function AdminScreen({ account, go, openProfile, openMatching, reload, showToast }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('professionals');
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erreur');
      setData(d);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => { if (account && account.isAdmin) load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!account || !account.isAdmin) {
    return <NotAvailable go={go} title="Accès réservé" text="Cet espace est réservé à l'administration d'ONASKILL." />;
  }

  const act = async (action, table, r, label) => {
    const what = { delete: 'Supprimer définitivement', hide: 'Masquer aux visiteurs', show: 'Rendre de nouveau visible' }[action];
    if (!window.confirm(`${what} : ${label} ?${action === 'delete' && table !== 'missions' ? '\n\nLe compte, les documents et les demandes de ce membre seront aussi supprimés.' : ''}`)) return;
    try {
      const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, table, id: r.id }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Erreur');
      showToast(action === 'delete' ? 'Supprimé' : action === 'hide' ? 'Masqué aux visiteurs' : 'De nouveau visible');
      await load();
      await reload();
    } catch (e) {
      showToast('Erreur : ' + e.message);
    }
  };

  const tabs = [
    { key: 'professionals', label: 'Professionnels' },
    { key: 'companies', label: 'Entreprises' },
    { key: 'particuliers', label: 'Particuliers' },
    { key: 'missions', label: 'Demandes' },
  ];
  const describe = (table, r) => {
    if (table === 'professionals') return { title: `${r.prenom} ${r.nom}`, sub: `${r.metier} · ${r.ville}`, open: () => openProfile(r.id) };
    if (table === 'companies') return { title: r.nom, sub: `${(r.secteurs || []).join(', ')} · ${r.ville}` };
    if (table === 'particuliers') return { title: `${r.prenom} ${r.nom}`, sub: `${r.ville} · ${r.telephone || ''}` };
    return { title: r.titre, sub: `${r.metier} · ${r.ville || '—'} · ${r.clientName || ''}`, open: () => openMatching(r.id) };
  };
  const rows = data ? (data[tab] || []).filter((r) => !q || norm(JSON.stringify(r)).includes(norm(q))) : [];

  return (
    <div>
      <ScreenHeader eyebrow="Administration" title="Modération de la plateforme" />
      <div className="container mx-auto py-8">
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
          Vous pouvez masquer un contenu (il disparaît pour les visiteurs, son auteur est prévenu dans son espace) ou le supprimer définitivement.
          Les membres restent seuls à pouvoir modifier leurs propres informations.
        </p>
        {error && <p className="mb-4 text-sm text-destructive" role="alert">{error}</p>}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 text-navy-900 hover:bg-secondary'}`}>
              {t.label} {data && <span className="opacity-70">({(data[t.key] || []).length})</span>}
            </button>
          ))}
          <Input aria-label="Rechercher" placeholder="Rechercher (nom, e-mail, ville…)" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto h-9 max-w-xs" />
        </div>
        <Card>
          <CardContent className="p-0">
            {!data ? (
              <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Aucun élément.</p>
            ) : (
              <ul className="divide-y">
                {rows.map((r) => {
                  const d = describe(tab, r);
                  const email = r.account ? r.account.email : r.ownerEmail || null;
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                      <div className="min-w-0 flex-1" style={{ minWidth: '220px' }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{d.title}</span>
                          {r.demo && <DemoBadge />}
                          {r.hidden && <Badge variant="secondary">Masqué</Badge>}
                          {r.verified && <Badge variant="outline">E-mail confirmé</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{d.sub}</p>
                        <p className="truncate text-xs text-muted-foreground">{email ? `Compte : ${email}` : tab === 'missions' ? 'Publiée sans compte' : 'Sans compte'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.open && <Button size="sm" variant="ghost" onClick={d.open}>Voir</Button>}
                        {r.hidden
                          ? <Button size="sm" variant="outline" onClick={() => act('show', tab, r, d.title)}>Rendre visible</Button>
                          : <Button size="sm" variant="outline" onClick={() => act('hide', tab, r, d.title)}>Masquer</Button>}
                        <Button size="sm" variant="destructive" onClick={() => act('delete', tab, r, d.title)}>Supprimer</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LegalDoc({ eyebrow, title, updated, go, children }) {
  return (
    <div>
      <ScreenHeader eyebrow={eyebrow} title={title} onBack={() => go('home')} />
      <div className="container mx-auto max-w-3xl py-10">
        <p className="mb-8 text-xs text-muted-foreground">Dernière mise à jour : {updated}</p>
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function LegalDraftNotice() {
  return (
    <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
      Projet de texte rédigé d'après le fonctionnement réel du site. À faire relire par un juriste avant l'ouverture au public,
      notamment au regard de la loi gabonaise n°001/2011 relative à la protection des données à caractère personnel.
    </p>
  );
}

function PrivacyScreen({ go }) {
  return (
    <LegalDoc eyebrow="Légal" title="Politique de confidentialité" updated="17 octobre 2026" go={go}>
      <LegalDraftNotice />

      <h2>1. Responsable du traitement</h2>
      <p>Le responsable du traitement est l'éditeur d'ONASKILL, dont l'identité et les coordonnées figurent dans les <button onClick={() => go('legal')} className="underline hover:text-foreground">mentions légales</button>.</p>

      <h2>2. Données collectées</h2>
      <ul>
        <li><strong>Professionnels</strong> : nom, prénom, localisation (province, ville, quartier), métier, disponibilité, années d'expérience, secteurs, compétences, certifications, documents déposés (CV, diplôme, justificatifs), téléphone, WhatsApp, LinkedIn, adresse e-mail.</li>
        <li><strong>Entreprises</strong> : raison sociale, localisation, année de création, effectif, domaines d'activité, description, logo, site web, NIF / RCCM, nom du contact, téléphone, WhatsApp, adresse e-mail.</li>
        <li><strong>Particuliers</strong> : le contenu de la demande publiée (nom indiqué, métier recherché, lieu, date, budget, description).</li>
        <li><strong>Compte</strong> : adresse e-mail et mot de passe. Le mot de passe est chiffré de manière irréversible : personne, y compris ONASKILL, ne peut le lire.</li>
        <li><strong>Données techniques</strong> : un cookie de connexion, la langue choisie si vous en sélectionnez une autre que le français, et des statistiques de fréquentation anonymes.</li>
      </ul>

      <h2>3. Ce qui est public et ce qui reste privé</h2>
      <p><strong>Visible par tous les visiteurs</strong> : nom, prénom, métier, localisation, expérience, compétences, certifications, téléphone, WhatsApp, LinkedIn, score du profil, et la mention « CV fourni » ou « Diplôme fourni ». Ces informations sont publiées pour que les clients puissent vous trouver et vous contacter : c'est l'objet même du service.</p>
      <p><strong>Jamais affichés</strong> : votre adresse e-mail, le contenu de vos documents (CV, diplômes, justificatifs), le NIF / RCCM des entreprises et votre mot de passe. Seul le titulaire du compte peut ouvrir ses propres documents.</p>

      <h2>4. Pourquoi ces données sont utilisées</h2>
      <ul>
        <li>Créer et gérer votre compte, et vous permettre de vous connecter.</li>
        <li>Publier votre profil, votre fiche entreprise ou votre demande.</li>
        <li>Calculer automatiquement le score de profil et proposer les profils les plus adaptés à une demande.</li>
        <li>Vous envoyer les e-mails nécessaires au service : confirmation d'adresse, lien « mot de passe oublié ». Aucun e-mail publicitaire n'est envoyé.</li>
        <li>Mesurer la fréquentation du site de façon anonyme pour l'améliorer.</li>
      </ul>
      <p>Ces traitements reposent sur votre consentement, donné lors de l'inscription, et sur la nécessité de fournir le service que vous demandez.</p>

      <h2>5. Prestataires et lieu de stockage</h2>
      <p>Les données sont hébergées par <strong>Vercel Inc.</strong> (hébergement du site, base de données, stockage des documents, statistiques), dont les serveurs peuvent se situer hors du Gabon, notamment aux États-Unis. Les e-mails sont envoyés via un service de messagerie (Google Gmail ou Resend). Si vous choisissez une autre langue que le français, le texte des pages est traduit par Google Traduction. Aucune donnée n'est vendue ni cédée à des fins publicitaires.</p>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li>Profils, fiches entreprise et comptes : tant que le compte existe. La suppression du compte efface immédiatement le profil, les documents et le compte.</li>
        <li>Demandes publiées : jusqu'à leur suppression par leur auteur.</li>
        <li>Liens envoyés par e-mail (mot de passe oublié) : 1 heure, utilisables une seule fois.</li>
      </ul>

      <h2>7. Sécurité</h2>
      <p>Connexion chiffrée (HTTPS), mots de passe chiffrés de manière irréversible, cookie de connexion inaccessible aux scripts, contrôle côté serveur : seul le titulaire d'un compte peut modifier ou supprimer sa fiche.</p>

      <h2>8. Vos droits</h2>
      <ul>
        <li><strong>Accès</strong> : depuis votre espace, « Télécharger mes données » vous remet une copie complète de vos informations.</li>
        <li><strong>Rectification</strong> : vous pouvez modifier votre profil ou votre fiche à tout moment.</li>
        <li><strong>Suppression</strong> : « Supprimer mon compte et mes données » efface tout, immédiatement.</li>
        <li><strong>Opposition et questions</strong> : contactez-nous à l'adresse indiquée dans les mentions légales.</li>
      </ul>
      <p>Vous pouvez également adresser une réclamation à la Commission nationale pour la protection des données à caractère personnel (CNPDCP) du Gabon.</p>

      <h2>9. Cookies</h2>
      <ul>
        <li><strong>Cookie de connexion</strong> : indispensable pour rester connecté. Il est supprimé à la déconnexion.</li>
        <li><strong>Cookie de langue</strong> : déposé uniquement si vous choisissez une autre langue que le français.</li>
        <li>Les statistiques de fréquentation sont mesurées <strong>sans cookie</strong> et de façon anonyme.</li>
        <li>Aucun cookie publicitaire ni traceur de réseau social.</li>
      </ul>

    </LegalDoc>
  );
}

function TermsScreen({ go }) {
  return (
    <LegalDoc eyebrow="Légal" title="Conditions générales d'utilisation" updated="17 octobre 2026" go={go}>
      <LegalDraftNotice />

      <h2>1. Objet</h2>
      <p>ONASKILL est une plateforme en ligne qui met en relation des talents de tous horizons — diplômés, formés ou autodidactes — avec des entreprises et des particuliers à la recherche de compétences au Gabon. Les présentes conditions encadrent l'utilisation du site par tous ses utilisateurs.</p>

      <h2>2. Rôle d'ONASKILL</h2>
      <p>ONASKILL est un intermédiaire technique : il permet aux utilisateurs de se trouver et de se contacter. ONASKILL n'est pas partie aux accords conclus entre professionnels et clients (prix, délais, qualité, paiement) et n'emploie pas les professionnels inscrits. Le score de profil est un indicateur calculé automatiquement à partir des informations déclarées ; il ne constitue ni une certification ni une garantie.</p>

      <h2>3. Compte</h2>
      <ul>
        <li>Un compte correspond à un seul profil professionnel ou à une seule fiche entreprise.</li>
        <li>Les informations fournies doivent être exactes et tenues à jour.</li>
        <li>Vous êtes responsable de la confidentialité de votre mot de passe et de l'utilisation de votre compte.</li>
      </ul>

      <h2>4. Engagements des professionnels</h2>
      <ul>
        <li>Déclarer honnêtement leur expérience, leurs compétences, diplômes et certifications.</li>
        <li>Déposer uniquement des documents authentiques dont ils sont titulaires.</li>
        <li>Exercer leur activité dans le respect des lois applicables, notamment en matière fiscale, sociale et de sécurité.</li>
      </ul>

      <h2>5. Engagements des clients</h2>
      <ul>
        <li>Publier uniquement des demandes réelles, licites et décrites honnêtement.</li>
        <li>Respecter les accords conclus avec les professionnels contactés, notamment en matière de paiement.</li>
      </ul>

      <h2>6. Contenus interdits</h2>
      <p>Il est interdit de publier des informations fausses ou trompeuses, des contenus illicites, injurieux ou discriminatoires, les coordonnées ou documents d'une autre personne, ou d'utiliser le site pour envoyer des messages non sollicités.</p>

      <h2>7. Suspension et suppression</h2>
      <p>ONASKILL peut retirer un contenu ou suspendre un compte qui ne respecte pas les présentes conditions. Vous pouvez supprimer votre compte à tout moment depuis votre espace : la suppression est immédiate et définitive.</p>

      <h2>8. Prix</h2>
      <p>L'inscription et l'utilisation du site sont actuellement gratuites. Toute évolution tarifaire sera annoncée à l'avance et ne s'appliquera qu'avec votre accord.</p>

      <h2>9. Responsabilité</h2>
      <p>ONASKILL met tout en œuvre pour assurer le bon fonctionnement du site, sans pouvoir garantir une disponibilité permanente. ONASKILL ne peut être tenu responsable des prestations réalisées entre utilisateurs, ni de l'exactitude des informations déclarées par eux.</p>

      <h2>10. Données personnelles</h2>
      <p>Le traitement de vos données est décrit dans la <button onClick={() => go('privacy')} className="underline hover:text-foreground">politique de confidentialité</button>.</p>

      <h2>11. Propriété intellectuelle</h2>
      <p>Le nom, le logo et les contenus du site appartiennent à ONASKILL. Vous conservez vos droits sur les contenus que vous publiez et autorisez ONASKILL à les afficher sur le site pour les besoins du service.</p>

      <h2>12. Modification des conditions</h2>
      <p>Ces conditions peuvent évoluer. La date de mise à jour figure en haut de cette page ; en cas de changement important, les utilisateurs inscrits en seront informés.</p>

      <h2>13. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit gabonais. À défaut d'accord amiable, tout litige relèvera des juridictions compétentes de Libreville.</p>
    </LegalDoc>
  );
}

function LegalScreen({ go }) {
  return (
    <LegalDoc eyebrow="Légal" title="Mentions légales" updated="26 août 2026" go={go}>
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
        Modèle à compléter avec les informations réelles de ta structure (raison sociale, forme juridique, numéro RCCM/NIF,
        adresse du siège) une fois celle-ci enregistrée.
      </p>

      <h2>Éditeur du site</h2>
      <p>ONASKILL — [Raison sociale à compléter]<br />
      [Adresse du siège à compléter], Libreville, Gabon<br />
      Email : contact@onaskill.com — Téléphone : +241 00 00 00 00<br />
      [Numéro RCCM / NIF à compléter]</p>

      <h2>Directeur de la publication</h2>
      <p>[Nom du responsable à compléter]</p>

      <h2>Hébergement</h2>
      <p>Ce site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</p>

      <h2>Propriété intellectuelle</h2>
      <p>L'ensemble des contenus présents sur ONASKILL (textes, mise en page, logo) est protégé par le droit d'auteur, sauf mention contraire. Les photographies utilisées proviennent de banques d'images libres de droits.</p>

      <h2>Données personnelles</h2>
      <p>Le traitement des données personnelles est détaillé dans notre <button onClick={() => go('privacy')} className="underline hover:text-foreground">Politique de confidentialité</button>.</p>

      <h2>Droit applicable</h2>
      <p>Les présentes mentions légales sont soumises au droit gabonais.</p>
    </LegalDoc>
  );
}

function NotAvailable({ go, title, text }) {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <h1 className="mb-2 text-xl font-semibold">{title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{text}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => go('home')}>Accueil</Button>
        <Button onClick={() => go('search')}>Trouver un professionnel</Button>
      </div>
    </div>
  );
}

const KIND_LABEL = { pro: 'professionnel', company: 'entreprise', particulier: 'particulier' };

function WrongAccountType({ go, kind }) {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <h1 className="mb-2 text-xl font-semibold">Vous êtes déjà connecté</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Votre compte est un compte {KIND_LABEL[kind]}. Un compte correspond à un seul profil : déconnectez-vous pour créer un autre type de compte.
      </p>
      <Button onClick={() => go({ pro: 'dashpro', company: 'dashcompany', particulier: 'dashpart' }[kind])}>Aller à mon espace</Button>
    </div>
  );
}

function LoginScreen({ go, login, account }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const requestLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Saisissez votre adresse e-mail.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setLinkSent(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (account) {
    return (
      <div className="container mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <h1 className="mb-2 text-xl font-semibold">Vous êtes connecté</h1>
        <p className="mb-6 text-sm text-muted-foreground">{account.email}</p>
        <Button onClick={() => go({ pro: 'dashpro', company: 'dashcompany', particulier: 'dashpart' }[account.kind])}>Aller à mon espace</Button>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Saisissez votre e-mail et votre mot de passe.'); return; }
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto flex max-w-md flex-col py-20">
      <Logo className="mx-auto mb-6 h-10 w-auto" />
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          {forgot ? (
            linkSent ? (
              <>
                <h1 className="mb-2 text-xl font-semibold">Vérifiez votre boîte mail</h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  Si un compte ou un profil existe avec <span className="font-medium text-foreground">{email}</span>, un lien pour choisir votre mot de passe vient d'y être envoyé. Il est valable 1 heure. Pensez aux courriers indésirables.
                </p>
                <Button variant="outline" className="w-full rounded-full" onClick={() => { setForgot(false); setLinkSent(false); }}>Retour à la connexion</Button>
              </>
            ) : (
              <>
                <h1 className="mb-1 text-xl font-semibold">Mot de passe oublié</h1>
                <p className="mb-6 text-sm text-muted-foreground">Indiquez votre e-mail : vous recevrez un lien pour choisir un nouveau mot de passe. Cela fonctionne aussi si votre profil a été créé avant l'arrivée des comptes.</p>
                <form onSubmit={requestLink} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="f40">Adresse e-mail</Label><Input id="f40" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                  <Button type="submit" className="h-11 w-full rounded-full bg-navy-900 hover:bg-navy-800" disabled={busy}>{busy ? 'Envoi…' : 'Recevoir le lien'}</Button>
                </form>
                <button type="button" className="mt-4 w-full text-center text-sm text-muted-foreground underline" onClick={() => { setForgot(false); setError(''); }}>Retour à la connexion</button>
              </>
            )
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold">Connexion</h1>
              <p className="mb-6 text-sm text-muted-foreground">Accédez à votre espace professionnel ou entreprise.</p>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="f41">Adresse e-mail</Label><Input id="f41" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="f42">Mot de passe</Label>
                    <button type="button" className="text-xs font-medium text-navy-900 underline" onClick={() => { setForgot(true); setError(''); }}>Mot de passe oublié ?</button>
                  </div>
                  <Input id="f42" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" className="h-11 w-full rounded-full bg-navy-900 hover:bg-navy-800" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">Pas encore de compte ? <button type="button" className="font-medium text-navy-900 underline" onClick={() => go('choosetype')}>Créer un compte</button></p>
        </CardContent>
      </Card>
    </div>
  );

}
