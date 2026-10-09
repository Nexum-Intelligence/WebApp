// Legal texts (imprint, privacy policy, cookie notice). German is the binding version;
// all other site languages get the English translation.
// Keep in sync with what the site actually does: design/02-agent-data-flow.md, api/lead.js,
// src/fonts.css (self-hosted fonts), localStorage keys in src/App.jsx and src/i18n.jsx.

export const COMPANY = {
  name: "NEXUM Intelligence GbR",
  street: "Freistraße 49",
  city: "89191 Nellingen",
  country: "Deutschland",
  partners: "Melina Kühn, Luise Rimola",
  email: "nexumintelligence@outlook.com",
  phone: "+49 177 2144200",
  phoneHref: "+491772144200",
  members: [
    ["Melina Kühn", "Geitauer Straße 4, 81379 München"],
    ["Luise Rimola", "Freistraße 49, 89191 Nellingen"],
  ],
};

const MEMBERS = COMPANY.members.map(([n, a]) => `${n}, ${a}`);

const ADDRESS_DE = `${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}`;
const ADDRESS_EN = `${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, Germany`;
const UPDATED = { de: "Stand: Oktober 2026", en: "Last updated: October 2026" };

// A section is [heading, paragraphs]; a paragraph that is an array renders as a list.
export const LEGAL = {
  de: {
    imprint: {
      title: "Impressum",
      lede: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).",
      sections: [
        ["Anbieter", [`${COMPANY.name}`, `${COMPANY.street}`, `${COMPANY.city}`, COMPANY.country]],
        ["Gesellschafterinnen (vertretungsberechtigt)", [MEMBERS]],
        ["Kontakt", [`Telefon: ${COMPANY.phone}`, `E-Mail: ${COMPANY.email}`, "Kontaktformular: nexum-intelligence.com/contact"]],
        ["Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV", [MEMBERS]],
        ["Verbraucherstreitbeilegung", ["Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."]],
        ["Haftung für Inhalte", ["Wir erstellen die Inhalte dieser Website mit Sorgfalt. Für die Richtigkeit, Vollständigkeit und Aktualität können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Wir sind nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen; bei Bekanntwerden von Rechtsverletzungen entfernen wir entsprechende Inhalte umgehend."]],
        ["Haftung für Links", ["Unsere Website enthält Links zu Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir solche Links umgehend."]],
        ["Urheberrecht", ["Die Inhalte dieser Website (Texte, Grafiken, Videos, Logo) unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen unserer schriftlichen Zustimmung."]],
      ],
    },
    privacy: {
      title: "Datenschutzerklärung",
      lede: "Hier erfahren Sie, welche personenbezogenen Daten wir verarbeiten, wenn Sie unsere Website und unsere Plattform nutzen, wofür wir sie verwenden und welche Rechte Sie haben.",
      sections: [
        ["1. Verantwortlicher", [
          `${ADDRESS_DE}, vertreten durch die Gesellschafterinnen ${COMPANY.partners}. Telefon: ${COMPANY.phone}, E-Mail: ${COMPANY.email}.`,
          "Ein Datenschutzbeauftragter ist nicht benannt, da hierzu keine gesetzliche Pflicht besteht. Wenden Sie sich bei Fragen zum Datenschutz direkt an die oben genannte Adresse.",
        ]],
        ["2. Hosting und Server-Logfiles", [
          "Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf der Website verarbeitet Vercel automatisch technische Zugriffsdaten (Server-Logfiles):",
          ["IP-Adresse", "Datum und Uhrzeit des Zugriffs", "aufgerufene Seite bzw. Datei", "Referrer-URL", "Browsertyp und Betriebssystem"],
          "Diese Daten sind erforderlich, um die Website auszuliefern sowie Stabilität und Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen Betrieb). Mit Vercel besteht ein Auftragsverarbeitungsvertrag. Die Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der EU-Standardvertragsklauseln. Die Logfiles werden von Vercel nur kurzfristig gespeichert und anschließend gelöscht.",
        ]],
        ["3. Schriftarten, Videos und Bilder", [
          "Alle Schriftarten, Videos und Bilder werden direkt von unserem Server ausgeliefert. Beim Besuch der Website wird keine Verbindung zu Google Fonts, Videoplattformen oder anderen Drittanbietern hergestellt.",
        ]],
        ["4. Keine Analyse- oder Werbe-Tools", [
          "Wir setzen keine Analyse-, Tracking- oder Werbedienste ein und erstellen keine Nutzungsprofile. Welche Informationen technisch notwendig im Browser gespeichert werden, erklären wir in unseren Cookie-Hinweisen.",
        ]],
        ["5. Kontaktformular und Gesprächsanfrage", [
          "Wenn Sie über das Kontaktformular ein Gespräch anfragen, verarbeiten wir die von Ihnen angegebenen Daten: Name, E-Mail-Adresse, Firma, optional Telefonnummer, Thema, optional Budget und Projektbeschreibung, Ihre Wunschtage und Wunschzeiten sowie die Zeitzone Ihres Browsers und die gewählte Sprache.",
          "Zweck ist die Bearbeitung Ihrer Anfrage und die Vereinbarung eines Gesprächstermins. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen auf Ihre Anfrage) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).",
          "Ihre Anfrage wird in unserer Datenbank bei Supabase Inc. (970 Toa Payoh North #07-04, Singapur; Rechenzentrum in Irland, AWS eu-west-1) gespeichert. Zur Benachrichtigung unseres Teams und für Ihre Eingangsbestätigung versenden wir E-Mails über Resend, Inc. (2261 Market Street #5039, San Francisco, CA 94114, USA; Versandregion Irland). Die Benachrichtigung geht an unser E-Mail-Postfach bei Microsoft (Microsoft Ireland Operations Ltd., Dublin). Mit diesen Dienstleistern bestehen Auftragsverarbeitungsverträge; soweit Daten in Drittländer übermittelt werden können, erfolgt dies auf Grundlage der EU-Standardvertragsklauseln bzw. des EU-US Data Privacy Framework.",
          "Wir löschen Ihre Anfrage, wenn sie erledigt ist und spätestens sechs Monate nach dem letzten Kontakt, sofern daraus keine Geschäftsbeziehung entsteht. Entsteht ein Vertrag, gelten die gesetzlichen Aufbewahrungsfristen (bis zu zehn Jahre nach HGB und AO).",
        ]],
        ["6. Potenzialanalyse (Fragebogen)", [
          "Wenn Sie die Potenzialanalyse ausfüllen, verarbeiten wir Ihre Antworten, das berechnete Ergebnis und Ihre Kontaktdaten (Name, E-Mail, optional Firma, Telefon, Website, Branche und Zielsetzung), um Ihnen das Ergebnis zu zeigen und Sie auf Wunsch dazu zu beraten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO und – soweit Sie eingewilligt haben – Art. 6 Abs. 1 lit. a DSGVO. Speicherung, E-Mail-Versand und Löschung erfolgen wie unter Nr. 5 beschrieben.",
        ]],
        ["7. Kontakt per E-Mail", [
          "Schreiben Sie uns eine E-Mail, verarbeiten wir Ihre Adresse und den Inhalt Ihrer Nachricht zur Bearbeitung Ihres Anliegens (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Unser Postfach wird bei Microsoft betrieben.",
        ]],
        ["8. NEXUM-Plattform (Beta)", [
          "Die Plattform ist derzeit nur auf Einladung nutzbar. Für Nutzerinnen und Nutzer gilt ergänzend:",
          [
            "Benutzerkonto: E-Mail-Adresse, Passwort (verschlüsselt gespeichert) und Anmeldedaten werden über Supabase (Rechenzentrum Irland) verwaltet.",
            "Unternehmensdaten: Die von Ihnen eingegebenen Daten (z. B. Profil, Kennzahlen, Kunden-, Produkt- und Personaldaten) speichern wir in Supabase, um die Plattform-Funktionen bereitzustellen. Für die Suche erzeugen wir innerhalb von Supabase Textvektoren; dabei werden keine Daten an Dritte übermittelt.",
            "KI-Auswertung: Aufträge an die KI-Agenten werden mit Claude von Anthropic, PBC (548 Market Street, San Francisco, CA 94104, USA) bearbeitet. Dabei übermitteln wir nur die für den Auftrag nötigen Daten; E-Mail-Adressen, Telefonnummern, Bankverbindungen und Adressen werden vorher entfernt oder unkenntlich gemacht. Die Übermittlung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln.",
            "Zahlungen: Bei einem kostenpflichtigen Abo erfolgt die Zahlung über Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland. Ihre Zahlungsdaten gibt Stripe nicht an uns weiter.",
            "Änderungsprotokoll: Änderungen an Ihren Daten protokollieren wir, damit sie nachvollziehbar bleiben.",
          ],
          "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag über die Nutzung der Plattform). Wir speichern die Daten für die Dauer Ihres Kontos und löschen sie nach Kündigung, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.",
        ]],
        ["9. Ihre Rechte", [
          "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO).",
          "Widerspruchsrecht: Soweit wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen (Art. 21 DSGVO).",
          `Für alle Anliegen genügt eine E-Mail an ${COMPANY.email}.`,
          "Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der für uns zuständigen Behörde: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart.",
        ]],
        ["10. Pflicht zur Bereitstellung und automatisierte Entscheidungen", [
          "Sie sind nicht verpflichtet, uns Daten bereitzustellen. Ohne die Pflichtangaben im Formular können wir Ihre Anfrage jedoch nicht bearbeiten. Eine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO findet nicht statt.",
        ]],
        ["11. Änderungen", [`Wir passen diese Datenschutzerklärung an, wenn sich unsere Website oder die Rechtslage ändert. ${UPDATED.de}.`]],
      ],
    },
    cookie: {
      title: "Cookie-Hinweise",
      lede: "Diese Website verwendet keine Cookies für Analyse, Tracking oder Werbung. Deshalb gibt es auch kein Cookie-Banner.",
      sections: [
        ["1. Was wir im Browser speichern", [
          "Für einige Funktionen speichern wir kleine Einträge im lokalen Speicher Ihres Browsers (localStorage). Sie verlassen Ihr Gerät nicht und dienen nur dem, was Sie selbst ausgewählt haben:",
          [
            "nexum_lang – Ihre gewählte Sprache.",
            "nexum_perf – ob Animationen reduziert angezeigt werden (z. B. auf langsamen Geräten).",
            "sb-…-auth-token – Ihre Anmeldung an der Plattform, nur wenn Sie sich einloggen. Wird beim Abmelden gelöscht.",
            "nexum_user – nur in der lokalen Vorschau der Plattform ohne Server.",
          ],
        ]],
        ["2. Rechtsgrundlage", [
          "Diese Speicherungen sind unbedingt erforderlich, damit wir die von Ihnen ausdrücklich gewünschten Funktionen bereitstellen können (§ 25 Abs. 2 Nr. 2 TDDDG). Eine Einwilligung ist dafür nicht erforderlich. Eine Auswertung findet nicht statt.",
        ]],
        ["3. Dienste anderer Anbieter", [
          "Schließen Sie auf der Plattform ein kostenpflichtiges Abo ab, werden Sie zu Stripe weitergeleitet. Stripe setzt auf seinen eigenen Seiten Cookies, die für die sichere Zahlung erforderlich sind; Details finden Sie in der Datenschutzerklärung von Stripe.",
        ]],
        ["4. Speicher löschen", [
          "Sie können den lokalen Speicher jederzeit in den Einstellungen Ihres Browsers löschen (z. B. „Website-Daten löschen“). Danach gelten wieder die Standardeinstellungen.",
        ]],
        ["5. Kontakt", [`Fragen beantworten wir gern unter ${COMPANY.email}. Mehr zur Verarbeitung Ihrer Daten steht in unserer Datenschutzerklärung. ${UPDATED.de}.`]],
      ],
    },
  },
  en: {
    imprint: {
      title: "Imprint",
      lede: "Information pursuant to § 5 of the German Digital Services Act (DDG). The German version is legally binding.",
      sections: [
        ["Provider", [`${COMPANY.name}`, `${COMPANY.street}`, `${COMPANY.city}`, "Germany"]],
        ["Partners (authorised to represent)", [MEMBERS]],
        ["Contact", [`Phone: ${COMPANY.phone}`, `E-mail: ${COMPANY.email}`, "Contact form: nexum-intelligence.com/contact"]],
        ["Responsible for content (§ 18 (2) MStV)", [MEMBERS]],
        ["Consumer dispute resolution", ["We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board."]],
        ["Liability for content and links", ["We create the content of this website with care but cannot guarantee that it is correct, complete and up to date. We are not responsible for the content of external websites we link to; if we become aware of any infringement, we will remove the link immediately."]],
        ["Copyright", ["The content of this website (texts, graphics, videos, logo) is protected by German copyright law. Any use beyond the limits of copyright law requires our written consent."]],
      ],
    },
    privacy: {
      title: "Privacy policy",
      lede: "This policy explains which personal data we process when you use our website and platform, why we do so, and what rights you have. The German version is legally binding.",
      sections: [
        ["1. Controller", [
          `${ADDRESS_EN}, represented by the partners ${COMPANY.partners}. Phone: ${COMPANY.phone}, e-mail: ${COMPANY.email}.`,
          "We have not appointed a data protection officer as we are not legally required to. Please send any privacy questions to the address above.",
        ]],
        ["2. Hosting and server log files", [
          "This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you visit it, Vercel automatically processes technical access data (server log files):",
          ["IP address", "date and time of access", "page or file requested", "referrer URL", "browser type and operating system"],
          "This data is needed to deliver the website and keep it stable and secure. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in secure and reliable operation). We have a data processing agreement with Vercel; transfers to the USA are based on the EU-US Data Privacy Framework or the EU Standard Contractual Clauses. Vercel keeps log files only briefly.",
        ]],
        ["3. Fonts, videos and images", ["All fonts, videos and images are served from our own server. Visiting the website does not connect you to Google Fonts, video platforms or other third parties."]],
        ["4. No analytics or advertising tools", ["We do not use analytics, tracking or advertising services and do not create usage profiles. What is stored in your browser for technical reasons is explained in our cookie notice."]],
        ["5. Contact form and call requests", [
          "When you request a call via the contact form, we process the data you enter: name, e-mail address, company, optionally phone number, topic, optionally budget and project details, your preferred days and times, and your browser's time zone and selected language.",
          "We use it to handle your request and arrange a call. The legal basis is Art. 6(1)(b) GDPR (steps prior to a contract at your request) and Art. 6(1)(f) GDPR (legitimate interest in answering enquiries).",
          "Your request is stored in our database at Supabase Inc. (970 Toa Payoh North #07-04, Singapore; data centre in Ireland, AWS eu-west-1). Notification e-mails to our team and your confirmation are sent via Resend, Inc. (2261 Market Street #5039, San Francisco, CA 94114, USA; sending region Ireland) to our mailbox at Microsoft (Microsoft Ireland Operations Ltd., Dublin). We have data processing agreements with these providers; any transfer to third countries is based on the EU Standard Contractual Clauses or the EU-US Data Privacy Framework.",
          "We delete your request once it has been dealt with and no later than six months after our last contact, unless a business relationship results. If a contract is concluded, statutory retention periods apply (up to ten years under German commercial and tax law).",
        ]],
        ["6. Potential analysis (questionnaire)", ["If you complete the potential analysis, we process your answers, the calculated result and your contact details (name, e-mail, optionally company, phone, website, industry and goal) to show you the result and, if you wish, advise you on it. The legal basis is Art. 6(1)(b) GDPR and, where you have given consent, Art. 6(1)(a) GDPR. Storage, e-mails and deletion work as described in section 5."]],
        ["7. Contact by e-mail", ["If you e-mail us, we process your address and message to deal with your request (Art. 6(1)(b) or (f) GDPR). Our mailbox is operated by Microsoft."]],
        ["8. NEXUM platform (beta)", [
          "The platform is currently available by invitation only. For its users, the following also applies:",
          [
            "Account: your e-mail address, password (stored encrypted) and sign-in data are managed via Supabase (data centre in Ireland).",
            "Company data: the data you enter (e.g. profile, KPIs, customer, product and staff data) is stored in Supabase to provide the platform's features. For search we create text vectors within Supabase; no data is passed to third parties for this.",
            "AI processing: tasks for the AI agents are processed with Claude by Anthropic, PBC (548 Market Street, San Francisco, CA 94104, USA). We only transfer the data needed for the task; e-mail addresses, phone numbers, bank details and addresses are removed or masked beforehand. Transfers to the USA are based on the EU Standard Contractual Clauses.",
            "Payments: paid subscriptions are processed by Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin 2, Ireland. Stripe does not share your payment details with us.",
            "Change history: changes to your data are logged so that they remain traceable.",
          ],
          "The legal basis is Art. 6(1)(b) GDPR (contract for the use of the platform). We keep the data for as long as your account exists and delete it after termination unless statutory retention obligations apply.",
        ]],
        ["9. Your rights", [
          "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18) and data portability (Art. 20). You can withdraw any consent at any time with effect for the future (Art. 7(3) GDPR).",
          "Right to object: where we process data on the basis of Art. 6(1)(f) GDPR, you may object at any time on grounds relating to your particular situation (Art. 21 GDPR).",
          `An e-mail to ${COMPANY.email} is all it takes.`,
          "You can also lodge a complaint with a data protection supervisory authority, for example the authority responsible for us: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart, Germany.",
        ]],
        ["10. Obligation to provide data and automated decisions", ["You are not obliged to provide data, but without the required form fields we cannot handle your request. We do not use automated decision-making, including profiling, within the meaning of Art. 22 GDPR."]],
        ["11. Changes", [`We update this policy when our website or the law changes. ${UPDATED.en}.`]],
      ],
    },
    cookie: {
      title: "Cookie notice",
      lede: "This website does not use cookies for analytics, tracking or advertising — which is why there is no cookie banner. The German version is legally binding.",
      sections: [
        ["1. What we store in your browser", [
          "For some features we store small entries in your browser's local storage (localStorage). They never leave your device and only serve what you chose yourself:",
          [
            "nexum_lang – your selected language.",
            "nexum_perf – whether animations are reduced (e.g. on slower devices).",
            "sb-…-auth-token – your platform sign-in, only if you sign in. Removed when you sign out.",
            "nexum_user – only in the local platform preview without a server.",
          ],
        ]],
        ["2. Legal basis", ["These entries are strictly necessary to provide the features you have explicitly requested (§ 25(2) no. 2 TDDDG). No consent is required, and nothing is analysed."]],
        ["3. Third-party services", ["If you take out a paid subscription on the platform, you are redirected to Stripe. Stripe sets cookies on its own pages that are required for secure payment; see Stripe's privacy policy for details."]],
        ["4. Clearing storage", ["You can clear local storage at any time in your browser settings (e.g. \"clear site data\"). The default settings then apply again."]],
        ["5. Contact", [`Questions? Write to ${COMPANY.email}. More on how we process your data is in our privacy policy. ${UPDATED.en}.`]],
      ],
    },
  },
};

export const legalText = (type, lang) => (LEGAL[lang] || LEGAL.en)[type];
