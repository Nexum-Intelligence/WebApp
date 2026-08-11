// Builds a structured business context for a tenant (by email) from Supabase.
// Returns { data, text }:
//   data — structured JSON (profile + computed KPIs) for programmatic use
//   text — a formatted context block ready to inject into an agent prompt (GYB-style)
//
// Used by /api/context (for n8n to fetch) and /api/module-run (injected into each run).
// Degrades to an empty context when Supabase env vars are missing.

export async function buildContext(email) {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const empty = { data: { email }, text: "" };
  if (!URL || !KEY || !email) return empty;

  const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  let profile = {};
  let records = [];
  try {
    const pr = await fetch(`${URL}/rest/v1/company_profiles?email=eq.${encodeURIComponent(email)}&select=data&limit=1`, { headers: h });
    const prj = pr.ok ? await pr.json() : [];
    profile = (prj[0] && prj[0].data) || {};
  } catch (e) {}
  try {
    const rr = await fetch(`${URL}/rest/v1/company_records?email=eq.${encodeURIComponent(email)}&select=kind,data`, { headers: h });
    records = rr.ok ? await rr.json() : [];
  } catch (e) {}

  const by = (k) => records.filter((r) => r.kind === k).map((r) => r.data || {});
  const num = (v) => Number(v) || 0;
  const sum = (arr, f) => arr.reduce((a, x) => a + num(f(x)), 0);
  const eur = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num(n));

  const flat = Object.assign({}, ...Object.values(profile || {}));
  const customers = by("customers"), products = by("products"), inventory = by("inventory"),
    suppliers = by("suppliers"), purchases = by("purchases"), sales = by("sales"),
    tx = by("transactions"), invoices = by("invoices"), staff = by("staff"),
    campaigns = by("campaigns"), tasks = by("tasks");

  const income = sum(tx.filter((t) => t.type === "Income"), (t) => t.amount);
  const txExpense = sum(tx.filter((t) => t.type === "Expense"), (t) => t.amount);
  const staffCost = sum(staff.filter((s) => s.status === "Active"), (s) => s.salary);
  const cogs = sum(sales, (s) => s.cost);
  const expenses = txExpense + staffCost;
  const profit = income - expenses - cogs;
  const pipeline = sum(customers, (c) => c.value);
  const stockValue = sum(inventory, (i) => num(i.unitCost) * num(i.stock));
  const lowStock = inventory.filter((i) => i.reorder && num(i.stock) <= num(i.reorder)).length;
  const invoiced = sum(invoices, (i) => i.total);
  const paid = sum(invoices.filter((i) => i.status === "Paid"), (i) => i.total);
  const purchaseSpend = sum(purchases, (p) => num(p.qty) * num(p.unitCost));
  const openTasks = tasks.filter((t) => !t.done).length;
  const avgMargin = products.length ? Math.round(products.reduce((a, p) => { const pr = num(p.price); return a + (pr > 0 ? ((pr - num(p.cost)) / pr) * 100 : 0); }, 0) / products.length) : 0;

  const data = {
    email,
    company: { name: flat.companyName || "", industry: flat.industry || "", stage: flat.stage || "", size: flat.size || "", location: flat.location || "", website: flat.website || "", description: flat.description || "" },
    strategy: { valueProp: flat.valueProp || "", usp: flat.usp || "", targetCustomer: flat.targetCustomer || "", segments: flat.segments || "", marketRegion: flat.marketRegion || "", competitors: flat.competitors || "", positioning: flat.positioning || "", brandValues: flat.brandValues || "", vision: flat.vision || "", goals12m: flat.goals12m || "", biggestChallenge: flat.biggestChallenge || "", priorities: flat.priorities || "", fundingStatus: flat.fundingStatus || "", financialGoals: flat.financialGoals || "" },
    finance: { revenue: income, expenses, costOfGoods: cogs, profit, staffCost },
    customers: { contacts: customers.length, customers: customers.filter((c) => c.stage === "Customer").length, pipeline },
    products: { count: products.length, active: products.filter((p) => p.status === "Active").length, avgMarginPct: avgMargin },
    inventory: { items: inventory.length, lowStock, stockValue },
    suppliers: { count: suppliers.length, preferred: suppliers.filter((s) => s.status === "Preferred").length },
    purchasing: { open: purchases.filter((p) => p.status === "Ordered" || p.status === "Draft").length, received: purchases.filter((p) => p.status === "Received").length, spend: purchaseSpend },
    sales: { count: sales.length, revenue: sum(sales, (s) => s.revenue), profit: sum(sales, (s) => s.profit) },
    invoices: { invoiced, outstanding: invoiced - paid, paid },
    staff: { count: staff.filter((s) => s.status !== "Left").length, monthlyCost: staffCost },
    marketing: { campaigns: campaigns.length, active: campaigns.filter((c) => c.status === "Active").length, leads: sum(campaigns, (c) => c.leads) },
    tasks: { open: openTasks },
  };

  const c = data.company, s = data.strategy;
  const lines = [];
  lines.push(`COMPANY: ${c.name || "(unnamed)"}${c.industry ? ` — ${c.industry}` : ""}${c.stage ? `, ${c.stage}` : ""}${c.location ? `, ${c.location}` : ""}`);
  if (c.description) lines.push(c.description);
  if (s.valueProp) lines.push(`Value proposition: ${s.valueProp}`);
  if (s.targetCustomer) lines.push(`Ideal customer: ${s.targetCustomer}`);
  if (s.competitors) lines.push(`Competitors: ${s.competitors}`);
  if (s.goals12m) lines.push(`12-month goals: ${s.goals12m}`);
  if (s.biggestChallenge) lines.push(`Biggest challenge: ${s.biggestChallenge}`);
  lines.push("");
  lines.push(`FINANCE (live): revenue ${eur(income)}, expenses ${eur(expenses)}, cost of goods ${eur(cogs)}, profit ${eur(profit)}`);
  lines.push(`CUSTOMERS: ${data.customers.contacts} contacts, ${data.customers.customers} customers, pipeline ${eur(pipeline)}`);
  lines.push(`PRODUCTS: ${data.products.count} (${data.products.active} active), avg margin ${avgMargin}%`);
  lines.push(`INVENTORY: ${data.inventory.items} items, ${lowStock} low-stock, stock value ${eur(stockValue)}`);
  lines.push(`SUPPLIERS: ${data.suppliers.count} (${data.suppliers.preferred} preferred) · PURCHASING: ${data.purchasing.open} open, ${data.purchasing.received} received, spend ${eur(purchaseSpend)}`);
  lines.push(`SALES (POS): ${data.sales.count} sales, revenue ${eur(data.sales.revenue)}`);
  lines.push(`INVOICES: invoiced ${eur(invoiced)}, outstanding ${eur(invoiced - paid)}, paid ${eur(paid)}`);
  lines.push(`STAFF: ${data.staff.count} members, monthly cost ${eur(staffCost)}`);
  lines.push(`MARKETING: ${data.marketing.campaigns} campaigns (${data.marketing.active} active), ${data.marketing.leads} leads`);
  lines.push(`OPEN TASKS: ${openTasks}`);

  return { data, text: lines.join("\n") };
}
