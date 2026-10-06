// Browser helpers for the /api endpoints. `api()` throws on HTTP or app errors so
// callers can show a real message instead of a false "saved".

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function api(url, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError("Network error — please check your connection.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const msg = res.status === 401 ? "Your session expired — please sign in again." : (data.error || `Request failed (${res.status})`);
    throw new ApiError(msg, res.status);
  }
  return data;
}

export const isLocalId = (id) => String(id || "").startsWith("local-");

export function downloadText(filename, text, type = "text/markdown") {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Opens a print window with the rendered deliverable — the browser's
// "Save as PDF" turns it into a PDF.
export function printHtml(title, html) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const safeTitle = String(title).replace(/[<>&"]/g, "");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  body{font:14px/1.6 Inter,system-ui,sans-serif;color:#111;max-width:760px;margin:40px auto;padding:0 24px}
  h1,h2,h3,h4{line-height:1.25;margin:1.4em 0 .5em} h2{font-size:22px} h3{font-size:18px}
  table{border-collapse:collapse;width:100%;margin:12px 0} th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f3f3f7} code{background:#f3f3f7;padding:1px 4px;border-radius:3px} pre{background:#f3f3f7;padding:12px;overflow:auto}
  blockquote{border-left:3px solid #818cf8;margin:12px 0;padding:4px 12px;color:#444}
  .doc-head{border-bottom:2px solid #818cf8;padding-bottom:8px;margin-bottom:24px;color:#555;font-size:12px}
</style></head><body><div class="doc-head">NEXUM Intelligence · ${new Date().toLocaleDateString()}</div>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}
