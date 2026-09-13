import { NextResponse } from 'next/server';

// POST /api/send-verification
// Body: { email, nom, token, type: 'pro' | 'company', id, origin }
//
// Sends a confirmation email with a link back to /verify?type=...&id=...&token=...
//
// Setup required to actually send real emails:
//   1. Create a free account at https://resend.com
//   2. Verify a sending domain (or use their shared onboarding domain for testing)
//   3. Create an API key, then add it to your environment as RESEND_API_KEY
//      - Locally: put RESEND_API_KEY=re_xxx in a .env.local file at the project root
//      - On Vercel: Project Settings -> Environment Variables -> add RESEND_API_KEY
//   4. Update FROM_EMAIL below to an address on your verified domain
//
// Without RESEND_API_KEY configured, this route logs the verification link to the
// server console instead of emailing it, so account creation still works end-to-end
// during local development.

const FROM_EMAIL = 'TECHGABON <onboarding@resend.dev>';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { email, nom, token, type, id, origin } = body || {};
  if (!email || !token || !type || !id) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const verifyUrl = `${origin || ''}/verify?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
  const label = type === 'company' ? 'votre fiche entreprise' : 'votre profil professionnel';

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback: no email service configured yet — surface the link in the server
    // logs so the flow is still testable end-to-end without a Resend account.
    console.log('[TECHGABON] RESEND_API_KEY non configurée. Lien de confirmation:', verifyUrl);
    return NextResponse.json({
      sent: false,
      devMode: true,
      message: "Email non envoyé (RESEND_API_KEY absente) — lien affiché dans les logs du serveur.",
      verifyUrl,
    });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Confirmez votre compte TECHGABON',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color:#1e2a3a;">Bienvenue sur TECHGABON${nom ? ', ' + nom : ''} !</h2>
          <p>Merci de vous être inscrit. Confirmez votre email pour activer ${label} :</p>
          <p style="margin: 28px 0;">
            <a href="${verifyUrl}" style="background:#c98a2c; color:#1e2a3a; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600;">
              Confirmer mon compte
            </a>
          </p>
          <p style="color:#666; font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>${verifyUrl}</p>
        </div>
      `,
    });
    if (error) {
      console.error('[TECHGABON] Resend error:', error);
      return NextResponse.json({ sent: false, error: String(error) }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error('[TECHGABON] send-verification error:', e);
    return NextResponse.json({ sent: false, error: 'Échec de l\'envoi' }, { status: 500 });
  }
}
