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
    ],
  },
  {
    key: "operations",
    name: "Operations Suite",
    icon: "dashboard",
    role: "Your digital COO & PMO team",
    modules: [
      {
        key: "business-operations",
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
        key: "predictive",
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
        key: "opportunity-risk",
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
        key: "decision-recommendation",
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

export function packageByKey(key) {
  return PACKAGES.find((p) => p.key === key) || PACKAGES[0];
}

// Flat lookup of every module with its suite context.
export function findModule(moduleKey) {
  for (const suite of SUITES) {
    const m = (suite.modules || []).find((x) => x.key === moduleKey);
    if (m) return { ...m, suiteKey: suite.key, suiteName: suite.name };
  }
  return null;
}
