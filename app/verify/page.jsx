'use client';

import { useEffect, useState } from 'react';

// This page runs in whatever browser opens the emailed link. Because this prototype
// persists data in localStorage (no shared server database — see README), it can only
// confirm an account when opened in the SAME browser used to sign up. Opening the link
// on a different device/browser will correctly report "not found" rather than silently
// failing, since the record simply isn't present in that browser's localStorage.
// The fix for real cross-device verification is to move `professionals` / `companies`
// storage to a real database (Postgres via Supabase/Neon, etc.) and check the token
// there instead of in localStorage.

export default function VerifyPage() {
  const [status, setStatus] = useState('checking'); // checking | success | notfound | mismatch
  const [label, setLabel] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const id = params.get('id');
    const token = params.get('token');

    if (!type || !id || !token) {
      setStatus('notfound');
      return;
    }

    const key = type === 'company' ? 'techgabon:companies' : 'techgabon:professionals';
    setLabel(type === 'company' ? 'fiche entreprise' : 'profil professionnel');

    try {
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) {
        setStatus('notfound');
        return;
      }
      if (list[idx].verifyToken !== token) {
        setStatus('mismatch');
        return;
      }
      list[idx] = { ...list[idx], verified: true };
      localStorage.setItem(key, JSON.stringify(list));
      setStatus('success');
    } catch (e) {
      setStatus('notfound');
    }
  }, []);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        {status === 'checking' && <p>Vérification en cours…</p>}

        {status === 'success' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Compte confirmé ✅</h1>
            <p style={{ color: '#5b6b78', marginBottom: 24 }}>Votre {label} est maintenant vérifié(e).</p>
            <a href="/" style={{ background: '#33465c', color: '#fff', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
              Retour à l'accueil
            </a>
          </>
        )}

        {status === 'notfound' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Lien introuvable sur cet appareil</h1>
            <p style={{ color: '#5b6b78', marginBottom: 8 }}>
              Ce prototype stocke les comptes dans le navigateur utilisé pour l'inscription.
            </p>
            <p style={{ color: '#5b6b78', marginBottom: 24 }}>
              Ouvrez ce lien depuis le même appareil et le même navigateur que ceux utilisés lors de la création du compte.
            </p>
            <a href="/" style={{ background: '#33465c', color: '#fff', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
              Retour à l'accueil
            </a>
          </>
        )}

        {status === 'mismatch' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Lien invalide</h1>
            <p style={{ color: '#5b6b78', marginBottom: 24 }}>Ce lien de confirmation ne correspond pas à ce compte. Demandez un nouvel envoi depuis votre profil.</p>
            <a href="/" style={{ background: '#33465c', color: '#fff', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
              Retour à l'accueil
            </a>
          </>
        )}
      </div>
    </div>
  );
}
