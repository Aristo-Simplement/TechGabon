'use client';

import { useEffect, useState } from 'react';

// Opened from the confirmation email. The server checks the token stored with the
// account, so the link works from any device or browser.

export default function VerifyPage() {
  const [status, setStatus] = useState('checking'); // checking | success | notfound | mismatch | invalid
  const [label, setLabel] = useState('compte');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    setLabel(type === 'company' ? 'fiche entreprise' : 'profil professionnel');
    fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id: params.get('id'), token: params.get('token') }),
    })
      .then((r) => r.json())
      .then((d) => setStatus(d.status || 'invalid'))
      .catch(() => setStatus('invalid'));
  }, []);

  const messages = {
    success: ['Compte confirmé ✅', `Votre ${label} est maintenant confirmé(e).`],
    notfound: ['Compte introuvable', 'Ce compte n’existe plus ou a été supprimé.'],
    mismatch: ['Lien invalide', 'Ce lien de confirmation n’est plus valide. Connectez-vous et demandez un nouvel envoi depuis votre espace.'],
    invalid: ['Lien incomplet', 'Le lien semble incomplet. Copiez-le en entier depuis l’e-mail reçu.'],
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        {status === 'checking' ? (
          <p>Vérification en cours…</p>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#0b1b36' }}>{messages[status][0]}</h1>
            <p style={{ color: '#5b6b78', marginBottom: 24 }}>{messages[status][1]}</p>
            <a href="/" style={{ background: '#0b1b36', color: '#fff', padding: '10px 22px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}>
              Retour à l’accueil
            </a>
          </>
        )}
      </div>
    </div>
  );
}
