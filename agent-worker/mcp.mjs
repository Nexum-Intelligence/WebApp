// Builds the Agent SDK `mcpServers` map for a tenant from their connected sources
// (company_records kind = 'connectors') plus optional global MCP servers.
//
// Adjust the server definitions to the MCP servers you actually run. Each entry is
// either a stdio server ({ type:'stdio', command, args, env }) or an HTTP server
// ({ type:'http', url, headers }). Tools are then allowed as `${name}_*`.

export async function buildMcpServers(db, email) {
  const servers = {};

  try {
    const { data } = await db.from("company_records").select("data").eq("email", email).eq("kind", "connectors");
    for (const row of data || []) {
      const c = row.data || {};
      if (!c.connected) continue;
      const cfg = c.config || {};

      if (c.connectorKey === "stripe" && cfg.apiKey) {
        servers.stripe = { type: "stdio", command: "npx", args: ["-y", "@stripe/mcp", "--tools=all"], env: { STRIPE_SECRET_KEY: cfg.apiKey } };
      }
      if (c.connectorKey === "hubspot" && cfg.apiKey && process.env.HUBSPOT_MCP_URL) {
        servers.hubspot = { type: "http", url: process.env.HUBSPOT_MCP_URL, headers: { Authorization: `Bearer ${cfg.apiKey}` } };
      }
      if (c.connectorKey === "gsheets" && process.env.GSHEETS_MCP_URL) {
        servers.gsheets = { type: "http", url: process.env.GSHEETS_MCP_URL, headers: {} };
      }
      // POS / Kasse, DATEV, CSV: add your own MCP servers here, keyed by connectorKey.
    }
  } catch (e) { /* no connectors */ }

  // Optional: a Supabase MCP so agents can read/write the tenant's data directly.
  if (process.env.SUPABASE_MCP_URL) {
    servers.supabase = {
      type: "http",
      url: process.env.SUPABASE_MCP_URL,
      headers: process.env.SUPABASE_MCP_TOKEN ? { Authorization: `Bearer ${process.env.SUPABASE_MCP_TOKEN}` } : {},
    };
  }

  return servers;
}
