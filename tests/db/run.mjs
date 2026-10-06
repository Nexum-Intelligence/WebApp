// Applies bootstrap + migrations to the local test database (docker container
// `nexum-pg`) and runs the SQL behaviour tests. See tests/README.md.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const psql = (file) => execFileSync("docker", ["exec", "-i", "nexum-pg", "psql", "-U", "postgres", "-q", "-v", "ON_ERROR_STOP=1"], { input: readFileSync(file), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

psql("tests/db/bootstrap.sql");
for (const f of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) psql(`supabase/migrations/${f}`);
const out = psql("tests/db/test.sql");
if (!out.includes("ALL DB TESTS PASSED")) { console.error(out); process.exit(1); }
console.log("ALL DB TESTS PASSED");
