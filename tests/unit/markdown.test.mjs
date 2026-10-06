import { test } from "node:test";
import assert from "node:assert/strict";
import { markdownToHtml, resultText } from "../../src/markdown.js";

test("renders the structures agents use", () => {
  const html = markdownToHtml("# Plan\n\nIntro **bold** and *it* `code`.\n\n- a\n- b\n\n1. x\n2. y\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n> note\n\n---\n\n```\nraw <b>\n```");
  assert.match(html, /<h2>Plan<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>it<\/em>/);
  assert.match(html, /<code>code<\/code>/);
  assert.match(html, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(html, /<ol><li>x<\/li><li>y<\/li><\/ol>/);
  assert.match(html, /<th>A<\/th>.*<td>2<\/td>/s);
  assert.match(html, /<blockquote>note<\/blockquote>/);
  assert.match(html, /<hr\/>/);
  assert.match(html, /<pre><code>raw &lt;b&gt;<\/code><\/pre>/);
});

test("escapes HTML and blocks script links (XSS)", () => {
  const html = markdownToHtml('<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1)) [ok](https://nexum.de?a=1&b=2) "<script>"');
  assert.ok(!html.includes("<img"), "raw html escaped");
  assert.ok(!html.includes("<script"), "script escaped");
  assert.ok(!/href="javascript/i.test(html), "javascript: link dropped");
  assert.match(html, /href="https:\/\/nexum\.de\?a=1&amp;b=2"/);
  const attr = markdownToHtml('[x](https://a.de/"onmouseover="alert(1))');
  assert.ok(!/<a [^>]*sonmouseover=/.test(attr) && !attr.includes('"onmouseover'), "no attribute breakout");
});

test("emphasis rules don't rewrite link URLs", () => {
  const html = markdownToHtml("[a](https://x.de/*a*) und *kursiv*");
  assert.ok(html.includes('href="https://x.de/*a*"'), html);
  assert.ok(html.includes("<em>kursiv</em>"), html);
});

test("resultText handles every stored shape", () => {
  assert.equal(resultText({ markdown: "# A" }), "# A");
  assert.equal(resultText("plain"), "plain");
  assert.equal(resultText(null), "");
  assert.match(resultText({ x: 1 }), /"x": 1/);
});
