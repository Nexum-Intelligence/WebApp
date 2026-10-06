// Renders the trend chart server-side: no hang, sensible output for edge cases.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const esbuildPath = path.join(path.dirname(require.resolve("vite")), "..", "..", "..", "esbuild", "lib", "main.js");

async function loadChart() {
  const { transformSync } = require(fs.existsSync(esbuildPath) ? esbuildPath : "esbuild");
  const src = fs.readFileSync(new URL("../../src/MonthlyChart.jsx", import.meta.url), "utf8");
  const out = transformSync(src, { loader: "jsx", format: "esm", jsx: "transform" });
  const file = path.join(os.tmpdir(), `monthlychart-${process.pid}.mjs`);
  fs.writeFileSync(file, out.code.replace('from "react"', `from "${pathToFileURL(require.resolve("react")).href}"`));
  return (await import(pathToFileURL(file).href)).default;
}

const month = (i, revenue, profit) => ({ month: `2026-${String(i + 1).padStart(2, "0")}`, revenue, expenses: 0, costOfGoods: 0, profit });

test("trend chart renders for normal, negative, flat and empty data", async () => {
  const React = require("react");
  const { renderToString } = require("react-dom/server");
  const Chart = await loadChart();
  const render = (months) => renderToString(React.createElement(Chart, { months }));

  const normal = render(Array.from({ length: 12 }, (_, i) => month(i, 3000 + i * 500, 400 + i * 100)));
  assert.match(normal, /polyline/);
  assert.match(normal, /Revenue/);
  const negative = render(Array.from({ length: 12 }, (_, i) => month(i, 1000, -2500 + i * 300)));
  assert.match(negative, /plat-chart-zero/, "zero line when profit is negative");
  const flat = render(Array.from({ length: 12 }, (_, i) => month(i, 0.01, 0)));
  assert.match(flat, /polyline/);
  assert.match(render(Array.from({ length: 12 }, (_, i) => month(i, 0, 0))), /No bookings/);
  assert.match(render([]), /No bookings/);
});
