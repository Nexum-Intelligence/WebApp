// Plans: which suites a tenant may use. Billing is "on" once STRIPE_SECRET_KEY is
// set; before that every tenant gets the full platform (beta).

import { PACKAGES, allModules } from "../src/modules.js";
import { rest, enc } from "./http.js";

export const ALWAYS_ALLOWED = new Set(["daily-tasks", "company-research"]);
export const NO_PLAN = { key: "none", name: "No plan yet", suites: ["foundation"] };

export const billingEnabled = () => !!process.env.STRIPE_SECRET_KEY;

export function packageByKeyStrict(key) {
  return PACKAGES.find((p) => p.key === key) || null;
}

// "4.990 €/yr" → 499000 (cents)
export function priceCents(label) {
  const digits = String(label || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) * 100 : 0;
}

export async function planFor(email) {
  if (!billingEnabled()) {
    return { package_key: "enterprise-plus", status: "beta", suites: packageByKeyStrict("enterprise-plus").suites, billing: false };
  }
  const r = await rest(`subscriptions?email=eq.${enc(email)}&select=package_key,status,interval,current_period_end&limit=1`);
  const row = r.ok && r.data[0];
  const valid = row && row.status === "active" && (!row.current_period_end || new Date(row.current_period_end) > new Date());
  const pkg = valid && packageByKeyStrict(row.package_key);
  if (!pkg) return { package_key: NO_PLAN.key, status: row ? row.status : "none", suites: NO_PLAN.suites, billing: true };
  return { package_key: pkg.key, status: row.status, interval: row.interval, current_period_end: row.current_period_end, suites: pkg.suites, billing: true };
}

// The module's suite comes from the catalog, never from the client.
export function moduleAllowed(plan, moduleKey) {
  if (ALWAYS_ALLOWED.has(moduleKey)) return true;
  const m = allModules().find((x) => x.key === moduleKey);
  return !!m && plan.suites.includes(m.suiteKey);
}
