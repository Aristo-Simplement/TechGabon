'use client';

import { useEffect } from 'react';

// Shown if something unexpected breaks while displaying a page.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[ONASKILL] erreur d’affichage :', error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold-700">Oups</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900">Un problème est survenu</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Réessayez dans un instant. Si le problème persiste, revenez à l'accueil.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800">Réessayer</button>
        <a href="/" className="rounded-full border border-navy-900/20 px-6 py-3 text-sm font-semibold text-navy-900 hover:bg-secondary">Retour à l'accueil</a>
      </div>
    </main>
  );
}
