'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Search, MapPin, Circle, Wrench, Building2, ShieldCheck, Zap,
  CheckCircle2, ArrowRight, Star, Award, Target, Quote, Clock, Menu, X, Upload,
  FileText, Trash2, Pencil, Plus, LayoutDashboard, LogIn, UserPlus, Phone, Mail,
  ExternalLink, MessageCircle, ChevronLeft, Flame, Snowflake, Droplet, Hammer, Scissors,
  Home, Smartphone, Sprout, ShoppingBag, Baby, Truck, Factory, Fuel, Mountain, Users, Car, AlertCircle,
} from 'lucide-react';

/* =========================================================
   REFERENCE DATA
========================================================= */
const CITIES = ['Libreville', 'Port-Gentil', 'Owendo', 'Franceville', 'Oyem', 'Lambaréné', 'Mouila', 'Tchibanga', 'Koulamoutou', 'Makokou'];

const PROVINCES = ['Estuaire', 'Haut-Ogooué', 'Moyen-Ogooué', 'Ngounié', 'Nyanga', 'Ogooué-Ivindo', 'Ogooué-Lolo', 'Ogooué-Maritime', 'Woleu-Ntem'];

const TRADES = [
  'Instrumentiste', 'Soudeur', 'Plombier', 'Frigoriste / Climatisation', 'Maçon',
  'Électricien bâtiment', 'Menuisier', 'Peintre en bâtiment', 'Mécanicien auto',
  'Chauffeur / Taximan', 'Automaticien', 'Électricien industriel', 'Carreleur',
  'Agent HSE', 'Technicien maintenance industrielle', 'Coiffure / Coiffeur(se)',
  'Ménagère / Aide à domicile', "Nounou / Garde d'enfants", 'Dépannage électronique',
  'Commerçant', 'Agriculteur', 'Trader / Investisseur', 'Agence de transport', 'Autre métier',
];

const SECTOR_KEYS = [
  'Oil & Gas', 'Industrie', 'BTP', 'Mines', 'Énergie', 'Maintenance',
  'Transport & Logistique', 'Bâtiment', 'Agriculture', 'Commerce',
  'Services domestiques', 'Électronique & Informatique', 'Coiffure & Beauté',
];

// All photos below are embedded as base64 data URIs — cropped from the user's own
// screenshots (photos originally sourced from Pexels), with the title/subtitle strip
// removed so this component's own text overlay doesn't duplicate it. Being embedded
// means these render everywhere with zero external network dependency: this preview,
// any browser, offline. The tradeoff is file size — swap these for files served from
// /public (or a real image host/CDN) once this is a real deployed project, since a
// 700KB+ component file is fine for a prototype but not ideal for production.

// Showcase — "Nos Métiers": real photos of professionals mid-activity, one per trade.
const PHOTO_SHOWCASE = [
  { title: 'Soudure industrielle', subtitle: 'Soudeur', Icon: Flame, img: '/images/metiers/soudure-industrielle.jpg' },
  { title: 'Électricité industrielle', subtitle: 'Électrotechnicien', Icon: Zap, img: '/images/metiers/electricite-industrielle.jpg' },
  { title: 'Climatisation industrielle', subtitle: 'Technicien HVAC', Icon: Snowflake, img: '/images/metiers/climatisation-industrielle.jpg' },
  { title: 'Plomberie', subtitle: 'Plombier', Icon: Droplet, img: '/images/metiers/plomberie.jpg' },
  { title: 'Maçonnerie & BTP', subtitle: 'Maçon', Icon: Hammer, img: '/images/metiers/maconnerie-btp.jpg' },
  { title: 'Transport & Taxi', subtitle: 'Taximan', Icon: Car, img: '/images/metiers/transport-taxi.jpg' },
  { title: 'Coiffure', subtitle: 'Coiffeur / Coiffeuse', Icon: Scissors, img: '/images/metiers/coiffure.jpg' },
  { title: 'Services domestiques', subtitle: 'Aide à domicile', Icon: Home, img: '/images/metiers/services-domestiques.jpg' },
  { title: 'Dépannage électronique', subtitle: 'Technicien réparation', Icon: Smartphone, img: '/images/metiers/depannage-electronique.jpg' },
  { title: 'Agriculture', subtitle: 'Agriculteur', Icon: Sprout, img: '/images/metiers/agriculture.jpg' },
  { title: 'Commerce', subtitle: 'Commerçant', Icon: ShoppingBag, img: '/images/metiers/commerce.jpg' },
  { title: "Garde d'enfants", subtitle: 'Nounou', Icon: Baby, img: '/images/metiers/garde-d-enfants.jpg' },
];

// Secteurs d'activité — real photos, keyed by sector (reuses the two closest showcase
// photos for the sectors that weren't in the original set: electronics and hair/beauty).
const PHOTO_SECTORS = {
  'Oil & Gas': { Icon: Fuel, img: '/images/secteurs/oil-gas.jpg' },
  'Industrie': { Icon: Factory, img: '/images/secteurs/industrie.jpg' },
  'BTP': { Icon: Hammer, img: '/images/secteurs/btp.jpg' },
  'Mines': { Icon: Mountain, img: '/images/secteurs/mines.jpg' },
  'Énergie': { Icon: Zap, img: '/images/secteurs/energie.jpg' },
  'Maintenance': { Icon: Wrench, img: '/images/secteurs/maintenance.jpg' },
  'Transport & Logistique': { Icon: Truck, img: '/images/secteurs/transport-logistique.jpg' },
  'Bâtiment': { Icon: Building2, img: '/images/secteurs/batiment.jpg' },
  'Agriculture': { Icon: Sprout, img: '/images/secteurs/agriculture.jpg' },
  'Commerce': { Icon: ShoppingBag, img: '/images/secteurs/commerce.jpg' },
  'Services domestiques': { Icon: Home, img: '/images/secteurs/services-domestiques.jpg' },
  'Électronique & Informatique': { Icon: Smartphone, img: '/images/secteurs/electronique-informatique.jpg' },
  'Coiffure & Beauté': { Icon: Scissors, img: '/images/secteurs/coiffure-beaute.jpg' },
};

// Scrolling hero portraits — reuse the same proven photos as small round thumbnails
const PORTRAITS = [
  { name: 'Jean', trade: 'Technicien maintenance', Icon: Wrench, img: '/images/portraits/jean.jpg' },
  { name: 'Chantal', trade: 'Coiffeuse', Icon: Scissors, img: '/images/portraits/chantal.jpg' },
  { name: 'Serge', trade: 'Plombier', Icon: Droplet, img: '/images/portraits/serge.jpg' },
  { name: 'Sylvie', trade: 'Nounou', Icon: Baby, img: '/images/portraits/sylvie.jpg' },
  { name: 'Marius', trade: 'Soudeur', Icon: Flame, img: '/images/portraits/marius.jpg' },
  { name: 'Patrick', trade: 'Chauffeur', Icon: Car, img: '/images/portraits/patrick.jpg' },
  { name: 'David', trade: 'Dépannage électronique', Icon: Smartphone, img: '/images/portraits/david.jpg' },
  { name: 'Guy', trade: 'Agriculteur', Icon: Sprout, img: '/images/portraits/guy.jpg' },
  { name: 'Rodrigue', trade: 'Maçon', Icon: Hammer, img: '/images/portraits/rodrigue.jpg' },
  { name: 'Franck', trade: 'Frigoriste', Icon: Snowflake, img: '/images/portraits/franck.jpg' },
];

const TESTIMONIALS = [
  { name: 'Marc O.', role: 'Responsable maintenance, Société pétrolière de Port-Gentil', text: "TECHGABON nous a permis de trouver un instrumentiste qualifié en moins de 48 heures. La plateforme est simple et les profils sont vérifiés.", rating: 5 },
  { name: 'Jean-Paul M.', role: 'Technicien maintenance industrielle, Libreville', text: "J'ai reçu 3 missions en un mois grâce à TECHGABON. Le système de matching m'envoie des missions qui correspondent vraiment à mes compétences.", rating: 5 },
  { name: 'Société de maintenance industrielle', role: 'Entreprise partenaire, Owendo', text: "Nous avons recruté 5 techniciens via TECHGABON pour un projet d'arrêt d'usine. Gain de temps considérable par rapport aux méthodes classiques.", rating: 4 },
];

const WEIGHTS = { competences: 35, experience: 20, certifications: 15, secteur: 10, localisation: 10, disponibilite: 10 };
const MAX_FILE_BYTES = 600 * 1024;

