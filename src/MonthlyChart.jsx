// Revenue vs. booked profit over the last 12 months (one € axis, two series).
// Colours validated with the dataviz validator against the platform's dark surface
// (#6d72e6 / #2fae63: lightness band, chroma, CVD ΔE 25.1, contrast ≥ 3:1).
import React, { useState } from "react";

const SERIES = [
  { key: "revenue", label: "Revenue", color: "#2fae63" },
  { key: "profit", label: "Profit", color: "#6d72e6" },
];
const W = 640, H = 230, PAD = { l: 56, r: 64, t: 14, b: 28 };
const eur = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const monthLabel = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });

function niceStep(range) {
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

export default function MonthlyChart({ months = [] }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const hasData = months.some((m) => m.revenue || m.profit || m.expenses || m.costOfGoods);
  if (!hasData) return <p className="plat-empty">No bookings in the last 12 months yet — record sales or add income &amp; expenses and the trend appears here.</p>;

  const vals = months.flatMap((m) => SERIES.map((s) => m[s.key]));
  const step = niceStep(Math.max(...vals, 0) - Math.min(...vals, 0) || 1);
  const yMax = Math.ceil(Math.max(...vals, 0) / step) * step || step;
  const yMin = Math.floor(Math.min(...vals, 0) / step) * step;
  const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, months.length - 1);
  const y = (v) => PAD.t + ((yMax - v) * (H - PAD.t - PAD.b)) / (yMax - yMin || 1);
  const ticks = [];
  for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(v);
  const slot = (W - PAD.l - PAD.r) / Math.max(1, months.length - 1);
  const last = months.length - 1;

  return (
    <div className="plat-chart">
      <div className="plat-chart-top">
        <div className="plat-chart-legend">
          {SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}
        </div>
        <button type="button" className="plat-ghost plat-chart-toggle" onClick={() => setTable((t) => !t)}>{table ? "Chart" : "Table"}</button>
      </div>
      {table ? (
        <div className="plat-table-wrap">
          <table className="plat-table">
            <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Cost of goods</th><th>Profit</th></tr></thead>
            <tbody>{months.map((m) => <tr key={m.month}><td>{m.month}</td><td>{eur(m.revenue)}</td><td>{eur(m.expenses)}</td><td>{eur(m.costOfGoods)}</td><td>{eur(m.profit)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="plat-chart-canvas" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Revenue and profit per month, last 12 months">
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className={v === 0 ? "plat-chart-zero" : "plat-chart-grid"} />
                <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="plat-chart-axis">{eur(v)}</text>
              </g>
            ))}
            {months.map((m, i) => (i % 2 === last % 2) && <text key={m.month} x={x(i)} y={H - 8} textAnchor="middle" className="plat-chart-axis">{monthLabel(m.month)}</text>)}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="plat-chart-cross" />}
            {SERIES.map((s) => (
              <g key={s.key}>
                <polyline fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                  points={months.map((m, i) => `${x(i)},${y(m[s.key])}`).join(" ")} />
                <circle cx={x(last)} cy={y(months[last][s.key])} r="4" fill={s.color} stroke="#0f1022" strokeWidth="2" />
                <text x={x(last) + 8} y={y(months[last][s.key]) + 4} className="plat-chart-label">{s.label}</text>
                {hover != null && <circle cx={x(hover)} cy={y(months[hover][s.key])} r="4.5" fill={s.color} stroke="#0f1022" strokeWidth="2" />}
              </g>
            ))}
            {months.map((m, i) => (
              <rect key={m.month} x={x(i) - slot / 2} y={0} width={slot} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
            ))}
          </svg>
          {hover != null && (
            <div className="plat-chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
              <b>{new Date(`${months[hover].month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}</b>
              {SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label} <b>{eur(months[hover][s.key])}</b></span>)}
              <span className="plat-chart-tip-sub">Expenses {eur(months[hover].expenses)} · Cost of goods {eur(months[hover].costOfGoods)}</span>
            </div>
          )}
        </div>
      )}
      <p className="plat-chart-note">Booked profit = revenue − expenses − cost of goods (monthly staff cost not included).</p>
    </div>
  );
}
