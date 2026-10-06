// Shared finance helpers (browser + /api). Same rules everywhere:
// profit = revenue − expenses − cost of goods; stock purchases (category
// "Purchasing") are not an expense — their cost counts when the goods are sold.
// Last 12 calendar months (UTC) of booked revenue, expenses (without stock purchases
// and staff) and cost of goods sold. Dates come from the record, else created_at.
export function monthlySeries(records, now = new Date()) {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ month: d.toISOString().slice(0, 7), revenue: 0, expenses: 0, costOfGoods: 0, profit: 0 });
  }
  const at = Object.fromEntries(months.map((m) => [m.month, m]));
  const monthOf = (r) => String((r.data && r.data.date) || r.created_at || "").slice(0, 7);
  for (const r of records) {
    const m = at[monthOf(r)];
    if (!m) continue;
    const d = r.data || {};
    if (r.kind === "transactions") {
      const amt = Number(d.amount) || 0;
      if (d.type === "Income") m.revenue += amt;
      else if (d.type === "Expense" && d.category !== "Purchasing") m.expenses += amt;
    } else if (r.kind === "sales") {
      m.costOfGoods += Number(d.cost) || 0;
    }
  }
  for (const m of months) {
    for (const k of ["revenue", "expenses", "costOfGoods"]) m[k] = Math.round(m[k] * 100) / 100;
    m.profit = Math.round((m.revenue - m.expenses - m.costOfGoods) * 100) / 100;
  }
  return months;
}

export const PERIODS = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "3m", label: "Last 3 months" },
  { key: "year", label: "This year" },
];

// Keep records whose date (data.date, else created_at) lies in the period.
export function inPeriod(record, period, now = new Date()) {
  if (period === "all") return true;
  const raw = (record.data && record.data.date) || record.created_at;
  const d = raw ? new Date(String(raw).length === 10 ? `${raw}T00:00:00Z` : raw) : null;
  if (!d || isNaN(d)) return false;
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  if (period === "month") return d.getUTCFullYear() === y && d.getUTCMonth() === m;
  if (period === "3m") return d >= new Date(Date.UTC(y, m - 2, 1));
  if (period === "year") return d.getUTCFullYear() === y;
  return true;
}

// Number of months the period covers (for monthly staff cost).
export function periodMonths(period, now = new Date()) {
  if (period === "month") return 1;
  if (period === "3m") return 3;
  if (period === "year") return now.getUTCMonth() + 1;
  return null;
}
