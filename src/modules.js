// NEXUM Intelligence — Platform module model
// Derived from the pricing model (Ebene 1 Capability Suites, Ebene 2 Kundenpakete).
// A customer's PACKAGE unlocks a set of SUITES; each suite contains agent MODULES.
// Filling out a module and submitting it writes a `module_runs` row to Supabase —
// that insert is the trigger that starts the agentic workflow in n8n.

// ---- Suites & their agent modules ------------------------------------------
// field types: "text" | "textarea" | "select"  (select needs options[])

export const SUITES = [
  {
    key: "foundation",
    name: "Foundation Platform",
    icon: "shield",
    role: "Technical foundation included in every package",
    base: true, // always on, no user-facing module form
    modules: [],
  },
  {
    key: "strategy",
    name: "Strategy Suite",
    icon: "compass",
    role: "Your intelligent strategy advisor",
    modules: [
      {
        key: "market-intelligence",
        name: "Market & Opportunity Intelligence",
        tagline: "Validate demand, map competitors and spot where your product wins.",
        deliverables: ["Market analysis", "Competitor matrix", "Trend radar", "SWOT canvas", "Opportunity map"],
        fields: [
          { key: "idea", label: "Your business / product in a few sentences", type: "textarea", required: true },
          { key: "targetMarket", label: "Target market", type: "text", placeholder: "e.g. B2B SaaS in DACH" },
          { key: "competitors", label: "Main competitors (if known)", type: "textarea" },
          { key: "region", label: "Primary region focus", type: "text", placeholder: "e.g. Germany, EU, Global" },
          { key: "goal", label: "Primary goal", type: "select", options: ["Validate the idea", "Enter a new market", "Find growth opportunities", "Benchmark competitors"] },
        ],
      },
      {
        key: "business-model",
        name: "Business Model Architect",
        tagline: "Turn your idea into a tested business model and PMF scorecard.",
        deliverables: ["Business Model Canvas", "Scenario simulations", "PMF scorecard", "Decision matrix"],
        fields: [
          { key: "valueProp", label: "Your value proposition", type: "textarea", required: true },
          { key: "customer", label: "Who is your ideal customer?", type: "text" },
          { key: "revenue", label: "How do you make (or plan to make) money?", type: "textarea" },
          { key: "resources", label: "Key resources & partners", type: "textarea" },
          { key: "stage", label: "Current stage", type: "select", options: ["Idea", "MVP", "Early revenue", "Scaling"] },
        ],
      },
      {
        key: "competitor-analysis",
        name: "Competitor Analysis",
        tagline: "Map competitors, their positioning and where you can win.",
        deliverables: ["Competitor matrix", "Positioning map", "Gap analysis"],
        fields: [
          { key: "competitors", label: "Competitors to analyse", type: "textarea", required: true },
          { key: "market", label: "Market / category", type: "text" },
          { key: "yourEdge", label: "Where you think you're stronger", type: "textarea" },
        ],
      },
      {
        key: "swot-analysis",
        name: "SWOT Analysis",
        tagline: "Strengths, weaknesses, opportunities and threats — structured.",
        deliverables: ["SWOT canvas", "Strategic implications"],
        fields: [
          { key: "context", label: "What should the SWOT focus on?", type: "textarea", required: true },
          { key: "knownStrengths", label: "Known strengths", type: "textarea" },
          { key: "knownRisks", label: "Known weaknesses / threats", type: "textarea" },
        ],
      },
      {
        key: "customer-validation",
        name: "Customer Validation",
        tagline: "Test whether your idea solves a real, urgent problem.",
        deliverables: ["Validation plan", "Interview guide", "Findings scorecard"],
        fields: [
          { key: "hypothesis", label: "Your core assumption to validate", type: "textarea", required: true },
          { key: "targetCustomer", label: "Who are you validating with?", type: "text" },
          { key: "channels", label: "How will you reach them?", type: "text" },
        ],
      },
    ],
  },
  {
    key: "venture",
    name: "Venture Suite",
    icon: "rocket",
    role: "Your digital venture studio & CFO team",
    modules: [
      {
        key: "business-builder",
        name: "Business Builder",
        tagline: "Business plan, pitch deck, financial plan and roadmap — built for you.",
        deliverables: ["Business plan", "Pitch deck", "Financial plan", "Roadmap", "Templates"],
        fields: [
          { key: "businessName", label: "Business / project name", type: "text", required: true },
          { key: "oneLiner", label: "One-line description", type: "textarea" },
          { key: "goal12m", label: "Your goal for the next 12 months", type: "textarea" },
          { key: "teamSize", label: "Team size", type: "text", placeholder: "e.g. 3 founders" },
        ],
      },
      {
        key: "funding-finance",
        name: "Funding & Finance",
        tagline: "Financial models, funding options and investor-ready documents.",
        deliverables: ["Financial models", "Funding overview", "Application docs", "Investor pitch deck"],
        fields: [
          { key: "fundingAmount", label: "How much funding do you need?", type: "text", placeholder: "e.g. 250k €", required: true },
          { key: "useOfFunds", label: "What will the funding be used for?", type: "textarea" },
          { key: "currentRevenue", label: "Current annual revenue", type: "text", placeholder: "e.g. 0, 120k €" },
          { key: "fundingType", label: "Preferred funding type", type: "select", options: ["Grant / subsidy", "Equity / investors", "Loan", "Bootstrapped"] },
        ],
      },
      {
        key: "value-proposition",
        name: "Value Proposition",
        tagline: "Sharpen the promise that makes customers choose you.",
        deliverables: ["Value proposition canvas", "Messaging pillars"],
        fields: [
          { key: "customer", label: "Who is it for?", type: "text", required: true },
          { key: "problem", label: "What problem do you solve?", type: "textarea" },
          { key: "benefit", label: "Main benefit / outcome", type: "textarea" },
        ],
      },
      {
        key: "go-to-market",
        name: "Go-to-Market Plan",
        tagline: "How you'll launch, reach customers and win the first sales.",
        deliverables: ["GTM plan", "Channel strategy", "Launch timeline"],
        fields: [
          { key: "offer", label: "What are you taking to market?", type: "textarea", required: true },
          { key: "targetSegment", label: "First target segment", type: "text" },
          { key: "channels", label: "Channels to reach them", type: "text" },
          { key: "timeline", label: "Target launch timeframe", type: "text" },
        ],
      },
    ],
  },
  {
    key: "growth",
    name: "Growth Suite",
    icon: "spark",
    role: "Your digital marketing team",
    modules: [
      {
        key: "brand-marketing",
        name: "Brand & Marketing Architect",
        tagline: "Brand strategy, guidelines, campaign concepts and a content plan.",
        deliverables: ["Brand strategy deck", "Brand guidelines", "Campaign concepts", "Content plan", "SEO dashboard"],
        fields: [
          { key: "brandValues", label: "What does your brand stand for?", type: "textarea", required: true },
          { key: "audience", label: "Target audience", type: "text" },
          { key: "tone", label: "Preferred tone", type: "select", options: ["Bold", "Premium", "Friendly", "Technical"] },
          { key: "competitorsBrands", label: "Brands you admire or compete with", type: "text" },
        ],
      },
      {
        key: "marketing-execution",
        name: "Marketing Execution",
        tagline: "Live campaigns, content assets and performance dashboards.",
        deliverables: ["Campaign setups", "Content assets", "Performance dashboards"],
        fields: [
          { key: "campaignGoal", label: "Campaign goal", type: "select", options: ["Awareness", "Leads", "Sales", "Retention"], required: true },
          { key: "channels", label: "Channels to focus on", type: "text", placeholder: "e.g. LinkedIn, Google, Email" },
          { key: "budget", label: "Monthly budget", type: "text", placeholder: "e.g. 2.000 €" },
          { key: "offer", label: "What are you promoting?", type: "textarea" },
        ],
      },
      {
        key: "marketing-strategy",
        name: "Marketing Strategy",
        tagline: "A full strategy: positioning, funnel, channels and content.",
        deliverables: ["Marketing strategy deck", "Funnel design", "Content plan"],
        fields: [
          { key: "goal", label: "Main marketing goal", type: "select", options: ["Awareness", "Lead generation", "Sales", "Retention"], required: true },
          { key: "audience", label: "Target audience", type: "text" },
          { key: "budget", label: "Monthly budget", type: "text" },
        ],
      },
      {
        key: "growth-execution-plan",
        name: "Growth Execution Plan",
        tagline: "Turn strategy into a prioritised, week-by-week action plan.",
        deliverables: ["Execution roadmap", "Weekly action plan", "KPI targets"],
        fields: [
          { key: "focus", label: "Main growth focus", type: "text", required: true },
          { key: "horizon", label: "Planning horizon", type: "select", options: ["30 days", "90 days", "6 months"] },
          { key: "constraints", label: "Constraints (budget, team, time)", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "operations",
    name: "Operations Suite",
    icon: "dashboard",
    role: "Your digital COO & PMO team",
    modules: [
      {
        key: "business-operations", type: "live",
        name: "Business Operations",
        tagline: "KPI dashboards, reporting and connected data pipelines.",
        deliverables: ["KPI dashboard", "Monthly reporting deck", "CRM/ERP integrations", "Real-time data pipelines"],
        fields: [
          { key: "currentTools", label: "Which tools/systems do you use today?", type: "textarea", required: true },
          { key: "processes", label: "Key processes you want visibility on", type: "textarea" },
          { key: "teamSize", label: "Team size", type: "text" },
          { key: "kpis", label: "Most important KPIs", type: "text", placeholder: "e.g. MRR, churn, lead time" },
        ],
      },
      {
        key: "project-execution",
        name: "Project & Task Execution",
        tagline: "Project plans, Kanban boards and sprint reporting.",
        deliverables: ["Gantt project plan", "Kanban board", "Sprint reports"],
        fields: [
          { key: "projectName", label: "Project name", type: "text", required: true },
          { key: "objectives", label: "Objectives & deliverables", type: "textarea" },
          { key: "deadline", label: "Target deadline", type: "text", placeholder: "e.g. Q4 2026" },
          { key: "stakeholders", label: "Key stakeholders", type: "text" },
        ],
      },
    ],
  },
  {
    key: "intelligence",
    name: "Intelligence Suite",
    icon: "brain",
    role: "Your digital management & decision team",
    modules: [
      {
        key: "predictive", type: "live",
        name: "Predictive Intelligence",
        tagline: "Forecasts, scenario simulations and prediction reports.",
        deliverables: ["Forecast dashboard", "Scenario simulations", "Prediction reports"],
        fields: [
          { key: "metric", label: "What do you want to forecast?", type: "text", placeholder: "e.g. revenue, demand, churn", required: true },
          { key: "horizon", label: "Forecast horizon", type: "select", options: ["1 month", "3 months", "6 months", "12 months"] },
          { key: "dataAvailable", label: "Historical data available?", type: "select", options: ["Yes, structured", "Partly", "No"] },
          { key: "context", label: "Anything we should know?", type: "textarea" },
        ],
      },
      {
        key: "opportunity-risk", type: "live",
        name: "Opportunity & Risk",
        tagline: "Opportunity/risk matrix, alerts and pattern recognition.",
        deliverables: ["Opportunity & risk matrix", "Alerts", "Pattern insights"],
        fields: [
          { key: "knownRisks", label: "Risks you're already aware of", type: "textarea" },
          { key: "marketChanges", label: "Market changes affecting you", type: "textarea" },
          { key: "riskAppetite", label: "Risk appetite", type: "select", options: ["Low", "Medium", "High"] },
        ],
      },
      {
        key: "decision-recommendation", type: "live",
        name: "Decision Recommendation",
        tagline: "ROI models, options comparison and a decision brief.",
        deliverables: ["ROI model", "Options comparison", "Decision brief"],
        fields: [
          { key: "decision", label: "What decision are you facing?", type: "textarea", required: true },
          { key: "options", label: "Options you're weighing", type: "textarea" },
          { key: "criteria", label: "What matters most in this decision?", type: "text" },
          { key: "deadline", label: "Decision deadline", type: "text" },
        ],
      },
    ],
  },
  {
    key: "execution",
    name: "Execution Suite",
    icon: "workflow",
    role: "Your digital execution team",
    modules: [
      {
        key: "automation-execution",
        name: "Automation & Execution",
        tagline: "Turn decisions into automated, documented workflows.",
        deliverables: ["Implementation plan", "Workflow documentation", "Automated task execution"],
        fields: [
          { key: "processToAutomate", label: "Which process should we automate?", type: "textarea", required: true },
          { key: "systems", label: "Systems / tools involved", type: "text" },
          { key: "frequency", label: "How often does it run?", type: "select", options: ["Daily", "Weekly", "Monthly", "Ad hoc"] },
          { key: "successMetric", label: "What does success look like?", type: "text" },
        ],
      },
    ],
  },
  {
    key: "specialist",
    name: "Specialist Suite",
    icon: "cpu",
    role: "Your digital expert team for functional domains",
    modules: [
      {
        key: "functional-specialist",
        name: "Functional Specialist",
        tagline: "On-demand Finance, HR, Legal, Procurement, CX or M&A expertise.",
        deliverables: ["Domain insights", "Budget reports", "Compliance checklists", "Funnel dashboards"],
        fields: [
          { key: "domain", label: "Which domain do you need?", type: "select", options: ["Finance", "HR", "Legal", "Procurement", "Customer Experience", "M&A"], required: true },
          { key: "task", label: "What do you need help with?", type: "textarea", required: true },
          { key: "urgency", label: "Urgency", type: "select", options: ["Low", "Normal", "High"] },
          { key: "context", label: "Relevant context", type: "textarea" },
        ],
      },
    ],
  },
];

// ---- Customer packages (Ebene 2) -------------------------------------------
// suites[] lists the suite keys unlocked by the package (cumulative per pricing).

export const PACKAGES = [
  {
    key: "venture-starter", name: "Venture Starter",
    target: "Founders, start-ups, accelerator teams",
    suites: ["foundation", "strategy"],
    priceOnce: "499 €", priceYear: "4.990 €/yr", extraRuns: "—",
  },
  {
    key: "venture-pro", name: "Venture Pro",
    target: "Start-ups with an MVP, scale-ups, grant projects",
    suites: ["foundation", "strategy", "venture"],
    priceOnce: "999 €", priceYear: "9.990 €/yr", extraRuns: "3 extra runs for 150 €",
  },
  {
    key: "growth", name: "Growth",
    target: "Scale-ups, SMEs",
    suites: ["foundation", "strategy", "venture", "growth"],
    priceOnce: "1.999 €", priceYear: "19.990 €/yr", extraRuns: "3 extra runs for 250 €",
  },
  {
    key: "business-operating", name: "Business Operating Platform",
    target: "SMEs, innovation units, corporate ventures",
    suites: ["foundation", "strategy", "venture", "growth", "operations"],
    priceOnce: "3.999 €", priceYear: "39.990 €/yr", extraRuns: "3 extra runs for 350 €",
  },
  {
    key: "intelligent-enterprise", name: "Intelligent Enterprise",
    target: "Established mid-market, data-driven decision makers",
    suites: ["foundation", "strategy", "venture", "growth", "operations", "intelligence"],
    priceOnce: "5.999 €", priceYear: "59.990 €/yr", extraRuns: "3 extra runs for 450 €",
  },
  {
    key: "autonomous-enterprise", name: "Autonomous Enterprise",
    target: "Digital champions with high automation ambition",
    suites: ["foundation", "strategy", "venture", "growth", "operations", "intelligence", "execution"],
    priceOnce: "7.999 €", priceYear: "79.990 €/yr", extraRuns: "3 extra runs for 550 €",
  },
  {
    key: "enterprise-plus", name: "Enterprise+",
    target: "Corporates, groups, PE portfolios, venture studios",
    suites: ["foundation", "strategy", "venture", "growth", "operations", "intelligence", "execution", "specialist"],
    priceOnce: "from 9.999 €", priceYear: "from 99.999 €/yr", extraRuns: "Custom",
  },
];

// ---- Company workspace sections --------------------------------------------
// Business data the owner maintains once. Stored per user and passed to agents
// as context, so every module can build on the same company knowledge.

export const COMPANY_SECTIONS = [
  {
    key: "basics", name: "Company Basics", icon: "shield",
    intro: "The essentials every agent needs about your company.",
    fields: [
      { key: "companyName", label: "Company name", type: "text" },
      { key: "industry", label: "Industry", type: "select", options: ["Software / SaaS", "E-Commerce / Retail", "Manufacturing", "Professional Services", "Finance / Insurance", "Healthcare", "Marketing / Agency", "Logistics", "Other"] },
      { key: "stage", label: "Stage", type: "select", options: ["Idea", "MVP", "Early revenue", "Scaling", "Established"] },
      { key: "size", label: "Company size", type: "select", options: ["Solo", "2–10", "11–50", "51–200", "200+"] },
      { key: "website", label: "Website", type: "text", placeholder: "https://" },
      { key: "location", label: "Main location / markets", type: "text" },
      { key: "description", label: "What does your company do?", type: "textarea" },
    ],
  },
  {
    key: "product", name: "Product & Offer", icon: "spark",
    intro: "What you sell and why it's valuable.",
    fields: [
      { key: "mainOffer", label: "Main product / service", type: "textarea" },
      { key: "valueProp", label: "Core value proposition", type: "textarea" },
      { key: "usp", label: "What makes you different (USP)?", type: "textarea" },
      { key: "pricingModel", label: "Pricing model", type: "text", placeholder: "e.g. subscription, one-off, retainer" },
    ],
  },
  {
    key: "customers", name: "Customers & Market", icon: "compass",
    intro: "Who you serve and the market you operate in.",
    fields: [
      { key: "targetCustomer", label: "Ideal customer", type: "textarea" },
      { key: "segments", label: "Key segments", type: "text" },
      { key: "marketRegion", label: "Target regions", type: "text" },
      { key: "competitors", label: "Main competitors", type: "textarea" },
    ],
  },
  {
    key: "marketing", name: "Brand & Marketing", icon: "growth",
    intro: "How you show up and win attention.",
    fields: [
      { key: "brandValues", label: "Brand values", type: "textarea" },
      { key: "tone", label: "Brand tone", type: "select", options: ["Bold", "Premium", "Friendly", "Technical"] },
      { key: "channels", label: "Marketing channels", type: "text" },
      { key: "positioning", label: "Positioning statement", type: "textarea" },
    ],
  },
  {
    key: "finance", name: "Finance", icon: "rocket",
    intro: "Your financial picture and funding status.",
    fields: [
      { key: "revenue", label: "Current annual revenue", type: "text" },
      { key: "fundingStatus", label: "Funding status", type: "select", options: ["Bootstrapped", "Pre-seed", "Seed", "Series A+", "Profitable"] },
      { key: "mainCosts", label: "Main cost drivers", type: "textarea" },
      { key: "financialGoals", label: "Financial goals", type: "textarea" },
    ],
  },
  {
    key: "team", name: "Team & Org", icon: "dashboard",
    intro: "Your people and organisational setup.",
    fields: [
      { key: "teamSize", label: "Team size", type: "text" },
      { key: "keyRoles", label: "Key roles", type: "textarea" },
      { key: "hiringNeeds", label: "Hiring needs", type: "textarea" },
    ],
  },
  {
    key: "goals", name: "Goals & Strategy", icon: "brain",
    intro: "Where you're heading and what's in the way.",
    fields: [
      { key: "vision", label: "Vision", type: "textarea" },
      { key: "goals12m", label: "Goals for the next 12 months", type: "textarea" },
      { key: "biggestChallenge", label: "Biggest challenge right now", type: "textarea" },
      { key: "priorities", label: "Top priorities", type: "text" },
    ],
  },
];

// ---- Operational admin collections (CRM / POS / Finance / Marketing) --------
// Each is a CRUD table of records the business runs on. Stored per user in the
// `company_records` table (kind = collection key, data jsonb).

function fmtEur(n) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n) || 0);
}

export const COLLECTIONS = [
  {
    key: "customers", name: "Customers (CRM)", icon: "compass", singular: "contact",
    intro: "Your customer and lead pipeline.",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "company", label: "Company", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "stage", label: "Stage", type: "select", options: ["Lead", "Qualified", "Customer", "Churned"] },
      { key: "value", label: "Deal value (€)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [["name", "Name"], ["company", "Company"], ["stage", "Stage"], ["value", "Value", "eur"]],
    summary: (rows) => [
      { label: "Contacts", value: rows.length },
      { label: "Customers", value: rows.filter((r) => r.stage === "Customer").length },
      { label: "Pipeline value", value: fmtEur(rows.reduce((s, r) => s + (Number(r.value) || 0), 0)) },
    ],
  },
  {
    key: "inventory", name: "Inventory", icon: "dashboard", singular: "item",
    intro: "Goods & ingredients you stock — the basis for product costs and profit.",
    fields: [
      { key: "name", label: "Item", type: "text", required: true },
      { key: "unit", label: "Unit", type: "text", placeholder: "kg, l, pcs" },
      { key: "unitCost", label: "Cost per unit (€)", type: "number" },
      { key: "stock", label: "In stock", type: "number" },
      { key: "reorder", label: "Reorder level", type: "number" },
      { key: "supplier", label: "Supplier", type: "text" },
    ],
    columns: [["name", "Item"], ["unit", "Unit"], ["unitCost", "Unit cost", "eur"], ["stock", "Stock"]],
    summary: (rows) => [
      { label: "Items", value: rows.length },
      { label: "Low stock", value: rows.filter((r) => r.reorder && Number(r.stock) <= Number(r.reorder)).length },
      { label: "Stock value", value: fmtEur(rows.reduce((s, r) => s + (Number(r.unitCost) || 0) * (Number(r.stock) || 0), 0)) },
    ],
  },
  {
    key: "transactions", name: "Income & Expenses", icon: "rocket", singular: "entry",
    intro: "Track revenue and costs.",
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "type", label: "Type", type: "select", options: ["Income", "Expense"], required: true },
      { key: "category", label: "Category", type: "text" },
      { key: "amount", label: "Amount (€)", type: "number", required: true },
      { key: "description", label: "Description", type: "text" },
    ],
    columns: [["date", "Date"], ["type", "Type"], ["category", "Category"], ["amount", "Amount", "eur"]],
    summary: (rows) => {
      const income = rows.filter((r) => r.type === "Income").reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const expense = rows.filter((r) => r.type === "Expense").reduce((s, r) => s + (Number(r.amount) || 0), 0);
      return [
        { label: "Income", value: fmtEur(income) },
        { label: "Expenses", value: fmtEur(expense) },
        { label: "Profit", value: fmtEur(income - expense) },
      ];
    },
  },
  {
    key: "campaigns", name: "Marketing (CRM)", icon: "growth", singular: "campaign",
    intro: "Campaigns, channels and leads.",
    fields: [
      { key: "name", label: "Campaign", type: "text", required: true },
      { key: "channel", label: "Channel", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Planned", "Active", "Done"] },
      { key: "budget", label: "Budget (€)", type: "number" },
      { key: "leads", label: "Leads", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [["name", "Campaign"], ["channel", "Channel"], ["status", "Status"], ["budget", "Budget", "eur"], ["leads", "Leads"]],
    summary: (rows) => [
      { label: "Campaigns", value: rows.length },
      { label: "Active", value: rows.filter((r) => r.status === "Active").length },
      { label: "Total leads", value: rows.reduce((s, r) => s + (Number(r.leads) || 0), 0) },
    ],
  },
];

export function collectionByKey(key) {
  return COLLECTIONS.find((c) => c.key === key) || null;
}

// ---- Connectors (data import for the agents) -------------------------------
// The owner configures a source here; the actual polling/import runs in n8n,
// which reads these connector configs and writes into company_records.

export const CONNECTORS = [
  {
    key: "pos", name: "POS / Kasse", category: "Sales", imports: "products, income",
    desc: "Read sales, products and revenue from your point-of-sale.",
    fields: [
      { key: "provider", label: "POS system", type: "text", placeholder: "e.g. orderbird, Square, Lightspeed" },
      { key: "apiUrl", label: "API URL", type: "text" },
      { key: "apiKey", label: "API key", type: "text" },
    ],
  },
  {
    key: "stripe", name: "Stripe", category: "Payments", imports: "income, customers",
    desc: "Import payments and payouts as income.",
    fields: [{ key: "apiKey", label: "Secret key (sk_…)", type: "text" }],
  },
  {
    key: "hubspot", name: "HubSpot", category: "CRM", imports: "customers",
    desc: "Import contacts and deals into your CRM.",
    fields: [{ key: "apiKey", label: "Private app token", type: "text" }],
  },
  {
    key: "gsheets", name: "Google Sheets", category: "Data", imports: "any table",
    desc: "Pull rows from a shared spreadsheet.",
    fields: [{ key: "sheetUrl", label: "Sheet URL", type: "text" }],
  },
  {
    key: "datev", name: "DATEV", category: "Finance", imports: "income & expenses",
    desc: "Sync bookings into finance.",
    fields: [
      { key: "client", label: "Client / Mandant", type: "text" },
      { key: "apiKey", label: "API key", type: "text" },
    ],
  },
  {
    key: "csv", name: "CSV / Excel", category: "Data", imports: "any table",
    desc: "Hand off a file URL for a one-off import.",
    fields: [{ key: "fileUrl", label: "File URL", type: "text" }],
  },
];

// ---- Phases (artifact generation journey) ----------------------------------
// The 5 NEXUM phases group the suites into a journey from analysis to execution.

export const PHASES = [
  { key: "analysis", num: "01", name: "Analysis", blurb: "Research, validate and understand your business.", suites: ["strategy"] },
  { key: "creation", num: "02", name: "Creation", blurb: "Turn insight into business models, funding and brand.", suites: ["venture", "growth"] },
  { key: "operation", num: "03", name: "Operation", blurb: "Run the business with live dashboards and delivery.", suites: ["operations"] },
  { key: "optimization", num: "04", name: "Optimization", blurb: "Forecast, monitor risk and decide — continuously.", suites: ["intelligence"] },
  { key: "execution", num: "05", name: "Execution", blurb: "Automate and execute decisions and campaigns.", suites: ["execution", "specialist"] },
];

// Category of a module: "analysis" (research/report), "artifact" (plan/document),
// or "live" (continuously updated from data — no manual run).
const ANALYSIS_MODULES = new Set(["market-intelligence", "business-model", "competitor-analysis", "swot-analysis", "customer-validation"]);
export function moduleCategory(m) {
  if (m.type === "live") return "live";
  if (ANALYSIS_MODULES.has(m.key)) return "analysis";
  return "artifact";
}

export function packageByKey(key) {
  return PACKAGES.find((p) => p.key === key) || PACKAGES[0];
}

// Every module flattened with its suite context (for tabs & lookups).
export function allModules() {
  const out = [];
  for (const suite of SUITES) {
    for (const m of suite.modules || []) out.push({ ...m, suiteKey: suite.key, suiteName: suite.name });
  }
  return out;
}

// Flat lookup of every module with its suite context.
export function findModule(moduleKey) {
  for (const suite of SUITES) {
    const m = (suite.modules || []).find((x) => x.key === moduleKey);
    if (m) return { ...m, suiteKey: suite.key, suiteName: suite.name };
  }
  return null;
}
