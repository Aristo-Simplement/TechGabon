'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Visitor-selected language. The site is written in French; any other choice is
// machine-translated in the browser by the Google Translate website widget, which is
// only loaded once a visitor picks a language other than French.
export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ln', label: 'Lingála' },
];

const COOKIE = 'googtrans';

function readLang() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/fr\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : 'fr';
}

function writeLang(code) {
  const host = window.location.hostname;
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Clear any previous choice (Google may have set it on the bare and the dotted domain).
  for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) {
    document.cookie = `${COOKIE}=; ${expire}; path=/${domain}`;
  }
  if (code !== 'fr') document.cookie = `${COOKIE}=/fr/${code}; path=/`;
}

// Google Translate rewraps text nodes in <font> tags, which makes React's later DOM
// updates throw ("removeChild: not a child"). Tolerate those mismatches while a
// translation is active — the standard workaround for this known conflict.
function patchDomForTranslation() {
  if (typeof Node === 'undefined' || Node.prototype.__tgPatched) return;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child);
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref);
  };
  Node.prototype.__tgPatched = true;
}

function loadTranslator() {
  if (document.getElementById('google-translate-script')) return;
  patchDomForTranslation();
  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      { pageLanguage: 'fr', includedLanguages: LANGUAGES.map((l) => l.code).join(','), autoDisplay: false },
      'google_translate_element'
    );
  };
  const s = document.createElement('script');
  s.id = 'google-translate-script';
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.body.appendChild(s);
}

export default function LanguageSwitcher({ className = '' }) {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    const current = readLang();
    setLang(current);
    if (current !== 'fr') loadTranslator();
  }, []);

  function change(code) {
    if (code === lang) return;
    writeLang(code);
    window.location.reload();
  }

  return (
    <div className={`notranslate ${className}`} translate="no">
      <Select value={lang} onValueChange={change}>
        <SelectTrigger aria-label="Choisir la langue" className="h-9 w-auto gap-1.5 rounded-full border-navy-900/15 px-3 text-sm font-medium text-navy-900">
          <Globe className="h-4 w-4 text-gold-500" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="notranslate max-h-80" translate="no">
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
