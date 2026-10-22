// Outgoing emails (account confirmation, password reset / profile recovery). Server only.
//
// Two ways to send real emails — set ONE of them in Vercel → Project Settings →
// Environment Variables (never in the code):
//
//   A. Gmail (free, no domain needed, ~500 emails/day):
//        SMTP_HOST=smtp.gmail.com   SMTP_PORT=465
//        SMTP_USER=<the Gmail address>   SMTP_PASS=<a Google "app password">
//        FROM_EMAIL="ONASKILL <the same Gmail address>"
//   B. Resend (needs a domain verified in Resend):
//        RESEND_API_KEY=re_…   FROM_EMAIL="ONASKILL <contact@your-domain>"
//
// With neither configured, the email (and its link) is printed in the server logs so
// the flows stay testable locally.

export function emailProvider() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return null;
}

async function sendMail({ to, subject, html, text }) {
  const provider = emailProvider();
  const from = process.env.FROM_EMAIL || (provider === 'smtp' ? `ONASKILL <${process.env.SMTP_USER}>` : 'ONASKILL <onboarding@resend.dev>');

  if (!provider) {
    console.log(`[ONASKILL] Aucun service d'e-mail configuré. E-mail pour ${to} — ${subject}\n${text}`);
    return { sent: false, devMode: true };
  }
  try {
    if (provider === 'resend') {
      const { Resend } = await import('resend');
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to, subject, html, text });
      if (error) throw new Error(String(error.message || error));
    } else {
      const nodemailer = (await import('nodemailer')).default;
      const port = Number(process.env.SMTP_PORT || 465);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from, to, subject, html, text });
    }
    return { sent: true };
  } catch (e) {
    console.error(`[ONASKILL] envoi d'e-mail échoué (${provider}) :`, e && e.message);
    return { sent: false };
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function layout(title, intro, buttonLabel, url, footer) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color:#1f2937;">
      <p style="font-size:20px; font-weight:800; color:#0b1b36; margin:0 0 20px;"><span style="color:#d4a03a;">O</span>NASKILL</p>
      <h2 style="color:#0b1b36; margin:0 0 12px;">${title}</h2>
      <p>${intro}</p>
      <p style="margin: 28px 0;">
        <a href="${url}" style="background:#e5b85a; color:#0b1b36; padding:12px 24px; border-radius:999px; text-decoration:none; font-weight:700;">${buttonLabel}</a>
      </p>
      <p style="color:#6b7280; font-size:13px;">${footer}<br/><br/>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>${url}</p>
    </div>`;
}

export async function sendVerificationEmail({ to, nom, type, id, token, origin }) {
  if (!to) return { sent: false };
  const url = `${origin}/verify?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
  const label = type === 'company' ? 'votre fiche entreprise' : type === 'particulier' ? 'votre compte' : 'votre profil professionnel';
  return sendMail({
    to,
    subject: 'Confirmez votre compte ONASKILL',
    html: layout(`Bienvenue${nom ? ', ' + escapeHtml(nom) : ''} !`, `Merci de vous être inscrit. Confirmez votre adresse e-mail pour activer ${label}.`,
      'Confirmer mon adresse', url, 'Vous recevez cet e-mail car un compte ONASKILL a été créé avec cette adresse.'),
    text: `Bienvenue sur ONASKILL ! Confirmez votre adresse e-mail : ${url}`,
  });
}

// Password reset, or first password for a profile created before accounts existed.
export async function sendAccessLinkEmail({ to, url, claim }) {
  return sendMail({
    to,
    subject: claim ? 'Activez votre compte ONASKILL' : 'Réinitialisez votre mot de passe ONASKILL',
    html: layout(
      claim ? 'Activez votre compte' : 'Nouveau mot de passe',
      claim
        ? 'Un profil ONASKILL existe déjà avec cette adresse. Choisissez un mot de passe pour pouvoir le modifier.'
        : 'Vous avez demandé à changer votre mot de passe. Cliquez ci-dessous pour en choisir un nouveau.',
      'Choisir mon mot de passe', url,
      "Ce lien est valable 1 heure et ne peut servir qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.",
    ),
    text: `${claim ? 'Activez votre compte ONASKILL' : 'Réinitialisez votre mot de passe ONASKILL'} (lien valable 1 heure) : ${url}`,
  });
}

// Origin of the site as seen by the visitor (used to build the links in emails).
export function originOf(request) {
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  return `${proto}://${host}`;
}