/* =========================================================
   HELPERS
========================================================= */
function uid() { return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function fmtSize(bytes) { if (!bytes) return ''; const kb = bytes / 1024; if (kb < 1024) return Math.round(kb) + ' Ko'; return (kb / 1024).toFixed(1) + ' Mo'; }
function toggleInArray(arr, val) { return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]; }

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (file.size > MAX_FILE_BYTES) { resolve({ error: `"${file.name}" dépasse 600 Ko et a été ignoré dans ce prototype.` }); return; }
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

function seedProfessionals() {
  return [
    { id: uid(), nom: 'Mabiala', prenom: 'Jean', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Bord de mer', dispo: 'now', metier: 'Technicien maintenance industrielle', experience: 7, note: 4.8, missionsTerminees: 14, secteurs: ['Industrie', 'Maintenance'], competences: [{ name: 'Mécanique industrielle', level: 5 }, { name: 'Pompes', level: 5 }, { name: 'Hydraulique', level: 4 }], certifications: [{ name: 'HSE', verified: true }, { name: 'BOSIET', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 74 12 34 56', email: 'jean.mabiala@email.com', whatsapp: '+24174123456', linkedin: '' },
    { id: uid(), nom: 'Koumba', prenom: 'Pierre', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Château d\'eau', dispo: 'now', metier: 'Instrumentiste', experience: 5, note: 4.6, missionsTerminees: 9, secteurs: ['Oil & Gas'], competences: [{ name: 'Calibration', level: 5 }, { name: 'Pression', level: 4 }], certifications: [{ name: 'H2S', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 65 22 11 09', email: '', whatsapp: '+24165221109', linkedin: '' },
    { id: uid(), nom: 'Nzeng', prenom: 'Serge', province: 'Estuaire', ville: 'Libreville', quartier: 'Nzeng-Ayong', dispo: 'now', metier: 'Plombier', experience: 8, note: 4.7, missionsTerminees: 22, secteurs: ['Bâtiment', 'Services domestiques'], competences: [{ name: 'Tuyauterie PVC', level: 5 }, { name: 'Sanitaire', level: 5 }], certifications: [{ name: 'CAP Plomberie', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 62 33 44 55', email: 'serge.n@email.com', whatsapp: '+24162334455', linkedin: '' },
    { id: uid(), nom: 'Obame', prenom: 'Franck', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Sable', dispo: 'now', metier: 'Frigoriste / Climatisation', experience: 6, note: 4.5, missionsTerminees: 11, secteurs: ['Maintenance'], competences: [{ name: 'Climatisation split', level: 5 }, { name: 'Groupes froids', level: 4 }], certifications: [{ name: 'Manipulation fluides frigorigènes', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 77 88 99 00', email: '', whatsapp: '+24177889900', linkedin: '' },
    { id: uid(), nom: 'Essono', prenom: 'Patrick', province: 'Estuaire', ville: 'Libreville', quartier: 'Akanda', dispo: 'soon', metier: 'Chauffeur / Taximan', experience: 9, note: 4.4, missionsTerminees: 31, secteurs: ['Transport & Logistique'], competences: [{ name: 'Conduite VL', level: 5 }, { name: 'Transport de personnel', level: 5 }], certifications: [{ name: 'Permis B', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 60 11 22 33', email: '', whatsapp: '+24160112233', linkedin: '' },
    { id: uid(), nom: 'Andeme', prenom: 'Rodrigue', province: 'Estuaire', ville: 'Libreville', quartier: 'Lalala', dispo: 'now', metier: 'Maçon', experience: 10, note: 4.6, missionsTerminees: 18, secteurs: ['BTP'], competences: [{ name: 'Maçonnerie', level: 5 }, { name: 'Coffrage', level: 4 }], certifications: [{ name: 'Diplôme technicien BTP', verified: false }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 74 55 66 77', email: 'rodrigue.a@email.com', whatsapp: '+24174556677', linkedin: '' },
    { id: uid(), nom: 'Lendoye', prenom: 'Marius', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: 'Grand Village', dispo: 'now', metier: 'Soudeur', experience: 12, note: 4.9, missionsTerminees: 27, secteurs: ['Industrie', 'Oil & Gas', 'BTP'], competences: [{ name: "Soudure à l'arc", level: 5 }, { name: 'Soudure TIG', level: 5 }], certifications: [{ name: 'Qualification soudure', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 65 77 88 99', email: 'marius.l@email.com', whatsapp: '+24165778899', linkedin: '' },
    { id: uid(), nom: 'Moussavou', prenom: 'Chantal', province: 'Estuaire', ville: 'Libreville', quartier: 'Glass', dispo: 'now', metier: 'Coiffure / Coiffeur(se)', experience: 6, note: 4.8, missionsTerminees: 40, secteurs: ['Coiffure & Beauté', 'Services domestiques'], competences: [{ name: 'Coiffure afro', level: 5 }, { name: 'Soins capillaires', level: 4 }], certifications: [{ name: 'CAP Coiffure', verified: true }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 66 22 33 11', email: '', whatsapp: '+24166223311', linkedin: '' },
    { id: uid(), nom: 'Ovono', prenom: 'Sylvie', province: 'Estuaire', ville: 'Owendo', quartier: 'Centre-ville', dispo: 'now', metier: "Nounou / Garde d'enfants", experience: 5, note: 4.9, missionsTerminees: 15, secteurs: ['Services domestiques'], competences: [{ name: "Garde d'enfants", level: 5 }, { name: 'Premiers secours', level: 3 }], certifications: [{ name: 'Formation petite enfance', verified: false }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 62 44 55 66', email: '', whatsapp: '+24162445566', linkedin: '' },
    { id: uid(), nom: 'Boussamba', prenom: 'David', province: 'Estuaire', ville: 'Libreville', quartier: 'Charbonnages', dispo: 'now', metier: 'Dépannage électronique', experience: 7, note: 4.5, missionsTerminees: 19, secteurs: ['Électronique & Informatique'], competences: [{ name: 'Réparation smartphones', level: 5 }, { name: 'Réparation TV/électroménager', level: 4 }], certifications: [], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 74 88 99 00', email: '', whatsapp: '+24174889900', linkedin: '' },
    { id: uid(), nom: 'Mintsa', prenom: 'Guy', province: 'Ngounié', ville: 'Mouila', quartier: 'Centre', dispo: 'soon', metier: 'Agriculteur', experience: 15, note: 4.3, missionsTerminees: 6, secteurs: ['Agriculture'], competences: [{ name: 'Maraîchage', level: 5 }, { name: 'Élevage', level: 3 }], certifications: [], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 66 00 11 22', email: '', whatsapp: '', linkedin: '' },
    { id: uid(), nom: 'Ndong', prenom: 'Aristide', province: 'Estuaire', ville: 'Owendo', quartier: 'Akournam', dispo: 'unavailable', metier: 'Électricien bâtiment', experience: 3, note: null, missionsTerminees: 0, secteurs: ['Bâtiment'], competences: [{ name: 'Câblage', level: 3 }], certifications: [{ name: 'Habilitation électrique', verified: false }], docs: { cv: null, diplome: null, certifs: [] }, telephone: '+241 66 12 34 00', email: '', whatsapp: '', linkedin: '' },
  ];
}

function seedCompanies() {
  return [
    { id: uid(), nom: 'SOBRAGA — Service PET', province: 'Estuaire', ville: 'Libreville', quartier: 'Oloumi', annee: 1978, effectif: '200+', site: '', secteurs: ['Industrie', 'Maintenance'], description: "Production de boissons en bouteilles plastiques. Recherche régulièrement des techniciens de maintenance industrielle pour ses lignes de production.", logo: null, contact: 'Service Maintenance PET', telephone: '+241 74 00 00 00', email: '', whatsapp: '' },
  ];
}

function seedMissions() {
  return [
    { id: uid(), clientType: 'entreprise', clientName: 'SOBRAGA', titre: 'Recherche technicien instrumentation', metier: 'Instrumentiste', experienceMin: 3, competences: ['Calibration', 'Pression'], secteur: 'Oil & Gas', province: 'Ogooué-Maritime', ville: 'Port-Gentil', quartier: '', duree: '5 jours', date: '25/08/2026', statut: 'active', budget: 'À discuter', description: 'Intervention sur instruments de mesure...' },
  ];
}

/* =========================================================
   SMALL UI PIECES
========================================================= */
function FileField({ label, hint, accept, multiple, value, onChange }) {
  const inputRef = useRef(null);
  const [warn, setWarn] = useState('');

  const handleFiles = async (fileList) => {
    setWarn('');
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const results = await Promise.all(files.map(readFileAsDataUrl));
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
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
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
        backgroundColor: hover ? '#ffffff' : 'rgba(255,255,255,0.12)',
        color: hover ? '#123a6e' : '#ffffff',
        border: '2px solid #ffffff',
      }
    : {
        backgroundColor: hover ? '#123a6e' : '#1a4d8f',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(15, 26, 46, 0.25)',
      };
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-8 text-base font-medium backdrop-blur-sm transition-colors"
      style={style}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

function Req() {
  return <span className="text-destructive" aria-hidden="true"> *</span>;
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
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Province</Label>
        <Select value={province} onValueChange={onProvince}>
          <SelectTrigger><SelectValue placeholder="Choisir une province" /></SelectTrigger>
          <SelectContent>
            {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Ville {villeRequired && <Req />}</Label>
        <Input value={ville} onChange={(e) => onVille(e.target.value)} placeholder="Libreville, Port-Gentil..." />
      </div>
      <div className="space-y-2">
        <Label>Quartier</Label>
        <Input value={quartier} onChange={(e) => onQuartier(e.target.value)} placeholder="Nzeng-Ayong, Glass..." />
      </div>
    </div>
  );
}

// Photo tile for "Nos Métiers" / "Secteurs d'activité": real photo, dark gradient for
// text legibility, bold title + subtitle, small trade-icon badge, zoom on hover.
function SceneTile({ title, subtitle, Icon, img, onClick, height = 'h-56' }) {
  return (
    <button onClick={onClick} className={`group relative ${height} w-full overflow-hidden rounded-xl text-left shadow-sm`}>
      <img src={img} alt={title} loading="lazy" decoding="async" width={435} height={208} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/25 to-transparent" />
      {Icon && (
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow">
          <Icon className="h-4 w-4 text-slate-700" strokeWidth={2} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-lg font-semibold leading-tight text-white">{title}</p>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
      </div>
    </button>
  );
}

function Portrait({ name, trade, Icon, img }) {
  return (
    <div className="flex w-32 flex-shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-5 backdrop-blur-sm">
      <div className="relative h-16 w-16">
        <img src={img} alt="" decoding="async" width={64} height={64} className="h-16 w-16 rounded-full object-cover shadow-lg ring-2 ring-white/20" />
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5">
          <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-white/60">{trade}</p>
      </div>
    </div>
  );
}

function PortraitStrip() {
  const loop = [...PORTRAITS, ...PORTRAITS];
  return (
    <div className="inline-flex animate-marquee-a gap-5 py-4">
      {loop.map((p, i) => <Portrait key={i} {...p} />)}
    </div>
  );
}

// Horizontally auto-scrolling row (right → left) for the Nos Métiers / Secteurs strips.
// inline-flex makes the row size to its own content (not to 100% of the parent), which is
// required for the -50% keyframe to line up exactly at the seam between the two duplicated
// halves — otherwise the loop jumps instead of scrolling seamlessly.
function MarqueeRow({ children, speed = 'a' }) {
  return (
    <div className="group overflow-hidden">
      <div className={`inline-flex animate-marquee-${speed} gap-5 py-2`}>{children}</div>
    </div>
  );
}

function CheckEmailScreen({ context, professionals, companies, go, openProfile, resendVerification, resendCompanyVerification }) {
  if (!context) return null;
  const record = context.type === 'pro'
    ? professionals.find((p) => p.id === context.id)
    : companies.find((c) => c.id === context.id);

  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Vérifiez votre boîte mail</h1>
      {context.email ? (
        <p className="mb-1 text-muted-foreground">
          Un lien de confirmation a été envoyé à <span className="font-medium text-foreground">{context.email}</span>.
        </p>
      ) : (
        <p className="mb-1 text-muted-foreground">
          Aucune adresse email n'a été renseignée — ajoutez-en une depuis votre profil pour recevoir le lien de confirmation.
        </p>
      )}
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Cliquez sur le lien reçu pour activer {context.type === 'pro' ? 'votre profil professionnel' : 'votre fiche entreprise'}.
        Pensez à vérifier vos courriers indésirables si vous ne le voyez pas sous quelques minutes.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {record && (
          <Button
            variant="outline"
            onClick={() => (context.type === 'pro' ? resendVerification(record) : resendCompanyVerification(record))}
          >
            Renvoyer l'email
          </Button>
        )}
        <Button onClick={() => (context.type === 'pro' ? openProfile(context.id) : go('dashcompany'))}>
          {context.type === 'pro' ? 'Voir mon profil' : "Aller à mon tableau de bord"}
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Ce prototype trace la confirmation dans ce navigateur. Pour une activation par lien fiable sur tout appareil,
        une base de données réelle est nécessaire côté serveur (voir le README).
      </p>
    </div>
  );
}


function ScreenHeader({ eyebrow, title, onBack }) {
  return (
    <div className="border-b bg-slate-50 py-8 dark:bg-slate-900/30">
      <div className="container mx-auto px-4">
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
export default function App() {
  const [screen, setScreen] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const [professionals, setProfessionals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [myProIds, setMyProIds] = useState([]);
  const [myCompanyId, setMyCompanyId] = useState(null);
  const [checkEmailContext, setCheckEmailContext] = useState(null);

  const [toast, setToast] = useState('');

  const [currentProfileId, setCurrentProfileId] = useState(null);
  const [editingProId, setEditingProId] = useState(null);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [currentMatchMissionId, setCurrentMatchMissionId] = useState(null);
  const [missionDefaultClientType, setMissionDefaultClientType] = useState('entreprise');

  // homepage quick search
  const [searchTrade, setSearchTrade] = useState('all');
  const [searchCity, setSearchCity] = useState('all');
  const [searchAvailability, setSearchAvailability] = useState('all');
  const [searchSector, setSearchSector] = useState('all');
  const [searchSort, setSearchSort] = useState('pertinence');

  useEffect(() => {
    (async () => {
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
        console.error('[TECHGABON] chargement des données échoué:', e);
        showToast('Impossible de charger les données — vérifiez la connexion à la base de données');
        setProfessionals([]);
        setCompanies([]);
        setMissions([]);
      }
      // "Which records are mine" has no real login system behind it yet, so it stays
      // a simple per-browser marker in localStorage — separate from the actual data,
      // which now lives in the shared database above.
      try {
        const mp = localStorage.getItem('techgabon:myProIds');
        const mc = localStorage.getItem('techgabon:myCompanyId');
        setMyProIds(mp ? JSON.parse(mp) : []);
        setMyCompanyId(mc || null);
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem('techgabon:myProIds', JSON.stringify(myProIds)); } catch (e) {}
  }, [myProIds, loaded]);
  useEffect(() => {
    if (!loaded) return;
    try {
      if (myCompanyId) localStorage.setItem('techgabon:myCompanyId', myCompanyId);
      else localStorage.removeItem('techgabon:myCompanyId');
    } catch (e) {}
  }, [myCompanyId, loaded]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2600); }
  function go(s) { setScreen(s); setMenuOpen(false); window.scrollTo(0, 0); }
  function scrollToSection(id) {
    setScreen('home');
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function handleSearch(e) {
    e.preventDefault();
    go('search');
  }

  function openProfile(id) { setCurrentProfileId(id); go('profile'); }
  function openProForm(id) { setEditingProId(id || null); go('proform'); }
  function openCompanyForm(id) { setEditingCompanyId(id || null); go('companyform'); }
  function openMissionForm(id, defaultType) { setEditingMissionId(id || null); setMissionDefaultClientType(defaultType || 'entreprise'); go('missionform'); }
  function openMatching(missionId) { setCurrentMatchMissionId(missionId); go('matching'); }

  // Fires a request to the /api/send-verification route (see app/api/send-verification/route.js).
  // This only succeeds once a real email provider is configured server-side — see the
  // "Vérification par e-mail" section of the README for setup. Failing silently here is
  // intentional: the record is already saved either way, so a missing email service
  // shouldn't block account creation.
  async function sendVerificationEmail({ email, nom, token, type, id }) {
    if (!email) return;
    try {
      await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nom, token, type, id, origin: window.location.origin }),
      });
    } catch (e) {
      // Network/email-service issue — the account still exists and can be verified
      // later via "Renvoyer l'email" on the profile.
    }
  }

  async function saveProfessional(data, isNew) {
    let record = data;
    if (isNew) {
      record = { ...data, verified: false, verifyToken: uid() + uid() };
    }
    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error('save failed');
      const saved = await res.json();
      setProfessionals((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx > -1) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      if (isNew) {
        setMyProIds((prev) => [...prev, saved.id]);
        sendVerificationEmail({ email: saved.email, nom: saved.prenom, token: saved.verifyToken, type: 'pro', id: saved.id });
        setCheckEmailContext({ email: saved.email, type: 'pro', id: saved.id });
        go('checkemail');
      } else {
        showToast('Profil mis à jour');
        openProfile(saved.id);
      }
    } catch (e) {
      console.error('[TECHGABON] saveProfessional error:', e);
      showToast("Erreur : le profil n'a pas pu être enregistré (connexion à la base de données)");
    }
  }
  async function deleteProfessional(id) {
    if (!window.confirm('Supprimer définitivement ce profil ?')) return;
    try {
      const res = await fetch(`/api/professionals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
      setMyProIds((prev) => prev.filter((pid) => pid !== id));
      showToast('Profil supprimé');
      go('search');
    } catch (e) {
      console.error('[TECHGABON] deleteProfessional error:', e);
      showToast('Erreur : la suppression a échoué');
    }
  }
  function resendVerification(pro) {
    sendVerificationEmail({ email: pro.email, nom: pro.prenom, token: pro.verifyToken, type: 'pro', id: pro.id });
    showToast('Email de confirmation renvoyé');
  }

  async function saveCompany(data, isNew) {
    let record = data;
    if (isNew) {
      record = { ...data, verified: false, verifyToken: uid() + uid() };
    }
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error('save failed');
      const saved = await res.json();
      setCompanies((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx > -1) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      if (isNew) {
        setMyCompanyId(saved.id);
        sendVerificationEmail({ email: saved.email, nom: saved.nom, token: saved.verifyToken, type: 'company', id: saved.id });
        setCheckEmailContext({ email: saved.email, type: 'company', id: saved.id });
        go('checkemail');
      } else {
        showToast('Fiche entreprise mise à jour');
        go('dashcompany');
      }
    } catch (e) {
      console.error('[TECHGABON] saveCompany error:', e);
      showToast("Erreur : la fiche n'a pas pu être enregistrée (connexion à la base de données)");
    }
  }
  async function deleteCompany(id) {
    if (!window.confirm('Supprimer définitivement cette fiche entreprise ?')) return;
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      if (myCompanyId === id) setMyCompanyId(null);
      showToast('Fiche entreprise supprimée');
      go('dashcompany');
    } catch (e) {
      console.error('[TECHGABON] deleteCompany error:', e);
      showToast('Erreur : la suppression a échoué');
    }
  }
  function resendCompanyVerification(company) {
    sendVerificationEmail({ email: company.email, nom: company.nom, token: company.verifyToken, type: 'company', id: company.id });
    showToast('Email de confirmation renvoyé');
  }

  async function saveMission(data) {
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('save failed');
      const saved = await res.json();
      setMissions((prev) => {
        const idx = prev.findIndex((m) => m.id === saved.id);
        if (idx > -1) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      showToast(editingMissionId ? 'Mission mise à jour' : 'Mission publiée');
      openMatching(saved.id);
    } catch (e) {
      console.error('[TECHGABON] saveMission error:', e);
      showToast("Erreur : la mission n'a pas pu être enregistrée (connexion à la base de données)");
    }
  }
  async function deleteMission(id) {
    if (!window.confirm('Supprimer définitivement cette mission ?')) return;
    try {
      const res = await fetch(`/api/missions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setMissions((prev) => prev.filter((m) => m.id !== id));
      showToast('Mission supprimée');
      go('dashcompany');
    } catch (e) {
      console.error('[TECHGABON] deleteMission error:', e);
      showToast('Erreur : la suppression a échoué');
    }
  }

  // No full-page loading gate: the home page renders immediately (and is pre-rendered
  // on the server, so search engines and link previews see the real content); the
  // database-backed lists fill in once the fetch above completes.
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toast message={toast} />
      <SiteHeader screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} openProForm={openProForm} openCompanyForm={openCompanyForm} />

      <main className="flex-1">
        {screen === 'home' && (
          <HomeScreen
            go={go}
            professionals={professionals}
            searchTrade={searchTrade} setSearchTrade={setSearchTrade}
            searchCity={searchCity} setSearchCity={setSearchCity}
            searchAvailability={searchAvailability} setSearchAvailability={setSearchAvailability}
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
            openProForm={openProForm}
            deleteProfessional={deleteProfessional}
            go={go}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            pro={professionals.find((p) => p.id === currentProfileId)}
            go={go}
            openProForm={openProForm}
            deleteProfessional={deleteProfessional}
            openMissionForm={openMissionForm}
            resendVerification={resendVerification}
          />
        )}

        {screen === 'proform' && (
          <ProForm
            existing={professionals.find((p) => p.id === editingProId) || null}
            onCancel={() => go(editingProId ? 'profile' : 'search')}
            onSave={(data) => saveProfessional(data, !editingProId)}
          />
        )}

        {screen === 'companyform' && (
          <CompanyForm
            existing={companies.find((c) => c.id === editingCompanyId) || null}
            onCancel={() => go('dashcompany')}
            onSave={(data) => saveCompany(data, !editingCompanyId)}
            onDelete={editingCompanyId ? () => deleteCompany(editingCompanyId) : null}
          />
        )}

        {screen === 'checkemail' && (
          <CheckEmailScreen
            context={checkEmailContext}
            professionals={professionals}
            companies={companies}
            go={go}
            openProfile={openProfile}
            resendVerification={resendVerification}
            resendCompanyVerification={resendCompanyVerification}
          />
        )}

        {screen === 'missionform' && (
          <MissionForm
            existing={missions.find((m) => m.id === editingMissionId) || null}
            defaultClientType={missionDefaultClientType}
            defaultClientName={(companies.find((c) => c.id === myCompanyId) || {}).nom || ''}
            onCancel={() => go('dashcompany')}
            onSave={saveMission}
            onDelete={editingMissionId ? () => deleteMission(editingMissionId) : null}
          />
        )}

        {screen === 'matching' && (
          <MatchingScreen
            mission={missions.find((m) => m.id === currentMatchMissionId)}
            professionals={professionals}
            go={go}
            openProfile={openProfile}
            openMissionForm={openMissionForm}
            deleteMission={deleteMission}
          />
        )}

        {screen === 'dashcompany' && (
          <CompanyDashboard
            companies={companies}
            missions={missions}
            professionals={professionals}
            myCompanyId={myCompanyId}
            openCompanyForm={openCompanyForm}
            openMissionForm={openMissionForm}
            openMatching={openMatching}
            deleteMission={deleteMission}
            resendCompanyVerification={resendCompanyVerification}
            go={go}
          />
        )}

        {screen === 'dashpro' && (
          <ProDashboard
            professionals={professionals}
            myProIds={myProIds}
            openProfile={openProfile}
            openProForm={openProForm}
            deleteProfessional={deleteProfessional}
          />
        )}

        {screen === 'choosetype' && (
          <ChooseAccountType go={go} openProForm={openProForm} openCompanyForm={openCompanyForm} openMissionForm={openMissionForm} />
        )}

        {screen === 'privacy' && <PrivacyScreen go={go} />}
        {screen === 'legal' && <LegalScreen go={go} />}

        {screen === 'login' && <LoginPlaceholder go={go} />}
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
function SiteHeader({ screen, go, menuOpen, setMenuOpen, openProForm, openCompanyForm }) {
  const links = [
    { id: 'home', label: 'Accueil' },
    { id: 'search', label: 'Trouver un professionnel' },
    { id: 'dashcompany', label: 'Espace entreprise' },
    { id: 'dashpro', label: 'Espace professionnel' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-3">
        <button onClick={() => go('home')} className="flex flex-shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <Wrench className="h-5 w-5" /> TECHGABON
        </button>
        <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium text-muted-foreground lg:flex">
          {links.map((l) => (
            <button key={l.id} onClick={() => go(l.id)} className={screen === l.id ? 'text-primary' : 'hover:text-foreground'}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" onClick={() => go('login')}><LogIn className="mr-1.5 h-4 w-4" />Connexion</Button>
          <Button size="sm" onClick={() => go('choosetype')}><UserPlus className="mr-1.5 h-4 w-4" />Créer un compte</Button>
        </div>
        <button className="lg:hidden" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
              <Button variant="outline" size="sm" className="flex-1" onClick={() => go('login')}>Connexion</Button>
              <Button size="sm" className="flex-1" onClick={() => go('choosetype')}>Créer un compte</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter({ go, scrollToSection, openProForm, openCompanyForm }) {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
            <Wrench className="h-5 w-5 text-accent" /> TECHGABON
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            La plateforme qui connecte les entreprises comme les particuliers du Gabon avec des techniciens et professionnels qualifiés et vérifiés, disponibles immédiatement.
            De la maintenance industrielle à la coiffure, en passant par le BTP et la plomberie.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:border-accent hover:text-accent"><MessageCircle className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:border-accent hover:text-accent text-xs font-bold">f</a>
            <a href="#" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:border-accent hover:text-accent"><ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Navigation</h5>
          <ul className="space-y-2.5 text-sm">
            <li><button onClick={() => go('search')} className="hover:text-white">Trouver un professionnel</button></li>
            <li><button onClick={() => go('dashcompany')} className="hover:text-white">Missions disponibles</button></li>
            <li><button onClick={() => go('dashcompany')} className="hover:text-white">Entreprises</button></li>
            <li><button onClick={() => scrollToSection('howitworks')} className="hover:text-white">Comment ça marche</button></li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Compte &amp; Légal</h5>
          <ul className="space-y-2.5 text-sm">
            <li><button onClick={() => go('login')} className="hover:text-white">Connexion</button></li>
            <li><button onClick={() => go('choosetype')} className="hover:text-white">Créer un compte</button></li>
            <li><button onClick={() => openProForm()} className="hover:text-white">Inscription professionnel</button></li>
            <li><button onClick={() => openCompanyForm()} className="hover:text-white">Inscription entreprise</button></li>
            <li><button onClick={() => go('legal')} className="hover:text-white">Mentions légales</button></li>
            <li><button onClick={() => go('privacy')} className="hover:text-white">Politique de confidentialité</button></li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Contact</h5>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 flex-shrink-0 text-accent" /> Libreville, Gabon</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0 text-accent" /> +241 00 00 00 00</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0 text-accent" /> contact@techgabon.com</li>
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
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TECHGABON — Phase pilote Port-Gentil · Libreville / Owendo
      </div>
    </footer>
  );
}

/* =========================================================
   HOME SCREEN
========================================================= */
function HomeScreen({ go, professionals, searchTrade, setSearchTrade, searchCity, setSearchCity, searchAvailability, setSearchAvailability, handleSearch, openMissionForm, openProForm, openCompanyForm }) {
  return (
    <div className="flex flex-col">
      <style>{`
        @keyframes techgabon-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee-a { animation: techgabon-marquee 34s linear infinite; }
        .animate-marquee-b { animation: techgabon-marquee 42s linear infinite; }
        .animate-marquee-c { animation: techgabon-marquee 50s linear infinite; }
        .group:hover .animate-marquee-a, .group:hover .animate-marquee-b, .group:hover .animate-marquee-c { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-a, .animate-marquee-b, .animate-marquee-c { animation: none; }
        }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden flex items-center" style={{ minHeight: '90vh' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #1a4d8f 55%, #0f1a2e 100%)' }} />
        <div className="absolute inset-0 flex items-center overflow-hidden opacity-30" aria-hidden="true">
          <PortraitStrip />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/75 to-slate-900" />

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Professionnels vérifiés · Disponibles maintenant
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Le bon professionnel, disponible maintenant, pour votre intervention
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-white/80">
              Entreprises ou particuliers : trouvez un technicien qualifié et prêt à intervenir immédiatement, partout au Gabon.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <HeroButton onClick={() => go('search')} icon={Search}>Je recherche un professionnel</HeroButton>
              <HeroButton outline onClick={() => openProForm()} icon={Wrench}>Je suis un professionnel</HeroButton>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Métier / compétence</label>
                      <Select value={searchTrade} onValueChange={setSearchTrade}>
                        <SelectTrigger><Search className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Sélectionnez un métier" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les métiers</SelectItem>
                          {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Localisation</label>
                      <Select value={searchCity} onValueChange={setSearchCity}>
                        <SelectTrigger><MapPin className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Toutes les villes" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les villes</SelectItem>
                          {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Disponibilité</label>
                      <Select value={searchAvailability} onValueChange={setSearchAvailability}>
                        <SelectTrigger><Circle className="mr-2 h-3 w-3 fill-green-500 text-green-500" /><SelectValue placeholder="Toutes" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="now">Disponible maintenant</SelectItem>
                          <SelectItem value="soon">Disponible bientôt</SelectItem>
                          <SelectItem value="unavailable">Indisponible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    <Search className="mr-2 h-5 w-5" /> RECHERCHER
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Showcase - Nos Métiers (scrolling strip, right to left, illustrated people at work) */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Nos Métiers</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              De la maintenance industrielle à la coiffure, TECHGABON couvre tous les métiers du Gabon
            </p>
          </div>
        </div>
        <MarqueeRow speed="b">
          {[...PHOTO_SHOWCASE, ...PHOTO_SHOWCASE].map((item, i) => (
            <div key={i} className="w-60 flex-shrink-0">
              <SceneTile
                title={item.title}
                subtitle={item.subtitle}
                Icon={item.Icon}
                img={item.img}
                height="h-56"
                onClick={() => { setSearchTrade('all'); go('search'); }}
              />
            </div>
          ))}
        </MarqueeRow>
      </section>

      {/* How It Works */}
      <section id="howitworks" className="bg-slate-50 py-20 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Comment ça marche</h2>
            <p className="mt-4 text-lg text-muted-foreground">Un parcours simple en quelques étapes pour trouver le bon profil technique</p>
          </div>

          <div className="mt-2 grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              {
                icon: Building2, step: '1', title: 'Publiez votre besoin', subtitle: 'En quelques minutes',
                iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', checkColor: 'text-emerald-600',
                items: ['Métier et compétences recherchées', 'Localisation et durée de la mission', 'Analyse automatique de votre demande'],
              },
              {
                icon: Target, step: '2', title: 'Profils recommandés', subtitle: 'Classement automatique',
                iconBg: 'bg-blue-50', iconColor: 'text-blue-600', checkColor: 'text-blue-600',
                items: ['Score de compatibilité calculé', 'Classement des meilleurs profils', 'Comparaison rapide des candidats'],
              },
              {
                icon: CheckCircle2, step: '3', title: 'Contactez et missionnez', subtitle: "Jusqu'à l'évaluation",
                iconBg: 'bg-amber-50', iconColor: 'text-amber-600', checkColor: 'text-amber-600',
                items: ['Contact direct par message ou WhatsApp', 'Réalisation de la mission', 'Évaluation mutuelle en fin de mission'],
              },
            ].map((item) => (
              <div key={item.step} className="py-6 md:px-6 md:first:pl-0 md:last:pr-0">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                <div className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Étape {item.step}</div>
                <ul className="mt-4 space-y-3">
                  {item.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.checkColor}`} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secteurs d'activité - scrolling strip, right to left, illustrated people at work */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Secteurs d'activité</h2>
            <p className="mt-4 text-lg text-muted-foreground">Des équipes professionnelles pour tous les secteurs d'activité au Gabon</p>
          </div>
        </div>
        <MarqueeRow speed="c">
          {[...SECTOR_KEYS, ...SECTOR_KEYS].map((key, i) => (
            <div key={i} className="w-56 flex-shrink-0">
              <SceneTile
                title={key}
                Icon={PHOTO_SECTORS[key].Icon}
                img={PHOTO_SECTORS[key].img}
                height="h-52"
                onClick={() => go('search')}
              />
            </div>
          ))}
        </MarqueeRow>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ils utilisent TECHGABON</h2>
            <p className="mt-4 text-lg text-muted-foreground">Entreprises et professionnels nous font confiance</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Quote className="mb-4 h-8 w-8 text-primary/20" />
                  <div className="mb-4 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`h-4 w-4 ${idx < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">{testimonial.text}</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div
            className="overflow-hidden rounded-xl text-center text-white shadow-lg"
            style={{ background: 'linear-gradient(120deg, #1a4d8f 0%, #0d2f5e 100%)' }}
          >
            <div className="p-12 md:p-16">
              <Award className="mx-auto mb-4 h-12 w-12" style={{ color: '#ffffff' }} />
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#ffffff' }}>Prêt à trouver le bon profil technique ?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>Rejoignez TECHGABON et accédez à un réseau de professionnels qualifiés et vérifiés au Gabon.</p>
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
function SearchScreen({ professionals, searchTrade, setSearchTrade, searchCity, setSearchCity, searchAvailability, setSearchAvailability, searchSector, setSearchSector, searchSort, setSearchSort, openProfile, openProForm, deleteProfessional, go }) {
  let results = professionals.filter((p) => {
    if (searchTrade !== 'all' && p.metier !== searchTrade) return false;
    if (searchCity !== 'all' && p.ville !== searchCity) return false;
    if (searchAvailability !== 'all' && p.dispo !== searchAvailability) return false;
    if (searchSector !== 'all' && !(p.secteurs || []).includes(searchSector)) return false;
    return true;
  });
  if (searchSort === 'experience') results = [...results].sort((a, b) => b.experience - a.experience);
  else if (searchSort === 'note') results = [...results].sort((a, b) => (b.note || 0) - (a.note || 0));

  return (
    <div>
      <ScreenHeader eyebrow="Annuaire" title="Trouver un professionnel" />
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-5">
            <Select value={searchTrade} onValueChange={setSearchTrade}>
              <SelectTrigger><SelectValue placeholder="Métier" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous les métiers</SelectItem>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={searchCity} onValueChange={setSearchCity}>
              <SelectTrigger><SelectValue placeholder="Ville" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Toutes les villes</SelectItem>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={searchSector} onValueChange={setSearchSector}>
              <SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous secteurs</SelectItem>{SECTOR_KEYS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
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
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
          <Button size="sm" onClick={() => openProForm()}><Plus className="mr-1.5 h-4 w-4" />Ajouter un professionnel</Button>
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
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${p.dispo === 'now' ? 'bg-green-500' : p.dispo === 'soon' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                    <p className="text-sm text-muted-foreground">{p.metier}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.ville} · {p.province} · {p.experience} ans d'expérience</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(p.competences || []).slice(0, 3).map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s.name}</Badge>)}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-1.5">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProForm(p.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProfessional(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
function ProfileScreen({ pro, go, openProForm, deleteProfessional, openMissionForm, resendVerification }) {
  if (!pro) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Ce profil n'existe plus. <Button variant="link" onClick={() => go('search')}>Retour</Button></div>;

  const wa = (pro.whatsapp || '').replace(/[^\d]/g, '');
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent('Bonjour ' + pro.prenom + ', je vous contacte via TECHGABON.')}` : null;
  const docs = pro.docs || { cv: null, diplome: null, certifs: [] };

  return (
    <div>
      <ScreenHeader eyebrow="Profil professionnel" title={`${pro.prenom} ${pro.nom}`} onBack={() => go('search')} />
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-6">
              <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{(pro.prenom[0] || '') + (pro.nom[0] || '')}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{pro.metier}</h2>
                  {pro.verified === false ? (
                    <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Email non confirmé</Badge>
                  ) : pro.verified ? (
                    <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Vérifié</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{pro.ville} · {pro.quartier} · {pro.province}</p>
                <p className="text-sm text-muted-foreground">{pro.experience} ans d'expérience · {pro.missionsTerminees > 0 && pro.note ? `⭐ ${pro.note}/5 (${pro.missionsTerminees} missions)` : 'Nouveau profil'}</p>
                {pro.verified === false && (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={() => resendVerification(pro)}>Renvoyer l'email de confirmation</Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openProForm(pro.id)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Modifier</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteProfessional(pro.id)}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Supprimer</Button>
              </div>
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
              <h3 className="mb-4 font-semibold">Documents</h3>
              <div className="space-y-2">
                {[docs.cv && { ...docs.cv, label: 'CV' }, docs.diplome && { ...docs.diplome, label: 'Diplôme' }, ...((docs.certifs || []).map((d) => ({ ...d, label: 'Certification' })))].filter(Boolean).map((d, i) => (
                  <a key={i} href={d.dataUrl} download={d.name} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-primary hover:bg-slate-50">
                    <FileText className="h-4 w-4" /> {d.label} — {d.name} <span className="text-xs text-muted-foreground">({fmtSize(d.size)})</span>
                  </a>
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
function ProForm({ existing, onCancel, onSave }) {
  const [nom, setNom] = useState(existing ? existing.nom : '');
  const [prenom, setPrenom] = useState(existing ? existing.prenom : '');
  const [province, setProvince] = useState(existing ? existing.province : 'Estuaire');
  const [ville, setVille] = useState(existing ? existing.ville : '');
  const [quartier, setQuartier] = useState(existing ? existing.quartier : '');
  const [dispo, setDispo] = useState(existing ? existing.dispo : 'now');
  const [metier, setMetier] = useState(existing ? existing.metier : '');
  const [experience, setExperience] = useState(existing ? String(existing.experience) : '');
  const [missionsTerminees, setMissionsTerminees] = useState(existing ? String(existing.missionsTerminees || 0) : '0');
  const [secteurs, setSecteurs] = useState(existing ? existing.secteurs : []);
  const [competences, setCompetences] = useState(existing ? existing.competences : []);
  const [certifications, setCertifications] = useState(existing ? existing.certifications : []);
  const [telephone, setTelephone] = useState(existing ? existing.telephone : '');
  const [email, setEmail] = useState(existing ? existing.email : '');
  const [whatsapp, setWhatsapp] = useState(existing ? existing.whatsapp : '');
  const [linkedin, setLinkedin] = useState(existing ? existing.linkedin : '');
  const [docs, setDocs] = useState(existing && existing.docs ? existing.docs : { cv: null, diplome: null, certifs: [] });
  const [errors, setErrors] = useState([]);

  const submit = (e) => {
    e.preventDefault();
    const missing = [];
    if (!nom.trim()) missing.push('Nom');
    if (!prenom.trim()) missing.push('Prénom');
    if (!ville.trim()) missing.push('Ville');
    if (!metier.trim()) missing.push('Métier principal');
    if (!telephone.trim()) missing.push('Téléphone');
    if (!email.trim()) missing.push('Email (nécessaire pour la confirmation de compte)');
    if (!docs.cv) missing.push('CV');
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    const missionsN = parseInt(missionsTerminees, 10) || 0;
    onSave({
      id: existing ? existing.id : uid(),
      nom: nom.trim(), prenom: prenom.trim(), province, ville: ville.trim(), quartier: quartier.trim(),
      dispo, metier: metier.trim(), experience: parseInt(experience, 10) || 0,
      missionsTerminees: missionsN, note: missionsN > 0 ? (existing && existing.note ? existing.note : 4.5) : null,
      secteurs, competences, certifications, docs,
      telephone: telephone.trim(), email: email.trim(), whatsapp: whatsapp.trim(), linkedin: linkedin.trim(),
      verified: existing ? existing.verified : undefined,
      verifyToken: existing ? existing.verifyToken : undefined,
    });
  };

  return (
    <div>
      <ScreenHeader eyebrow={existing ? 'Édition du profil' : 'Inscription professionnel'} title={existing ? 'Modifier le profil' : 'Créer votre profil professionnel'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            <p className="text-xs text-muted-foreground">Les champs marqués d'une <Req /> sont obligatoires.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nom <Req /></Label><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Mabiala" /></div>
              <div className="space-y-2"><Label>Prénom <Req /></Label><Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" /></div>
            </div>

            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} villeRequired />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Métier principal <Req /></Label>
                <Select value={metier} onValueChange={setMetier}>
                  <SelectTrigger><SelectValue placeholder="Choisir un métier" /></SelectTrigger>
                  <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibilité</Label>
                <Select value={dispo} onValueChange={setDispo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">🟢 Disponible maintenant</SelectItem>
                    <SelectItem value="soon">🟠 Disponible bientôt</SelectItem>
                    <SelectItem value="unavailable">🔴 Indisponible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Années d'expérience</Label><Input type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="5" /></div>
              <div className="space-y-2"><Label>Missions terminées sur la plateforme</Label><Input type="number" min="0" value={missionsTerminees} onChange={(e) => setMissionsTerminees(e.target.value)} /></div>
            </div>
            <p className="text-xs text-muted-foreground">La note affichée est calculée automatiquement à partir des missions terminées — elle ne peut pas être saisie manuellement.</p>

            <div className="space-y-2">
              <Label>Secteurs d'activité</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {SECTOR_KEYS.map((s) => (
                  <button type="button" key={s} onClick={() => setSecteurs(toggleInArray(secteurs, s))}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${secteurs.includes(s) ? 'border-primary bg-primary/5 text-primary' : 'border-muted-foreground/20'}`}>
                    {secteurs.includes(s) && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />} {s}
                  </button>
                ))}
              </div>
            </div>

            <TagAdder label="Compétences" placeholder="Ex : Pompes, Tuyauterie PVC..." items={competences} onChange={setCompetences} withLevel />
            <TagAdder label="Certifications (texte)" placeholder="Ex : BOSIET, Habilitation électrique..." items={certifications} onChange={setCertifications} withVerified />

            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-semibold">Documents (CV, diplôme, certifications)</p>
              <FileField label={<>CV (PDF / Word) <Req /></>} accept=".pdf,.doc,.docx" value={docs.cv} onChange={(v) => setDocs({ ...docs, cv: v })} />
              <FileField label="Diplôme principal (PDF / Image)" accept=".pdf,.jpg,.jpeg,.png" value={docs.diplome} onChange={(v) => setDocs({ ...docs, diplome: v })} />
              <FileField label="Justificatifs de certification" accept=".pdf,.jpg,.jpeg,.png" multiple value={docs.certifs} onChange={(v) => setDocs({ ...docs, certifs: v })} />
              <p className="text-xs text-muted-foreground">Fichiers légers uniquement pour ce prototype (≤ 600 Ko chacun). Ils restent privés jusqu'à validation par TECHGABON.</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold">Contact</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Téléphone <Req /></Label><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+241 XX XX XX XX" /></div>
                <div className="space-y-2"><Label>Email <Req /></Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean.mabiala@email.com" /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+241XXXXXXXX" /></div>
                <div className="space-y-2"><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/..." /></div>
              </div>
              <p className="text-xs text-muted-foreground">L'email sert à confirmer votre compte et n'est jamais affiché publiquement.</p>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
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
function CompanyForm({ existing, onCancel, onSave, onDelete }) {
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
  const [errors, setErrors] = useState([]);

  const years = [];
  for (let y = currentYear; y >= 1955; y--) years.push(y);

  const submit = (e) => {
    e.preventDefault();
    const missing = [];
    if (!nom.trim()) missing.push("Nom de l'entreprise");
    if (!ville.trim()) missing.push('Ville');
    if (!secteurs.length) missing.push("Au moins un domaine d'activité");
    if (!telephone.trim()) missing.push('Téléphone');
    if (!email.trim()) missing.push('Email (nécessaire pour la confirmation de compte)');
    if (!logo) missing.push("Logo de l'entreprise");
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    onSave({
      id: existing ? existing.id : uid(),
      nom: nom.trim(), province, ville: ville.trim(), quartier: quartier.trim(),
      annee: parseInt(annee, 10), effectif, site: site.trim(), nif: nif.trim(), secteurs, description: description.trim(), logo,
      contact: contact.trim(), telephone: telephone.trim(), email: email.trim(), whatsapp: whatsapp.trim(),
      verified: existing ? existing.verified : undefined,
      verifyToken: existing ? existing.verifyToken : undefined,
    });
  };

  return (
    <div>
      <ScreenHeader eyebrow={existing ? 'Édition' : 'Inscription entreprise'} title={existing ? 'Modifier la fiche entreprise' : 'Créer ma fiche entreprise'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            <p className="text-xs text-muted-foreground">Les champs marqués d'une <Req /> sont obligatoires.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nom de l'entreprise <Req /></Label><Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="SOBRAGA, Assala Energy..." /></div>
              <div className="space-y-2"><Label>Site web (optionnel)</Label><Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://..." /></div>
            </div>

            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} villeRequired />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Année de création</Label>
                <Select value={annee} onValueChange={setAnnee}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Effectif</Label>
                <Select value={effectif} onValueChange={setEffectif}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 à 10 salariés</SelectItem>
                    <SelectItem value="11-50">11 à 50 salariés</SelectItem>
                    <SelectItem value="51-200">51 à 200 salariés</SelectItem>
                    <SelectItem value="200+">Plus de 200 salariés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>NIF / RCCM (optionnel)</Label>
                <Input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="Numéro d'identification fiscale" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Domaines d'activité <Req /></Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {SECTOR_KEYS.map((s) => (
                  <button type="button" key={s} onClick={() => setSecteurs(toggleInArray(secteurs, s))}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${secteurs.includes(s) ? 'border-primary bg-primary/5 text-primary' : 'border-muted-foreground/20'}`}>
                    {secteurs.includes(s) && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />} {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2"><Label>Description de l'activité</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Présentez votre entreprise et vos besoins récurrents en compétences techniques." /></div>

            <FileField label={<>Logo de l'entreprise <Req /></>} accept=".jpg,.jpeg,.png,.svg" value={logo} onChange={setLogo} hint="Image légère recommandée (≤ 600 Ko) pour ce prototype." />

            <div className="space-y-4">
              <p className="text-sm font-semibold">Contact</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nom du contact</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Responsable RH / Achats" /></div>
                <div className="space-y-2"><Label>Téléphone <Req /></Label><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+241 XX XX XX XX" /></div>
                <div className="space-y-2"><Label>Email <Req /></Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@entreprise.ga" /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+241XXXXXXXX" /></div>
              </div>
              <p className="text-xs text-muted-foreground">L'email sert à confirmer votre compte et n'est jamais affiché publiquement.</p>
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              {onDelete ? <Button type="button" variant="destructive" onClick={onDelete}>Supprimer cette fiche</Button> : <span />}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
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
function MissionForm({ existing, defaultClientType, defaultClientName, onCancel, onSave, onDelete }) {
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

  const submit = (e) => {
    e.preventDefault();
    const missing = [];
    if (!titre.trim()) missing.push('Titre');
    if (!metier.trim()) missing.push('Métier');
    if (!ville.trim()) missing.push('Localisation (ville)');
    if (missing.length) { setErrors(missing); window.scrollTo(0, 0); return; }
    setErrors([]);
    onSave({
      id: existing ? existing.id : uid(),
      clientType, clientName: clientName.trim(), titre: titre.trim(), metier: metier.trim(),
      experienceMin: parseInt(experienceMin, 10) || 0, competences, secteur,
      province, ville: ville.trim(), quartier: quartier.trim(), duree, date, statut, budget: budget.trim(), description: description.trim(),
    });
  };

  return (
    <div>
      <ScreenHeader eyebrow={existing ? 'Édition' : 'Nouvelle mission'} title={existing ? 'Modifier la mission' : 'Publier une mission'} onBack={onCancel} />
      <form onSubmit={submit} className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="space-y-6 p-6">
            <FormErrorBanner errors={errors} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Publié par</Label>
                <Select value={clientType} onValueChange={setClientType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="entreprise">Entreprise</SelectItem><SelectItem value="particulier">Particulier</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nom (entreprise ou contact)</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="SOBRAGA, ou votre nom" /></div>
            </div>

            <div className="space-y-2"><Label>Titre</Label><Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Recherche technicien instrumentation" /></div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Métier</Label>
                <Select value={metier} onValueChange={setMetier}>
                  <SelectTrigger><SelectValue placeholder="Choisir un métier" /></SelectTrigger>
                  <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Expérience minimum (ans)</Label><Input type="number" min="0" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} /></div>
            </div>

            <TagAdder label="Compétences nécessaires" placeholder="Ex : Calibration" items={competences} onChange={setCompetences} />

            <div className="space-y-2">
              <Label>Secteur</Label>
              <Select value={secteur} onValueChange={setSecteur}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SECTOR_KEYS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <LocationFields province={province} ville={ville} quartier={quartier} onProvince={setProvince} onVille={setVille} onQuartier={setQuartier} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Durée</Label>
                <Select value={duree} onValueChange={setDuree}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="space-y-2"><Label>Date de début</Label><Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="25/08/2026" /></div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="done">Terminée</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Budget</Label><Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="À discuter" /></div>
            </div>

            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>

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
function MatchingScreen({ mission, professionals, go, openProfile, openMissionForm, deleteMission }) {
  if (!mission) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Mission introuvable.</div>;

  const ranked = professionals.map((p) => ({ p, ...computeScore(p, mission) })).sort((a, b) => b.score - a.score);

  return (
    <div>
      <ScreenHeader eyebrow="Mission" title={`Profils recommandés — ${mission.titre}`} onBack={() => go('dashcompany')} />
      <div className="container mx-auto max-w-3xl px-4 py-8">
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
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => openMissionForm(mission.id)}>Modifier la mission</Button>
          <Button variant="destructive" onClick={() => deleteMission(mission.id)}>Supprimer la mission</Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPANY DASHBOARD
========================================================= */
function CompanyDashboard({ companies, missions, professionals, myCompanyId, openCompanyForm, openMissionForm, openMatching, deleteMission, resendCompanyVerification, go }) {
  const company = companies.find((c) => c.id === myCompanyId) || null;
  const kpis = [
    { label: 'Missions publiées', value: missions.length },
    { label: 'Missions actives', value: missions.filter((m) => m.statut === 'active').length },
    { label: 'Professionnels enregistrés', value: professionals.length },
    { label: 'Missions terminées', value: missions.filter((m) => m.statut === 'done').length },
  ];
  const statusLabel = { active: 'Active', pending: 'En attente', done: 'Terminée' };
  const statusColor = { active: 'bg-primary/10 text-primary', pending: 'bg-amber-500/10 text-amber-600', done: 'bg-green-500/10 text-green-600' };

  return (
    <div>
      <ScreenHeader eyebrow="Espace entreprise" title="Tableau de bord entreprise" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Gérez votre fiche entreprise, vos missions et l'annuaire des professionnels.</p>
          <Button onClick={() => openMissionForm()}><Plus className="mr-1.5 h-4 w-4" />Publier une mission</Button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}><CardContent className="p-5"><div className="text-2xl font-bold">{k.value}</div><div className="mt-1 text-xs text-muted-foreground">{k.label}</div></CardContent></Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Ma fiche entreprise</h3>
              {company && <Button variant="outline" size="sm" onClick={() => openCompanyForm(company.id)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Modifier</Button>}
            </div>
            {company ? (
              <div className="flex flex-wrap items-start gap-4">
                <Avatar className="h-14 w-14 flex-shrink-0"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{company.nom.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1" style={{ minWidth: '220px' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{company.nom}</h4>
                    {company.verified ? (
                      <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Vérifiée</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Email non confirmé</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{company.ville} · {company.province} · Créée en {company.annee} · {company.effectif} salariés</p>
                  <p className="mt-2 text-sm text-muted-foreground">{company.description || 'Aucune description renseignée.'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{(company.secteurs || []).map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}</div>
                  {!company.verified && (
                    <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => resendCompanyVerification(company)}>Renvoyer l'email de confirmation</Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">Vous n'avez pas encore de fiche entreprise sur cet appareil.</p>
                <Button size="sm" onClick={() => openCompanyForm()}><Plus className="mr-1.5 h-4 w-4" />Créer ma fiche entreprise</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Mes missions</h3>
            {missions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune mission publiée.</p>
            ) : (
              <div className="space-y-2">
                {missions.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 border-b py-3 text-sm last:border-0">
                    <div className="flex-1" style={{ minWidth: '200px' }}>
                      <span className="font-medium">{m.titre}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{m.clientType === 'particulier' ? 'Particulier' : 'Entreprise'}</Badge>
                    </div>
                    <span className="w-32 text-muted-foreground">{m.ville || '—'}</span>
                    <span className="w-28 text-muted-foreground">{m.date || '—'}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[m.statut]}`}>{statusLabel[m.statut]}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openMatching(m.id)}><Target className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openMissionForm(m.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMission(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Professionnels enregistrés</h3>
              <Button variant="link" size="sm" onClick={() => go('search')}>Voir tous <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {professionals.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{(p.prenom[0] || '') + (p.nom[0] || '')}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.prenom} {p.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.metier}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   PROFESSIONAL DASHBOARD
========================================================= */
function ProDashboard({ professionals, myProIds, openProfile, openProForm, deleteProfessional }) {
  const mine = professionals.filter((p) => myProIds.includes(p.id));
  return (
    <div>
      <ScreenHeader eyebrow="Espace professionnel" title="Tableau de bord professionnel" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Gérez vos profils publics, vos documents et vos disponibilités.</p>
          <Button onClick={() => openProForm()}><Plus className="mr-1.5 h-4 w-4" />Ajouter un profil</Button>
        </div>
        {mine.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
              <p>Vous n'avez pas encore de profil professionnel sur cet appareil.</p>
              <Button size="sm" onClick={() => openProForm()}><Plus className="mr-1.5 h-4 w-4" />Créer mon premier profil</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mine.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{(p.prenom[0] || '') + (p.nom[0] || '')}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openProfile(p.id)}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-medium">{p.prenom} {p.nom}</p>
                      {p.verified ? (
                        <Badge className="gap-1 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5" />Vérifié</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[10px]"><AlertCircle className="h-2.5 w-2.5" />Non vérifié</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{p.metier} · {p.ville}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProForm(p.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProfessional(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
   LOGIN PLACEHOLDER
========================================================= */
function ChooseAccountType({ go, openProForm, openCompanyForm, openMissionForm }) {
  const options = [
    { icon: Wrench, title: 'Professionnel', desc: "Créez votre profil, ajoutez CV, diplômes et certifications, soyez visible et contacté directement.", action: () => openProForm() },
    { icon: Building2, title: 'Entreprise', desc: "Créez votre fiche entreprise (secteur, année de création, effectif) et publiez vos missions.", action: () => openCompanyForm() },
    { icon: Users, title: 'Particulier', desc: "Publiez un besoin ponctuel (plomberie, électricité, ménage...) sans créer de fiche entreprise.", action: () => openMissionForm(null, 'particulier') },
  ];
  return (
    <div>
      <ScreenHeader eyebrow="Créer un compte" title="Quel type de compte souhaitez-vous créer ?" onBack={() => go('home')} />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <p className="mb-6 text-sm text-muted-foreground">Choisissez le profil qui correspond à votre situation. Vous pourrez compléter vos informations à l'étape suivante.</p>
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
      </div>
    </div>
  );
}

function LegalDoc({ eyebrow, title, updated, go, children }) {
  return (
    <div>
      <ScreenHeader eyebrow={eyebrow} title={title} onBack={() => go('home')} />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <p className="mb-8 text-xs text-muted-foreground">Dernière mise à jour : {updated}</p>
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function PrivacyScreen({ go }) {
  return (
    <LegalDoc eyebrow="Légal" title="Politique de confidentialité" updated="26 août 2026" go={go}>
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
        Ce document est un modèle de base couvrant les pratiques réelles de ce prototype (ce qui est stocké, où, et pourquoi).
        Avant une mise en production réelle, fais-le relire par un juriste pour t'assurer qu'il couvre correctement ta situation
        et respecte la réglementation gabonaise applicable à la protection des données.
      </p>

      <h2>1. Quelles données sont collectées</h2>
      <p>Lorsque vous créez un profil professionnel ou une fiche entreprise, nous collectons les informations que vous saisissez volontairement : identité, coordonnées, métier ou secteur d'activité, compétences, et les documents que vous choisissez de téléverser (CV, diplômes, certifications, logo).</p>

      <h2>2. Où ces données sont stockées</h2>
      <p>Dans la version actuelle de TECHGABON, les profils sont enregistrés dans le stockage local (localStorage) de votre navigateur, sur votre propre appareil — ils ne transitent pas vers un serveur central tant que cette fonctionnalité n'a pas été mise en place. Les documents (CV, diplômes) restent privés jusqu'à validation par TECHGABON ; seul le badge « vérifié » est visible publiquement.</p>

      <h2>3. Utilisation des données</h2>
      <ul>
        <li>Afficher votre profil dans l'annuaire public si vous l'avez créé à cet effet</li>
        <li>Calculer le score de compatibilité entre une mission et les professionnels disponibles</li>
        <li>Vous envoyer un email de confirmation lors de la création de compte</li>
      </ul>

      <h2>4. Partage des données</h2>
      <p>Nous ne vendons aucune donnée personnelle. Les informations de contact (téléphone, WhatsApp, email) que vous rendez publiques sur votre profil sont visibles par les visiteurs du site, dans le but explicite de faciliter la mise en relation.</p>

      <h2>5. Vos droits</h2>
      <p>Vous pouvez à tout moment modifier ou supprimer votre profil depuis votre tableau de bord. La suppression retire définitivement vos données du navigateur utilisé.</p>

      <h2>6. Cookies et stockage local</h2>
      <p>Ce site utilise le stockage local de votre navigateur pour conserver votre session et vos profils — pas de cookies publicitaires ni de traceurs tiers.</p>

      <h2>7. Contact</h2>
      <p>Pour toute question relative à vos données : contact@techgabon.com</p>
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
      <p>TECHGABON — [Raison sociale à compléter]<br />
      [Adresse du siège à compléter], Libreville, Gabon<br />
      Email : contact@techgabon.com — Téléphone : +241 00 00 00 00<br />
      [Numéro RCCM / NIF à compléter]</p>

      <h2>Directeur de la publication</h2>
      <p>[Nom du responsable à compléter]</p>

      <h2>Hébergement</h2>
      <p>Ce site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</p>

      <h2>Propriété intellectuelle</h2>
      <p>L'ensemble des contenus présents sur TECHGABON (textes, mise en page, logo) est protégé par le droit d'auteur, sauf mention contraire. Les photographies utilisées proviennent de banques d'images libres de droits.</p>

      <h2>Données personnelles</h2>
      <p>Le traitement des données personnelles est détaillé dans notre <button onClick={() => go('privacy')} className="underline hover:text-foreground">Politique de confidentialité</button>.</p>

      <h2>Droit applicable</h2>
      <p>Les présentes mentions légales sont soumises au droit gabonais.</p>
    </LegalDoc>
  );
}

function LoginPlaceholder({ go }) {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <LayoutDashboard className="mb-4 h-10 w-10 text-primary" />
      <h1 className="mb-2 text-xl font-semibold">Connexion</h1>
      <p className="mb-6 text-sm text-muted-foreground">L'authentification n'est pas encore branchée dans ce prototype. Utilisez les tableaux de bord directement.</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => go('dashpro')}>Espace professionnel</Button>
        <Button onClick={() => go('dashcompany')}>Espace entreprise</Button>
      </div>
    </div>
  );
}
