// Writes the e-mail templates as HTML files for a visual check:
//   node scripts/email-preview.mjs [outDir]
// Images are loaded from SITE_URL (default: the live site); for a local preview
// before deploying, run with SITE_URL pointing at a dev server that serves /email/*.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { customerConfirmation, salesNotification } from "../lib/email.js";

const out = process.argv[2] || "email-preview";
mkdirSync(out, { recursive: true });
const sample = { name: "Lena Berger", email: "lena@example.com", company: "Café Nord GmbH", phone: "+49 40 123456",
  topic: "AI automation project", budget: "€10.000 – €25.000", days: ["tue", "thu"], slots: ["10:00–12:00", "14:00–16:00"],
  timezone: "Europe/Berlin", details: "We want to automate our order intake.\nAround 300 orders per week.", lang: "de" };
for (const lang of ["de", "en"]) writeFileSync(path.join(out, `customer-${lang}.html`), customerConfirmation({ ...sample, lang }).html);
writeFileSync(path.join(out, "team.html"), salesNotification(sample).html);
console.log(`written to ${out}/`);
