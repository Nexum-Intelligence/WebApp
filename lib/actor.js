// Who is acting in the current request — sent to PostgREST as `x-nexum-actor`
// so the audit_log trigger can record it. Handlers call setActor(t.actor) right
// after resolveTenant() — in the handler itself, so it covers all later awaits.
import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage();

export function setActor(actor) {
  store.enterWith({ actor });
}

export function currentActor() {
  const s = store.getStore();
  return (s && s.actor) || null;
}
