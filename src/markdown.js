// Minimal, dependency-free Markdown → HTML for agent deliverables.
// All input is HTML-escaped first; only the tags generated here reach the DOM,
// and links are limited to http(s)/mailto. Supports headings, paragraphs,
// bullet/numbered lists, tables, code blocks, blockquotes, hr, bold/italic/code/links.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function inline(text) {
  let s = esc(text);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  // hrefs go into placeholders too, so emphasis rules can't rewrite URLs
  const hrefs = [];
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const h = href.replace(/&amp;/g, "&");
    if (!/^(https?:|mailto:)/i.test(h)) return label;
    hrefs.push(esc(h));
    return `<a href="\u0001${hrefs.length - 1}\u0001" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  s = s.replace(/\u0001(\d+)\u0001/g, (_, i) => hrefs[Number(i)]);
  return s;
}

const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function markdownToHtml(md) {
  const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const n = Math.min(h[1].length + 1, 6); out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push("<hr/>"); i++; continue; }

    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<div class="md-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, "").replace(/^\[( |x)\]\s*/i, (m) => (/x/i.test(m) ? "☑ " : "☐ ")));
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*([-*+]|\d+[.)])\s+|>\s?|\s*\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    out.push(`<p>${buf.map(inline).join("<br/>")}</p>`);
  }
  return out.join("\n");
}

// Text of a module run result regardless of how it was stored.
export function resultText(result) {
  if (result == null) return "";
  if (typeof result === "string") return result;
  if (typeof result === "object" && typeof result.markdown === "string") return result.markdown;
  return JSON.stringify(result, null, 2);
}
