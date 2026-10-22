// Renamed trades and sectors. Profiles store these names as text, so records saved with an
// old name are translated to the current one wherever they are read or saved — nobody
// loses their classification when a name changes.
//
// Trades are named after the person who does the work (Plombier, not Plomberie);
// sectors are named after the field of activity (Beauté & Bien-être, not Coiffure).

export const TRADE_ALIASES = {
  'Coiffure / Coiffeur(se)': 'Coiffeur / Coiffeuse',
  'Technicien maintenance industrielle': 'Maintenancier industriel',
  'Dépannage électronique': 'Dépanneur électronique',
  'Agence de transport': 'Transporteur',
  'Blanchisserie / Repassage': 'Blanchisseur / Repasseuse',
};

export const SECTOR_ALIASES = {
  'Oil & Gas': 'Pétrole & Gaz',
  'Maintenance': 'Maintenance & Services industriels',
  'Agriculture': 'Agriculture & Élevage',
  'Commerce': 'Commerce & Distribution',
  'Services domestiques': 'Services à la personne',
  'Électronique & Informatique': 'Numérique & Télécoms',
  'Coiffure & Beauté': 'Beauté & Bien-être',
};

export const canonicalTrade = (t) => (t && TRADE_ALIASES[t]) || t;
export const canonicalSector = (s) => (s && SECTOR_ALIASES[s]) || s;
export const canonicalSectors = (list) => [...new Set((list || []).map(canonicalSector))];
