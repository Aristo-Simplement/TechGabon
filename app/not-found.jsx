import Logo from '@/components/Logo';

export const metadata = { title: 'Page introuvable | ONASKILL', robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-8 h-10 w-auto" />
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold-700">Erreur 404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900">Cette page n'existe pas</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Le lien est peut-être incomplet, ou le profil a été supprimé par son propriétaire.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="/" className="rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800">Retour à l'accueil</a>
        <a href="/recherche" className="rounded-full border border-navy-900/20 px-6 py-3 text-sm font-semibold text-navy-900 hover:bg-secondary">Trouver un professionnel</a>
      </div>
    </main>
  );
}
