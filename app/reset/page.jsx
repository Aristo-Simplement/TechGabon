'use client';

import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

// Opened from the "choose your password" email (password reset, or activating an
// account for a profile created before accounts existed).

const field = { width: '100%', height: 42, borderRadius: 8, border: '1px solid #d6dbe6', padding: '0 12px', fontSize: 15, boxSizing: 'border-box' };

export default function ResetPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setDone(true);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}><Logo className="h-10 w-auto" /></div>
        <div style={{ border: '1px solid #e3e6ee', borderRadius: 16, padding: 24, background: '#fff' }}>
          {done ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0b1b36', marginBottom: 8 }}>Mot de passe enregistré ✅</h1>
              <p style={{ color: '#5b6b78' }}>Vous êtes connecté. Redirection vers le site…</p>
            </>
          ) : !token ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0b1b36', marginBottom: 8 }}>Lien incomplet</h1>
              <p style={{ color: '#5b6b78' }}>Ouvrez le lien reçu par e-mail en entier, ou demandez-en un nouveau depuis la page Connexion.</p>
            </>
          ) : (
            <form onSubmit={submit}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0b1b36', marginBottom: 6 }}>Choisissez votre mot de passe</h1>
              <p style={{ color: '#5b6b78', fontSize: 14, marginBottom: 20 }}>8 caractères minimum.</p>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }} htmlFor="pw">Nouveau mot de passe</label>
              <input id="pw" type="password" autoComplete="new-password" style={field} value={password} onChange={(e) => setPassword(e.target.value)} />
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, margin: '14px 0 6px' }} htmlFor="pw2">Confirmer le mot de passe</label>
              <input id="pw2" type="password" autoComplete="new-password" style={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {error && <p role="alert" style={{ color: '#c0392b', fontSize: 14, marginTop: 12 }}>{error}</p>}
              <button type="submit" disabled={busy} style={{ marginTop: 20, width: '100%', height: 44, borderRadius: 999, border: 0, background: '#0b1b36', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                {busy ? 'Enregistrement…' : 'Enregistrer et me connecter'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
