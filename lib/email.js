// HTML e-mails in the NEXUM look (dark background, pink → purple → blue accents).
// Table layout with inline styles, so Outlook, Gmail and Apple Mail render it alike;
// the gradient is an image (public/email/*), CSS gradients only as enhancement.

const SITE = () => (process.env.SITE_URL || "https://www.nexum-intelligence.com").replace(/\/$/, "");

export const esc = (s) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DAY_NAMES = {
  en: { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" },
  de: { mon: "Montag", tue: "Dienstag", wed: "Mittwoch", thu: "Donnerstag", fri: "Freitag" },
  es: { mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes" },
  fr: { mon: "Lundi", tue: "Mardi", wed: "Mercredi", thu: "Jeudi", fri: "Vendredi" },
};

const COPY = {
  en: {
    subject: "Your call request with NEXUM Intelligence",
    preheader: "Thank you — we will confirm a time within 24 business hours.",
    hello: (n) => `Hi ${n},`,
    intro: "thank you for your interest in NEXUM Intelligence. We have received your call request and will confirm a time that matches your availability within 24 business hours.",
    summary: "Your request", topic: "Topic", days: "Preferred days", slots: "Preferred times",
    next: "Until then, take a look at what our autonomous agents can do:",
    cta: "Explore the live demo",
    signoff: "Best regards,<br>The NEXUM Intelligence team",
    footer: "You receive this e-mail because you sent us a call request on nexum-intelligence.com. Just reply to reach us.",
    privacy: "Privacy policy",
  },
  de: {
    subject: "Deine Anfrage bei NEXUM Intelligence",
    preheader: "Danke – wir bestätigen dir innerhalb von 24 Stunden (werktags) einen Termin.",
    hello: (n) => `Hallo ${n},`,
    intro: "danke für dein Interesse an NEXUM Intelligence. Wir haben deine Gesprächsanfrage erhalten und bestätigen dir innerhalb von 24 Stunden (werktags) einen Termin, der zu deinen Wunschzeiten passt.",
    summary: "Deine Anfrage", topic: "Thema", days: "Wunschtage", slots: "Wunschzeiten",
    next: "Bis dahin: Sieh dir an, was unsere autonomen Agenten können.",
    cta: "Live-Demo ansehen",
    signoff: "Viele Grüße<br>Dein Team von NEXUM Intelligence",
    footer: "Du erhältst diese E-Mail, weil du auf nexum-intelligence.com eine Gesprächsanfrage gestellt hast. Antworte einfach auf diese Mail, um uns zu erreichen.",
    privacy: "Datenschutzerklärung",
  },
  es: {
    subject: "Tu solicitud de llamada con NEXUM Intelligence",
    preheader: "Gracias: confirmaremos una hora en un plazo de 24 horas laborables.",
    hello: (n) => `Hola ${n}:`,
    intro: "gracias por tu interés en NEXUM Intelligence. Hemos recibido tu solicitud de llamada y te confirmaremos una hora acorde a tu disponibilidad en un plazo de 24 horas laborables.",
    summary: "Tu solicitud", topic: "Tema", days: "Días preferidos", slots: "Horarios preferidos",
    next: "Mientras tanto, descubre lo que pueden hacer nuestros agentes autónomos:",
    cta: "Ver la demo en vivo",
    signoff: "Saludos cordiales,<br>El equipo de NEXUM Intelligence",
    footer: "Recibes este correo porque enviaste una solicitud de llamada en nexum-intelligence.com. Responde a este correo para contactarnos.",
    privacy: "Política de privacidad",
  },
  fr: {
    subject: "Votre demande d'appel auprès de NEXUM Intelligence",
    preheader: "Merci – nous confirmerons un créneau sous 24 heures ouvrées.",
    hello: (n) => `Bonjour ${n},`,
    intro: "merci de votre intérêt pour NEXUM Intelligence. Nous avons bien reçu votre demande d'appel et vous confirmerons un créneau correspondant à vos disponibilités sous 24 heures ouvrées.",
    summary: "Votre demande", topic: "Sujet", days: "Jours préférés", slots: "Horaires préférés",
    next: "En attendant, découvrez ce que nos agents autonomes savent faire :",
    cta: "Voir la démo en direct",
    signoff: "Cordialement,<br>L'équipe NEXUM Intelligence",
    footer: "Vous recevez cet e-mail car vous avez envoyé une demande d'appel sur nexum-intelligence.com. Répondez simplement pour nous joindre.",
    privacy: "Politique de confidentialité",
  },
};

const pickLang = (lang) => (COPY[lang] ? lang : "en");
export const dayNames = (days, lang = "en") => (days || []).map((d) => DAY_NAMES[pickLang(lang)][d] || d).join(", ");

const FONT = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

// The frame shared by both e-mails: logo bar, banner, gradient line, content, footer.
function frame({ preheader, content, footer = "" }) {
  const s = SITE();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>NEXUM Intelligence</title></head>
<body style="margin:0;padding:0;background:#05060b;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#05060b" style="background:#05060b;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0c16" style="width:100%;max-width:600px;background:#0b0c16;border:1px solid #23264a;border-radius:18px;overflow:hidden;">
    <tr><td align="left" style="padding:22px 28px;background:#05060b;">
      <a href="${s}" style="text-decoration:none;"><img src="${s}/email/logo.png" width="210" alt="NEXUM Intelligence" style="display:block;width:210px;height:auto;border:0;color:#ffffff;${FONT}font-size:18px;font-weight:700;"></a>
    </td></tr>
    <tr><td><img src="${s}/email/header.jpg" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>
    <tr><td><img src="${s}/email/line.png" width="600" height="3" alt="" style="display:block;width:100%;height:3px;border:0;"></td></tr>
    <tr><td style="padding:32px 28px 8px;${FONT}color:#e7e8f3;font-size:16px;line-height:1.6;">${content}</td></tr>
    <tr><td style="padding:20px 28px 28px;${FONT}color:#8b8fa8;font-size:12px;line-height:1.6;border-top:1px solid #1d1f3a;">
      ${footer}
      <p style="margin:10px 0 0;"><a href="${s}" style="color:#a5b4fc;text-decoration:none;">nexum-intelligence.com</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const row = (label, value) =>
  `<tr><td style="padding:8px 0;${FONT}color:#8b8fa8;font-size:13px;width:150px;vertical-align:top;">${esc(label)}</td><td style="padding:8px 0;${FONT}color:#ffffff;font-size:15px;font-weight:600;">${value}</td></tr>`;

const card = (title, rows) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#11132a" style="background:#11132a;border:1px solid #2a2d5c;border-radius:14px;margin:22px 0;">
  <tr><td style="padding:18px 20px;">
    <p style="margin:0 0 6px;${FONT}color:#c4b5fd;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${esc(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </td></tr>
</table>`;

const button = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px;"><tr>
  <td bgcolor="#7c3aed" style="border-radius:999px;background:#7c3aed;background-image:linear-gradient(90deg,#ff3cac,#7c3aed,#2563eb);">
    <a href="${href}" style="display:inline-block;padding:14px 28px;${FONT}color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">${esc(label)} &rarr;</a>
  </td></tr></table>`;

// Confirmation to the person who sent the contact form.
export function customerConfirmation({ name, topic, days, slots, timezone, lang }) {
  const l = pickLang(lang);
  const c = COPY[l];
  const s = SITE();
  const content = `
    <p style="margin:0 0 14px;">${esc(c.hello(name || ""))}</p>
    <p style="margin:0;">${esc(c.intro)}</p>
    ${card(c.summary, [
      topic ? row(c.topic, esc(topic)) : "",
      row(c.days, esc(dayNames(days, l))),
      row(c.slots, esc((slots || []).join(", ")) + (timezone ? `<br><span style="color:#8b8fa8;font-size:12px;font-weight:400;">${esc(timezone)}</span>` : "")),
    ].join(""))}
    <p style="margin:0 0 14px;">${esc(c.next)}</p>
    ${button(`${s}/use-case-demo`, c.cta)}
    <p style="margin:0 0 8px;">${c.signoff}</p>`;
  const footer = `<p style="margin:0;">${esc(c.footer)}</p><p style="margin:8px 0 0;"><a href="${s}/legal/privacy-policy" style="color:#a5b4fc;">${esc(c.privacy)}</a></p>`;
  return { subject: c.subject, html: frame({ preheader: c.preheader, content, footer }) };
}

// Notification to the NEXUM team (German).
export function salesNotification({ name, email, company, phone, topic, budget, days, slots, timezone, details, lang }) {
  const content = `
    <p style="margin:0 0 4px;${FONT}color:#c4b5fd;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Neue Gesprächsanfrage</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${esc(company || name)}</p>
    ${card("Kontakt", [
      row("Name", esc(name)),
      row("E-Mail", `<a href="mailto:${esc(email)}" style="color:#a5b4fc;">${esc(email)}</a>`),
      phone ? row("Telefon", esc(phone)) : "",
      row("Firma", esc(company || "–")),
    ].join(""))}
    ${card("Wunschtermin", [
      row("Tage", esc(dayNames(days, "de"))),
      row("Zeiten", esc((slots || []).join(", "))),
      row("Zeitzone", esc(timezone || "unbekannt")),
    ].join(""))}
    ${card("Projekt", [
      row("Thema", esc(topic || "–")),
      row("Budget", esc(budget || "–")),
      row("Details", esc(details || "–").replace(/\n/g, "<br>")),
    ].join(""))}
    <p style="margin:0 0 20px;color:#8b8fa8;font-size:13px;">Antworten geht direkt an den Kunden. Sprache der Website: ${esc(lang || "?")}</p>`;
  return {
    subject: `📞 Gesprächsanfrage: ${company || name}`,
    html: frame({ preheader: `${name} · ${dayNames(days, "de")} · ${(slots || []).join(", ")}`, content }),
  };
}
