// In-browser demo backend for /use-case-demo: answers every /api/* call of the
// real platform UI from fictional, in-memory data (a café in Hamburg). Nothing
// leaves the browser, nothing is saved; agent runs and chat replies are simulated.

import { monthlySeries } from "./finance.js";

export const DEMO_USER = { email: "demo@nexum-intelligence.com", name: "Lena Demo", company: "Café Nord", industry: "gastro", demo: true };

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `d-${Math.random().toString(36).slice(2)}-${Date.now()}`);
const iso = (d) => d.toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const day = (d) => iso(d).slice(0, 10);

function seed() {
  const recs = [];
  const add = (kind, data, ageDays = 0) => { const r = { id: uid(), kind, data, created_at: iso(daysAgo(ageDays)), updated_at: iso(daysAgo(ageDays)) }; recs.push(r); return r; };

  const beans = add("inventory", { name: "Kaffeebohnen Espresso", unit: "g", unitCost: 0.024, stock: 4200, reorder: 3000, supplier: "Rösterei Elbe" }, 60);
  const milk = add("inventory", { name: "Hafermilch", unit: "ml", unitCost: 0.0021, stock: 18000, reorder: 8000, supplier: "Bio-Großhandel Nord" }, 60);
  const flour = add("inventory", { name: "Dinkelmehl", unit: "g", unitCost: 0.0018, stock: 2500, reorder: 5000, supplier: "Mühle Holstein" }, 60);
  add("inventory", { name: "To-go-Becher", unit: "pcs", unitCost: 0.11, stock: 900, reorder: 500, supplier: "Pack & Go" }, 60);

  add("products", { name: "Flat White", category: "Coffee", price: 4.2, status: "Active", recipe: [{ itemId: beans.id, qty: 18 }, { itemId: milk.id, qty: 150 }] }, 55);
  add("products", { name: "Espresso", category: "Coffee", price: 2.6, status: "Active", recipe: [{ itemId: beans.id, qty: 9 }] }, 55);
  add("products", { name: "Hafer-Cappuccino", category: "Coffee", price: 4.0, status: "Active", recipe: [{ itemId: beans.id, qty: 18 }, { itemId: milk.id, qty: 120 }] }, 55);
  add("products", { name: "Dinkel-Zimtschnecke", category: "Bakery", price: 3.8, status: "Active", recipe: [{ itemId: flour.id, qty: 90 }] }, 55);

  [["Rösterei Elbe", "Kaffeebohnen", "Preferred", 3], ["Bio-Großhandel Nord", "Milch & Alternativen", "Active", 2], ["Mühle Holstein", "Mehl", "Active", 5], ["Pack & Go", "Verpackung", "Active", 7]]
    .forEach(([name, category, status, leadTime]) => add("suppliers", { name, category, status, leadTime }, 70));

  [["Hotel Elbblick", "Customer", 2400, "Catering monthly"], ["Agentur Kontor", "Customer", 1800, "Office coffee"], ["Coworking Ottensen", "Opportunity", 3600, "Coffee subscription"], ["Familie Jansen", "Customer", 120, "Regular guest"], ["Yogastudio Prana", "Lead", 900, "Event catering"]]
    .forEach(([name, stage, value, notes]) => add("customers", { name, stage, value, notes, email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@example.com` }, 40));

  [["Mara Schulz", "Barista", 2400, "Active"], ["Tim Becker", "Barista", 1900, "Active"], ["Aylin Kaya", "Service (Minijob)", 538, "Active"]]
    .forEach(([name, role, salary, status]) => add("staff", { name, role, salary, status }, 90));

  [["Instagram Herbst-Specials", "Instagram", "Active", 380, 46], ["Google Maps Bewertungen", "Local SEO", "Active", 0, 21], ["Coworking-Abo Flyer", "Print", "Completed", 120, 9]]
    .forEach(([name, channel, status, budget, leads]) => add("campaigns", { name, channel, status, budget, leads }, 30));

  // six months of bookings with a growth trend
  for (let m = 5; m >= 0; m--) {
    const base = new Date(); base.setUTCDate(1); base.setUTCMonth(base.getUTCMonth() - m);
    const rev = 14800 + (5 - m) * 1150 + (m % 2) * 600;
    add("transactions", { type: "Income", category: "Sales", amount: rev, date: day(new Date(base.getTime() + 25 * 864e5 > Date.now() ? Date.now() - 864e5 : base.getTime() + 25 * 864e5)), description: "POS Umsatz Monat" }, m * 30);
    add("transactions", { type: "Expense", category: "Rent", amount: 3200, date: day(new Date(base.getTime() + 2 * 864e5)), description: "Miete Ottensen" }, m * 30);
    add("transactions", { type: "Expense", category: "Utilities", amount: 640 + (m % 3) * 40, date: day(new Date(base.getTime() + 5 * 864e5)), description: "Strom & Wasser" }, m * 30);
    add("transactions", { type: "Expense", category: "Purchasing", amount: 3900 + (5 - m) * 200, date: day(new Date(base.getTime() + 8 * 864e5)), description: "Wareneinkauf" }, m * 30);
    add("sales", { productName: "Monatsumsatz (gesamt)", qty: 1, revenue: rev, cost: Math.round(rev * 0.27), profit: Math.round(rev * 0.73), date: iso(new Date(base.getTime() + 25 * 864e5 > Date.now() ? Date.now() - 864e5 : base.getTime() + 25 * 864e5)) }, m * 30);
  }

  add("purchases", { supplier: "Mühle Holstein", itemId: flour.id, itemName: "Dinkelmehl", qty: 10000, unitCost: 0.0017, status: "Ordered", expected: day(daysAgo(-3)) }, 2);

  [["Dinkelmehl nachbestellen — reicht nur noch ~2 Tage", "high"], ["Coworking Ottensen: Abo-Angebot nachfassen (3.600 €)", "high"], ["5 neue Google-Bewertungen beantworten", "medium"]]
    .forEach(([title, priority]) => add("tasks", { title, priority, done: false, source: "Daily Tasks" }, 0));
  add("tasks", { title: "Herbstkarte fotografieren", priority: "medium", done: true, source: "manual" }, 3);

  add("notifications", { severity: "warning", title: "Dinkelmehl unter Meldebestand", message: "2.500 g auf Lager, Meldebestand 5.000 g. Bestellung ist unterwegs (ETA 3 Tage) — Zimtschnecken ggf. limitieren.", impact: "Risiko ~380 € Umsatz", link: "collection:inventory", read: false }, 0);
  add("notifications", { severity: "recommendation", title: "Hafer-Aufpreis prüfen", message: "Hafermilch-Getränke machen 41 % des Kaffeeumsatzes aus. 0,30 € Aufpreis entspricht dem Marktniveau in Ottensen.", impact: "+520 €/Monat", link: "module:decision-recommendation", read: false }, 1);
  add("notifications", { severity: "info", title: "Umsatz +7 % zum Vormonat", message: "Stärkster Tag: Samstag. Frühstücksgeschäft wächst am schnellsten.", link: "finance", read: true }, 4);

  const profile = {
    basics: { companyName: "Café Nord", industry: "gastro", stage: "Growing", size: "3 employees", location: "Hamburg-Ottensen", website: "cafe-nord.example", description: "Specialty-Café mit eigener Röstpartnerschaft, Frühstück und hausgemachtem Gebäck." },
    product: { valueProp: "Third-Wave-Kaffee aus Hamburger Röstung, vegan freundlich, Gebäck aus der eigenen Backstube", usp: "Exklusive Röstpartnerschaft mit Rösterei Elbe" },
    customers: { targetCustomer: "Kreative und Familien im Viertel, Coworker, Firmen-Catering", segments: "Laufkundschaft, Stammgäste, B2B-Catering" },
    goals: { goals12m: "Zweiter Standort 2027, Catering auf 20 % Umsatzanteil", biggestChallenge: "Personal am Wochenende" },
  };

  const now = Date.now();
  const runs = [
    { id: uid(), module_key: "swot-analysis", module_name: "SWOT Analysis", suite_key: "strategy", status: "done", created_at: iso(new Date(now - 6 * 864e5)), updated_at: iso(new Date(now - 6 * 864e5)), finished_at: iso(new Date(now - 6 * 864e5)),
      summary: "Starke Marke und Röstpartnerschaft; größter Hebel ist B2B-Catering, größtes Risiko das Wochenend-Personal.",
      result: { markdown: SWOT_MD, format: "md" } },
    { id: uid(), module_key: "go-to-market", module_name: "Go-to-Market Plan", suite_key: "venture", status: "needs_input", created_at: iso(new Date(now - 864e5)), updated_at: iso(new Date(now - 864e5)),
      questions: [{ key: "budget", label: "Welches Monatsbudget steht für das Catering-Marketing zur Verfügung?", type: "text" }, { key: "capacity", label: "Wie viele Catering-Aufträge pro Woche schafft das Team zusätzlich?", type: "select", options: ["1–2", "3–5", "mehr als 5"] }] },
    { id: uid(), module_key: "daily-tasks", module_name: "Daily Tasks", suite_key: "intelligence", status: "done", created_at: iso(new Date(now - 3 * 3600e3)), updated_at: iso(new Date(now - 3 * 3600e3)), finished_at: iso(new Date(now - 3 * 3600e3)),
      summary: "3 Aufgaben mit dem größten Hebel für heute.", result: { markdown: "## Warum diese Aufgaben\n\n- **Dinkelmehl** reicht bei aktuellem Absatz ~2 Tage.\n- **Coworking Ottensen** ist das größte offene Angebot (3.600 €).\n- **Bewertungen** heben die Sichtbarkeit in Google Maps.", format: "md" } },
  ];
  return { recs, profile, runs, messages: [], audit: [] };
}

const SWOT_MD = `## SWOT – Café Nord, Hamburg-Ottensen

Café Nord wächst seit sechs Monaten stetig (Umsatz +38 %). Die Marke lebt von der Röstpartnerschaft und dem Gebäck; das Wochenende ist der Engpass.

| Stärken | Schwächen |
|---|---|
| Exklusive Röstung mit **Rösterei Elbe** | Personal am Wochenende knapp |
| Gebäck aus eigener Backstube, Marge 81 % | Abhängig von einem Standort |
| 4,7 ★ bei Google (312 Bewertungen) | Kaum Online-Vorbestellung |

| Chancen | Risiken |
|---|---|
| B2B-Catering & Coworking-Abos (+3.600 € Pipeline) | Neue Ketten-Filiale 400 m entfernt |
| Hafer-Aufpreis (+520 €/Monat) | Bohnenpreise +12 % im Jahr |

### Strategische Implikationen
1. Catering als zweites Standbein ausbauen — Ziel 20 % Umsatzanteil.
2. Wochenend-Schichten mit Minijob-Pool absichern.
3. Hafer-Aufpreis von 0,30 € einführen.

### Next steps
- [ ] Angebot an Coworking Ottensen bis Freitag
- [ ] Zwei Minijobber für Samstag rekrutieren
- [ ] Preisaushang Hafer anpassen`;

function resultFor(name) {
  return `## ${name} – Café Nord\n\n*Demo-Ergebnis: In Ihrem Konto erstellt der Agent dieses Deliverable aus Ihren echten Daten, Ihrem Profil und einer Web-Recherche.*\n\n### Kernaussagen\n- Umsatz der letzten 6 Monate +38 %, Rohertragsmarge 73 %.\n- Größter Hebel: B2B-Catering und Coworking-Abos (offene Pipeline 3.600 €).\n- Engpass: Personal am Wochenende.\n\n| Maßnahme | Wirkung | Aufwand |\n|---|---|---|\n| Catering-Paket für Büros | +2.000 €/Monat | mittel |\n| Hafer-Aufpreis 0,30 € | +520 €/Monat | gering |\n| Minijob-Pool Samstag | +900 €/Monat | mittel |\n\n### Next steps\n- [ ] Catering-Angebot erstellen\n- [ ] Preisaushang anpassen\n- [ ] Stellenanzeige Minijob veröffentlichen`;
}

function contextData(s) {
  const by = (k) => s.recs.filter((r) => r.kind === k).map((r) => r.data);
  const tx = by("transactions"), sales = by("sales"), staff = by("staff"), customers = by("customers"), tasks = by("tasks");
  const sum = (a, f) => a.reduce((x, r) => x + (Number(f(r)) || 0), 0);
  const income = sum(tx.filter((t) => t.type === "Income"), (t) => t.amount);
  const expenses = sum(tx.filter((t) => t.type === "Expense" && t.category !== "Purchasing"), (t) => t.amount) + sum(staff.filter((x) => x.status === "Active"), (x) => x.salary);
  const cogs = sum(sales, (x) => x.cost);
  return {
    email: DEMO_USER.email,
    company: { name: "Café Nord", industry: "gastro" },
    finance: { revenue: income, expenses, costOfGoods: cogs, profit: income - expenses - cogs },
    customers: { contacts: customers.length, customers: customers.filter((c) => c.stage === "Customer").length, pipeline: sum(customers, (c) => c.value) },
    tasks: { open: tasks.filter((t) => !t.done).length },
    monthly: monthlySeries(s.recs),
  };
}

function chatReply(text, s) {
  const t = text.toLowerCase();
  const d = contextData(s);
  const eur = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  if (/umsatz|revenue|gewinn|profit/.test(t)) return `Ihr gebuchter Umsatz liegt bei **${eur(d.finance.revenue)}**, der Gewinn bei **${eur(d.finance.profit)}**. Diesen Monat: ${eur(d.monthly.at(-1).revenue)} Umsatz.`;
  if (/liefer|supplier/.test(t)) return "Ihr wichtigster Lieferant ist **Rösterei Elbe** (Preferred, Lieferzeit 3 Tage). Offen ist eine Bestellung bei **Mühle Holstein** (Dinkelmehl, ETA 3 Tage).";
  if (/lager|stock|inventory|bestand/.test(t)) return "Kritisch ist **Dinkelmehl**: 2.500 g auf Lager bei 5.000 g Meldebestand. Alle anderen Artikel liegen über dem Meldebestand.";
  if (/kunde|customer|pipeline/.test(t)) return `Sie haben ${d.customers.contacts} Kontakte, davon ${d.customers.customers} Kunden. Offene Pipeline: **${eur(d.customers.pipeline)}** — größtes Potenzial: Coworking Ottensen.`;
  return "Das ist die Demo — in Ihrem Konto beantworte ich Fragen aus Ihren echten Daten, Ihrem Profil und früheren Ergebnissen. Fragen Sie mich z. B. nach Umsatz, Lager, Lieferanten oder Kunden.";
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function makeHandler(s) {
  const log = (table_name, op, kind, changed) => s.audit.unshift({ id: uid(), at: iso(new Date()), actor: DEMO_USER.email, table_name, op, kind, changed });
  const later = (ms, fn) => setTimeout(fn, ms);
  const finishRun = (run) => {
    later(2500, () => { if (run.status === "queued") { run.status = "running"; run.started_at = iso(new Date()); run.updated_at = run.started_at; } });
    later(8000, () => {
      if (run.status !== "running") return;
      Object.assign(run, { status: "done", finished_at: iso(new Date()), updated_at: iso(new Date()), summary: `Demo: ${run.module_name} für Café Nord erstellt.`, result: { markdown: resultFor(run.module_name || run.module_key), format: "md" }, questions: null });
      if (run.module_key !== "daily-tasks") s.recs.unshift({ id: uid(), kind: "artifacts", data: { module_key: run.module_key, title: run.module_name, format: "md", run_id: run.id }, created_at: iso(new Date()) });
      s.recs.unshift({ id: uid(), kind: "notifications", data: { severity: "recommendation", title: `${run.module_name} ist fertig`, message: "Neue Empfehlungen aus Ihrem Agenten-Lauf.", link: `module:${run.module_key}`, read: false }, created_at: iso(new Date()) });
      s.recs.unshift({ id: uid(), kind: "tasks", data: { title: `Nächster Schritt aus ${run.module_name} umsetzen`, priority: "medium", done: false, source: run.module_name }, created_at: iso(new Date()) });
      log("module_runs", "update", run.module_key, { status: "done" });
    });
  };

  return async (url, init = {}) => {
    const u = new URL(url, window.location.origin);
    const path = u.pathname.replace(/^\/api\//, "");
    const method = (init.method || "GET").toUpperCase();
    let body = {};
    try { body = init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    const q = Object.fromEntries(u.searchParams);

    if (path === "records") {
      if (method === "GET") return json(200, { records: s.recs.filter((r) => r.kind === q.kind) });
      if (method === "POST" && Array.isArray(body.items)) {
        for (const data of body.items) s.recs.unshift({ id: uid(), kind: body.kind, data, created_at: iso(new Date()) });
        log("company_records", "insert", body.kind, { rows: body.items.length });
        return json(200, { ok: true, count: body.items.length });
      }
      if (method === "POST") { const r = { id: uid(), kind: body.kind, data: body.data || {}, created_at: iso(new Date()) }; s.recs.unshift(r); log("company_records", "insert", body.kind, body.data); return json(200, { ok: true, record: r }); }
      if (method === "PATCH") { const r = s.recs.find((x) => x.id === body.id); if (!r) return json(404, { ok: false, error: "Not found" }); r.data = body.data; r.updated_at = iso(new Date()); log("company_records", "update", r.kind, {}); return json(200, { ok: true, record: r }); }
      if (method === "DELETE") { const i = s.recs.findIndex((x) => x.id === q.id); if (i >= 0) { log("company_records", "delete", s.recs[i].kind, s.recs[i].data); s.recs.splice(i, 1); } return json(200, { ok: true }); }
    }
    if (path === "company") {
      if (method === "GET") return json(200, { data: s.profile });
      s.profile = { ...s.profile, ...(body.data || {}) }; log("company_profiles", "update", null, {});
      return json(200, { ok: true, data: s.profile });
    }
    if (path === "context") return json(200, { context: "", data: contextData(s) });
    if (path === "billing") return method === "GET" ? json(200, { package_key: "enterprise-plus", status: "beta", billing: false }) : json(409, { ok: false, error: "Checkout is not available in the demo." });
    if (path === "audit") return json(200, { entries: s.audit.slice(0, 60) });
    if (path === "module-run") {
      if (method === "GET") return json(200, { runs: [...s.runs].sort((a, b) => b.created_at.localeCompare(a.created_at)) });
      if (method === "POST") {
        const run = { id: uid(), module_key: body.moduleKey, module_name: body.moduleName, suite_key: body.suiteKey, status: "queued", created_at: iso(new Date()), updated_at: iso(new Date()) };
        s.runs.unshift(run); log("module_runs", "insert", run.module_key, { status: "queued" }); finishRun(run);
        return json(200, { ok: true, run });
      }
      if (method === "PATCH") {
        const run = s.runs.find((r) => r.id === body.id);
        if (!run) return json(404, { ok: false, error: "Run not found" });
        if (body.answers) { if (run.status !== "needs_input") return json(409, { ok: false, error: "This run is not waiting for answers" }); run.status = "queued"; run.updated_at = iso(new Date()); finishRun(run); return json(200, { ok: true, run }); }
        run.result = { markdown: body.result, format: "md", edited: true }; run.updated_at = iso(new Date());
        return json(200, { ok: true, run });
      }
    }
    if (path === "agent-chat") {
      if (method === "GET") return json(200, { messages: s.messages, pending: s.messages.some((m) => m.status === "pending") });
      const m = { id: uid(), role: "user", content: body.message, status: "pending", created_at: iso(new Date()) };
      s.messages.push(m);
      later(2200, () => { m.status = "answered"; s.messages.push({ id: uid(), role: "assistant", content: chatReply(m.content, s), reply_to: m.id, created_at: iso(new Date()) }); });
      return json(200, { ok: true, message: m });
    }
    if (path === "ops") {
      if (body.action === "sale") {
        const p = s.recs.find((r) => r.id === body.productId); const qty = Number(body.qty) || 0;
        if (!p || qty <= 0) return json(400, { ok: false, error: "Choose a product and a quantity" });
        let unitCost = 0; const lowStock = [];
        for (const line of p.data.recipe || []) {
          const it = s.recs.find((r) => r.id === line.itemId); if (!it) continue;
          unitCost += (Number(line.qty) || 0) * (Number(it.data.unitCost) || 0);
          it.data = { ...it.data, stock: (Number(it.data.stock) || 0) - (Number(line.qty) || 0) * qty };
          if (it.data.stock <= (Number(it.data.reorder) || 0)) lowStock.push({ id: it.id, name: it.data.name, stock: it.data.stock });
        }
        const revenue = Math.round(p.data.price * qty * 100) / 100, cost = Math.round(unitCost * qty * 100) / 100;
        const sale = { id: uid(), kind: "sales", created_at: iso(new Date()), data: { productId: p.id, productName: p.data.name, qty, unitPrice: p.data.price, unitCost, revenue, cost, profit: Math.round((revenue - cost) * 100) / 100, date: iso(new Date()) } };
        s.recs.unshift(sale);
        s.recs.unshift({ id: uid(), kind: "transactions", created_at: iso(new Date()), data: { type: "Income", category: "Sales", amount: revenue, date: day(new Date()), description: `${qty}× ${p.data.name}` } });
        log("company_records", "insert", "sales", sale.data);
        return json(200, { ok: true, sale, lowStock });
      }
      if (body.action === "receive") {
        const po = s.recs.find((r) => r.id === body.purchaseId);
        if (!po) return json(404, { ok: false, error: "Purchase not found" });
        if (po.data.status === "Received") return json(409, { ok: false, error: "Already received" });
        po.data = { ...po.data, status: "Received" };
        const it = s.recs.find((r) => r.id === po.data.itemId);
        if (it) it.data = { ...it.data, stock: (Number(it.data.stock) || 0) + (Number(po.data.qty) || 0) };
        s.recs.unshift({ id: uid(), kind: "transactions", created_at: iso(new Date()), data: { type: "Expense", category: "Purchasing", amount: Math.round(po.data.qty * po.data.unitCost * 100) / 100, date: day(new Date()), description: `${po.data.qty}× ${po.data.itemName}` } });
        return json(200, { ok: true, purchase: po, inventory: it || null });
      }
    }
    if (path === "connector-sync") return json(409, { ok: false, error: "Connectors are not available in the demo — create an account to connect your data." });
    return json(404, { ok: false, error: "Not available in the demo" });
  };
}

// Route /api/* to the demo backend while the demo is mounted. Returns an uninstall
// function. Removal is deferred a tick so a StrictMode remount (cleanup → effects
// again) never sends a request to the real API; the demo data lives for the page load.
let state = null, handle = null, prev = null, removeTimer = 0;
export function installDemoApi() {
  clearTimeout(removeTimer);
  if (!state) { state = seed(); handle = makeHandler(state); }
  if (!prev) {
    prev = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      if (url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`)) return handle(url, init);
      return prev(input, init);
    };
  }
  return () => {
    clearTimeout(removeTimer);
    removeTimer = setTimeout(() => { if (prev) { window.fetch = prev; prev = null; } }, 0);
  };
}
