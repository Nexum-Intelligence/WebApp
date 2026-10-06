// Keeps the local Supabase stand-in running for manual/browser testing:
//   node tests/e2e/stack.mjs   → http://127.0.0.1:54330
import { startStack, SERVICE_KEY } from "./harness.mjs";
const s = await startStack();
console.log(`stack on ${s.url}\nSUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`);
setInterval(() => {}, 1 << 30);
