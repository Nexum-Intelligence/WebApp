// CSV parsing + header→field mapping for data imports (browser and server).
// Handles quotes, escaped quotes, CRLF, BOM and ; or , or tab delimiters (German
// Excel exports use ";" and decimal commas).

export function parseCsv(text) {
  const src = String(text || "").replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const counts = { ";": 0, ",": 0, "\t": 0 };
  let inQ = false;
  for (const ch of firstLine) { if (ch === '"') inQ = !inQ; else if (!inQ && ch in counts) counts[ch]++; }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const delim = best[1] > 0 ? best[0] : ",";

  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (!rows.length) return { headers: [], rows: [], delimiter: delim };
  const headers = rows[0].map((h) => h.trim());
  return { headers, rows: rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()]))), delimiter: delim };
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// Map CSV headers to collection fields by key or label (any language label passed in).
export function mapHeaders(headers, fields, extraLabels = {}) {
  const map = {};
  for (const f of fields) {
    const names = [f.key, f.label, ...(extraLabels[f.key] || [])].map(norm);
    const h = headers.find((x) => names.includes(norm(x))) || headers.find((x) => names.some((n) => n.length > 3 && norm(x).includes(n)));
    if (h) map[f.key] = h;
  }
  return map;
}

// "1.234,50" / "1,234.50" / "12,5" / "€ 30" → number
export function toNumber(v) {
  if (typeof v === "number") return v;
  let s = String(v || "").replace(/[^\d,.\-]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function rowsToRecords(rows, fields, map) {
  return rows.map((r) => {
    const data = {};
    for (const f of fields) {
      const h = map[f.key];
      if (!h || r[h] === undefined || r[h] === "") continue;
      data[f.key] = f.type === "number" ? toNumber(r[h]) : r[h];
    }
    return data;
  }).filter((d) => Object.keys(d).length > 0);
}
