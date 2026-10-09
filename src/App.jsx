import React, { useEffect, useMemo, useRef, useSyncExternalStore, useState } from "react";
import {
  blogPosts,
  faqs,
  footerLinks,
  agentPhases,
  navItems,
  processSteps,
  services,
  testimonials,
} from "./content.js";
import nexumLogo from "./assets/source-logo-wide.png";
import badgeSpark from "./assets/badge-chip.svg";
import whatWeBuildDashboard from "./assets/framer-images/what-we-build-dashboard-platform.webp";
import reviewWomanAvatar from "./assets/framer-images/what-we-build-woman-yellow.webp";
import systemsArchitectureVisual from "./assets/framer-images/systems-architecture.webp";
import systemsStrategyVisual from "./assets/framer-images/systems-strategy.webp";
import systemsPerformanceVisual from "./assets/framer-images/systems-performance.webp";
import scenePresenter from "./assets/framer-images/analyze.webp";
import sceneAiWindow from "./assets/framer-images/create.webp";
import sceneConsulting from "./assets/framer-images/operate.webp";
import abstractDashboard from "./assets/framer-images/optimize.webp";
import abstractSystem from "./assets/framer-images/execute.webp";
import phoneVertical from "./assets/framer-images/what-we-build-dashboard-platform.webp";
import melinaKuehnPortrait from "./assets/founders/melina-kuehn.jpeg";
import luiseRimolaPortrait from "./assets/founders/luise-rimola.jpeg";
import googleLogo from "./assets/brand/google-g.svg";
import microsoftLogo from "./assets/brand/microsoft.svg";
import heroVideo from "./assets/hero/hero-scroll.mp4";
import heroVideoMobile from "./assets/hero/hero-scroll-mobile.mp4";
import heroVideoPoster from "./assets/hero/hero-scroll-poster.jpg";
import agentsDemoUrl from "./assets/spielwieseagentsdemo.html?url";
import previewInfoUrl from "./assets/preview-info-input.html?url";
import previewModuleUrl from "./assets/preview-choose-module.html?url";
import previewValidateUrl from "./assets/preview-validate.html?url";
import previewContactUrl from "./assets/preview-contact.html?url";
import { LanguageProvider, useI18n, LANGS } from "./i18n.jsx";
import { SUITES, PACKAGES, COMPANY_SECTIONS, COLLECTIONS, CONNECTORS, PHASES, INDUSTRIES, packageByKey, collectionByKey, allModules, moduleCategory, industryHint, industryConfig, opLabel, fieldLabel, kpiLabel } from "./modules.js";
import { supabase, supabaseEnabled, recovery } from "./supabase.js";
import { api, isLocalId, downloadText, printHtml } from "./platformApi.js";
import { markdownToHtml, resultText } from "./markdown.js";
import MonthlyChart from "./MonthlyChart.jsx";
import { DEMO_USER, installDemoApi } from "./demoApi.js";
import { monthlySeries, PERIODS, inPeriod, periodMonths } from "./finance.js";
import { parseCsv, mapHeaders, rowsToRecords } from "./csv.js";

const PerfContext = React.createContext({ lite: false, setLite: () => {} });

function usePerf() {
  return React.useContext(PerfContext);
}

function PerfProvider({ children }) {
  const [lite, setLiteState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem("nexum_perf");
      if (saved === "lite") return true;
      if (saved === "full") return false;
    } catch (e) {}
    // No explicit choice yet -> quick auto-detection from device signals.
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    } catch (e) {}
    const mem = navigator.deviceMemory;         // approx RAM in GB (Chrome)
    const cores = navigator.hardwareConcurrency; // logical CPU cores
    if ((mem && mem <= 2) || (cores && cores <= 2)) return true;
    return false;
  });

  const setLite = (value) => {
    setLiteState(value);
    try { window.localStorage.setItem("nexum_perf", value ? "lite" : "full"); } catch (e) {}
  };

  useEffect(() => {
    try { document.documentElement.setAttribute("data-lite", lite ? "1" : "0"); } catch (e) {}
  }, [lite]);

  // Measure the real frame rate for ~1.2s. If the device can't keep a smooth
  // frame rate, switch to lite mode automatically. Skipped once the visitor
  // has made an explicit choice via the footer toggle.
  useEffect(() => {
    let explicit = false;
    try { explicit = !!window.localStorage.getItem("nexum_perf"); } catch (e) {}
    if (explicit) return undefined;

    let raf = 0;
    let frames = 0;
    let start = 0;
    const step = (now) => {
      if (!start) start = now;
      frames += 1;
      const elapsed = now - start;
      if (elapsed < 1200) {
        raf = window.requestAnimationFrame(step);
      } else if ((frames * 1000) / elapsed < 50) {
        setLiteState(true);
      }
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return <PerfContext.Provider value={{ lite, setLite }}>{children}</PerfContext.Provider>;
}

function subscribeToLocation(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  window.addEventListener("locationchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("locationchange", callback);
  };
}

function currentLocation() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.hash}`;
}

function useLocationPath() {
  return useSyncExternalStore(subscribeToLocation, currentLocation, () => "/");
}

function navigateTo(to) {
  try {
    const next = new URL(to, window.location.origin);
    if (next.origin !== window.location.origin) {
      window.location.assign(next.href);
      return;
    }
    window.history.pushState({}, "", `${next.pathname}${next.search}${next.hash}`);
    window.dispatchEvent(new Event("locationchange"));
    if (next.hash) {
      window.setTimeout(() => document.getElementById(next.hash.slice(1))?.scrollIntoView(), 0);
    } else {
      window.scrollTo({ top: 0 });
    }
  } catch {
    window.location.assign(to);
  }
}

// Beta: sign-in/sign-up stay hidden until VITE_AUTH_OPEN=true; visitors book a call instead.
// VITE_BOOKING_URL can point to an external scheduler (e.g. a Cal.com event); default is the contact page.
const AUTH_OPEN = import.meta.env.VITE_AUTH_OPEN === "true";
const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || "/contact";

function BookCallButton({ className = "primary-button glow-button", children, arrow = false }) {
  const { t } = useI18n();
  const content = <>{children || t.btn.bookCall}{arrow && <> <ArrowRight size={18} /></>}</>;
  if (BOOKING_URL.startsWith("/")) return <Link className={className} to={BOOKING_URL}>{content}</Link>;
  return <a className={className} href={BOOKING_URL} target="_blank" rel="noreferrer">{content}</a>;
}

function BetaAccess() {
  return (
    <div className="beta-access">
      <p className="plat-saved"><Zap size={15} /> Private beta: access by invitation.</p>
      <p>Book a short call and we will set up your platform with you.</p>
      <BookCallButton arrow />
    </div>
  );
}

function Link({ to, children, onClick, ...props }) {
  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigateTo(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

function NavLink({ to, children, className = "", ...props }) {
  const current = useLocationPath().split("#")[0] || "/";
  const active = current === to;
  return (
    <Link to={to} className={`${className} ${active ? "active" : ""}`.trim()} {...props}>
      {children}
    </Link>
  );
}

function Icon({ size = 20, children }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ArrowRight = (props) => <Icon {...props}><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></Icon>;
const Bot = (props) => <Icon {...props}><rect x="5" y="9" width="14" height="10" rx="3" /><path d="M12 5v4" /><path d="M9 14h.01" /><path d="M15 14h.01" /></Icon>;
const BrainCircuit = (props) => <Icon {...props}><path d="M9 3a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 4 4" /><path d="M15 3a4 4 0 0 1 4 4v1a4 4 0 0 1 0 8v1a4 4 0 0 1-4 4" /><path d="M9 8h6" /><path d="M9 16h6" /><path d="M12 8v8" /></Icon>;
const Check = (props) => <Icon {...props}><path d="m20 6-11 11-5-5" /></Icon>;
const ChevronLeft = (props) => <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>;
const Cpu = (props) => <Icon {...props}><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 1v3" /><path d="M15 1v3" /><path d="M9 20v3" /><path d="M15 20v3" /><path d="M20 9h3" /><path d="M20 15h3" /><path d="M1 9h3" /><path d="M1 15h3" /></Icon>;
const LayoutDashboard = (props) => <Icon {...props}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></Icon>;
const Mail = (props) => <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>;
const MapPin = (props) => <Icon {...props}><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></Icon>;
const Menu = (props) => <Icon {...props}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icon>;
const Phone = (props) => <Icon {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.64a16 16 0 0 0 6.36 6.36l1.21-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92Z" /></Icon>;
const ShieldCheck = (props) => <Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Icon>;
const Sparkles = (props) => <Icon {...props}><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></Icon>;
const Workflow = (props) => <Icon {...props}><rect x="3" y="4" width="6" height="6" rx="1" /><rect x="15" y="14" width="6" height="6" rx="1" /><path d="M9 7h3a4 4 0 0 1 4 4v3" /><path d="M12 11h4" /></Icon>;
const X = (props) => <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const Zap = (props) => <Icon {...props}><path d="M13 2 3 14h8l-1 8 11-13h-8z" /></Icon>;
const Globe = (props) => <Icon {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>;

const systemsToolsItems = [
  {
    title: "Custom-Built Architecture",
    text: "We design every AI system around your exact business model and workflows. No generic setups or reused frameworks. Our architecture integrates cleanly with your tools, data, and operations.",
    image: systemsArchitectureVisual,
  },
  {
    title: "Strategy-First Approach",
    text: "Every project begins with a deep analysis of your processes, bottlenecks, and growth goals before automation is built.",
    image: systemsStrategyVisual,
  },
  {
    title: "Business-Focused AI",
    text: "Our systems are built with performance and revenue in mind, ensuring every workflow supports business growth.",
    image: whatWeBuildDashboard,
  },
  {
    title: "Long-Term Partnership Model",
    text: "NEXUM continuously monitors performance, refines workflows, and evolves your AI infrastructure as you scale.",
    image: abstractSystem,
  },
  {
    title: "Performance-Driven Execution",
    text: "Every deployment is tracked, measured, and optimized to maintain consistent long-term operational results.",
    image: systemsPerformanceVisual,
  },
];

const reviewAvatars = [
  systemsStrategyVisual,
  reviewWomanAvatar,
  scenePresenter,
  whatWeBuildDashboard,
];

const founders = [
  {
    name: "Melina Kühn",
    role: "CEO & CMO",
    description:
      "Melina leads NEXUM Intelligence's corporate strategy, product vision, brand development, go-to-market direction and growth strategy. She brings experience in AI transformation, business development, leadership, change management and marketing. She is also pursuing a doctorate in Human-AI Interactions with a focus on the acceptance of AI agents in companies, connecting scientific expertise with entrepreneurial practice.",
    image: melinaKuehnPortrait,
    imagePosition: "50% 12%",
  },
  {
    name: "Luise Rimola",
    role: "CEO & CTO",
    description:
      "Luise leads NEXUM Intelligence's technical strategy, product development, IT architecture and operational execution. She brings experience in company leadership, software development, process automation and IT security, with more than three years in Identity & Access Management and IT security. Her focus is on scalable AI and automation solutions, intelligent agent system integration and the secure technical implementation of complex business processes.",
    image: luiseRimolaPortrait,
    imagePosition: "47% 31%",
  },
];

// Scroll-driven background video (landing page). The page's scroll progress scrubs
// through the clip; the files are encoded with a keyframe every 4 frames so seeking is
// smooth. Lite mode / reduced motion show the still frame. The previous hero (particle
// sphere + 3D logo) is archived in archive/landing-2026-10-08.
function ScrollVideoBackground() {
  const videoRef = useRef(null);
  const { lite } = usePerf();
  const [still] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [src] = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? heroVideoMobile : heroVideo));
  // Scrubbing a paused video is cheap, so only an explicit "Reduce animations" choice
  // (footer toggle, stored as nexum_perf=lite) or the OS setting shows the still frame —
  // not the automatic low-frame-rate detection, which often triggers while the video loads.
  let explicitLite = false;
  try { explicitLite = lite && window.localStorage.getItem("nexum_perf") === "lite"; } catch (e) {}
  const animate = !explicitLite && !still;

  useEffect(() => {
    document.body.classList.add("has-scroll-video");
    return () => document.body.classList.remove("has-scroll-video");
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!animate || !v) return;
    let raf = 0, current = 0;
    const target = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      return p * Math.max(0, (v.duration || 0) - 0.05);
    };
    // ease towards the scroll position so fast scrolling still looks fluid
    const tick = () => {
      raf = 0;
      if (!v.duration) return;
      const t = target();
      current += (t - current) * 0.25;
      if (Math.abs(t - current) < 0.01) current = t;
      if (Math.abs(v.currentTime - current) > 0.005) v.currentTime = current;
      if (current !== t) raf = requestAnimationFrame(tick);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onReady = () => { current = target(); v.currentTime = current; };
    v.addEventListener("loadedmetadata", onReady);
    if (v.readyState >= 1) onReady();
    // iOS Safari only allows seeking after the video has been "played" once
    const unlock = v.play && v.play();
    if (unlock && unlock.then) unlock.then(() => { v.pause(); current = target(); v.currentTime = current; }).catch(() => {});
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadedmetadata", onReady);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [animate]);

  return (
    <div className="scroll-video" aria-hidden="true">
      {animate
        ? <video ref={videoRef} src={src} poster={heroVideoPoster} muted playsInline preload="auto" disablePictureInPicture />
        : <img src={heroVideoPoster} alt="" />}
      <div className="scroll-video-shade" />
    </div>
  );
}

function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="hero reference-hero">
      <div className="hero-copy">
        <Link className="hero-badge hero-platform-chip" to="/use-case-demo">
          <span className="hero-badge-icon"><img src={badgeSpark} alt="" /></span>
          {t.btn.explorePlatform}
        </Link>
        <h1>
          {t.hero.l1}<br />
          {t.hero.l2}<br />
          {t.hero.l3}
        </h1>
        <p className="hero-statement">
          {t.hero.statement}
        </p>
        <div className="hero-actions">
          <BookCallButton />
        </div>
      </div>
    </section>
  );
}

function LanguageSelector({ variant = "desktop" }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current = LANGS.find((item) => item.code === lang) || LANGS[0];

  return (
    <div className={`lang-select lang-${variant}`} ref={ref}>
      <button
        type="button"
        className="lang-button"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={18} />
        <span className="lang-code">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {LANGS.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                role="option"
                aria-selected={item.code === lang}
                className={item.code === lang ? "active" : ""}
                onClick={() => { setLang(item.code); setOpen(false); }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const navLabels = [
    { label: t.nav.whatWeBuild, href: "/agent-platform" },
    { label: t.nav.howItWorks, href: "/how-it-works" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  return (
    <header className="site-header">
      <Link className="brand nexum-brand" to="/" aria-label="NEXUM Intelligence home">
        <img src={nexumLogo} alt="NEXUM Intelligence" />
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navLabels.filter((item) => item.href !== "/contact").map((item) => (
          <NavLink key={item.href} to={item.href}>
            {item.label.toUpperCase()}
          </NavLink>
        ))}
      </nav>
      <div className="header-right">
        <Link className="header-mail" to="/contact" aria-label="Contact form">
          <Mail size={18} />
        </Link>
        <LanguageSelector />
        <Link className="header-cta glow-button" to="/potential-analysis">{t.btn.platform}</Link>
      </div>
      <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>
      {open && (
        <div className="mobile-menu">
          <button className="menu-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
          {navLabels.map((item) => (
            <NavLink key={item.href} to={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <Link className="header-cta glow-button mobile-menu-cta" to="/potential-analysis" onClick={() => setOpen(false)}>{t.btn.platform}</Link>
          <LanguageSelector variant="mobile" />
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t, lang } = useI18n();
  const { lite, setLite } = usePerf();
  const perfLabel = { en: "Reduce animations", de: "Animationen reduzieren", es: "Reducir animaciones", fr: "Réduire les animations" }[lang] || "Reduce animations";
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Link className="brand nexum-brand footer-brand" to="/">
            <img src={nexumLogo} alt="NEXUM Intelligence" />
          </Link>
          <p>{t.footer.tagline}</p>
        </div>
        <div className="footer-nav">
          <div className="footer-links">
            {footerLinks.map((link, i) => (
              <Link key={link.href} to={link.href}>
                {t.footer.links[i] || link.label}
              </Link>
            ))}
            <Link to="/legal/privacy-policy">Privacy Policy</Link>
            <Link to="/legal/cookie-policy">Cookie Policy</Link>
          </div>
          <Link className="footer-cta glow-button" to="/potential-analysis">
            AGENT PLATFORM
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="copyright">© 2026 NEXUM Intelligence. All rights reserved.</div>
        <button
          type="button"
          className={`perf-toggle ${lite ? "active" : ""}`}
          onClick={() => setLite(!lite)}
          aria-pressed={lite}
        >
          <span className="perf-dot" aria-hidden="true" />
          {perfLabel}
        </button>
      </div>
    </footer>
  );
}

function Shell({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

function SectionIntro({ label, title, text, align = "center" }) {
  return (
    <div className={`section-intro ${align}`}>
      {label && <p className="section-label">{label}</p>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

// Awards. `logo` takes the official award artwork once it is available
// (e.g. import cvFemaleLeaders from "./assets/awards/....png") — until then a
// NEXUM-styled badge is shown. Do not use Corporate Vision's own logo without their permission.
const AWARDS = [
  { title: "Emerging Female Leaders in Agentic AI", year: "2026", region: "", programme: "Small Business Awards 2026", host: "Corporate Vision", logo: null },
  { title: "Business Innovation Excellence Award", year: "2026", region: "Germany", programme: "Small Business Awards 2026", host: "Corporate Vision", logo: null },
];

function Laurel({ side }) {
  // one branch of leaves from bottom-left up to top-left; mirrored for the right side
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const deg = 118 + i * 19;
    const a = deg * (Math.PI / 180);
    const x = 60 + Math.cos(a) * 44, y = 58 + Math.sin(a) * 44;
    const rot = deg + 25;
    return <ellipse key={i} cx={x} cy={y} rx="4.2" ry="10" transform={`rotate(${rot} ${x} ${y})`} />;
  });
  return <g className="award-laurel" transform={side === "right" ? "translate(120 0) scale(-1 1)" : undefined}>{leaves}</g>;
}

function AwardBadge({ award }) {
  if (award.logo) return <img className="award-logo" src={award.logo} alt={`${award.title} ${award.year} – ${award.programme}`} />;
  return (
    // colours and type follow Corporate Vision's brand (navy #00132f, white,
    // turquoise #6ec2b7, geometric sans); shape and mark are NEXUM's own — not their logo
    <svg className="award-badge" viewBox="0 0 120 120" role="img" aria-label={`${award.title} ${award.year}`}>
      <Laurel side="left" />
      <Laurel side="right" />
      <circle cx="60" cy="58" r="31" fill="#00132f" stroke="#6ec2b7" strokeWidth="2.5" />
      <circle cx="60" cy="58" r="25.5" fill="none" stroke="#5da9a6" strokeWidth="0.8" opacity="0.7" />
      <text x="60" y="56" textAnchor="middle" className="award-badge-sub">WINNER</text>
      <text x="60" y="70" textAnchor="middle" className="award-badge-year">{award.year}</text>
    </svg>
  );
}

function AwardsSection({ compact = false }) {
  return (
    <section className={`awards-section ${compact ? "is-compact" : ""}`} aria-labelledby="awards-title">
      <div className="awards-inner">
        <span className="outline-pill">Awards</span>
        <h2 id="awards-title">Recognised for Innovation</h2>
        <p className="awards-intro">NEXUM Intelligence has been recognised in the Small Business Awards 2026 by Corporate Vision.</p>
        <div className="awards-grid">
          {AWARDS.map((a) => (
            <article className="award-card" key={a.title}>
              <AwardBadge award={a} />
              <div>
                <h3>{a.title} {a.year}{a.region ? ` – ${a.region}` : ""}</h3>
                <span>{a.programme} · {a.host}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustImpactSection() {
  const { t } = useI18n();
  return (
    <section id="impact" className="impact-section">
      <div className="impact-inner">
        <span className="outline-pill">{t.nav.about}</span>
        <h2>Trust &amp; Impact</h2>
        <div className="impact-copy">
          <p>{t.impact.title1}<br />{t.impact.title2}</p>
          <span className="impact-arrow" aria-hidden="true" />
          <p>{t.impact.sub1}<br />{t.impact.sub2}</p>
        </div>
        <div className="impact-stats-grid">
          {[
            ["40% Average", "Workflow Automation", <Workflow size={50} />],
            ["3x Faster", "Operational Output", <Zap size={52} />],
            ["24/7 AI Execution", "& Overhead", <RefreshIcon />],
            ["Enterprise-Level", "Security & Scalability", <ShieldCheck size={52} />],
          ].map(([top, bottom, icon]) => (
            <article className="impact-stat-card" key={`${top}-${bottom}`}>
              <span className="stat-icon">{icon}</span>
              <strong>{top}<br />{bottom}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function KeywordMarquee() {
  const mutedTerms = ["BRANDING", "UI DESIGN", "Creative Digital", "BUSINESS CONSULTING", "PPC", "SEO"];
  const heroTerms = ["AUTOMATION", "AI AGENTS", "STRATEGY", "INTELLIGENCE"];
  const renderTerms = (terms, repeats = 3) =>
    Array.from({ length: repeats }, (_, repeat) => (
      <React.Fragment key={repeat}>
        {terms.map((term) => (
          <React.Fragment key={`${repeat}-${term}`}>
            <span>{term}</span>
            <b>✦</b>
          </React.Fragment>
        ))}
      </React.Fragment>
    ));

  return (
    <div className="keyword-marquee" aria-hidden="true">
      <div className="keyword-row muted-row">
        {renderTerms(mutedTerms, 4)}
      </div>
      <div className="keyword-row hero-row">
        {renderTerms(heroTerms, 4)}
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <Icon size={52}>
      <path d="M20 11a8 8 0 1 0 1.2 6" />
      <path d="M20 5v6h-6" />
    </Icon>
  );
}

function WhatWeBuildSection({ standalone = false }) {
  const { t } = useI18n();
  return (
    <section id="build" className={`build-showcase ${standalone ? "page-section" : "is-compact"}`}>
      <div className="build-title">
        <h2 className="build-heading">
          <span>NEXUM Intelligence Builds</span>
          <span>AI Systems That Don&apos;t</span>
          <span>Just Assist - They Operate.</span>
        </h2>
        <span className="asterisk" aria-hidden="true">*</span>
      </div>
      <div className="build-layout">
        {standalone && (
          <article className="build-visual-card">
            <span className="outline-pill">{t.build.label.toUpperCase()}</span>
            <h3>{t.build.title}</h3>
            <img src={whatWeBuildDashboard} alt="AI operations dashboard visual" />
          </article>
        )}
        <div className="build-service-list">
          {t.build.services.map((service, index) => (
            <article className="build-service-row" key={service.title} tabIndex={0}>
              <span className="service-line-icon">
                {index === 0 && <Workflow size={48} />}
                {index === 1 && <Bot size={48} />}
                {index === 2 && <FunnelIcon />}
                {index === 3 && <LayoutDashboard size={48} />}
              </span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecurityComplianceSection() {
  const { t } = useI18n();
  const s = t.security;
  return (
    <section id="security" className="section security-section">
      <SectionIntro label={s.pill} title={s.title} text={s.intro} />
      <div className="security-grid">
        {s.items.map((item) => (
          <article className="security-card" key={item.name}>
            <span className="security-badge"><ShieldCheck size={20} /></span>
            <div>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SystemsToolsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = systemsToolsItems[activeIndex];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % systemsToolsItems.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section id="systems-tools" className="systems-tools-section">
      <div className="systems-tools-head">
        <div>
          <span className="outline-pill">WHY NEXUM INTELLIGENCE</span>
          <h2>
            We Build Systems.
            <br />
            Others Build Tools.
          </h2>
        </div>
        <div className="systems-tools-copy">
          <p>Most agencies deliver<br />automation tools.</p>
          <p>We deliver<br />intelligent ecosystems.</p>
        </div>
      </div>

      <div className="systems-tools-panel">
        <div className="systems-tools-tabs" role="tablist" aria-label="NEXUM system advantages">
          {systemsToolsItems.map((item, index) => (
            <button
              className={`systems-tool-tab ${activeIndex === index ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              key={item.title}
              onClick={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item.title}
            </button>
          ))}
        </div>

        <article className="systems-tools-card">
          <img src={activeItem.image} alt={`${activeItem.title} visual`} />
          <h3>{activeItem.title}</h3>
          <p>{activeItem.text}</p>
        </article>
      </div>
    </section>
  );
}

function FunnelIcon() {
  return (
    <Icon size={48}>
      <path d="M4 5h16l-6 7v6l-4 2v-8z" />
      <circle cx="12" cy="16" r="1" />
    </Icon>
  );
}

const howItWorksSteps = [
  {
    num: "01",
    title: "Information Input",
    text: "Lets the Agents know all informations about your business and idea.",
  },
  {
    num: "02",
    title: "Choose your Module",
    text: "Pick the agent modules that match your current goal.",
  },
  {
    num: "03",
    title: "Give your Agents a Task and watch them work",
    text: "Assign a task and watch the autonomous agents execute it end-to-end.",
    demo: true,
  },
  {
    num: "04",
    title: "Validate the Outcome",
    text: "Give the agents feedback until you are happy with the results.",
  },
  {
    num: "05",
    title: "Contact us for your individual Setup",
    text: "We build your tailored agent setup around your business.",
  },
];

// Adds "is-in" once the element scrolls into view (used for fly-in panels).
function useFlyIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = [...el.querySelectorAll("[data-fly]")];
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((i) => i.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);
  return ref;
}

function WorkPhasesSection() {
  const { t } = useI18n();
  const flyRef = useFlyIn();
  return (
    <section id="works" className="work-steps-section">
      <span className="outline-pill">{t.works.pill}</span>
      <h2>{t.works.title}</h2>
      <div className="work-actions">
        <Link className="secondary-button" to="/agent-platform">{t.btn.getToKnowAgents}</Link>
      </div>
      <div className="work-step-panel is-fly" ref={flyRef}>
        {t.works.phases.map((phase) => (
          <div className="work-step-slot" key={phase.num} data-fly>
            <article className="work-step" tabIndex={0}>
              <div>
                <span>{phase.num}</span>
                <h3>{phase.title}</h3>
                <p>{phase.text}</p>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}

// Mounts a preview iframe only while it's near the viewport, so off-screen
// previews don't keep running their animation loops (perf win on /how-it-works).
function LazyFrame({ src, title, style }) {
  const holderRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = holderRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0].isIntersecting),
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={holderRef} className="how-step-holder" style={style}>
      {visible && <iframe className="how-step-demo-fill" src={src} title={title} loading="lazy" />}
    </div>
  );
}

function HowItWorksSection({ standalone = false }) {
  const { t } = useI18n();
  const stepPreviews = [previewInfoUrl, previewModuleUrl, agentsDemoUrl, previewValidateUrl, previewContactUrl];
  // Content heights measured in a real browser (Playwright), max over the animation.
  // d = desktop (> 720px), m = mobile (<= 720px). Set from React so it never depends
  // on a script running inside the framed document.
  const demoHeights = [
    { d: 412, m: 432 }, // 01 Information Input
    { d: 382, m: 428 }, // 02 Choose your Module
    { d: 500, m: 576 }, // 03 Agents demo (Agent Studio)
    { d: 378, m: 420 }, // 04 Validate the Outcome
    { d: 470, m: 546 }, // 05 Individual Setup
  ];
  return (
    <section id="works" className={`work-steps-section ${standalone ? "page-section" : ""}`}>
      <span className="outline-pill">{t.works.pill}</span>
      <h2>{t.works.title}</h2>
      {!standalone && (
        <div className="work-actions">
          <Link className="secondary-button" to="/agent-platform">{t.btn.getToKnowAgents}</Link>
        </div>
      )}
      <div className="how-steps">
        {t.works.steps.map((step, i) => (
          <article className="how-step" key={step.num}>
            <div className="how-step-head">
              <span className="how-step-num">{step.num}</span>
              <div className="how-step-copy">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
            <div className="how-step-media">
              <div className="how-step-demo-wrap">
                <LazyFrame
                  src={stepPreviews[i]}
                  title={`${step.title} preview`}
                  style={{ "--demo-h": `${demoHeights[i].d}px`, "--demo-h-m": `${demoHeights[i].m}px` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function InfrastructureSection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const infrastructureFeatures = [
    {
      label: "Centralized AI Workflow Control",
      image: abstractSystem,
      alt: "Abstract AI workflow interface",
    },
    {
      label: "Prompt & Model Management",
      image: sceneAiWindow,
      alt: "AI model management dashboard",
    },
    {
      label: "Performance Monitoring Dashboard",
      image: abstractDashboard,
      alt: "Performance analytics dashboard",
    },
    {
      label: "Secure Data Layer",
      image: phoneVertical,
      alt: "Secure mobile data interface",
    },
    {
      label: "Continuous System Optimization",
      image: sceneConsulting,
      alt: "AI operations optimization visual",
    },
  ];
  const activeItem = infrastructureFeatures[activeFeature];

  return (
    <section className="section infrastructure">
      <SectionIntro
        title="Your AI Infrastructure. Managed. Scalable. Intelligent."
        text="Centralized AI workflow control, prompt and model management, performance monitoring, secure data layers, and continuous optimization."
      />
      <div className="dashboard-mock">
        <div className="dashboard-tabs">
          {infrastructureFeatures.map((item, index) => (
            <button
              className={`dash-row ${activeFeature === index ? "active" : ""}`}
              type="button"
              key={item.label}
              onClick={() => setActiveFeature(index)}
              onFocus={() => setActiveFeature(index)}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <Check size={18} /> {item.label}
            </button>
          ))}
        </div>
        <figure className="dashboard-visual-panel">
          <img src={activeItem.image} alt={activeItem.alt} />
          <figcaption>{activeItem.label}</figcaption>
        </figure>
      </div>
    </section>
  );
}

function WhyNexumSection() {
  const carouselItems = [
    "Prompt & Model Management",
    "Performance Monitoring Dashboard",
    "Secure Data Layer",
    "Continuous System Optimization",
    "Centralized AI Workflow Control",
  ];
  const loopItems = [...carouselItems, ...carouselItems];

  return (
    <section id="why-nexum" className="ai-systems-section">
      <div className="ai-systems-copy">
        <span className="outline-pill">AI SYSTEMS</span>
        <h2>
          Your AI
          <br />
          Infrastructure.
          <br />
          Managed.
          <br />
          Scalable. Intelligent.
        </h2>
      </div>
      <p className="ai-systems-vertical">Ionyx CMS Gives You</p>
      <div className="ai-systems-carousel" aria-label="AI infrastructure features">
        <div className="ai-systems-track">
          {loopItems.map((item, index) => (
            <article className="ai-system-pill" key={`${item}-${index}`}>
              <span className="ai-system-check"><Check size={19} /></span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegacyAiSystemsSection() {
  return <WhyNexumSection />;
}

function TestimonialsSection() {
  const reviewItems = testimonials.map((quote, index) => ({
    ...quote,
    avatar: reviewAvatars[index] || reviewAvatars[0],
    text:
      index === 0
        ? "NEXUM Intelligence completely restructured how we operate internally. What started as a simple automation project evolved into a fully integrated AI system that improved reporting, lead qualification, and support workflows. The clarity in strategy and execution made the impact measurable within weeks."
        : quote.text,
  }));
  const [activeReview, setActiveReview] = useState(0);
  const selectedReview = reviewItems[activeReview];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActiveReview((current) => (current + 1) % reviewItems.length);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [activeReview, reviewItems.length]);

  return (
    <section id="testimonials" className="reviews-section">
      <div className="reviews-hero-row">
        <h2>
          NEXUM Intelligence
          <br />
          Doesn&apos;t Plug AI
          <br />
          into Your Business.
        </h2>
        <img className="reviews-emblem" src={badgeSpark} alt="" />
        <p>
          We rebuild
          <br />
          your business
          <br />
          with AI Agents.
        </p>
      </div>

      <div className="reviews-panel">
        <div className="reviews-layout">
          <div className="reviews-copy">
            <span className="outline-pill">TESTIMONIALS</span>
            <h3>
              Proof We
              <br />
              Know What
              <br />
              We&apos;re Doing
            </h3>
          </div>

          <article
            className="review-card"
            id="review-panel"
            role="tabpanel"
            aria-labelledby={`review-tab-${activeReview}`}
          >
            <span className="review-quote-mark" aria-hidden="true">&rdquo;</span>
            <div className="review-card-head">
              <img src={selectedReview.avatar} alt={`${selectedReview.name} avatar`} />
              <div>
                <strong>{selectedReview.name}</strong>
                <span>{selectedReview.role}</span>
              </div>
            </div>
            <p>{selectedReview.text}</p>
          </article>
        </div>

        <div className="review-selector" role="tablist" aria-label="Testimonials">
          {reviewItems.map((quote, index) => (
            <button
              className={`review-person ${activeReview === index ? "active" : ""}`}
              type="button"
              role="tab"
              id={`review-tab-${index}`}
              aria-controls="review-panel"
              aria-selected={activeReview === index}
              key={quote.name}
              onClick={() => setActiveReview(index)}
              onFocus={() => setActiveReview(index)}
              onMouseEnter={() => setActiveReview(index)}
            >
              <img src={quote.avatar} alt="" />
              <span>
                <strong>{quote.name}</strong>
                <em>{quote.role}</em>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useI18n();
  return (
    <section className="section faq-section">
      <SectionIntro title={t.faqTitle} />
      <div className="faq-list">
        {t.faqs.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
      <p className="muted center">Not found the answer you&apos;re looking for? <Link to="/contact">{t.nav.contact}</Link></p>
    </section>
  );
}

function AboutIntroSection() {
  return (
    <section className="about-intro-section">
      <span className="outline-pill">About NEXUM Intelligence</span>
      <h1>
        Building Autonomous AI Systems
        <br />
        for the Next Generation of Business.
      </h1>
      <p>
        Nexum Intelligence empowers startups, agencies, and growing companies to turn
        complex operations into fully autonomous AI systems. We combine strategic
        intelligence, multi-agent autonomy, and high-performance system design to create
        solutions that understand your business, run workflows end-to-end, and deliver
        measurable impact at scale.
      </p>
      <img src={whatWeBuildDashboard} alt="AI systems interface operated by a business strategist" />
    </section>
  );
}

function FoundersSection() {
  return (
    <section className="founders-section">
      <div className="founders-heading">
        <span className="outline-pill">FOUNDERS</span>
        <h2>The people building NEXUM Intelligence</h2>
      </div>
      <div className="founder-grid">
        {founders.map((founder) => (
          <article className="founder-card" key={founder.name}>
            <img
              src={founder.image}
              alt={`${founder.name} portrait`}
              style={{ objectPosition: founder.imagePosition }}
            />
            <div>
              <h3>{founder.name}</h3>
              <span>{founder.role}</span>
              <p>{founder.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <Shell>
      <main>
        <HeroSection />

        <section id="impact" className="band">
          <SectionIntro
            label="About"
            title="Real Systems. Real Transformation."
            text="We do not experiment with AI. We engineer intelligent business systems that deliver measurable impact from day one."
          />
          <div className="stats-grid">
            {["40% Average Workflow Automation", "3x Faster Operational Output", "24/7 AI Execution & Overhead", "Enterprise-Level Security & Scalability"].map((stat) => (
              <div className="stat-card" key={stat}>{stat}</div>
            ))}
          </div>
        </section>

        <section id="build" className="section">
          <SectionIntro
            label="Why NEXUM Intelligence"
            title="What We Build"
            text="NEXUM Intelligence builds AI systems that autonomously think, orchestrate, and execute end-to-end."
          />
          <div className="service-grid">
            {services.map((service, index) => (
              <article className="feature-card" key={service.title}>
                <span className="card-index">0{index + 1}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="works" className="section split">
          <div>
            <p className="section-label">Work</p>
            <h2>How NEXUM Intelligence Works</h2>
          </div>
          <div className="process-list">
            {processSteps.map(([num, title, text]) => (
              <article className="process-row" key={title}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <LegacyAiSystemsSection />

        <section id="testimonials" className="band">
          <SectionIntro label="Testimonials" title="Proof We Know What We’re Doing" />
          <div className="testimonial-grid">
            {testimonials.map((quote) => (
              <article className="testimonial" key={quote.name}>
                <p>“{quote.text}”</p>
                <strong>{quote.name}</strong>
                <span>{quote.role}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section faq-section">
          <SectionIntro title="Frequently Asked Questions" />
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="muted center">Not found the answer you’re looking for? <Link to="/contact">Contact us</Link></p>
        </section>

        <CTA />
      </main>
    </Shell>
  );
}

function AboutPage() {
  return (
    <Shell>
      <main>
        <HeroSection />
        <section className="band">
          <SectionIntro title="Trust & Impact" text="We combine strategy, automation, and thoughtful design to create solutions that improve efficiency and drive measurable impact." />
          <div className="stats-grid">
            <div className="stat-card">40% Average Workflow Automation</div>
            <div className="stat-card">3x Faster Operational Output</div>
            <div className="stat-card">24/7 AI Execution & Overhead</div>
            <div className="stat-card">Enterprise-Level Security & Scalability</div>
          </div>
        </section>
        <LegacyAiSystemsSection />
        <CTA />
      </main>
    </Shell>
  );
}

function HomePageV2() {
  return (
    <Shell>
      <ScrollVideoBackground />
      <main>
        <HeroSection />
        <TrustImpactSection />
        <AwardsSection />
        <WhatWeBuildSection />
        <SecurityComplianceSection />
        <SystemsToolsSection />
        <WorkPhasesSection />
        <WhyNexumSection />
        <TestimonialsSection />
        <FAQSection />
        <CTA />
      </main>
    </Shell>
  );
}

function AboutPageV2() {
  return (
    <Shell>
      <main>
        <AboutIntroSection />
        <FoundersSection />
        <AwardsSection compact />
        <TrustImpactSection />
        <WhyNexumSection />
        <TestimonialsSection />
        <CTA />
      </main>
    </Shell>
  );
}

function WhatWeBuildPage() {
  return (
    <Shell>
      <main>
        <WhatWeBuildSection standalone />
        <SecurityComplianceSection />
        <WhyNexumSection />
        <CTA />
      </main>
    </Shell>
  );
}

function HowItWorksPage() {
  return (
    <Shell>
      <main>
        <HowItWorksSection standalone />
        <FAQSection />
        <CTA />
      </main>
    </Shell>
  );
}

function AgentPlatformPage() {
  return (
    <Shell>
      <main>
        <SubHero
          label="Agent Platform"
          title="Explore the Autonomous Agent Platform"
          text="A modular agent platform for analysis, creation, operation, optimization and execution."
        />
        <section className="section agent-platform-section">
          <div className="agent-phase-grid">
            {agentPhases.map((phase) => (
              <article className="agent-phase-card" key={phase.title}>
                <span>{phase.num}</span>
                <h2>{phase.title}</h2>
                <p>{phase.text}</p>
                <div className="agent-list">
                  {phase.agents.map(([name, output, status]) => (
                    <div className="agent-row" key={name}>
                      <div>
                        <strong>{name}</strong>
                        <p>{output}</p>
                      </div>
                      <em>{status}</em>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <CTA />
      </main>
    </Shell>
  );
}

const scoreFields = [
  ["Business Stage", ["Idea / Concept", "MVP", "Growing Company", "Established Business"]],
  ["Main Objective", ["Validate Market Potential", "Automate Operations", "Increase Revenue", "Scale Delivery"]],
  ["Industry Focus", ["B2B Services", "SaaS / Software", "E-Commerce", "Consulting", "Other"]],
  ["Automation Maturity", ["Manual Processes", "Basic Tools", "Partly Automated", "AI-Ready Stack"]],
];

function SignInModal({ onClose, onSignIn }) {
  if (supabaseEnabled) {
    return (
      <div className="login-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
        <div className="login-modal" role="dialog" aria-modal="true" aria-label="Sign in">
          <button className="login-modal-close" type="button" onClick={onClose} aria-label="Close sign in"><X size={22} /></button>
          <PlatformAuth embedded initialMode="signup" />
        </div>
      </div>
    );
  }
  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="signin-title">
        <button className="login-modal-close" type="button" onClick={onClose} aria-label="Close sign in">
          <X size={22} />
        </button>
        <span className="outline-pill">SIGN IN REQUIRED</span>
        <h2 id="signin-title">Sign in to unlock your Potential Score</h2>
        <p>
          Create your NEXUM account to save the analysis, compare scenarios and receive
          agent recommendations for your business idea.
        </p>
        <div className="provider-grid">
          <button type="button" onClick={onSignIn}><img src={googleLogo} alt="" /> Continue with Google</button>
          <button type="button" onClick={onSignIn}><img src={microsoftLogo} alt="" /> Continue with Microsoft</button>
        </div>
        <form className="modal-signin-form" onSubmit={(event) => { event.preventDefault(); onSignIn(); }}>
          <label>
            Email
            <input type="email" placeholder="you@company.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" />
          </label>
          <button className="primary-button glow-button" type="submit">Sign in and continue</button>
        </form>
      </div>
    </div>
  );
}

function AgentRobot({ color = "#818cf8" }) {
  return (
    <svg viewBox="0 0 80 80" width="132" height="132" fill="none" aria-hidden="true">
      <rect x="32" y="66" width="6" height="9" rx="3" fill="#26426e" />
      <rect x="42" y="66" width="6" height="9" rx="3" fill="#26426e" />
      <rect x="21" y="36" width="6" height="15" rx="3" fill={color} />
      <rect x="53" y="36" width="6" height="15" rx="3" fill={color} />
      <rect x="26" y="32" width="28" height="30" rx="10" fill={color} />
      <text x="40" y="52" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700" fill="rgba(255,255,255,.55)">{">-"}</text>
      <rect x="23" y="2" width="34" height="30" rx="9" fill="#12203c" stroke="#3f6aa8" strokeWidth="2" />
      <text x="40" y="21" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700" fill="#7de3ff">{">_"}</text>
    </svg>
  );
}

const ArrowLeft = (props) => <Icon {...props}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Icon>;

// ============================================================================
// AI Readiness Test — step-by-step questionnaire, rule-based scoring,
// lead + company capture (before the result), stored via /api/lead.
// ============================================================================
const READINESS = {
  en: {
    kicker: "Business Potential Check",
    title: "How much untapped potential is hidden in your business?",
    intro: "Answer 10 quick questions and get your personal Business Potential score across 10 areas — plus where your biggest growth levers and blind spots really are.",
    start: "Start the test",
    step: "Step", of: "of", next: "Next", back: "Back", toResult: "Almost there",
    dimensions: [
      { key: "positioning", label: "Positioning & USP", question: "How clearly can you explain why customers choose you over the competition?",
        options: [ { label: "We're honestly not sure", points: 0 }, { label: "A rough idea", points: 1 }, { label: "A clear USP we can name", points: 2 }, { label: "A sharp, tested positioning we lead with", points: 3 } ] },
      { key: "idealCustomer", label: "Ideal Customer", question: "Do you know which customer group is the most profitable and easiest to win?",
        hint: "In most businesses a small segment drives the majority of the profit — but few can actually name it.",
        options: [ { label: "We treat every customer the same", points: 0 }, { label: "A gut feeling", points: 1 }, { label: "We've identified a core segment", points: 2 }, { label: "A data-backed ideal-customer profile", points: 3 } ] },
      { key: "marketInsight", label: "Market & Demand", question: "Do you know where demand is growing — and where your product could be most popular?",
        hint: "Spotting which regions, channels or niches are heating up lets you aim before competitors do.",
        options: [ { label: "No real overview", points: 0 }, { label: "We follow it loosely", points: 1 }, { label: "We track our main market", points: 2 }, { label: "We map demand and act on it early", points: 3 } ] },
      { key: "earlyWarning", label: "Early-Warning Signals", question: "Do you catch early-warning signals before they hit your revenue?",
        hint: "Rising churn, shrinking margins, slower sales cycles or fewer repeat orders often appear months before the numbers drop.",
        options: [ { label: "We notice problems once they hurt", points: 0 }, { label: "Sometimes, by chance", points: 1 }, { label: "We watch a few key indicators", points: 2 }, { label: "We monitor signals and act early", points: 3 } ] },
      { key: "offerPricing", label: "Offer & Pricing", question: "How confident are you that your pricing reflects the value you deliver?",
        hint: "Pricing on cost or habit instead of value is one of the most common ways businesses leave money on the table.",
        options: [ { label: "We rarely revisit pricing", points: 0 }, { label: "Priced on cost or competitors", points: 1 }, { label: "We test pricing sometimes", points: 2 }, { label: "Value-based and regularly optimised", points: 3 } ] },
      { key: "marketing", label: "Marketing & Acquisition", question: "How predictable and measurable is your customer acquisition?",
        options: [ { label: "Mostly word of mouth / luck", points: 0 }, { label: "We try things, hard to measure", points: 1 }, { label: "A few channels we can measure", points: 2 }, { label: "A predictable, measured engine", points: 3 } ] },
      { key: "retention", label: "Customer Loyalty", question: "Do you know why customers stay or leave — and act on it?",
        options: [ { label: "We don't really track it", points: 0 }, { label: "We hear the odd anecdote", points: 1 }, { label: "We measure retention", points: 2 }, { label: "We know the drivers and improve them", points: 3 } ] },
      { key: "decisions", label: "Data & Decisions", question: "How much do your important decisions rely on data rather than gut feeling?",
        options: [ { label: "Mostly gut", points: 0 }, { label: "Some numbers when handy", points: 1 }, { label: "Regular reports guide us", points: 2 }, { label: "Decisions are data-driven", points: 3 } ] },
      { key: "aiAutomation", label: "AI & Automation Leverage", question: "Do you know where AI or automation could save the most time or unlock growth for you?",
        options: [ { label: "Haven't looked into it", points: 0 }, { label: "Curious, no clear picture", points: 1 }, { label: "A few ideas in mind", points: 2 }, { label: "High-impact opportunities mapped", points: 3 } ] },
      { key: "growthPlan", label: "Growth Strategy", question: "Do you have a clear, prioritised plan for your next growth step?",
        options: [ { label: "No real plan", points: 0 }, { label: "Ideas, not prioritised", points: 1 }, { label: "A plan we loosely follow", points: 2 }, { label: "A prioritised roadmap we execute", points: 3 } ] },
    ],
    levels: [
      { min: 0, label: "Hidden Potential", blurb: "There's real untapped potential in your business. A clear outside view would surface quick wins you can't see from the inside." },
      { min: 40, label: "Emerging Strength", blurb: "You have solid foundations. Sharpening focus on your best customers and biggest levers can accelerate growth fast." },
      { min: 65, label: "Growth-Ready", blurb: "Strong position. Close a few blind spots and set the right priorities, and you're ready to scale." },
      { min: 85, label: "Market Leader", blurb: "You operate at a high level. Your edge now comes from compounding small advantages and reading signals early." },
    ],
    form: {
      heading: "Where should we send your result?",
      sub: "Enter your details to unlock your readiness score and tailored breakdown.",
      name: "Full name", email: "Work email", company: "Company", phone: "Phone", website: "Website", industry: "Industry",
      challenge: "Your biggest challenge or goal (optional)",
      consent: "I agree that NEXUM Intelligence may store my details and contact me about my result.",
      privacy: "Privacy policy",
      submit: "Unlock my result", sending: "Analysing…",
      required: "Please fill in name, email & company and accept the privacy note.",
    },
    industries: ["Software / SaaS", "E-Commerce / Retail", "Manufacturing", "Professional Services", "Finance / Insurance", "Healthcare", "Marketing / Agency", "Logistics", "Other"],
    result: {
      pill: "Your Business Potential", dimensionsTitle: "Your potential by area", recTitle: "Recommended next steps",
      ctaTitle: "Want the full picture?", ctaText: "Book a free 30-minute call with a NEXUM business expert and we'll turn this score into a concrete growth plan.",
      cta: "Book my strategy call", restart: "Retake the test",
      thanks: "Result sent to our team — we'll be in touch shortly.",
    },
    recs: {
      "Hidden Potential": ["Pin down your most profitable, easiest-to-win customer segment.", "Map where demand for your offer is actually growing.", "Book a free potential call to surface your quickest wins."],
      "Emerging Strength": ["Focus your marketing on your highest-value segment.", "Set up 2–3 early-warning indicators for revenue.", "Turn your best growth idea into a prioritised plan."],
      "Growth-Ready": ["Close your biggest blind spot before you scale.", "Move to value-based pricing to lift margins.", "Sequence your growth moves by ROI with an expert sparring partner."],
      "Market Leader": ["Systematise your early-warning monitoring.", "Double down on your most profitable niches.", "Use AI & automation to compound your lead."],
    },
  },
  de: {
    kicker: "Business-Potenzial-Check",
    title: "Wie viel ungenutztes Potenzial steckt in deinem Unternehmen?",
    intro: "Beantworte 10 kurze Fragen und erhalte deinen persönlichen Business-Potenzial-Score über 10 Bereiche — plus wo deine größten Wachstumshebel und blinden Flecken wirklich liegen.",
    start: "Test starten",
    step: "Schritt", of: "von", next: "Weiter", back: "Zurück", toResult: "Fast geschafft",
    dimensions: [
      { key: "positioning", label: "Positionierung & USP", question: "Wie klar kannst du erklären, warum Kunden dich statt der Konkurrenz wählen?",
        options: [ { label: "Ehrlich gesagt unklar", points: 0 }, { label: "Eine grobe Idee", points: 1 }, { label: "Ein klares USP, das wir benennen können", points: 2 }, { label: "Eine scharfe, getestete Positionierung", points: 3 } ] },
      { key: "idealCustomer", label: "Idealkunde", question: "Weißt du, welche Kundengruppe am profitabelsten und am leichtesten zu gewinnen ist?",
        hint: "In den meisten Unternehmen bringt ein kleines Segment den Großteil des Gewinns — nur wenige können es benennen.",
        options: [ { label: "Wir behandeln alle Kunden gleich", points: 0 }, { label: "Ein Bauchgefühl", points: 1 }, { label: "Wir haben ein Kernsegment identifiziert", points: 2 }, { label: "Ein datenbasiertes Idealkundenprofil", points: 3 } ] },
      { key: "marketInsight", label: "Markt & Nachfrage", question: "Weißt du, wo die Nachfrage wächst — und wo dein Produkt am beliebtesten sein könnte?",
        hint: "Zu erkennen, welche Regionen, Kanäle oder Nischen gerade heiß laufen, lässt dich zielen, bevor die Konkurrenz es tut.",
        options: [ { label: "Kein echter Überblick", points: 0 }, { label: "Wir verfolgen es lose", points: 1 }, { label: "Wir beobachten unseren Hauptmarkt", points: 2 }, { label: "Wir kartieren Nachfrage und handeln früh", points: 3 } ] },
      { key: "earlyWarning", label: "Frühwarnsignale", question: "Erkennst du Frühwarnsignale, bevor sie deinen Umsatz treffen?",
        hint: "Steigende Abwanderung, schrumpfende Margen, längere Verkaufszyklen oder weniger Wiederkäufe zeigen sich oft Monate, bevor die Zahlen fallen.",
        options: [ { label: "Wir merken Probleme, wenn sie wehtun", points: 0 }, { label: "Manchmal, eher zufällig", points: 1 }, { label: "Wir beobachten ein paar Kennzahlen", points: 2 }, { label: "Wir überwachen Signale und handeln früh", points: 3 } ] },
      { key: "offerPricing", label: "Angebot & Preis", question: "Wie sicher bist du, dass dein Preis den gelieferten Wert widerspiegelt?",
        hint: "Nach Kosten oder Gewohnheit statt nach Wert zu bepreisen ist einer der häufigsten Wege, Geld liegen zu lassen.",
        options: [ { label: "Wir überdenken Preise selten", points: 0 }, { label: "Preis nach Kosten oder Wettbewerb", points: 1 }, { label: "Wir testen Preise gelegentlich", points: 2 }, { label: "Wertbasiert und regelmäßig optimiert", points: 3 } ] },
      { key: "marketing", label: "Marketing & Gewinnung", question: "Wie planbar und messbar ist deine Kundengewinnung?",
        options: [ { label: "Meist Mundpropaganda / Zufall", points: 0 }, { label: "Wir probieren, schwer messbar", points: 1 }, { label: "Ein paar messbare Kanäle", points: 2 }, { label: "Eine planbare, messbare Maschine", points: 3 } ] },
      { key: "retention", label: "Kundenbindung", question: "Weißt du, warum Kunden bleiben oder gehen — und handelst du danach?",
        options: [ { label: "Wir erfassen es kaum", points: 0 }, { label: "Wir hören mal Anekdoten", points: 1 }, { label: "Wir messen die Bindung", points: 2 }, { label: "Wir kennen die Treiber und verbessern sie", points: 3 } ] },
      { key: "decisions", label: "Daten & Entscheidungen", question: "Wie stark beruhen deine wichtigen Entscheidungen auf Daten statt Bauchgefühl?",
        options: [ { label: "Meist Bauchgefühl", points: 0 }, { label: "Ein paar Zahlen, wenn zur Hand", points: 1 }, { label: "Regelmäßige Reports leiten uns", points: 2 }, { label: "Entscheidungen sind datenbasiert", points: 3 } ] },
      { key: "aiAutomation", label: "KI- & Automatisierungs-Hebel", question: "Weißt du, wo KI oder Automatisierung dir am meisten Zeit sparen oder Wachstum bringen könnte?",
        options: [ { label: "Noch nicht angeschaut", points: 0 }, { label: "Neugierig, kein klares Bild", points: 1 }, { label: "Ein paar Ideen im Kopf", points: 2 }, { label: "Wirkungsvolle Chancen identifiziert", points: 3 } ] },
      { key: "growthPlan", label: "Wachstumsstrategie", question: "Hast du einen klaren, priorisierten Plan für deinen nächsten Wachstumsschritt?",
        options: [ { label: "Kein echter Plan", points: 0 }, { label: "Ideen, nicht priorisiert", points: 1 }, { label: "Ein Plan, dem wir lose folgen", points: 2 }, { label: "Eine priorisierte Roadmap, die wir umsetzen", points: 3 } ] },
    ],
    levels: [
      { min: 0, label: "Verborgenes Potenzial", blurb: "In deinem Unternehmen steckt echtes ungenutztes Potenzial. Ein klarer Blick von außen deckt schnelle Erfolge auf, die man von innen nicht sieht." },
      { min: 40, label: "Wachsende Stärke", blurb: "Du hast solide Grundlagen. Mehr Fokus auf deine besten Kunden und größten Hebel bringt spürbar Tempo." },
      { min: 65, label: "Wachstumsbereit", blurb: "Starke Position. Schließe ein paar blinde Flecken und setze die richtigen Prioritäten — dann bist du bereit zu skalieren." },
      { min: 85, label: "Marktführer", blurb: "Du agierst auf hohem Niveau. Dein Vorsprung kommt jetzt aus vielen kleinen Vorteilen und dem frühen Lesen von Signalen." },
    ],
    form: {
      heading: "Wohin sollen wir dein Ergebnis schicken?",
      sub: "Gib deine Daten ein, um deinen Readiness-Score und die Auswertung freizuschalten.",
      name: "Vollständiger Name", email: "Geschäftliche E-Mail", company: "Unternehmen", phone: "Telefon", website: "Website", industry: "Branche",
      challenge: "Deine größte Herausforderung oder dein Ziel (optional)",
      consent: "Ich bin einverstanden, dass NEXUM Intelligence meine Daten speichert und mich zu meinem Ergebnis kontaktiert.",
      privacy: "Datenschutz",
      submit: "Ergebnis freischalten", sending: "Analysiere…",
      required: "Bitte Name, E-Mail & Unternehmen ausfüllen und den Datenschutzhinweis akzeptieren.",
    },
    industries: ["Software / SaaS", "E-Commerce / Handel", "Produktion / Industrie", "Dienstleistung", "Finanzen / Versicherung", "Gesundheit", "Marketing / Agentur", "Logistik", "Sonstige"],
    result: {
      pill: "Dein Business-Potenzial", dimensionsTitle: "Dein Potenzial nach Bereich", recTitle: "Empfohlene nächste Schritte",
      ctaTitle: "Willst du das volle Bild?", ctaText: "Buche ein kostenloses 30-Minuten-Gespräch mit einem NEXUM Business-Experten und wir machen aus diesem Score einen konkreten Wachstumsplan.",
      cta: "Strategiegespräch buchen", restart: "Test wiederholen",
      thanks: "Ergebnis an unser Team gesendet — wir melden uns in Kürze.",
    },
    recs: {
      "Verborgenes Potenzial": ["Dein profitabelstes, am leichtesten gewinnbares Kundensegment festlegen.", "Kartieren, wo die Nachfrage nach deinem Angebot wirklich wächst.", "Kostenloses Potenzial-Gespräch für deine schnellsten Erfolge buchen."],
      "Wachsende Stärke": ["Marketing auf dein wertvollstes Segment fokussieren.", "2–3 Frühwarn-Kennzahlen für den Umsatz einrichten.", "Deine beste Wachstumsidee in einen priorisierten Plan überführen."],
      "Wachstumsbereit": ["Deinen größten blinden Fleck schließen, bevor du skalierst.", "Auf wertbasierte Preise umstellen, um Margen zu heben.", "Wachstumsschritte nach ROI ordnen — mit einem Experten als Sparringspartner."],
      "Marktführer": ["Deine Frühwarn-Überwachung systematisieren.", "Auf deine profitabelsten Nischen doppelt setzen.", "KI & Automatisierung nutzen, um deinen Vorsprung auszubauen."],
    },
  },
};

function readinessLevel(dict, score) {
  let chosen = dict.levels[0];
  for (const l of dict.levels) if (score >= l.min) chosen = l;
  return chosen;
}

function ReadinessTest() {
  const { lang } = useI18n();
  const dict = READINESS[lang] || READINESS.en;
  const dims = dict.dimensions;
  const TOTAL = dims.length;

  const [stage, setStage] = useState("quiz"); // quiz | form | result
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ name: "", email: "", company: "", phone: "", website: "", industry: "", challenge: "", consent: false });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const maxPoints = TOTAL * 3;
  const sumPoints = dims.reduce((s, d) => s + (answers[d.key] ?? 0), 0);
  const score = Math.round((sumPoints / maxPoints) * 100);
  const level = readinessLevel(dict, score);
  const perDim = dims.map((d) => ({ key: d.key, label: d.label, pct: Math.round(((answers[d.key] ?? 0) / 3) * 100) }));

  const choose = (dimKey, points) => {
    setAnswers((a) => ({ ...a, [dimKey]: points }));
    const last = step >= TOTAL - 1;
    setTimeout(() => { if (last) setStage("form"); else setStep(step + 1); }, 190);
  };

  const goBack = () => {
    if (stage === "form") { setStage("quiz"); setStep(TOTAL - 1); return; }
    if (step > 0) setStep(step - 1);
  };

  const setField = (k, v) => setContact((c) => ({ ...c, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!contact.name || !contact.email || !contact.company || !contact.consent) { setError(dict.form.required); return; }
    setError(""); setSending(true);
    const payload = {
      contact, score, level: level.label,
      dimensions: perDim, answers: dims.map((d) => ({ dimension: d.label, question: d.question, points: answers[d.key] ?? 0 })),
      lang, source: "readiness-test",
    };
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) setSent(true);
    } catch (err) { /* backend not configured yet — still show the result */ }
    setSending(false);
    setStage("result");
  };

  const progressPct = stage === "result" ? 100 : Math.round(((stage === "form" ? TOTAL : step) / TOTAL) * 100);

  return (
    <section className="readiness">
      <div className="readiness-head">
        <span className="outline-pill"><Zap size={14} /> {dict.kicker}</span>
        <h1>{dict.title}</h1>
      </div>

      <div className="readiness-card">
        {stage !== "result" && (
          <div className="readiness-progress" aria-hidden="true"><span style={{ width: `${progressPct}%` }} /></div>
        )}

        {stage === "quiz" && (() => {
          const d = dims[step];
          const selected = answers[d.key];
          return (
            <div className="readiness-quiz">
              <div className="readiness-step-meta">{dict.step} {step + 1} {dict.of} {TOTAL} · {d.label}</div>
              <h2 className="readiness-question">{d.question}</h2>
              {d.hint && <p className="readiness-hint">{d.hint}</p>}
              <div className="readiness-options">
                {d.options.map((o) => (
                  <button type="button" key={o.label}
                    className={`readiness-option ${selected === o.points ? "is-selected" : ""}`}
                    onClick={() => choose(d.key, o.points)}>
                    <span className="readiness-dot" />{o.label}
                  </button>
                ))}
              </div>
              <div className="readiness-nav">
                <button type="button" className="readiness-back" onClick={goBack} disabled={step === 0}><ArrowLeft size={16} /> {dict.back}</button>
              </div>
            </div>
          );
        })()}

        {stage === "form" && (
          <form className="readiness-form" onSubmit={submit}>
            <div className="readiness-step-meta">{dict.toResult} · {dict.step} {TOTAL} {dict.of} {TOTAL}</div>
            <h2 className="readiness-question">{dict.form.heading}</h2>
            <p className="readiness-form-sub">{dict.form.sub}</p>
            <div className="readiness-fields">
              <label>{dict.form.name} *<input value={contact.name} onChange={(e) => setField("name", e.target.value)} required /></label>
              <label>{dict.form.email} *<input type="email" value={contact.email} onChange={(e) => setField("email", e.target.value)} required /></label>
              <label>{dict.form.company} *<input value={contact.company} onChange={(e) => setField("company", e.target.value)} required /></label>
              <label>{dict.form.phone}<input value={contact.phone} onChange={(e) => setField("phone", e.target.value)} /></label>
              <label>{dict.form.website}<input value={contact.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://" /></label>
              <label>{dict.form.industry}
                <select value={contact.industry} onChange={(e) => setField("industry", e.target.value)}>
                  <option value="">—</option>
                  {dict.industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </label>
              <label className="readiness-full">{dict.form.challenge}<textarea rows="3" value={contact.challenge} onChange={(e) => setField("challenge", e.target.value)} /></label>
            </div>
            <label className="readiness-consent">
              <input type="checkbox" checked={contact.consent} onChange={(e) => setField("consent", e.target.checked)} />
              <span>{dict.form.consent} <Link to="/legal/privacy-policy">{dict.form.privacy}</Link>.</span>
            </label>
            {error && <p className="readiness-error">{error}</p>}
            <div className="readiness-nav">
              <button type="button" className="readiness-back" onClick={goBack}><ArrowLeft size={16} /> {dict.back}</button>
              <button type="submit" className="primary-button glow-button" disabled={sending}>
                {sending ? dict.form.sending : dict.form.submit} <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {stage === "result" && (
          <div className="readiness-result">
            <span className="outline-pill">{dict.result.pill}</span>
            <div className="readiness-score-row">
              <div className={`readiness-score-badge tone-${level.min >= 85 ? "green" : level.min >= 65 ? "indigo" : level.min >= 40 ? "sky" : "amber"}`}>
                <strong>{score}%</strong><span>{level.label}</span>
              </div>
              <p className="readiness-blurb">{level.blurb}</p>
            </div>

            <h3 className="readiness-sub-title">{dict.result.dimensionsTitle}</h3>
            <div className="readiness-dims">
              {perDim.map((d) => (
                <div className="readiness-dim" key={d.key}>
                  <div className="readiness-dim-head"><span>{d.label}</span><b>{d.pct}%</b></div>
                  <div className="readiness-dim-bar"><span style={{ width: `${d.pct}%` }} /></div>
                </div>
              ))}
            </div>

            <h3 className="readiness-sub-title">{dict.result.recTitle}</h3>
            <ul className="readiness-recs">
              {(dict.recs[level.label] || []).map((r) => <li key={r}><Check size={17} /> {r}</li>)}
            </ul>

            <div className="readiness-cta">
              <div>
                <strong>{dict.result.ctaTitle}</strong>
                <p>{dict.result.ctaText}</p>
                {sent && <p className="readiness-thanks"><Check size={15} /> {dict.result.thanks}</p>}
              </div>
              <BookCallButton arrow>{dict.result.cta}</BookCallButton>
            </div>
            <button type="button" className="readiness-restart" onClick={() => { setAnswers({}); setStep(0); setContact({ name: "", email: "", company: "", phone: "", website: "", industry: "", challenge: "", consent: false }); setSent(false); setStage("quiz"); }}>{dict.result.restart}</button>
          </div>
        )}
      </div>
    </section>
  );
}

const Lock = (props) => <Icon {...props}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>;

const SUITE_ICONS = {
  foundation: ShieldCheck, strategy: Sparkles, venture: Zap, growth: Globe,
  operations: LayoutDashboard, intelligence: BrainCircuit, execution: Workflow, specialist: Cpu,
};

const RUN_STATUS = {
  queued: { label: "Queued", tone: "amber" },
  running: { label: "Running", tone: "sky" },
  needs_input: { label: "Needs your input", tone: "amber" },
  done: { label: "Completed", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  error: { label: "Error", tone: "red" },
};

function sessionToUser(session) {
  if (!session || !session.user) return null;
  const u = session.user; const md = u.user_metadata || {};
  return { email: u.email, id: u.id, name: md.name || md.full_name || u.email, company: md.company || "", industry: md.industry || "other", needsOnboarding: !md.industry };
}

function usePlatformUser() {
  const [user, setUser] = useState(() => {
    if (supabaseEnabled) return null;
    try { return JSON.parse(window.localStorage.getItem("nexum_user") || "null"); } catch (e) { return null; }
  });
  const [ready, setReady] = useState(!supabaseEnabled);
  useEffect(() => {
    if (!supabaseEnabled) return;
    let sub;
    // keep the same object across token refreshes so effects keyed on the user don't re-run
    const apply = (session) => setUser((prev) => {
      const next = sessionToUser(session);
      if (prev && next && prev.email === next.email && prev.name === next.name && prev.industry === next.industry && prev.company === next.company && prev.needsOnboarding === next.needsOnboarding) return prev;
      return next;
    });
    supabase.auth.getSession().then(({ data }) => { apply(data.session); setReady(true); }).catch(() => setReady(true));
    const res = supabase.auth.onAuthStateChange((_e, session) => apply(session));
    sub = res && res.data && res.data.subscription;
    return () => { if (sub) sub.unsubscribe(); };
  }, []);
  const save = async (u) => {
    if (supabaseEnabled) {
      if (u === null) { try { await supabase.auth.signOut(); } catch (e) {} setUser(null); }
      return;
    }
    setUser(u);
    try {
      if (u) window.localStorage.setItem("nexum_user", JSON.stringify(u));
      else window.localStorage.removeItem("nexum_user");
    } catch (e) {}
  };
  return [user, save, ready];
}

// OAuth buttons only for providers that are enabled in Supabase, e.g. VITE_AUTH_PROVIDERS=google,azure
const OAUTH_PROVIDERS = String(import.meta.env.VITE_AUTH_PROVIDERS || "").split(",").map((s) => s.trim()).filter(Boolean);

function PlatformAuth({ embedded = false, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [f, setF] = useState({ name: "", email: "", password: "", company: "", industry: "" });
  const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    if (!f.email || (mode !== "reset" && !f.password)) { setErr(mode === "reset" ? "Please enter your email." : "Email and password are required."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!f.industry) { setErr("Please pick your industry."); setBusy(false); return; }
        const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { name: f.name, company: f.company, industry: f.industry }, emailRedirectTo: `${window.location.origin}/platform` } });
        if (error) setErr(error.message);
        else if (!(data && data.session)) setMsg("Account created — check your email to confirm, then sign in.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: `${window.location.origin}/platform?reset=1` });
        if (error) setErr(error.message); else setMsg("If an account exists, we've sent you a link to set a new password.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) setErr(error.message);
      }
    } catch (e2) { setErr(String(e2)); }
    setBusy(false);
  };
  const oauth = async (provider) => {
    setErr("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/platform` } });
      if (error) setErr(error.message);
    } catch (e2) { setErr(String(e2)); }
  };
  return (
    <div className={embedded ? "plat-auth-embedded" : "plat-auth"}><div className={`plat-auth-card ${embedded ? "is-embedded" : ""}`}>
      {!embedded && <span className="outline-pill"><LayoutDashboard size={14} /> NEXUM Platform</span>}
      <h1>{mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Sign in"}</h1>
      <p>{mode === "signup" ? "Your industry tailors the platform to your business." : mode === "reset" ? "We'll email you a link to set a new password." : "Welcome back."}</p>
      {mode !== "reset" && OAUTH_PROVIDERS.length > 0 && <div className="signin-provider-list">
        {OAUTH_PROVIDERS.includes("google") && <button type="button" onClick={() => oauth("google")}><img src={googleLogo} alt="" /> Continue with Google</button>}
        {OAUTH_PROVIDERS.includes("azure") && <button type="button" onClick={() => oauth("azure")}><img src={microsoftLogo} alt="" /> Continue with Microsoft</button>}
      </div>}
      {mode !== "reset" && OAUTH_PROVIDERS.length > 0 && <div className="plat-auth-or"><span>or</span></div>}
      <form onSubmit={submit}>
        {mode === "signup" && <label>Full name<input value={f.name} onChange={(e) => set("name", e.target.value)} /></label>}
        <label>Email<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required /></label>
        {mode !== "reset" && <label>Password<input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} required minLength={mode === "signup" ? 8 : undefined} /></label>}
        {mode === "signup" && <label>Company<input value={f.company} onChange={(e) => set("company", e.target.value)} /></label>}
        {mode === "signup" && <label>Industry
          <select value={f.industry} onChange={(e) => set("industry", e.target.value)} required>
            <option value="">— select your industry —</option>
            {INDUSTRIES.filter((i) => i.key !== "other").map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}
            <option value="other">Other</option>
          </select>
        </label>}
        {err && <p className="plat-err">{err}</p>}
        {msg && <p className="plat-saved"><Check size={15} /> {msg}</p>}
        <button className="primary-button glow-button" type="submit" disabled={busy}>{busy ? "…" : (mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in")} <ArrowRight size={18} /></button>
      </form>
      {mode === "signin" && <button type="button" className="plat-auth-switch" onClick={() => { setMode("reset"); setErr(""); setMsg(""); }}>Forgot your password?</button>}
      <button type="button" className="plat-auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); setMsg(""); }}>
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div></div>
  );
}

function PlatformSignIn({ onSignIn }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", industry: "" });
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setErr("Please enter your name and work email."); return; }
    if (!form.industry) { setErr("Please pick your industry — it tailors the platform to your business."); return; }
    onSignIn({ ...form });
  };
  return (
    <div className="plat-auth">
      <div className="plat-auth-card">
        <span className="outline-pill"><LayoutDashboard size={14} /> NEXUM Platform</span>
        <h1>Set up your platform</h1>
        <p>Your industry tailors the vocabulary and the tools you see.</p>
        <form onSubmit={submit}>
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Work email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label>Industry
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} required>
              <option value="">— select your industry —</option>
              {INDUSTRIES.filter((i) => i.key !== "other").map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}
              <option value="other">Other</option>
            </select>
          </label>
          {err && <p className="plat-err">{err}</p>}
          <button className="primary-button glow-button" type="submit">Enter platform <ArrowRight size={18} /></button>
        </form>
      </div>
    </div>
  );
}

const PLAT_ICONS = {
  shield: ShieldCheck, spark: Sparkles, compass: Globe, growth: Zap,
  rocket: Workflow, dashboard: LayoutDashboard, brain: BrainCircuit, cpu: Cpu,
};

// operations key -> [route, icon] for the industry-driven Operations nav
const OP_ROUTE = {
  customers: ["collection:customers", Globe], products: ["products", Sparkles],
  inventory: ["collection:inventory", LayoutDashboard], suppliers: ["collection:suppliers", Globe],
  purchasing: ["purchasing", Workflow], pos: ["pos", ShieldCheck], finance: ["finance", Cpu],
  transactions: ["collection:transactions", Workflow], marketing: ["collection:campaigns", Zap], staff: ["collection:staff", Bot],
};

// Map a module input field to the company-profile field it can be pre-filled from
// (the research agent writes into the company profile, which then feeds modules).
const MODULE_ALIAS = {
  idea: "description", oneLiner: "description", context: "description",
  targetMarket: "marketRegion", region: "marketRegion",
  customer: "targetCustomer", audience: "targetCustomer",
  businessName: "companyName", goal12m: "goals12m",
  currentRevenue: "revenue", offer: "mainOffer",
  competitorsBrands: "competitors", resources: "keyRoles", useOfFunds: "financialGoals",
};
function prefillFromCompany(fields, companyFlat) {
  const out = {};
  fields.forEach((f) => {
    let v = companyFlat[f.key];
    if (v == null || v === "") v = companyFlat[MODULE_ALIAS[f.key]];
    if (v == null || v === "") return;
    if (f.type === "select" && !(f.options || []).includes(v)) return;
    out[f.key] = v;
  });
  return out;
}

function PlatField({ f, value, onChange }) {
  return (
    <label className={f.type === "textarea" ? "plat-full" : ""}>
      {f.label}{f.required && <span className="plat-req"> *</span>}
      {f.type === "textarea" ? (
        <textarea rows="3" value={value || ""} onChange={(e) => onChange(f.key, e.target.value)} placeholder={f.placeholder || ""} />
      ) : f.type === "select" ? (
        <select value={value || ""} onChange={(e) => onChange(f.key, e.target.value)}>
          <option value="">—</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={value || ""} onChange={(e) => onChange(f.key, e.target.value)} placeholder={f.placeholder || ""} />
      )}
    </label>
  );
}

const EUR_COLS = new Set();
function fmtCell(value, kind) {
  if (kind === "eur") {
    if (value === "" || value == null) return "—";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
  return value === "" || value == null ? "—" : String(value);
}

function CollectionView({ collection, user, label, industryKey }) {
  const title = label || collection.name;
  const flabel = (f) => fieldLabel(industryKey, collection.key, f.key, f.label);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // "new" | id | null
  const [values, setValues] = useState({});
  const [err, setErr] = useState("");
  const Ico = PLAT_ICONS[collection.icon] || Sparkles;

  useEffect(() => {
    let ok = true; setLoading(true); setEditing(null);
    api(`/api/records?email=${encodeURIComponent(user.email)}&kind=${collection.key}`)
      .then((d) => { if (ok) { setRows(Array.isArray(d.records) ? d.records : []); setErr(""); } })
      .catch((e) => { if (ok) setErr(e.message); })
      .finally(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, [collection.key]);

  const startAdd = () => { setValues({}); setEditing("new"); setErr(""); };
  const startEdit = (row) => { setValues(row.data || {}); setEditing(row.id); setErr(""); };
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const missing = collection.fields.filter((f) => f.required && !values[f.key]);
    if (missing.length) { setErr("Please fill in the required fields."); return; }
    setErr("");
    if (editing === "new") {
      const optimistic = { id: `local-${Date.now()}`, created_at: new Date().toISOString(), kind: collection.key, data: values };
      setRows((r) => [optimistic, ...r]); setEditing(null);
      try {
        const d = await api("/api/records", { method: "POST", body: { email: user.email, kind: collection.key, data: values } });
        if (d.record) setRows((r) => [d.record, ...r.filter((x) => x.id !== optimistic.id)]);
      } catch (e2) {
        setRows((r) => r.filter((x) => x.id !== optimistic.id));
        setErr(`Not saved: ${e2.message}`); setValues(values); setEditing("new");
      }
    } else {
      const id = editing;
      const before = rows.find((x) => x.id === id);
      setRows((r) => r.map((x) => (x.id === id ? { ...x, data: values } : x))); setEditing(null);
      try {
        await api("/api/records", { method: "PATCH", body: { id, email: user.email, data: values } });
      } catch (e2) {
        if (before) setRows((r) => r.map((x) => (x.id === id ? before : x)));
        setErr(`Not saved: ${e2.message}`);
      }
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this entry?")) return;
    setRows((r) => r.filter((x) => x.id !== row.id));
    try { await api(`/api/records?id=${encodeURIComponent(row.id)}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" }); }
    catch (e) { setRows((r) => [row, ...r]); setErr(`Not deleted: ${e.message}`); }
  };

  const summary = collection.summary(rows.map((r) => r.data || {}));

  return (
    <div className="plat-view">
      <div className="plat-view-head">
        <h1><Ico size={22} /> {title}</h1>
        <p>{collection.intro}</p>
      </div>

      <div className="plat-kpis plat-kpis-3">
        {summary.map((k, idx) => (
          <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{kpiLabel(industryKey, collection.key, idx, k.label)} <InfoButton text={(collection.kpiInfo && collection.kpiInfo[idx]) || `Live metric from your ${title.toLowerCase()} data.`} /></span></div>
        ))}
      </div>

      <div className="plat-card">
        <div className="plat-table-top">
          <h3>{title}</h3>
          {editing == null && <button className="plat-start" onClick={startAdd}>Add {collection.singular} <ArrowRight size={15} /></button>}
        </div>

        {editing != null && (
          <form onSubmit={save} className="plat-form plat-record-form">
            {collection.fields.map((f) => <PlatField key={f.key} f={{ ...f, label: flabel(f) }} value={values[f.key]} onChange={set} />)}
            {err && <p className="plat-err plat-full">{err}</p>}
            <div className="plat-modal-actions plat-full">
              <button type="button" className="plat-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="primary-button glow-button">{editing === "new" ? "Add" : "Save"} <Check size={16} /></button>
            </div>
          </form>
        )}

        {err && editing == null && <p className="plat-err">{err}</p>}
        {loading ? (
          <p className="plat-empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="plat-empty">No {collection.name.toLowerCase()} yet. Add your first {collection.singular}.</p>
        ) : (
          <div className="plat-table-wrap">
            <table className="plat-table">
              <thead>
                <tr>{collection.columns.map((c) => <th key={c[0]}>{fieldLabel(industryKey, collection.key, c[0], c[1])}</th>)}<th aria-label="actions" /></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {collection.columns.map((c) => <td key={c[0]}>{fmtCell((row.data || {})[c[0]], c[2])}</td>)}
                    <td className="plat-row-actions">
                      <button onClick={() => startEdit(row)} aria-label="Edit">Edit</button>
                      <button onClick={() => remove(row)} aria-label="Delete" className="plat-del">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function money(n) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(n) || 0); }
function productCost(data, inventory) {
  return ((data && data.recipe) || []).reduce((sum, r) => {
    const it = inventory.find((i) => i.id === r.itemId);
    const uc = it ? Number((it.data || {}).unitCost) || 0 : 0;
    return sum + uc * (Number(r.qty) || 0);
  }, 0);
}

function ProductsView({ user, label, industryKey }) {
  const title = label || "Products";
  const fl = (k, fb) => fieldLabel(industryKey, "products", k, fb);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", status: "Active", recipe: [] });
  const [err, setErr] = useState("");

  const load = () => Promise.all([
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=products`).then((r) => r.json()),
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=inventory`).then((r) => r.json()),
  ]).then(([p, i]) => { setProducts(p.records || []); setInventory(i.records || []); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const startAdd = () => { setForm({ name: "", category: "", price: "", status: "Active", recipe: [] }); setEditing("new"); setErr(""); };
  const startEdit = (p) => { setForm({ name: "", category: "", price: "", status: "Active", recipe: [], ...(p.data || {}) }); setEditing(p.id); setErr(""); };
  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const addLine = () => setForm((s) => ({ ...s, recipe: [...(s.recipe || []), { itemId: "", qty: "" }] }));
  const setLine = (idx, k, v) => setForm((s) => ({ ...s, recipe: s.recipe.map((r, i) => (i === idx ? { ...r, [k]: v } : r)) }));
  const delLine = (idx) => setForm((s) => ({ ...s, recipe: s.recipe.filter((_, i) => i !== idx) }));

  const cost = productCost({ recipe: form.recipe }, inventory);
  const price = Number(form.price) || 0;
  const margin = price - cost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) { setErr("Name is required."); return; }
    const data = { ...form, cost };
    if (editing === "new") {
      const opt = { id: `local-${Date.now()}`, kind: "products", data };
      setProducts((p) => [opt, ...p]); setEditing(null);
      try { const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, kind: "products", data }) }); const d = await res.json().catch(() => ({})); if (d.record) setProducts((p) => [d.record, ...p.filter((x) => x.id !== opt.id)]); } catch (e2) {}
    } else {
      const id = editing; setProducts((p) => p.map((x) => (x.id === id ? { ...x, data } : x))); setEditing(null);
      try { await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, email: user.email, data }) }); } catch (e2) {}
    }
  };
  const remove = async (p) => { setProducts((x) => x.filter((y) => y.id !== p.id)); try { await fetch(`/api/records?id=${encodeURIComponent(p.id)}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" }); } catch (e) {} };

  const rows = products.map((p) => ({ id: p.id, ...(p.data || {}), _cost: productCost(p.data || {}, inventory) }));
  const avgMargin = rows.length ? Math.round(rows.reduce((s, r) => { const pr = Number(r.price) || 0; return s + (pr > 0 ? ((pr - r._cost) / pr) * 100 : 0); }, 0) / rows.length) : 0;

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Sparkles size={22} /> {title}</h1><p>Your {title.toLowerCase()} with their ingredients/goods, costs and margin. Costs come from Inventory.</p></div>

      <div className="plat-kpis plat-kpis-3">
        <div className="plat-kpi"><span className="plat-kpi-val">{rows.length}</span><span className="plat-kpi-label">Products</span></div>
        <div className="plat-kpi"><span className="plat-kpi-val">{rows.filter((r) => r.status === "Active").length}</span><span className="plat-kpi-label">Active</span></div>
        <div className="plat-kpi"><span className="plat-kpi-val">{avgMargin}%</span><span className="plat-kpi-label">Avg margin</span></div>
      </div>

      {inventory.length === 0 && <div className="plat-card"><p className="plat-empty">Tip: add your goods/ingredients under <b>Inventory</b> first, then attach them to a product to calculate cost &amp; profit.</p></div>}

      <div className="plat-card">
        <div className="plat-table-top"><h3>Products</h3>{editing == null && <button className="plat-start" onClick={startAdd}>Add product <ArrowRight size={15} /></button>}</div>

        {editing != null && (
          <form onSubmit={save} className="plat-record-form">
            <div className="plat-form">
              <label>{fl("name", "Name")}<span className="plat-req"> *</span><input value={form.name} onChange={(e) => setF("name", e.target.value)} /></label>
              <label>{fl("category", "Category")}<input value={form.category} onChange={(e) => setF("category", e.target.value)} /></label>
              <label>{fl("price", "Selling price (€)")}<input type="number" value={form.price} onChange={(e) => setF("price", e.target.value)} /></label>
              <label>Status<select value={form.status} onChange={(e) => setF("status", e.target.value)}><option>Active</option><option>Draft</option><option>Archived</option></select></label>
            </div>

            <div className="plat-recipe">
              <div className="plat-recipe-head"><b>Ingredients / goods</b><button type="button" className="plat-ghost" onClick={addLine}>+ Add ingredient</button></div>
              {(form.recipe || []).length === 0 ? <p className="plat-empty">No ingredients yet — add some to calculate cost.</p> : (form.recipe || []).map((line, idx) => {
                const it = inventory.find((i) => i.id === line.itemId);
                const uc = it ? Number((it.data || {}).unitCost) || 0 : 0;
                const lineCost = uc * (Number(line.qty) || 0);
                return (
                  <div className="plat-recipe-row" key={idx}>
                    <select value={line.itemId} onChange={(e) => setLine(idx, "itemId", e.target.value)}>
                      <option value="">— select item —</option>
                      {inventory.map((i) => <option key={i.id} value={i.id}>{(i.data || {}).name}{(i.data || {}).unit ? ` (${(i.data || {}).unit})` : ""}</option>)}
                    </select>
                    <input type="number" value={line.qty} onChange={(e) => setLine(idx, "qty", e.target.value)} placeholder="Qty" />
                    <span className="plat-recipe-cost">{money(lineCost)}</span>
                    <button type="button" className="plat-task-del" onClick={() => delLine(idx)} aria-label="Remove"><X size={14} /></button>
                  </div>
                );
              })}
            </div>

            <div className="plat-cost-summary">
              <span>Cost: <b>{money(cost)}</b></span><span>Price: <b>{money(price)}</b></span>
              <span className={margin >= 0 ? "plat-pos" : "plat-neg"}>Margin: <b>{money(margin)} ({marginPct}%)</b></span>
            </div>
            {err && <p className="plat-err">{err}</p>}
            <div className="plat-modal-actions"><button type="button" className="plat-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="primary-button glow-button">{editing === "new" ? "Add" : "Save"} <Check size={16} /></button></div>
          </form>
        )}

        {loading ? <p className="plat-empty">Loading…</p> : rows.length === 0 ? <p className="plat-empty">No products yet.</p> : (
          <div className="plat-table-wrap">
            <table className="plat-table">
              <thead><tr><th>{fl("name", "Name")}</th><th>{fl("category", "Category")}</th><th>{fl("price", "Price")}</th><th>Cost</th><th>Margin</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => { const pr = Number(r.price) || 0; const m = pr - r._cost; const mp = pr > 0 ? Math.round((m / pr) * 100) : 0; return (
                  <tr key={r.id}>
                    <td>{r.name}</td><td>{r.category || "—"}</td><td>{money(pr)}</td><td>{money(r._cost)}</td>
                    <td className={m >= 0 ? "plat-pos" : "plat-neg"}>{money(m)} ({mp}%)</td>
                    <td className="plat-row-actions"><button onClick={() => startEdit(products.find((p) => p.id === r.id))}>Edit</button><button className="plat-del" onClick={() => remove({ id: r.id })}>Delete</button></td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PosView({ user, label }) {
  const title = label || "Sales";
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => Promise.all([
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=products`).then((r) => r.json()),
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=inventory`).then((r) => r.json()),
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=sales`).then((r) => r.json()),
  ]).then(([p, i, s]) => { setProducts(p.records || []); setInventory(i.records || []); setSales(s.records || []); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const product = products.find((p) => p.id === pid);
  const unitPrice = product ? Number((product.data || {}).price) || 0 : 0;
  const unitCost = product ? (Number((product.data || {}).cost) || productCost(product.data || {}, inventory)) : 0;
  const q = Number(qty) || 0;
  const revenue = unitPrice * q, lineCost = unitCost * q, profit = revenue - lineCost;

  const [recording, setRecording] = useState(false);
  const record = async () => {
    if (!product || q <= 0 || recording) return;
    setRecording(true);
    // sale + income + stock in one database transaction (/api/ops)
    try {
      const d = await api("/api/ops", { method: "POST", body: { action: "sale", productId: pid, qty: q } });
      setSales((s) => [d.sale, ...s]);
      const ids = new Set(((product.data || {}).recipe || []).map((l) => l.itemId));
      if (ids.size) api(`/api/records?email=${encodeURIComponent(user.email)}&kind=inventory`).then((r) => setInventory(r.records || [])).catch(() => {});
      const low = (d.lowStock || []).map((x) => x.name).join(", ");
      setMsg(`Sale recorded — profit ${money((d.sale.data || {}).profit)}.${low ? ` Low stock: ${low}.` : ""}`);
      setQty("1");
    } catch (e) {
      if (e.status === 409) { // demo mode without database: show it locally only
        setSales((s) => [{ id: `local-${Date.now()}`, kind: "sales", data: { productId: pid, productName: (product.data || {}).name, qty: q, unitPrice, unitCost, revenue, cost: lineCost, profit, date: new Date().toISOString() } }, ...s]);
        setMsg(`Sale recorded locally (demo) — profit ${money(profit)}.`);
      } else setMsg(`Not booked: ${e.message}`);
    }
    window.setTimeout(() => setMsg(""), 6000);
    setRecording(false);
  };

  const sRows = sales.map((s) => s.data || {});
  const totRev = sRows.reduce((a, r) => a + (Number(r.revenue) || 0), 0);
  const totCogs = sRows.reduce((a, r) => a + (Number(r.cost) || 0), 0);
  const totProfit = totRev - totCogs;

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Sparkles size={22} /> {title}</h1><p>Record a sale — revenue, cost of goods and profit are calculated, income is booked and stock is reduced.</p></div>

      <div className="plat-kpis plat-kpis-3">
        <div className="plat-kpi"><span className="plat-kpi-val">{money(totRev)}</span><span className="plat-kpi-label">Revenue</span></div>
        <div className="plat-kpi"><span className="plat-kpi-val">{money(totCogs)}</span><span className="plat-kpi-label">Cost of goods</span></div>
        <div className="plat-kpi"><span className="plat-kpi-val">{money(totProfit)}</span><span className="plat-kpi-label">Profit</span></div>
      </div>

      <div className="plat-card">
        <h3>New sale</h3>
        <div className="plat-pos-form">
          <select value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">— select product —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{(p.data || {}).name} · {money(Number((p.data || {}).price) || 0)}</option>)}
          </select>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" />
          <button className="plat-start" onClick={record} disabled={!product || q <= 0 || recording}>Record sale <ArrowRight size={15} /></button>
        </div>
        {product && (
          <div className="plat-cost-summary">
            <span>Revenue: <b>{money(revenue)}</b></span><span>Cost: <b>{money(lineCost)}</b></span>
            <span className={profit >= 0 ? "plat-pos" : "plat-neg"}>Profit: <b>{money(profit)}</b></span>
          </div>
        )}
        {msg && <p className="plat-saved"><Check size={15} /> {msg}</p>}
      </div>

      <div className="plat-card">
        <h3>Recent sales</h3>
        {loading ? <p className="plat-empty">Loading…</p> : sales.length === 0 ? <p className="plat-empty">No sales yet.</p> : (
          <div className="plat-table-wrap">
            <table className="plat-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>When</th></tr></thead>
              <tbody>
                {sales.map((s) => { const d = s.data || {}; return (
                  <tr key={s.id}><td>{d.productName}</td><td>{d.qty}</td><td>{money(d.revenue)}</td><td>{money(d.cost)}</td><td className={(Number(d.profit) || 0) >= 0 ? "plat-pos" : "plat-neg"}>{money(d.profit)}</td><td>{d.date ? new Date(d.date).toLocaleString() : ""}</td></tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PurchasingView({ user }) {
  const H = { "Content-Type": "application/json" };
  const em = encodeURIComponent(user.email);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ supplierId: "", itemId: "", qty: "1", unitCost: "", expected: "" });
  const [msg, setMsg] = useState("");
  const [receiving, setReceiving] = useState(null);

  const load = () => Promise.all([
    fetch(`/api/records?email=${em}&kind=suppliers`).then((r) => r.json()),
    fetch(`/api/records?email=${em}&kind=inventory`).then((r) => r.json()),
    fetch(`/api/records?email=${em}&kind=purchases`).then((r) => r.json()),
  ]).then(([s, i, o]) => { setSuppliers(s.records || []); setInventory(i.records || []); setOrders(o.records || []); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const item = inventory.find((x) => x.id === f.itemId);
  const setField = (k, v) => setF((s) => { const n = { ...s, [k]: v }; if (k === "itemId") { const it = inventory.find((x) => x.id === v); if (it && !n.unitCost) n.unitCost = String((it.data || {}).unitCost || ""); } return n; });

  const addOrder = async () => {
    if (!f.itemId && !f.supplierId) return;
    const sup = suppliers.find((s) => s.id === f.supplierId);
    const data = { supplier: (sup && sup.data && sup.data.name) || "", itemId: f.itemId, itemName: (item && item.data && item.data.name) || "", qty: Number(f.qty) || 0, unitCost: Number(f.unitCost) || 0, status: "Ordered", expected: f.expected };
    const opt = { id: `local-${Date.now()}`, kind: "purchases", data };
    setOrders((o) => [opt, ...o]); setMsg("Order created."); window.setTimeout(() => setMsg(""), 4000); setF({ supplierId: "", itemId: "", qty: "1", unitCost: "", expected: "" });
    try { const res = await fetch("/api/records", { method: "POST", headers: H, body: JSON.stringify({ email: user.email, kind: "purchases", data }) }); const d = await res.json().catch(() => ({})); if (d.record) setOrders((o) => [d.record, ...o.filter((x) => x.id !== opt.id)]); } catch (e) {}
  };

  const receive = async (o) => {
    const d = o.data || {}; if (d.status === "Received" || receiving) return;
    setReceiving(o.id);
    // status + stock (+ average cost) + stock purchase in one database transaction (/api/ops)
    try {
      const r = await api("/api/ops", { method: "POST", body: { action: "receive", purchaseId: o.id } });
      setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, data: r.purchase.data } : x)));
      if (r.inventory) setInventory((inv) => inv.map((x) => (x.id === r.inventory.id ? { ...x, data: r.inventory.data } : x)));
      setMsg("Received — stock increased and the purchase booked.");
    } catch (e) { setMsg(`Not received: ${e.message}`); }
    setReceiving(null);
    window.setTimeout(() => setMsg(""), 6000);
  };
  const remove = async (o) => { setOrders((os) => os.filter((x) => x.id !== o.id)); try { await fetch(`/api/records?id=${encodeURIComponent(o.id)}&email=${em}`, { method: "DELETE" }); } catch (e) {} };

  const rows = orders.map((o) => o.data || {});
  const kpis = [
    { label: "Open orders", value: rows.filter((r) => r.status === "Ordered" || r.status === "Draft").length },
    { label: "Received", value: rows.filter((r) => r.status === "Received").length },
    { label: "Total spend", value: money(rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.unitCost) || 0), 0)) },
  ];

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Workflow size={22} /> Purchasing</h1><p>Order goods from suppliers. Receiving an order increases stock and books the expense.</p></div>
      <div className="plat-kpis plat-kpis-3">{kpis.map((k) => <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span></div>)}</div>
      <div className="plat-card">
        <h3>New purchase order</h3>
        <div className="plat-pos-form">
          <select value={f.supplierId} onChange={(e) => setField("supplierId", e.target.value)}><option value="">— supplier —</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{(s.data || {}).name}</option>)}</select>
          <select value={f.itemId} onChange={(e) => setField("itemId", e.target.value)}><option value="">— item —</option>{inventory.map((i) => <option key={i.id} value={i.id}>{(i.data || {}).name}</option>)}</select>
          <input type="number" value={f.qty} onChange={(e) => setField("qty", e.target.value)} placeholder="Qty" />
          <input type="number" value={f.unitCost} onChange={(e) => setField("unitCost", e.target.value)} placeholder="Unit cost" />
          <button className="plat-start" onClick={addOrder}>Create order <ArrowRight size={15} /></button>
        </div>
        {msg && <p className="plat-saved"><Check size={15} /> {msg}</p>}
      </div>
      <div className="plat-card">
        <h3>Orders</h3>
        {loading ? <p className="plat-empty">Loading…</p> : orders.length === 0 ? <p className="plat-empty">No purchase orders yet.</p> : (
          <div className="plat-table-wrap"><table className="plat-table">
            <thead><tr><th>Item</th><th>Supplier</th><th>Qty</th><th>Unit cost</th><th>Status</th><th /></tr></thead>
            <tbody>{orders.map((o) => { const d = o.data || {}; return (
              <tr key={o.id}><td>{d.itemName || "—"}</td><td>{d.supplier || "—"}</td><td>{d.qty}</td><td>{money(d.unitCost)}</td>
                <td><span className={`plat-status tone-${d.status === "Received" ? "green" : d.status === "Cancelled" ? "red" : "amber"}`}>{d.status}</span></td>
                <td className="plat-row-actions">{d.status !== "Received" && <button onClick={() => receive(o)} disabled={receiving === o.id || isLocalId(o.id)}>{receiving === o.id ? "…" : "Receive"}</button>}<button className="plat-del" onClick={() => remove(o)}>Delete</button></td>
              </tr>
            ); })}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

function InvoicesView({ user }) {
  const H = { "Content-Type": "application/json" };
  const em = encodeURIComponent(user.email);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cust, setCust] = useState("");
  const [lines, setLines] = useState([]);
  const [due, setDue] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => Promise.all([
    fetch(`/api/records?email=${em}&kind=customers`).then((r) => r.json()),
    fetch(`/api/records?email=${em}&kind=products`).then((r) => r.json()),
    fetch(`/api/records?email=${em}&kind=invoices`).then((r) => r.json()),
  ]).then(([c, p, i]) => { setCustomers(c.records || []); setProducts(p.records || []); setInvoices(i.records || []); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addLine = () => setLines((l) => [...l, { productId: "", qty: "1" }]);
  const setLine = (idx, k, v) => setLines((l) => l.map((x, i) => (i === idx ? { ...x, [k]: v } : x)));
  const delLine = (idx) => setLines((l) => l.filter((_, i) => i !== idx));
  const lineTotal = (ln) => { const p = products.find((x) => x.id === ln.productId); return (p ? Number((p.data || {}).price) || 0 : 0) * (Number(ln.qty) || 0); };
  const total = lines.reduce((s, ln) => s + lineTotal(ln), 0);

  const create = async () => {
    if (!cust || lines.length === 0) return;
    const c = customers.find((x) => x.id === cust);
    const data = { customerId: cust, customerName: (c && c.data && c.data.name) || "", lines: lines.map((ln) => { const p = products.find((x) => x.id === ln.productId); return { productId: ln.productId, name: p ? (p.data || {}).name : "", qty: Number(ln.qty) || 0, price: p ? Number((p.data || {}).price) || 0 : 0 }; }), total, status: "Draft", date: new Date().toISOString(), due };
    const opt = { id: `local-${Date.now()}`, kind: "invoices", data };
    setInvoices((iv) => [opt, ...iv]); setLines([]); setCust(""); setDue(""); setMsg("Invoice created (Draft)."); window.setTimeout(() => setMsg(""), 4000);
    try { const res = await fetch("/api/records", { method: "POST", headers: H, body: JSON.stringify({ email: user.email, kind: "invoices", data }) }); const d = await res.json().catch(() => ({})); if (d.record) setInvoices((iv) => [d.record, ...iv.filter((x) => x.id !== opt.id)]); } catch (e) {}
  };

  const markPaid = async (inv) => {
    const d = inv.data || {}; if (d.status === "Paid") return;
    setInvoices((iv) => iv.map((x) => (x.id === inv.id ? { ...x, data: { ...d, status: "Paid" } } : x)));
    try {
      await fetch("/api/records", { method: "PATCH", headers: H, body: JSON.stringify({ id: inv.id, email: user.email, data: { ...d, status: "Paid" } }) });
      await fetch("/api/records", { method: "POST", headers: H, body: JSON.stringify({ email: user.email, kind: "transactions", data: { date: new Date().toISOString().slice(0, 10), type: "Income", category: "Invoice", amount: Number(d.total) || 0, description: `Invoice · ${d.customerName}` } }) });
    } catch (e) {}
    setMsg("Marked paid — income booked."); window.setTimeout(() => setMsg(""), 5000);
  };
  const remove = async (inv) => { setInvoices((iv) => iv.filter((x) => x.id !== inv.id)); try { await fetch(`/api/records?id=${encodeURIComponent(inv.id)}&email=${em}`, { method: "DELETE" }); } catch (e) {} };

  const rows = invoices.map((i) => i.data || {});
  const invoiced = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const paid = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + (Number(r.total) || 0), 0);
  const kpis = [{ label: "Invoiced", value: money(invoiced) }, { label: "Outstanding", value: money(invoiced - paid) }, { label: "Paid", value: money(paid) }];

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><ShieldCheck size={22} /> Invoices</h1><p>Bill customers for products. Marking an invoice paid books the income automatically.</p></div>
      <div className="plat-kpis plat-kpis-3">{kpis.map((k) => <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span></div>)}</div>
      <div className="plat-card">
        <h3>New invoice</h3>
        <div className="plat-pos-form">
          <select value={cust} onChange={(e) => setCust(e.target.value)}><option value="">— customer —</option>{customers.map((c) => <option key={c.id} value={c.id}>{(c.data || {}).name}</option>)}</select>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="plat-recipe">
          <div className="plat-recipe-head"><b>Line items</b><button type="button" className="plat-ghost" onClick={addLine}>+ Add line</button></div>
          {lines.length === 0 ? <p className="plat-empty">Add products to bill.</p> : lines.map((ln, idx) => (
            <div className="plat-recipe-row" key={idx}>
              <select value={ln.productId} onChange={(e) => setLine(idx, "productId", e.target.value)}><option value="">— product —</option>{products.map((p) => <option key={p.id} value={p.id}>{(p.data || {}).name} · {money(Number((p.data || {}).price) || 0)}</option>)}</select>
              <input type="number" value={ln.qty} onChange={(e) => setLine(idx, "qty", e.target.value)} placeholder="Qty" />
              <span className="plat-recipe-cost">{money(lineTotal(ln))}</span>
              <button type="button" className="plat-task-del" onClick={() => delLine(idx)} aria-label="Remove"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="plat-cost-summary"><span>Total: <b>{money(total)}</b></span></div>
        <div className="plat-modal-actions"><button className="plat-start" onClick={create} disabled={!cust || lines.length === 0}>Create invoice <ArrowRight size={15} /></button></div>
        {msg && <p className="plat-saved"><Check size={15} /> {msg}</p>}
      </div>
      <div className="plat-card">
        <h3>Invoices</h3>
        {loading ? <p className="plat-empty">Loading…</p> : invoices.length === 0 ? <p className="plat-empty">No invoices yet.</p> : (
          <div className="plat-table-wrap"><table className="plat-table">
            <thead><tr><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th /></tr></thead>
            <tbody>{invoices.map((inv) => { const d = inv.data || {}; return (
              <tr key={inv.id}><td>{d.customerName || "—"}</td><td>{money(d.total)}</td>
                <td><span className={`plat-status tone-${d.status === "Paid" ? "green" : "amber"}`}>{d.status}</span></td>
                <td>{d.date ? new Date(d.date).toLocaleDateString() : ""}</td>
                <td className="plat-row-actions">{d.status !== "Paid" && <button onClick={() => markPaid(inv)}>Mark paid</button>}<button className="plat-del" onClick={() => remove(inv)}>Delete</button></td>
              </tr>
            ); })}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

function SubscriptionView({ pkg, plan, notify }) {
  const [busy, setBusy] = useState("");
  const billing = !!(plan && plan.billing);
  const currentIdx = PACKAGES.findIndex((p) => p.key === pkg.key);
  const buy = async (p, interval) => {
    setBusy(`${p.key}:${interval}`);
    try {
      const d = await api("/api/billing", { method: "POST", body: { packageKey: p.key, interval } });
      window.location.assign(d.url);
    } catch (e) { notify(e.message, "error"); setBusy(""); }
  };
  const until = plan && plan.current_period_end ? new Date(plan.current_period_end).toLocaleDateString() : null;
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Subscription</h1><p>Your current plan and upgrades. A higher plan unlocks more agent suites.</p></div>
      <div className="plat-card plat-plan-current">
        <div>
          <span className="outline-pill"><ShieldCheck size={14} /> Current plan</span>
          <h2>{pkg.name}</h2>
          <p className="plat-plan-target">{!billing ? "Beta — every suite is unlocked while billing is not active yet." : plan.status === "active" ? (until ? `Active until ${until}` : "Active — one-time purchase") : pkg.key === "none" ? "Choose a plan to unlock the agent suites." : `Status: ${plan.status}`}</p>
        </div>
        {pkg.priceOnce && <div className="plat-plan-current-price"><b>{pkg.priceOnce}</b><span>once</span><b>{pkg.priceYear}</b></div>}
      </div>
      <div className="plat-plan-grid">
        {PACKAGES.map((p, i) => {
          const isCurrent = p.key === pkg.key;
          return (
            <div className={`plat-plan-card ${isCurrent ? "is-current" : ""}`} key={p.key}>
              <h3>{p.name}</h3>
              <div className="plat-plan-price">{p.priceOnce}<span> once</span></div>
              <div className="plat-plan-year">{p.priceYear}</div>
              <p className="plat-plan-target">{p.target}</p>
              <ul className="plat-plan-suites">
                {p.suites.filter((s) => s !== "foundation").map((sk) => { const s = SUITES.find((x) => x.key === sk); return <li key={sk}><Check size={13} /> {s ? s.name : sk}</li>; })}
              </ul>
              {isCurrent ? <button className="plat-start is-locked" disabled>Current plan</button> : billing ? (
                <div className="plat-plan-buy">
                  <button className="plat-start" disabled={!!busy} onClick={() => buy(p, "once")}>{busy === `${p.key}:once` ? "…" : `${i > currentIdx ? "Upgrade" : "Switch"} · once`}</button>
                  <button className="plat-ghost" disabled={!!busy} onClick={() => buy(p, "year")}>{busy === `${p.key}:year` ? "…" : "Yearly"}</button>
                </div>
              ) : <button className="plat-start is-locked" disabled>Included in beta</button>}
            </div>
          );
        })}
      </div>
      <p className="plat-empty">{billing ? "Secure checkout by Stripe. Your plan is activated automatically after payment." : "Billing starts after the beta. Until then all suites are free to use."}</p>
    </div>
  );
}

const SYNCABLE = new Set(["stripe", "hubspot"]);

function ConnectorsView({ user, notify }) {
  const [saved, setSaved] = useState([]);
  const [openKey, setOpenKey] = useState(null);
  const [cfg, setCfg] = useState({});
  const [importing, setImporting] = useState(null); // null | { kind?, parsed? }
  const [syncing, setSyncing] = useState("");

  const sync = async (c) => {
    setSyncing(c.key);
    try {
      if (c.key === "gsheets") {
        const d = await api("/api/connector-sync", { method: "POST", body: { connector: "gsheets" } });
        setImporting({ parsed: { headers: d.headers, rows: d.rows } });
      } else {
        const d = await api("/api/connector-sync", { method: "POST", body: { connector: c.key } });
        notify(`${c.name}: ${d.imported} new, ${d.skipped} already imported.`);
        reload();
      }
    } catch (e) { notify(`${c.name}: ${e.message}`, "error"); }
    setSyncing("");
  };

  const reload = () => api(`/api/records?email=${encodeURIComponent(user.email)}&kind=connectors`)
    .then((d) => setSaved(Array.isArray(d.records) ? d.records : [])).catch(() => {});
  useEffect(() => { reload(); }, []);

  const recordFor = (key) => saved.find((s) => (s.data || {}).connectorKey === key);
  const open = (c) => { const rec = recordFor(c.key); setCfg(rec ? (rec.data.config || {}) : {}); setOpenKey(c.key); };
  const set = (k, v) => setCfg((s) => ({ ...s, [k]: v }));

  const save = async (c) => {
    const existing = recordFor(c.key);
    const data = { connectorKey: c.key, name: c.name, config: cfg, connected: true };
    setOpenKey(null);
    if (existing) {
      setSaved((s) => s.map((x) => (x.id === existing.id ? { ...x, data } : x)));
      try { await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: existing.id, email: user.email, data }) }); } catch (e) {}
    } else {
      const optimistic = { id: `local-${Date.now()}`, kind: "connectors", data };
      setSaved((s) => [optimistic, ...s]);
      try {
        const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, kind: "connectors", data }) });
        const d = await res.json().catch(() => ({}));
        if (d.record) setSaved((s) => [d.record, ...s.filter((x) => x.id !== optimistic.id)]);
      } catch (e) {}
    }
  };

  const disconnect = async (c) => {
    const existing = recordFor(c.key); if (!existing) return;
    setSaved((s) => s.filter((x) => x.id !== existing.id));
    try { await fetch(`/api/records?id=${encodeURIComponent(existing.id)}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" }); } catch (e) {}
  };

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Workflow size={22} /> Connectors</h1><p>Bring your data in: sync Stripe payments and HubSpot contacts, import a Google Sheet, or upload a CSV/Excel export from your POS or accounting tool. Keys stay on the server — after saving only the last 4 characters are shown.</p></div>
      {importing && <ImportDialog user={user} initial={importing} notify={notify} onClose={() => setImporting(null)} />}
      <div className="plat-connector-grid">
        {CONNECTORS.map((c) => {
          const rec = recordFor(c.key); const isOpen = openKey === c.key;
          return (
            <div className={`plat-connector ${rec ? "is-connected" : ""}`} key={c.key}>
              <div className="plat-connector-head"><h3>{c.name}</h3>{rec ? <span className="plat-included">Connected</span> : <span className="plat-connector-cat">{c.category}</span>}</div>
              <p>{c.desc}</p>
              <span className="plat-connector-imports">Imports: {c.imports}</span>
              {isOpen ? (
                <div className="plat-connector-form">
                  {c.fields.length === 0 && <p className="plat-empty">No configuration needed.</p>}
                  {c.fields.map((f) => (
                    <label key={f.key}>{f.label}<input type={/key|token|secret/i.test(f.key) ? "password" : "text"} autoComplete="off" value={cfg[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder || ""} /></label>
                  ))}
                  <div className="plat-connector-actions"><button className="plat-ghost" onClick={() => setOpenKey(null)}>Cancel</button><button className="plat-start" onClick={() => save(c)}>Save <Check size={15} /></button></div>
                </div>
              ) : (
                <>
                <div className="plat-connector-actions">
                  {c.key === "csv" ? (
                    <button className="plat-start" onClick={() => setImporting({})}>Upload file <ArrowRight size={15} /></button>
                  ) : (
                    <button className={rec ? "plat-ghost" : "plat-start"} onClick={() => open(c)}>{rec ? "Edit" : "Connect"} {!rec && <ArrowRight size={15} />}</button>
                  )}
                  {rec && (SYNCABLE.has(c.key) || c.key === "gsheets") && <button className="plat-start" disabled={syncing === c.key} onClick={() => sync(c)}>{syncing === c.key ? "Syncing…" : c.key === "gsheets" ? "Import now" : "Sync now"}</button>}
                  {rec && c.key !== "csv" && <button className="plat-ghost" onClick={() => disconnect(c)}>Disconnect</button>}
                </div>
                {rec && rec.data && rec.data.lastSync && <span className="plat-connector-imports">Last sync {new Date(rec.data.lastSync).toLocaleString()} · {rec.data.lastSyncCount || 0} new</span>}
                {!SYNCABLE.has(c.key) && !["gsheets", "csv"].includes(c.key) && rec && <span className="plat-connector-imports">Automatic sync for {c.name} is coming — until then export a CSV and use “CSV / Excel”.</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResearchCard({ onResearch }) {
  const [v, setV] = useState({ companyName: "", website: "", location: "" });
  const [sent, setSent] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    if (!v.website && !v.companyName) return;
    await onResearch(v);
    setSent(true);
    window.setTimeout(() => setSent(false), 6000);
  };
  return (
    <div className="plat-card plat-research">
      <div className="plat-research-head"><Sparkles size={18} /><div><h3>Auto-fill with the research agent</h3><p>Give us your website and location — the agent researches your company (products, name, shareholders, financials) and fills your profile.</p></div></div>
      <form onSubmit={go} className="plat-form">
        <label>Company name<input value={v.companyName} onChange={(e) => setV({ ...v, companyName: e.target.value })} /></label>
        <label>Website<input value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} placeholder="https://" /></label>
        <label>Location<input value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} placeholder="City, country" /></label>
        <div className="plat-modal-actions plat-full">
          {sent && <span className="plat-saved"><Check size={15} /> Research queued</span>}
          <button type="submit" className="plat-start">Run research <ArrowRight size={15} /></button>
        </div>
      </form>
    </div>
  );
}

const CAT_LABEL = { analysis: "Analysis", artifact: "Artifact", live: "Live" };

const SUITE_COLORS = { foundation: "#f59e0b", strategy: "#3b82f6", venture: "#a855f7", growth: "#ec4899", operations: "#14b8a6", intelligence: "#eab308", execution: "#06b6d4", specialist: "#22c55e" };
const AGENT_STATUS_TEXT = { idle: "Idle — ready", queued: "Queued — waiting to start", running: "Working…", done: "Active — deliverables ready" };

function suiteRunStatus(suite, runs) {
  const keys = new Set((suite.modules || []).map((m) => m.key));
  const rs = runs.filter((r) => keys.has(r.module_key));
  if (rs.some((r) => r.status === "running")) return "running";
  if (rs.some((r) => r.status === "queued")) return "queued";
  if (rs.some((r) => r.status === "done" || r.status === "completed")) return "done";
  return "idle";
}

function Robot({ color, size = 60, hub }) {
  return (
    <svg className="plat-robot-svg" width={size} height={size * 74 / 64} viewBox="0 0 64 74" fill="none" aria-hidden="true">
      <ellipse className="plat-robot-base" cx="32" cy="70" rx={hub ? 22 : 18} ry="5" fill="none" stroke={color} strokeWidth="2" opacity="0.45" />
      <line x1="32" y1="6" x2="32" y2="2" stroke={color} strokeWidth="2" />
      <circle cx="32" cy="2" r="2" fill={color} />
      <rect x="24" y="60" width="6" height="9" rx="3" fill="#26426e" />
      <rect x="34" y="60" width="6" height="9" rx="3" fill="#26426e" />
      <rect x="8" y="34" width="6" height="16" rx="3" fill={color} />
      <rect x="50" y="34" width="6" height="16" rx="3" fill={color} />
      <rect x="16" y="32" width="32" height="28" rx="9" fill={color} />
      <text x="32" y="50" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.6)">{">-"}</text>
      <rect x="14" y="6" width="36" height="26" rx="8" fill="#12203c" stroke="#3f6aa8" strokeWidth="2" />
      <text x="32" y="24" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700" fill="#7de3ff">{">_"}</text>
    </svg>
  );
}

function AgentConstellation({ runs, goto, pkg }) {
  const sats = SUITES.filter((s) => !s.base);
  const [active, setActive] = useState(null);
  const n = sats.length;
  const anyActive = sats.some((s) => ["running", "queued"].includes(suiteRunStatus(s, runs)));
  const orchStatus = anyActive ? "running" : (runs.length ? "done" : "idle");
  const activeSuite = sats.find((s) => s.key === active);
  const bubble = activeSuite
    ? `${activeSuite.name.replace(" Suite", "")} · ${AGENT_STATUS_TEXT[suiteRunStatus(activeSuite, runs)]}`
    : `Orchestrator · ${orchStatus === "running" ? "Coordinating agents…" : "Self-managed · ready"}`;
  const pos = (i) => { const a = (-90 + i * 360 / n) * Math.PI / 180; return { left: `${50 + 39 * Math.cos(a)}%`, top: `${50 + 39 * Math.sin(a)}%` }; };

  return (
    <div className="plat-constellation" onMouseLeave={() => setActive(null)}>
      <svg className="plat-const-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {sats.map((s, i) => { const a = (-90 + i * 360 / n) * Math.PI / 180; return <line key={s.key} x1="50" y1="50" x2={50 + 39 * Math.cos(a)} y2={50 + 39 * Math.sin(a)} className={`status-${suiteRunStatus(s, runs)}`} />; })}
      </svg>
      <button className={`plat-agent plat-agent-orch status-${orchStatus}`} style={{ left: "50%", top: "50%" }} onMouseEnter={() => setActive(null)} onClick={() => goto("phases")}>
        <span className="plat-robot"><Robot color={SUITE_COLORS.foundation} size={82} hub /></span>
        <span className="plat-agent-name">Orchestrator</span>
      </button>
      {sats.map((s, i) => {
        const st = suiteRunStatus(s, runs);
        const unlocked = pkg.suites.includes(s.key);
        return (
          <button key={s.key} className={`plat-agent status-${st} ${active === s.key ? "is-active" : ""}`} style={pos(i)}
            onMouseEnter={() => setActive(s.key)}
            onClick={() => { const m = (s.modules || [])[0]; if (m) goto(`module:${m.key}`); }}>
            <span className="plat-robot"><Robot color={SUITE_COLORS[s.key]} size={60} />{!unlocked && <span className="plat-agent-lock"><Lock size={10} /></span>}</span>
            <span className="plat-agent-name">{s.name.replace(" Suite", "")}</span>
          </button>
        );
      })}
      <div className="plat-const-bubble">{bubble}</div>
    </div>
  );
}

function PhasesView({ pkg, goto }) {
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Phases</h1><p>Your journey from analysis to execution. Each phase generates its artifacts — open a card to fill the form and generate.</p></div>
      {PHASES.map((phase) => {
        const mods = allModules().filter((m) => phase.suites.includes(m.suiteKey));
        return (
          <div className="plat-card plat-phase" key={phase.key}>
            <div className="plat-phase-head"><span className="plat-phase-num">{phase.num}</span><div><h3>{phase.name}</h3><p>{phase.blurb}</p></div></div>
            <div className="plat-phase-mods">
              {mods.map((m) => {
                const cat = moduleCategory(m);
                const unlocked = pkg.suites.includes(m.suiteKey);
                return (
                  <button className="plat-phase-mod" key={m.key} onClick={() => goto(`module:${m.key}`)}>
                    <span className={`plat-cat plat-cat-${cat}`}>{CAT_LABEL[cat]}</span>
                    <b>{m.name}</b>
                    <span className="plat-phase-mod-tag">{unlocked ? (cat === "live" ? "Live" : "Generate") : "Locked"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyTasksView({ user, runs = [], onGenerate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState("");
  const [gen, setGen] = useState(false);

  const load = () => fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=tasks`)
    .then((r) => r.json()).then((d) => setTasks(Array.isArray(d.records) ? d.records : [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const daily = runs.find((r) => r.module_key === "daily-tasks");
  const agentBusy = !!daily && (daily.status === "queued" || daily.status === "running");
  useEffect(() => { if (daily && daily.status === "done") load(); }, [daily ? `${daily.id}:${daily.status}` : ""]);

  const toggle = async (t) => {
    const data = { ...(t.data || {}), done: !(t.data || {}).done };
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, data } : x)));
    try { await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, email: user.email, data }) }); } catch (e) {}
  };
  const remove = async (t) => {
    setTasks((ts) => ts.filter((x) => x.id !== t.id));
    try { await fetch(`/api/records?id=${encodeURIComponent(t.id)}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" }); } catch (e) {}
  };
  const add = async (e) => {
    e.preventDefault();
    const title = adding.trim(); if (!title) return;
    const data = { title, priority: "Normal", done: false, source: "manual" };
    const optimistic = { id: `local-${Date.now()}`, kind: "tasks", data };
    setTasks((ts) => [optimistic, ...ts]); setAdding("");
    try {
      const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, kind: "tasks", data }) });
      const d = await res.json().catch(() => ({}));
      if (d.record) setTasks((ts) => [d.record, ...ts.filter((x) => x.id !== optimistic.id)]);
    } catch (e2) {}
  };
  const generate = async () => { setGen(true); await onGenerate(); setGen(false); };

  const open = tasks.filter((t) => !(t.data || {}).done);
  const done = tasks.filter((t) => (t.data || {}).done);

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Daily Tasks</h1><p>Your Decision agent generates a focused set of tasks each day to grow and scale — from your live data. Check them off as you go.</p></div>

      <div className="plat-card plat-cta-card">
        <div><h3>Today's plan</h3><p>Let the agent read your data and generate today's highest-impact actions.</p></div>
        <button className="plat-start" onClick={generate} disabled={gen || agentBusy}>{gen ? "Starting…" : agentBusy ? "Agent is working…" : "Generate today's tasks"} <ArrowRight size={15} /></button>
      </div>

      <div className="plat-card">
        <form className="plat-task-add" onSubmit={add}>
          <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Add a task…" />
          <button className="plat-start" type="submit">Add</button>
        </form>
        {loading ? <p className="plat-empty">Loading…</p> : tasks.length === 0 ? (
          <p className="plat-empty">No tasks yet. Generate today's plan or add one above.</p>
        ) : (
          <div className="plat-task-list">
            {open.map((t) => (
              <div className="plat-task" key={t.id}>
                <label><input type="checkbox" checked={false} onChange={() => toggle(t)} /><span>{(t.data || {}).title}</span></label>
                {(t.data || {}).priority && <span className="plat-task-pri">{(t.data || {}).priority}</span>}
                <button className="plat-task-del" onClick={() => remove(t)} aria-label="Delete"><X size={14} /></button>
              </div>
            ))}
            {done.length > 0 && <div className="plat-task-done-head">Done ({done.length})</div>}
            {done.map((t) => (
              <div className="plat-task is-done" key={t.id}>
                <label><input type="checkbox" checked readOnly onChange={() => toggle(t)} /><span>{(t.data || {}).title}</span></label>
                <button className="plat-task-del" onClick={() => remove(t)} aria-label="Delete"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoButton({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="plat-info" onMouseLeave={() => setOpen(false)}>
      <button type="button" className="plat-info-btn" onClick={() => setOpen((o) => !o)} onMouseEnter={() => setOpen(true)} aria-label="Info">i</button>
      {open && <span className="plat-info-pop">{text}</span>}
    </span>
  );
}

const NOTE_SEV = {
  recommendation: { tone: "indigo", label: "Recommendation" },
  info: { tone: "sky", label: "Info" },
  warning: { tone: "amber", label: "Early warning" },
  critical: { tone: "red", label: "Warning" },
};

function NotificationBell({ notifications, onRead, onReadAll, goto }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !(n.data || {}).read).length;
  return (
    <div className="plat-bell-wrap" onMouseLeave={() => setOpen(false)}>
      <button className="plat-bell" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {unread > 0 && <span className="plat-bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="plat-notes">
          <div className="plat-notes-head"><b>Notifications</b>{unread > 0 && <button onClick={onReadAll}>Mark all read</button>}</div>
          <div className="plat-notes-body">
            {notifications.length === 0 ? (
              <p className="plat-empty">No notifications yet. Your agents alert you here — recommendations, early warnings and warnings.</p>
            ) : notifications.map((n) => {
              const d = n.data || {}; const sev = NOTE_SEV[d.severity] || NOTE_SEV.info;
              return (
                <button key={n.id} className={`plat-note ${d.read ? "is-read" : ""}`} onClick={() => { onRead(n); if (d.link) goto(d.link); setOpen(false); }}>
                  <span className={`plat-note-dot tone-${sev.tone}`} />
                  <div>
                    <b>{d.title || sev.label}</b>
                    <span className="plat-note-msg">{d.message}</span>
                    {d.impact && <span className="plat-note-impact">{d.impact}</span>}
                    <span className="plat-note-time">{d.created_at ? new Date(d.created_at).toLocaleString() : (n.created_at ? new Date(n.created_at).toLocaleString() : "")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewView({ user, pkg, runs, company, goto, notifications = [], onNoteRead }) {
  const modulesAvailable = allModules().filter((m) => pkg.suites.includes(m.suiteKey)).length;
  const totalCompanyFields = COMPANY_SECTIONS.reduce((n, s) => n + s.fields.length, 0);
  const filledCompanyFields = COMPANY_SECTIONS.reduce(
    (n, s) => n + s.fields.filter((f) => (company[s.key] || {})[f.key]).length, 0);
  const completeness = totalCompanyFields ? Math.round((filledCompanyFields / totalCompanyFields) * 100) : 0;
  const startedModules = new Set(runs.map((r) => r.module_key)).size;
  const done = runs.filter((r) => r.status === "done" || r.status === "completed").length;
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    let ok = true;
    api(`/api/context?email=${encodeURIComponent(user.email)}`).then((d) => { if (ok && d && d.data) setMetrics(d.data); }).catch(() => {});
    return () => { ok = false; };
  }, []);
  const m = metrics || {}; const fin = m.finance || {}; const cust = m.customers || {}; const tk = m.tasks || {};
  const kpis = [
    { label: "Revenue", value: money(fin.revenue), hint: "booked income" },
    { label: "Profit", value: money(fin.profit), hint: "after all costs" },
    { label: "Pipeline", value: money(cust.pipeline), hint: `${cust.customers || 0} customers` },
    { label: "Open tasks", value: tk.open || 0, hint: "from your agents" },
  ];
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Overview</h1><p>Your business at a glance. Your agent team, live status, company data and deliverables.</p></div>
      <div className="plat-industry-hint"><Sparkles size={14} /> {industryHint(user.industry)}</div>
      {(() => {
        const alerts = notifications.filter((n) => !(n.data || {}).read && ["recommendation", "warning", "critical"].includes((n.data || {}).severity)).slice(0, 3);
        if (alerts.length === 0) return null;
        return (
          <div className="plat-card plat-alerts">
            <div className="plat-agents-title"><span className="plat-live-badge"><span className="plat-live-dot" /> Recommended for you</span><span>What your agents suggest you act on now.</span></div>
            {alerts.map((n) => { const d = n.data || {}; const sev = NOTE_SEV[d.severity] || NOTE_SEV.info; return (
              <button key={n.id} className="plat-alert" onClick={() => { if (onNoteRead) onNoteRead(n); if (d.link) goto(d.link); }}>
                <span className={`plat-note-dot tone-${sev.tone}`} />
                <div><b>{d.title}</b><span className="plat-note-msg">{d.message}</span></div>
                {d.impact && <span className="plat-note-impact">{d.impact}</span>}
              </button>
            ); })}
          </div>
        );
      })()}
      <div className="plat-card plat-agents-card">
        <div className="plat-agents-title"><span className="plat-live-badge"><span className="plat-live-dot" /> Agents</span><span>Live view of what your agent team is doing — click an agent to open it.</span></div>
        <AgentConstellation runs={runs} goto={goto} pkg={pkg} />
      </div>
      <div className="plat-kpis">
        {kpis.map((k) => (
          <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span><span className="plat-kpi-hint">{k.hint}</span></div>
        ))}
      </div>

      {m.monthly && (
        <div className="plat-card">
          <h3>Revenue &amp; profit — last 12 months <InfoButton text="Booked revenue and profit per month from Income &amp; Expenses and POS sales. Hover a month for details, or switch to the table." /></h3>
          <MonthlyChart months={m.monthly} />
        </div>
      )}

      {completeness < 100 && (
        <div className="plat-card plat-cta-card">
          <div>
            <h3>Complete your company profile</h3>
            <p>The more you fill in, the sharper every agent's output. You're at {completeness}%.</p>
            <div className="plat-progress"><span style={{ width: `${completeness}%` }} /></div>
          </div>
          <button className="plat-start" onClick={() => goto("company:basics")}>Open company profile <ArrowRight size={15} /></button>
        </div>
      )}

      <div className="plat-two-col">
        <div className="plat-card">
          <h3>Recent activity</h3>
          {runs.length === 0 ? (
            <p className="plat-empty">No module runs yet. Open a module from the sidebar to get started.</p>
          ) : (
            <div className="plat-run-list">
              {runs.slice(0, 6).map((r) => {
                const st = RUN_STATUS[r.status] || RUN_STATUS.queued;
                return (
                  <button className="plat-run plat-run-btn" key={r.id} onClick={() => goto(`module:${r.module_key}`)}>
                    <div><b>{r.module_name}</b><span>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</span></div>
                    <span className={`plat-status tone-${st.tone}`}>{st.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="plat-card">
          <h3>Your suites</h3>
          <div className="plat-suite-list">
            {SUITES.map((s) => {
              const unlocked = pkg.suites.includes(s.key);
              const Ico = SUITE_ICONS[s.key] || Sparkles;
              return (
                <div className={`plat-suite-row ${unlocked ? "" : "is-locked"}`} key={s.key}>
                  <Ico size={16} /><span>{s.name}</span>
                  {unlocked ? <span className="plat-included">On</span> : <span className="plat-locked"><Lock size={12} /> Locked</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBars({ items }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <div className="plat-bars">
      {items.map((i) => (
        <div className="plat-bar-row" key={i.label}>
          <span className="plat-bar-label">{i.label}</span>
          <div className="plat-bar-track"><span className="plat-bar-fill" style={{ width: `${Math.max(2, (Math.abs(i.value) / max) * 100)}%`, background: i.color }} /></div>
          <span className="plat-bar-val">{money(i.value)}</span>
        </div>
      ))}
    </div>
  );
}

function FinanceDashboardView({ user }) {
  const [tx, setTx] = useState([]);
  const [sales, setSales] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let ok = true;
    Promise.all([
      fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=transactions`).then((r) => r.json()),
      fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=sales`).then((r) => r.json()),
      fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=staff`).then((r) => r.json()),
    ]).then(([t, s, st]) => { if (ok) { setTx(t.records || []); setSales(s.records || []); setStaff(st.records || []); } }).catch(() => {}).finally(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, []);
  const [period, setPeriod] = useState("all");
  const txP = tx.filter((r) => inPeriod(r, period));
  const salesP = sales.filter((r) => inPeriod(r, period));
  const sumAmt = (rows) => rows.reduce((a, r) => a + (Number((r.data || {}).amount) || 0), 0);
  const isStock = (r) => (r.data || {}).category === "Purchasing";
  const income = sumAmt(txP.filter((r) => (r.data || {}).type === "Income"));
  const txExpense = sumAmt(txP.filter((r) => (r.data || {}).type === "Expense" && !isStock(r)));
  const stockPurchases = sumAmt(txP.filter((r) => (r.data || {}).type === "Expense" && isStock(r)));
  const monthlyStaff = staff.filter((r) => (r.data || {}).status === "Active").reduce((a, r) => a + (Number((r.data || {}).salary) || 0), 0);
  const staffCost = monthlyStaff * (periodMonths(period) || 1);
  const expense = txExpense + staffCost;
  const cogs = salesP.reduce((a, r) => a + (Number((r.data || {}).cost) || 0), 0);
  const profit = income - expense - cogs;
  const months = monthlySeries([...tx.map((r) => ({ ...r, kind: "transactions" })), ...sales.map((r) => ({ ...r, kind: "sales" }))]);
  const kpis = [
    { label: "Revenue", value: money(income) }, { label: "Expenses", value: money(expense) },
    { label: "Cost of goods", value: money(cogs) }, { label: "Profit", value: money(profit) },
  ];
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Cpu size={22} /> Finance</h1><p>Your live financial picture — calculated from Income &amp; Expenses and POS sales, not entered by hand.</p></div>
      <div className="plat-period" role="group" aria-label="Period">
        {PERIODS.map((p) => <button key={p.key} className={`plat-period-btn ${period === p.key ? "is-active" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</button>)}
      </div>
      <div className="plat-kpis">{kpis.map((k) => <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span></div>)}</div>
      <div className="plat-card">
        <h3>Revenue · Expenses · Profit <InfoButton text={`Revenue = booked income. Expenses = expense entries (without stock purchases) + cost of active staff (${money(monthlyStaff)} per month${periodMonths(period) ? ` × ${periodMonths(period)}` : ""}). Cost of goods = cost of what you sold (POS). Stock purchases are shown separately — they count as cost once the goods are sold. Profit = revenue − expenses − cost of goods.`} /></h3>
        <MiniBars items={[
          { label: "Revenue", value: income, color: "#4ade80" },
          { label: "Expenses", value: expense, color: "#f87171" },
          { label: "Cost of goods", value: cogs, color: "#fbbf24" },
          { label: "Profit", value: profit, color: "#818cf8" },
        ]} />
        {stockPurchases > 0 && <p className="plat-context-note">Stock purchases (cash out, not yet cost): {money(stockPurchases)}</p>}
        {!loading && tx.length === 0 && sales.length === 0 && <p className="plat-empty">No financial data yet — add entries under Income &amp; Expenses or record sales in POS, and this fills automatically.</p>}
      </div>
      <div className="plat-card">
        <h3>Trend — last 12 months</h3>
        <MonthlyChart months={months} />
      </div>
    </div>
  );
}

function ProfileView({ company, onSaveAll, onResearch }) {
  const [values, setValues] = useState(company || {});
  const [saved, setSaved] = useState(false);
  useEffect(() => { setValues(company || {}); }, [company]);
  const setF = (sk, k, v) => { setValues((s) => ({ ...s, [sk]: { ...(s[sk] || {}), [k]: v } })); setSaved(false); };
  const save = () => { onSaveAll(values); setSaved(true); window.setTimeout(() => setSaved(false), 4000); };
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><ShieldCheck size={22} /> Company Profile</h1><p>One questionnaire that feeds every agent. All optional — connect data sources for anything that can be measured.</p></div>
      {onResearch && <ResearchCard onResearch={onResearch} />}
      <div className="plat-profile-hint"><Sparkles size={14} /> All fields are optional. Connect a data source under <b>Connectors</b> and we'll use your live data where possible.</div>
      {COMPANY_SECTIONS.map((sec) => {
        const Ico = PLAT_ICONS[sec.icon] || ShieldCheck;
        return (
          <div className="plat-card" key={sec.key}>
            <h3 className="plat-section-title"><Ico size={17} /> {sec.name}</h3>
            <div className="plat-form">{sec.fields.map((f) => <PlatField key={f.key} f={f} value={(values[sec.key] || {})[f.key]} onChange={(k, v) => setF(sec.key, k, v)} />)}</div>
          </div>
        );
      })}
      <div className="plat-modal-actions">{saved && <span className="plat-saved"><Check size={15} /> Saved</span>}<button className="primary-button glow-button" onClick={save}>Save profile <Check size={16} /></button></div>
    </div>
  );
}

function CompanySectionView({ section, data, onSave, onResearch, user }) {
  const [values, setValues] = useState(data || {});
  const [saved, setSaved] = useState(false);
  useEffect(() => { setValues(data || {}); setSaved(false); }, [section.key]);
  const set = (k, v) => { setValues((s) => ({ ...s, [k]: v })); setSaved(false); };
  const Ico = PLAT_ICONS[section.icon] || ShieldCheck;
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Ico size={22} /> {section.name}</h1><p>{section.intro}</p></div>
      {section.key === "basics" && onResearch && <ResearchCard onResearch={onResearch} />}
      <div className="plat-profile-hint"><Sparkles size={14} /> {section.computed ? <>These are the only fields you set here — the numbers above come from your live data.</> : <>All fields are optional. Connect a data source under <b>Connectors</b> and we'll use your live data instead — which is more accurate than filling this in by hand.</>}</div>
      <div className="plat-card">
        <div className="plat-form">
          {section.fields.map((f) => <PlatField key={f.key} f={f} value={values[f.key]} onChange={set} />)}
        </div>
        <div className="plat-save-row">
          {saved && <span className="plat-saved"><Check size={15} /> Saved</span>}
          <button className="plat-start" onClick={() => { onSave(section.key, values); setSaved(true); }}>Save section <Check size={15} /></button>
        </div>
      </div>
    </div>
  );
}

const ACTIVE_RUN = new Set(["queued", "running"]);
const NO_PLAN_PKG = { key: "none", name: "No plan yet", target: "", suites: ["foundation"] };

function runFileName(run) {
  const base = (run.module_name || run.module_key || "deliverable").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const day = (run.finished_at || run.created_at || new Date().toISOString()).slice(0, 10);
  return `${base}-${day}.md`;
}

function ResultActions({ run }) {
  const text = resultText(run.result);
  if (!text) return null;
  return (
    <>
      <button type="button" className="plat-ghost" onClick={() => downloadText(runFileName(run), text)}>Download .md</button>
      <button type="button" className="plat-ghost" onClick={() => printHtml(run.module_name || "Deliverable", markdownToHtml(text))}>PDF</button>
    </>
  );
}

function RunStatusNote({ run }) {
  if (!run) return null;
  if (run.status === "error") return <p className="plat-err">The agent could not finish this run{run.error ? `: ${run.error}` : "."} You can regenerate it.</p>;
  if (run.status === "queued") {
    const waitingMin = (Date.now() - new Date(run.created_at).getTime()) / 60000;
    return <p className="plat-context-note">{waitingMin > 10 ? "Queued — your agent picks this up on its next scheduled run." : "Queued — your agent will start shortly. This page updates automatically."}</p>;
  }
  if (run.status === "running") return <p className="plat-context-note">Your agent is working on it — this page updates automatically.</p>;
  return null;
}

function ModuleView({ module, unlocked, companyFlat, runs, onRun, onRunUpdated, notify, gotoUpgrade, user }) {
  const flatKey = JSON.stringify(companyFlat || {});
  const [values, setValues] = useState(() => prefillFromCompany(module.fields, companyFlat));
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [resultDraft, setResultDraft] = useState("");
  const [editingResult, setEditingResult] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [answers, setAnswers] = useState({});
  const [answering, setAnswering] = useState(false);
  const [answerErr, setAnswerErr] = useState("");

  const moduleRuns = runs.filter((r) => r.module_key === module.key);
  const isLive = module.type === "live";
  const latest = moduleRuns[0];
  const finished = moduleRuns.find((r) => r.status === "done" || r.status === "completed");
  const shown = latest && (latest.status === "done" || latest.status === "completed") ? latest : finished;
  const shownText = shown ? resultText(shown.result) : "";
  const busy = latest && ACTIVE_RUN.has(latest.status);

  const inputsDirty = useRef(false);
  useEffect(() => { inputsDirty.current = false; setValues(prefillFromCompany(module.fields, companyFlat)); setErr(""); }, [module.key]);
  // profile updates (e.g. after company research) refresh the prefill unless the owner is typing
  useEffect(() => { if (!inputsDirty.current) setValues(prefillFromCompany(module.fields, companyFlat)); }, [flatKey]);
  useEffect(() => { setEditingResult(false); setResultDraft(shownText); }, [shown ? `${shown.id}:${shown.updated_at || ""}` : "none"]);
  useEffect(() => { setAnswers({}); setAnswerErr(""); }, [latest ? latest.id : "none"]);

  const set = (k, v) => { inputsDirty.current = true; setValues((s) => ({ ...s, [k]: v })); };
  const setAnswer = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  const submitAnswers = async (e) => {
    e.preventDefault();
    const missing = (latest.questions || []).filter((q) => !String(answers[q.key] || "").trim());
    if (missing.length) { setAnswerErr("Please answer every question — or write “not sure”."); return; }
    setAnswering(true); setAnswerErr("");
    try {
      const d = await api("/api/module-run", { method: "PATCH", body: { id: latest.id, answers } });
      if (d.run) onRunUpdated(d.run);
      notify("Thanks — the agent continues with your answers.");
    } catch (e2) { setAnswerErr(e2.message); }
    setAnswering(false);
  };

  const generate = async (e) => {
    if (e) e.preventDefault();
    if (!isLive) {
      const missing = module.fields.filter((f) => f.required && !values[f.key]);
      if (missing.length) { setErr("Please fill in the required fields."); return; }
    }
    setErr(""); setSending(true);
    const ok = await onRun(module, values);
    if (!ok) setErr("The module could not be started. Please try again.");
    setSending(false);
  };

  const saveResult = async () => {
    if (!shown) return;
    setSavingResult(true);
    try {
      const d = await api("/api/module-run", { method: "PATCH", body: { id: shown.id, result: resultDraft } });
      if (d.run) onRunUpdated(d.run);
      else onRunUpdated({ ...shown, result: { markdown: resultDraft, format: "md", edited: true } });
      setEditingResult(false);
      notify("Changes saved.");
    } catch (e) { notify(e.message, "error"); }
    setSavingResult(false);
  };

  const Ico = SUITE_ICONS[module.suiteKey] || Sparkles;
  const st = latest ? (RUN_STATUS[latest.status] || RUN_STATUS.queued) : null;

  return (
    <div className="plat-view">
      <div className="plat-view-head">
        <span className="plat-head-tags"><span className="outline-pill"><Ico size={14} /> {module.suiteName}</span><span className={`plat-cat plat-cat-${moduleCategory(module)}`}>{CAT_LABEL[moduleCategory(module)]}</span>{isLive && <span className="plat-live-badge"><span className="plat-live-dot" /> Live</span>}</span>
        <h1>{module.name}</h1>
        <p>{module.tagline}</p>
        <div className="plat-deliverables">{module.deliverables.map((d) => <span key={d}>{d}</span>)}</div>
      </div>

      {!unlocked ? (
        <div className="plat-card plat-locked-card">
          <div><Lock size={22} /><h3>This module is locked</h3><p>The {module.suiteName} isn't part of your current plan. Upgrade to unlock {module.name} and its deliverables.</p></div>
          <button className="plat-start" onClick={gotoUpgrade}>See plans <ArrowRight size={15} /></button>
        </div>
      ) : (
        <>
          {latest && latest.status === "needs_input" && Array.isArray(latest.questions) && latest.questions.length > 0 && (
            <div className="plat-card plat-questions-card">
              <div className="plat-result-head"><h3>The agent has a few questions <InfoButton text="Answer these so the agent can produce a sharp, tailored result. Your answers are saved and the agent continues automatically." /></h3><span className="plat-status tone-amber">Needs your input</span></div>
              <form onSubmit={submitAnswers} className="plat-form">
                {latest.questions.map((qn) => <PlatField key={qn.key} f={{ key: qn.key, label: qn.label, type: qn.type || "text", options: qn.options }} value={answers[qn.key]} onChange={setAnswer} />)}
                {answerErr && <p className="plat-err plat-full">{answerErr}</p>}
                <div className="plat-modal-actions plat-full">
                  <button type="submit" className="primary-button glow-button" disabled={answering}>{answering ? "Sending…" : "Submit answers"} <ArrowRight size={18} /></button>
                </div>
              </form>
            </div>
          )}
          <div className="plat-card">
            <div className="plat-result-head"><h3>{isLive ? "Live result" : "Result"} <InfoButton text="Generated by your agent from your company profile, your live business data and its research. You can edit and save it, or download it as Markdown / PDF." /></h3>{st && <span className={`plat-status tone-${st.tone}`}>{st.label}</span>}</div>
            {shown && latest && latest !== shown && <RunStatusNote run={latest} />}
            {shown ? (
              <>
                {shown.summary && !editingResult && <p className="plat-result-summary">{shown.summary}</p>}
                {editingResult ? (
                  <textarea className="plat-result-edit" rows="16" value={resultDraft} onChange={(e) => setResultDraft(e.target.value)} />
                ) : (
                  <div className="plat-md" dangerouslySetInnerHTML={{ __html: markdownToHtml(shownText) }} />
                )}
                <div className="plat-modal-actions">
                  {(shown.finished_at || shown.created_at) && <span className="plat-live-updated">Updated {new Date(shown.updated_at || shown.finished_at || shown.created_at).toLocaleString()}</span>}
                  {editingResult ? (
                    <>
                      <button className="plat-ghost" onClick={() => { setEditingResult(false); setResultDraft(shownText); }}>Cancel</button>
                      <button className="plat-start" onClick={saveResult} disabled={savingResult}>{savingResult ? "Saving…" : "Save changes"}</button>
                    </>
                  ) : (
                    <>
                      <ResultActions run={shown} />
                      <button className="plat-ghost" onClick={() => setEditingResult(true)}>Edit</button>
                    </>
                  )}
                </div>
              </>
            ) : latest ? (
              latest.status === "needs_input" ? <p className="plat-empty">Answer the questions above and the agent finishes the result.</p> : <RunStatusNote run={latest} />
            ) : (
              <p className="plat-empty">{isLive ? "No result yet. Connect your data (Connectors) and this updates automatically — or generate it now below." : "No result yet. Review the inputs below (already filled from your profile) and generate."}</p>
            )}
          </div>

          <div className="plat-card">
            <details className="plat-inputs" open={!latest}>
              <summary>{isLive ? "Focus & settings (optional)" : "Inputs — from your company profile, adjust before generating"}</summary>
              <p className="plat-context-note">These come from your company profile &amp; research. Edit anything, then {latest ? "regenerate" : "generate"}.</p>
              <form onSubmit={generate} className="plat-form">
                {module.fields.map((f) => <PlatField key={f.key} f={f} value={values[f.key]} onChange={set} />)}
                {err && <p className="plat-err plat-full">{err}</p>}
                <div className="plat-modal-actions plat-full">
                  <button type="submit" className="primary-button glow-button" disabled={sending || busy}>{sending ? "Starting…" : busy ? "Agent is working…" : (isLive ? "Update now" : (latest ? "Regenerate" : "Generate"))} <ArrowRight size={18} /></button>
                </div>
              </form>
            </details>
          </div>
        </>
      )}
    </div>
  );
}

function DeliverablesView({ runs, goto, user }) {
  const ready = runs.filter((r) => r.status === "done" || r.status === "completed");
  const inProgress = runs.filter((r) => ACTIVE_RUN.has(r.status) || r.status === "needs_input");
  const [files, setFiles] = useState([]);
  useEffect(() => {
    if (!user) return;
    let ok = true;
    api(`/api/records?email=${encodeURIComponent(user.email)}&kind=artifacts`).then((d) => { if (ok) setFiles(d.records || []); }).catch(() => {});
    return () => { ok = false; };
  }, [user, ready.length]);
  const legacyFiles = files.filter((f) => (f.data || {}).url);
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Deliverables</h1><p>Results your agents produced. Open them, edit them, or download them as Markdown or PDF.</p></div>
      {ready.length === 0 && inProgress.length === 0 && legacyFiles.length === 0 && (
        <div className="plat-card"><p className="plat-empty">Nothing yet. Run a module and its deliverables will land here once the agent finishes.</p></div>
      )}
      {inProgress.length > 0 && (
        <div className="plat-card">
          <h3>In progress</h3>
          <div className="plat-run-list">
            {inProgress.map((r) => {
              const st = RUN_STATUS[r.status] || RUN_STATUS.queued;
              return (
                <button className="plat-run plat-run-btn" key={r.id} onClick={() => goto(`module:${r.module_key}`)}>
                  <div><b>{r.module_name}</b><span>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</span></div>
                  <span className={`plat-status tone-${st.tone}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {ready.length > 0 && (
        <div className="plat-card">
          <h3>Ready</h3>
          <div className="plat-run-list">
            {ready.map((r) => (
              <div className="plat-run" key={r.id}>
                <div><b>{r.module_name}</b><span>{r.summary || (r.finished_at || r.created_at ? new Date(r.finished_at || r.created_at).toLocaleString() : "")}</span></div>
                <div className="plat-run-actions">
                  <ResultActions run={r} />
                  <button className="plat-start" onClick={() => goto(`module:${r.module_key}`)}>Open <ArrowRight size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {legacyFiles.length > 0 && (
        <div className="plat-card">
          <h3>Files</h3>
          <div className="plat-run-list">
            {legacyFiles.map((f) => { const d = f.data || {}; return (
              <div className="plat-run" key={f.id}>
                <div><b>{d.title}</b><span>{d.created_at ? new Date(d.created_at).toLocaleString() : ""}</span></div>
                <a className="plat-start" href={d.url} target="_blank" rel="noreferrer">Download <ArrowRight size={15} /></a>
              </div>
            ); })}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityView({ runs, goto, user }) {
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Activity</h1><p>Every module run and its current status.</p></div>
      <div className="plat-card">
        {runs.length === 0 ? <p className="plat-empty">No activity yet.</p> : (
          <div className="plat-run-list">
            {runs.map((r) => {
              const st = RUN_STATUS[r.status] || RUN_STATUS.queued;
              return (
                <button className="plat-run plat-run-btn" key={r.id} onClick={() => goto(`module:${r.module_key}`)}>
                  <div><b>{r.module_name}</b><span>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}{r.status === "error" && r.error ? ` · ${r.error}` : ""}</span></div>
                  <span className={`plat-status tone-${st.tone}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {user && <ChangeHistory user={user} />}
    </div>
  );
}

function AgentChat({ user, view }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState("");
  const [waitSince, setWaitSince] = useState(0);
  const bodyRef = useRef(null);

  const load = () => api(`/api/agent-chat?email=${encodeURIComponent(user.email)}`)
    .then((d) => {
      setMessages((m) => (Array.isArray(d.messages) && (d.messages.length || !m.some((x) => isLocalId(x.id))) ? d.messages : m));
      setPending(!!d.pending);
    })
    .catch(() => {});

  useEffect(() => { if (open) load(); }, [open, user]);
  // poll while a reply is outstanding
  useEffect(() => {
    if (!open || !pending) return;
    const iv = window.setInterval(load, 4000);
    return () => window.clearInterval(iv);
  }, [open, pending]);
  useEffect(() => { if (!pending) setWaitSince(0); }, [pending]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, open, pending]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim(); if (!text || sending) return;
    setErr(""); setSending(true);
    try {
      const d = await api("/api/agent-chat", { method: "POST", body: { email: user.email, message: text, context: { view } } });
      setMessages((m) => [...m, d.message || { id: `local-${Date.now()}`, role: "user", content: text, status: "pending" }]);
      setInput(""); setPending(true); setWaitSince(Date.now());
    } catch (e2) { setErr(e2.message); }
    setSending(false);
  };

  const slow = pending && waitSince && Date.now() - waitSince > 30000;

  return (
    <>
      <button className={`plat-chat-fab ${open ? "is-open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Chat with your agent">
        {open ? <X size={22} /> : <Bot size={26} />}
      </button>
      {open && (
        <div className="plat-chat">
          <div className="plat-chat-head"><span className="plat-chat-title"><Bot size={18} /> NEXUM Agent</span><button onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button></div>
          <div className="plat-chat-body" ref={bodyRef}>
            {messages.length === 0 && <div className="plat-chat-hint">Ask me anything about your business — I answer from your data, your profile and earlier results.</div>}
            {messages.map((m) => (
              m.role === "assistant"
                ? <div key={m.id} className="plat-chat-msg assistant plat-md" dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content) }} />
                : <div key={m.id} className="plat-chat-msg user">{m.content}</div>
            ))}
            {pending && <div className="plat-chat-msg assistant plat-chat-typing">{slow ? "Your agent answers on its next run — you can close the chat, the reply will be here." : "…"}</div>}
          </div>
          {err && <p className="plat-err plat-chat-err">{err}</p>}
          <form className="plat-chat-input" onSubmit={send}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your agent…" />
            <button type="submit" disabled={sending} aria-label="Send"><ArrowRight size={18} /></button>
          </form>
        </div>
      )}
    </>
  );
}

function Onboarding({ user }) {
  const [f, setF] = useState({ name: user.name && user.name !== user.email ? user.name : "", company: user.company || "", industry: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.industry) { setErr("Please pick your industry."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.auth.updateUser({ data: { name: f.name, company: f.company, industry: f.industry } });
    if (error) { setErr(error.message); setBusy(false); }
  };
  return (
    <div className="plat-modal-backdrop">
      <form className="plat-card plat-recovery" onSubmit={submit}>
        <h3>Welcome to NEXUM</h3>
        <p className="plat-context-note">Two details tailor the platform — vocabulary, operations tabs and every agent — to your business.</p>
        <label>Your name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Company<input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></label>
        <label>Industry
          <select value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} required>
            <option value="">— select your industry —</option>
            {INDUSTRIES.map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}
          </select>
        </label>
        {err && <p className="plat-err">{err}</p>}
        <div className="plat-modal-actions"><button type="submit" className="plat-start" disabled={busy}>{busy ? "…" : "Continue"} <ArrowRight size={15} /></button></div>
      </form>
    </div>
  );
}

const AUDIT_OP = { insert: "added", update: "changed", delete: "deleted" };
function auditText(e) {
  const what = e.table_name === "module_runs" ? `Agent run ${e.kind || ""}` : e.table_name === "company_profiles" ? "Company profile" : e.table_name === "subscriptions" ? "Plan" : (e.kind || "record");
  const ch = e.changed || {};
  if (e.table_name === "module_runs") return `${what}: ${(ch.status || "")}`;
  if (e.op === "update") return `${what} ${AUDIT_OP.update}: ${Object.keys(ch).slice(0, 4).join(", ")}`;
  return `${what} ${AUDIT_OP[e.op] || e.op}${ch.name ? ` — ${ch.name}` : ch.title ? ` — ${ch.title}` : ""}`;
}

function ChangeHistory({ user }) {
  const [entries, setEntries] = useState(null);
  useEffect(() => {
    let ok = true;
    api(`/api/audit?email=${encodeURIComponent(user.email)}&limit=60`).then((d) => { if (ok) setEntries(d.entries || []); }).catch(() => { if (ok) setEntries([]); });
    return () => { ok = false; };
  }, [user]);
  return (
    <div className="plat-card">
      <h3>Change history <InfoButton text="Every change to your data — by you, your team or your agents — is recorded here." /></h3>
      {entries == null ? <p className="plat-empty">Loading…</p> : entries.length === 0 ? <p className="plat-empty">No changes recorded yet.</p> : (
        <div className="plat-run-list">
          {entries.map((e) => (
            <div className="plat-run" key={e.id}>
              <div><b>{auditText(e)}</b><span>{new Date(e.at).toLocaleString()} · {String(e.actor || "").startsWith("internal:") ? "integration" : e.actor === user.email ? "you" : /^(postgres|service_role|supabase)/.test(e.actor || "") ? "agent / system" : e.actor}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tables with their own views (not in COLLECTIONS) that can still be imported.
const EXTRA_IMPORTS = [
  { key: "products", name: "Products", fields: [
    { key: "name", label: "Name" }, { key: "category", label: "Category" },
    { key: "price", label: "Price", type: "number" }, { key: "cost", label: "Cost", type: "number" }, { key: "status", label: "Status" }] },
];

function ImportDialog({ user, initial, onClose, notify }) {
  const importable = [...COLLECTIONS.filter((c) => !["tasks"].includes(c.key)), ...EXTRA_IMPORTS.filter((x) => !COLLECTIONS.some((c) => c.key === x.key))];
  const [kind, setKind] = useState(initial && initial.kind ? initial.kind : importable[0].key);
  const [parsed, setParsed] = useState(initial && initial.parsed ? initial.parsed : null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const col = importable.find((c) => c.key === kind);
  const labels = Object.fromEntries(col.fields.map((f) => [f.key, [fieldLabel(user.industry, kind, f.key, f.label)]]));
  const map = parsed ? mapHeaders(parsed.headers, col.fields, labels) : {};
  const records = parsed ? rowsToRecords(parsed.rows, col.fields, map) : [];
  const onFile = (file) => {
    setErr("");
    if (!file) return;
    if (file.size > 5_000_000) { setErr("File too large (max 5 MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => { const p = parseCsv(reader.result); if (!p.headers.length) setErr("No rows found."); setParsed(p); };
    reader.readAsText(file);
  };
  const run = async () => {
    setBusy(true); setErr("");
    try {
      let n = 0;
      for (let i = 0; i < records.length; i += 500) {
        const d = await api("/api/records", { method: "POST", body: { email: user.email, kind, items: records.slice(i, i + 500) } });
        n += d.count || 0;
      }
      notify(`${n} ${col.name.toLowerCase()} imported.`);
      onClose(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className="plat-modal-backdrop">
      <div className="plat-card plat-import">
        <div className="plat-result-head"><h3>Import data</h3><button className="plat-ghost" onClick={() => onClose(false)}>Close</button></div>
        <label>Import into
          <select value={kind} onChange={(e) => setKind(e.target.value)}>{importable.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</select>
        </label>
        {!(initial && initial.parsed) && <label>CSV file (Excel: “Save as CSV”)<input type="file" accept=".csv,text/csv,.txt" onChange={(e) => onFile(e.target.files && e.target.files[0])} /></label>}
        {parsed && (
          <>
            <p className="plat-context-note">{parsed.rows.length} rows · columns matched: {Object.keys(map).length ? Object.entries(map).map(([k, h]) => `${h} → ${fieldLabel(user.industry, kind, k, (col.fields.find((f) => f.key === k) || {}).label)}`).join(", ") : "none — rename the column headers to the field names shown in the table"}</p>
            {records.length > 0 && (
              <div className="plat-table-wrap">
                <table className="plat-table">
                  <thead><tr>{Object.keys(map).map((k) => <th key={k}>{fieldLabel(user.industry, kind, k, (col.fields.find((f) => f.key === k) || {}).label)}</th>)}</tr></thead>
                  <tbody>{records.slice(0, 5).map((r, i) => <tr key={i}>{Object.keys(map).map((k) => <td key={k}>{String(r[k] ?? "")}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </>
        )}
        {err && <p className="plat-err">{err}</p>}
        <div className="plat-modal-actions">
          <button className="plat-start" disabled={busy || records.length === 0} onClick={run}>{busy ? "Importing…" : `Import ${records.length} rows`} <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}

function PasswordRecovery() {
  const [open, setOpen] = useState(() => !!(recovery && recovery.active));
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("nexum-recovery", on);
    return () => window.removeEventListener("nexum-recovery", on);
  }, []);
  if (!open || !supabaseEnabled) return null;
  const close = () => {
    recovery.active = false; setOpen(false);
    try { window.history.replaceState(null, "", "/platform"); } catch (e) {}
  };
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) { setErr("Please use at least 8 characters."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setErr(error.message); else { setMsg("Password updated."); window.setTimeout(close, 1500); }
    setBusy(false);
  };
  return (
    <div className="plat-modal-backdrop">
      <form className="plat-card plat-recovery" onSubmit={submit}>
        <h3>Set a new password</h3>
        <label>New password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required /></label>
        {err && <p className="plat-err">{err}</p>}
        {msg && <p className="plat-saved"><Check size={15} /> {msg}</p>}
        <div className="plat-modal-actions">
          <button type="button" className="plat-ghost" onClick={close}>Later</button>
          <button type="submit" className="plat-start" disabled={busy}>{busy ? "…" : "Save password"}</button>
        </div>
      </form>
    </div>
  );
}

function PlatformPage({ demo = false }) {
  const { lang } = useI18n();
  const [authUser, setUser, authReady] = usePlatformUser();
  const user = demo ? DEMO_USER : authUser;
  const [plan, setPlan] = useState(null);
  const [view, setView] = useState("overview");
  const [runs, setRuns] = useState([]);
  const [company, setCompany] = useState({});
  const [toast, setToast] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const activeRef = useRef(false);
  const prevRunsRef = useRef(null);
  const toastTimer = useRef(0);

  // plan comes from the server (/api/billing); until it is known nothing is unlocked
  const pkg = !plan ? NO_PLAN_PKG : plan.package_key === "none" ? NO_PLAN_PKG : packageByKey(plan.package_key);
  const ind = industryConfig(user && user.industry);
  const email = user ? user.email : null;
  activeRef.current = runs.some((r) => ACTIVE_RUN.has(r.status));

  const notify = (text, tone = "ok") => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  };

  // responses for a previous user (signed out while a request was in flight) are dropped
  const currentEmail = useRef(email);
  currentEmail.current = email;
  const loadCompany = () => {
    const who = email;
    return api(`/api/company?email=${encodeURIComponent(who)}`)
      .then((d) => { if (currentEmail.current === who && d && d.data && Object.keys(d.data).length) setCompany(d.data); }).catch(() => {});
  };
  const loadNotifications = () => {
    const who = email;
    return api(`/api/records?email=${encodeURIComponent(who)}&kind=notifications`)
      .then((d) => { if (currentEmail.current === who && Array.isArray(d.records)) setNotifications(d.records); }).catch(() => {});
  };

  // per-user data; everything is reset when the user changes (sign-out / switch)
  useEffect(() => {
    setRuns([]); setCompany({}); setNotifications([]); setPlan(null); prevRunsRef.current = null; setView("overview");
    if (!email) return;
    let ok = true;
    if (!supabaseEnabled) {
      try { const l = JSON.parse(window.localStorage.getItem(`nexum_company_${email}`) || "null"); if (l) setCompany(l); } catch (e) {}
    }
    loadCompany();
    const loadPlan = () => api(`/api/billing?email=${encodeURIComponent(email)}`).then((d) => { if (ok) setPlan(d); }).catch(() => { if (ok) setPlan({ package_key: "none", billing: true, status: "unknown" }); });
    loadPlan();
    // back from Stripe Checkout: the webhook may need a few seconds
    let checkoutTimer = 0;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout")) {
      const success = params.get("checkout") === "success";
      try { window.history.replaceState(null, "", "/platform"); } catch (e) {}
      if (success) {
        notify("Payment received — activating your plan…");
        let tries = 0;
        checkoutTimer = window.setInterval(() => { tries++; loadPlan(); if (tries >= 10) window.clearInterval(checkoutTimer); }, 3000);
      } else notify("Checkout cancelled — nothing was charged.", "warn");
    }
    let last = 0; let inFlight = false;
    const loadRuns = () => {
      if (inFlight) return; // no overlapping polls → no out-of-order statuses
      inFlight = true;
      const sentAt = Date.now(); last = sentAt;
      api(`/api/module-run?email=${encodeURIComponent(email)}`)
        .then((d) => {
          if (!ok) return;
          setRuns((prev) => {
            const fresh = d.runs || [];
            const ids = new Set(fresh.map((r) => r.id));
            // keep local runs and runs started while this request was in flight
            const keep = prev.filter((r) => !ids.has(r.id) && (isLocalId(r.id) || new Date(r.created_at).getTime() > sentAt - 2000));
            return [...keep, ...fresh];
          });
        })
        .catch(() => {})
        .finally(() => { inFlight = false; });
    };
    loadRuns();
    loadNotifications();
    // runs: every 5 s while an agent is busy, otherwise every 30 s; notifications every 60 s
    let lastNotes = Date.now();
    const iv = window.setInterval(() => {
      if (document.hidden) return;
      if (activeRef.current || Date.now() - last > 30000) loadRuns();
      if (Date.now() - lastNotes > 60000) { lastNotes = Date.now(); loadNotifications(); }
    }, 5000);
    // back on the tab: refresh right away instead of waiting for the next tick
    const onVisible = () => { if (!document.hidden) { loadRuns(); loadNotifications(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { ok = false; window.clearInterval(iv); window.clearInterval(checkoutTimer); document.removeEventListener("visibilitychange", onVisible); };
  }, [email]);

  // react to agent progress: toast, refresh alerts/profile
  useEffect(() => {
    const prev = prevRunsRef.current;
    prevRunsRef.current = new Map(runs.map((r) => [r.id, r.status]));
    if (!prev) return;
    for (const r of runs) {
      const before = prev.get(r.id);
      if (!before || before === r.status || !ACTIVE_RUN.has(before)) continue;
      if (r.status === "done") {
        notify(`“${r.module_name || r.module_key}” is ready.`);
        loadNotifications();
        if (r.module_key === "company-research") loadCompany();
      } else if (r.status === "needs_input") {
        notify(`“${r.module_name || r.module_key}” needs your input.`, "warn");
      } else if (r.status === "error") {
        notify(`“${r.module_name || r.module_key}” failed — you can regenerate it.`, "error");
      }
    }
  }, [runs]);


  const persistCompany = (next) => {
    setCompany(next);
    if (!supabaseEnabled) { try { window.localStorage.setItem(`nexum_company_${email}`, JSON.stringify(next)); } catch (e) {} }
    api("/api/company", { method: "POST", body: { email, name: user.name, company: user.company, data: next } })
      .then((d) => { if (d && d.data) setCompany(d.data); })
      .catch((e) => notify(`Profile not saved: ${e.message}`, "error"));
  };
  const saveCompanySection = (sectionKey, values) => persistCompany({ ...company, [sectionKey]: values });
  const saveCompanyAll = (next) => persistCompany(next);

  const companyFlat = Object.assign({}, ...Object.values(company || {}).map((v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {})));

  const onRunUpdated = (run) => setRuns((rs) => rs.map((x) => (x.id === run.id ? { ...x, ...run } : x)));

  const runModule = async (module, values) => {
    const payload = {
      email, name: user.name, company: user.company,
      packageKey: pkg.key, suiteKey: module.suiteKey, moduleKey: module.key, moduleName: module.name,
      inputs: { ...values }, lang, source: "platform", industry: user.industry,
    };
    try {
      const data = await api("/api/module-run", { method: "POST", body: payload });
      const run = data.run || { id: `local-${Date.now()}`, created_at: new Date().toISOString(), module_key: module.key, module_name: module.name, suite_key: module.suiteKey, status: "queued" };
      setRuns((r) => [run, ...r.filter((x) => x.id !== run.id)]);
      notify(`“${module.name}” started — your agent is now working on it.`);
      return true;
    } catch (e) {
      notify(`“${module.name}” could not be started: ${e.message}`, "error");
      return false;
    }
  };

  const runResearch = async (inputs) => runModule({ key: "company-research", name: "Company Research", suiteKey: "strategy", deliverables: [], fields: [] }, inputs);

  const markNoteRead = async (note) => {
    const data = { ...(note.data || {}), read: true };
    setNotifications((ns) => ns.map((x) => (x.id === note.id ? { ...x, data } : x)));
    try { await api("/api/records", { method: "PATCH", body: { id: note.id, email, data } }); } catch (e) {}
  };
  const markAllNotesRead = async () => {
    const unread = notifications.filter((n) => !(n.data || {}).read);
    setNotifications((ns) => ns.map((x) => ({ ...x, data: { ...(x.data || {}), read: true } })));
    for (const n of unread) { try { await api("/api/records", { method: "PATCH", body: { id: n.id, email, data: { ...(n.data || {}), read: true } } }); } catch (e) {} }
  };

  const runTasks = async () => runModule({ key: "daily-tasks", name: "Daily Tasks", suiteKey: "intelligence", deliverables: [], fields: [] }, {});

  const goto = (v) => { setView(v); setNavOpen(false); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); };
  const signOut = async () => { if (demo) { navigateTo("/potential-analysis"); return; } await setUser(null); };

  if (!authReady && !demo) {
    return (<Shell><main><section className="platform-page"><div className="plat-auth"><p className="plat-empty">Loading…</p></div></section></main></Shell>);
  }
  if (!user) {
    return (<Shell><main><section className="platform-page">{!AUTH_OPEN ? <div className="plat-auth"><h1>NEXUM Platform</h1><BetaAccess /><button type="button" className="plat-auth-switch" onClick={() => navigateTo("/use-case-demo")}>Just looking? Try the live demo — no account needed</button></div> : supabaseEnabled ? <PlatformAuth /> : <PlatformSignIn onSignIn={setUser} />}</section></main></Shell>);
  }

  const firstName = (user.name || "").split(" ")[0] || user.name;

  let content = null;
  if (view === "overview") content = <OverviewView user={user} pkg={pkg} runs={runs} company={company} goto={goto} notifications={notifications} onNoteRead={markNoteRead} />;
  else if (view === "deliverables") content = <DeliverablesView runs={runs} goto={goto} user={user} />;
  else if (view === "activity") content = <ActivityView runs={runs} goto={goto} user={user} />;
  else if (view === "connectors") content = <ConnectorsView user={user} notify={notify} />;
  else if (view === "subscription") content = <SubscriptionView pkg={pkg} plan={plan} notify={notify} />;
  else if (view === "products") content = <ProductsView user={user} label={ind.product} industryKey={user.industry} />;
  else if (view === "pos") content = <PosView user={user} label={ind.sale} />;
  else if (view === "finance") content = <FinanceDashboardView user={user} />;
  else if (view === "purchasing") content = <PurchasingView user={user} />;
  else if (view === "profile") content = <ProfileView company={company} onSaveAll={saveCompanyAll} onResearch={runResearch} />;
  else if (view === "phases") content = <PhasesView pkg={pkg} goto={goto} />;
  else if (view === "tasks") content = <DailyTasksView user={user} runs={runs} onGenerate={runTasks} />;
  else if (view.startsWith("collection:")) {
    const col = collectionByKey(view.slice(11));
    const colLabel = col ? (col.key === "customers" ? ind.customer : col.key === "campaigns" ? "Marketing" : col.name) : "";
    content = col ? <CollectionView key={col.key} collection={col} user={user} label={colLabel} industryKey={user.industry} /> : null;
  } else if (view.startsWith("company:")) {
    const section = COMPANY_SECTIONS.find((s) => s.key === view.slice(8));
    content = section ? <CompanySectionView section={section} data={company[section.key]} onSave={saveCompanySection} onResearch={runResearch} user={user} /> : null;
  } else if (view.startsWith("module:")) {
    const mod = allModules().find((m) => m.key === view.slice(7));
    if (mod) content = <ModuleView module={mod} unlocked={pkg.suites.includes(mod.suiteKey)} companyFlat={companyFlat} runs={runs} onRun={runModule} onRunUpdated={onRunUpdated} notify={notify} gotoUpgrade={() => goto("subscription")} user={user} />;
  }

  const navItem = (key, label, icon, opts = {}) => {
    const Ico = icon;
    return (
      <button key={key} className={`plat-nav-item ${view === key ? "is-active" : ""} ${opts.locked ? "is-locked" : ""}`} onClick={() => goto(key)}>
        {Ico && <Ico size={16} />}<span>{label}</span>{opts.locked && <Lock size={12} />}
      </button>
    );
  };

  return (
    <Shell>
      <main>
        {demo && (
          <SubHero
            label="Use Case Demonstration"
            title="Explore the NEXUM Platform Live"
            text="This is the real NEXUM cockpit with a fictional café. Click through operations, start agent modules, answer their questions and chat with your agent — no account needed."
          />
        )}
        <div className="platform-shell">
          <button className="plat-nav-toggle" onClick={() => setNavOpen((o) => !o)}><Menu size={18} /> Menu</button>
          <aside className={`plat-sidebar ${navOpen ? "is-open" : ""}`}>
            <div className="plat-brand"><LayoutDashboard size={18} /> NEXUM Platform</div>
            <nav>
              {navItem("overview", "Overview", LayoutDashboard)}
              {navItem("phases", "Phases", Sparkles)}
              {navItem("tasks", "Daily Tasks", Check)}

              <div className="plat-nav-group">Operations</div>
              {ind.ops.map((key) => { const r = OP_ROUTE[key]; return r ? navItem(r[0], opLabel(ind, key), r[1]) : null; })}

              <div className="plat-nav-group">Company</div>
              {navItem("profile", "Company Profile", ShieldCheck)}

              {SUITES.filter((s) => !s.base && s.modules.length).map((suite) => {
                const unlocked = pkg.suites.includes(suite.key);
                return (
                  <div key={suite.key}>
                    <div className="plat-nav-group">{suite.name}{!unlocked && <Lock size={11} />}</div>
                    {suite.modules.map((m) => navItem(`module:${m.key}`, m.name, SUITE_ICONS[suite.key], { locked: !unlocked }))}
                  </div>
                );
              })}

              <div className="plat-nav-group">Results</div>
              {navItem("deliverables", "Deliverables", Check)}
              {navItem("activity", "Activity", Workflow)}

              <div className="plat-nav-group">Settings</div>
              {navItem("subscription", "Subscription", ShieldCheck)}
              {navItem("connectors", "Connectors", Cpu)}
            </nav>

            <div className="plat-sidebar-foot">
              <div className="plat-plan-mini" onClick={() => goto("subscription")}><span>Plan</span><b>{pkg.name}</b></div>
              <div className="plat-user"><span>{firstName}</span><button className="plat-ghost plat-signout" onClick={signOut}>{demo ? "Exit demo" : "Sign out"}</button></div>
            </div>
          </aside>

          <div className="plat-main">
            {demo && (
              <div className="plat-demo-banner">
                <span><b>Live demo</b> — fictional café data. Start modules, answer the agent, chat, record sales: everything works, nothing is saved.</span>
                <button className="plat-start" onClick={() => navigateTo("/potential-analysis")}>Create your account <ArrowRight size={15} /></button>
              </div>
            )}
            <div className="plat-topbar"><NotificationBell notifications={notifications} onRead={markNoteRead} onReadAll={markAllNotesRead} goto={goto} /></div>
            {toast && <div className={`plat-toast plat-toast-${toast.tone}`}>{toast.tone === "ok" ? <Check size={16} /> : <span className="plat-toast-dot" />} {toast.text}</div>}
            {content}
          </div>
        </div>
      </main>
      <AgentChat user={user} view={view} />
      {!demo && <PasswordRecovery />}
      {!demo && user.needsOnboarding && supabaseEnabled && <Onboarding user={user} />}
    </Shell>
  );
}

function PotentialAnalysisPage() {
  const { t } = useI18n();
  const [loginOpen, setLoginOpen] = useState(false);
  const [authUser] = usePlatformUser();
  const [mockSignedIn, setSignedIn] = useState(false);
  const signedIn = supabaseEnabled ? !!authUser : mockSignedIn;
  const [score, setScore] = useState(76);
  const [resultText, setResultText] = useState("Complete the fields and sign in to unlock your autonomous growth potential.");
  const analysisPath = useLocationPath().split("#")[0];
  const showQuestionnaire = analysisPath === "/potential-analysis/fragebogen";

  if (showQuestionnaire) {
    return (
      <Shell>
        <main>
          <section className="potential-login-page readiness-page">
            <ReadinessTest />
          </section>
        </main>
      </Shell>
    );
  }

  const signIn = () => {
    setSignedIn(true);
    setLoginOpen(false);
    setScore(88);
    setResultText("Your idea shows strong automation potential. NEXUM can turn it into a scalable agent-powered system.");
  };

  const runAnalysis = (event) => {
    event.preventDefault();
    if (!signedIn) {
      setLoginOpen(true);
      return;
    }
    setScore(91);
    setResultText("High potential detected: your model is ready for structured validation, automation and scalable execution.");
  };

  return (
    <Shell>
      <main>
        <section className="potential-login-page">
          <div className="potential-shell">
            <article className="signin-side">
              <span className="outline-pill"><Zap size={14} /> {t.platform.pill}</span>
              <h1>{t.platform.title}</h1>
              <p>
                {t.platform.signinText}
              </p>
              {!AUTH_OPEN && !authUser ? <BetaAccess /> : supabaseEnabled ? (
                authUser ? (
                  <div className="signin-done">
                    <p className="plat-saved"><Check size={15} /> Signed in as {authUser.email}</p>
                    <button className="primary-button glow-button" type="button" onClick={() => navigateTo("/platform")}>Open your platform <ArrowRight size={18} /></button>
                  </div>
                ) : <PlatformAuth embedded />
              ) : (
                <>
                  <div className="signin-provider-list">
                    <button type="button" onClick={() => navigateTo("/platform")}><img src={googleLogo} alt="" /> {t.platform.google}</button>
                    <button type="button" onClick={() => navigateTo("/platform")}><img src={microsoftLogo} alt="" /> {t.platform.microsoft}</button>
                  </div>
                  <form className="signin-inline-form" onSubmit={(event) => { event.preventDefault(); navigateTo("/platform"); }}>
                    <label>
                      {t.platform.email}
                      <input type="email" placeholder="you@company.com" />
                    </label>
                    <label>
                      {t.platform.password}
                      <input type="password" placeholder={t.platform.password} />
                    </label>
                    <button className="primary-button glow-button" type="submit">{t.btn.signIn}</button>
                  </form>
                  <button type="button" className="plat-auth-switch" onClick={() => navigateTo("/platform")}>New here? Create an account</button>
                </>
              )}
              <button type="button" className="plat-auth-switch" onClick={() => navigateTo("/use-case-demo")}>Just looking? Try the live demo — no account needed</button>
            </article>

            <article className="score-side">
              <div className="score-header">
                <span className="outline-pill">{t.platform.scorePill}</span>
                <strong>{score}%</strong>
              </div>
              <div className="score-bar" aria-label={`Potential score ${score} percent`}>
                <span style={{ width: `${score}%` }} />
              </div>
              <h2>{t.platform.scoreTitle}</h2>
              <p>
                {t.platform.scoreIntro}
              </p>
              {showQuestionnaire ? (
              <form className="score-form" onSubmit={runAnalysis}>
                {scoreFields.map(([label, options]) => (
                  <label key={label}>
                    {t.platform.fields[label] || label}
                    <select defaultValue="">
                      <option value="" disabled>{t.platform.fields[label] || label}</option>
                      {options.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
                <label className="full">
                  {t.platform.businessIdea}
                  <textarea rows="4" placeholder={t.platform.businessIdeaPlaceholder} />
                </label>
                <button className="primary-button glow-button full" type="submit">
                  {t.btn.runScore} <ArrowRight size={18} />
                </button>
                <p className="score-result full">{resultText}</p>
              </form>
              ) : (
                <div className="agent-intro">
                  <div className="agent-avatar"><AgentRobot /></div>
                  <div className="agent-bubble">
                    <p>{t.platform.agentBubble}</p>
                    <Link className="primary-button glow-button" to="/potential-analysis/fragebogen">
                      {t.btn.startQuestionnaire} <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              )}
            </article>
          </div>
        </section>
      </main>
      {loginOpen && !(supabaseEnabled && authUser) && <SignInModal onClose={() => setLoginOpen(false)} onSignIn={signIn} />}
    </Shell>
  );
}

// The real platform UI on fictional data, no login. /api/* is answered in the
// browser by src/demoApi.js while this is mounted.
function DemoPlatform() {
  useState(() => installDemoApi()); // during render, so it is active before child effects fetch
  useEffect(() => installDemoApi(), []); // (re-)install after StrictMode remounts; returns the uninstall
  return <PlatformPage demo />;
}

function UseCaseDemoPage() {
  return <DemoPlatform />;
}

const blogImages = [scenePresenter, sceneAiWindow, abstractDashboard, abstractSystem];

function BlogPage() {
  return (
    <Shell>
      <main>
        <SubHero label="Blog Posts" title="Latest News & Insights" text="Research, resources, and strategy notes for AI-powered operations." />
        <section className="section">
          <div className="blog-grid">
            {blogPosts.map((post, index) => (
              <Link className="blog-card" to={`/blog/${post.slug}`} key={post.slug}>
                <img className="blog-card-img" src={blogImages[index % blogImages.length]} alt={post.title} />
                <span>{post.category} · {post.date}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <ul>
                  {post.bullets.slice(0, 3).map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <strong>Read more <ArrowRight size={16} /></strong>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Shell>
  );
}

function BlogPostPage() {
  const slug = useLocationPath().split("#")[0].replace(/^\/blog\//, "");
  const post = useMemo(() => blogPosts.find((item) => item.slug === slug), [slug]);
  const idx = blogPosts.findIndex((item) => item.slug === slug);

  if (!post) return <NotFoundPage />;

  return (
    <Shell>
      <main>
        <article className="article-page">
          <Link className="back-link" to="/blog"><ChevronLeft size={16} /> Back To All Posts</Link>
          <img className="article-banner" src={blogImages[(idx < 0 ? 0 : idx) % blogImages.length]} alt={post.title} />
          <div className="article-meta">{post.date} · {post.category}</div>
          <h1>{post.title}</h1>
          <p className="article-lede">{post.excerpt}</p>
          <ul className="article-bullets">
            {post.bullets.map((bullet) => <li key={bullet}><Check size={17} /> {bullet}</li>)}
          </ul>
          {post.sections.map(([title, text]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        </article>
      </main>
    </Shell>
  );
}

// Call request instead of a booking calendar: the visitor picks the weekdays and time
// slots that suit them; the request goes to /api/lead (Supabase `leads` + sales e-mail).
const CALL_DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"]];
const CALL_SLOTS = ["08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00"];
const HONEYPOT_FIELDS = ["website", "company", "message", "subject", "title", "description", "feedback", "notes", "details", "remarks", "comments"];

function ChipGroup({ legend, options, value, onChange }) {
  const toggle = (key) => onChange((cur) => (cur.includes(key) ? cur.filter((v) => v !== key) : [...cur, key]));
  return (
    <fieldset className="full chip-group">
      <legend>{legend}</legend>
      <div>
        {options.map(([key, label]) => (
          <button key={key} type="button" className={`chip ${value.includes(key) ? "is-on" : ""}`} aria-pressed={value.includes(key)} onClick={() => toggle(key)}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ContactPage() {
  const { lang } = useI18n();
  const [days, setDays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [err, setErr] = useState("");
  const timezone = useMemo(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ""; } }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (HONEYPOT_FIELDS.some((f) => String(form.get(f) || "").trim())) { setState("sent"); return; }
    if (!days.length || !slots.length) { setErr("Please choose at least one day and one time slot."); return; }
    setErr("");
    setState("sending");
    const payload = {
      source: "contact",
      lang,
      contact: {
        name: form.get("Name"), email: form.get("Email"), company: form.get("Company"), phone: form.get("Phone"),
        challenge: form.get("Details"), consent: form.get("Consent") === "on",
      },
      request: { topic: form.get("Topic"), budget: form.get("Budget") },
      availability: { days, slots, timezone },
    };
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
      setState("sent");
    } catch (e) {
      setState("error");
      setErr("Sending failed. Please try again or write to nexumintelligence@outlook.com.");
    }
  }

  return (
    <Shell>
      <main>
        <SubHero label="Let’s Talk" title="Request a Strategy Call" text="Tell us about your project and when it suits you — we will confirm a time by e-mail." />
        <section className="contact-section">
          {state === "sent" ? (
            <div className="contact-form contact-done">
              <h2><Check size={22} /> Thank you — your request is in.</h2>
              <p>We will get back to you within 24 business hours with a time that matches your availability.</p>
              <Link className="secondary-button" to="/use-case-demo">Explore the live demo meanwhile</Link>
            </div>
          ) : (
          <form className="contact-form" onSubmit={submit}>
            <label>Name *<input required name="Name" placeholder="David Johnson" autoComplete="name" maxLength={120} /></label>
            <label>Email *<input required type="email" name="Email" placeholder="example@mail.com" autoComplete="email" maxLength={200} /></label>
            <label>Company Name *<input required name="Company" placeholder="Your company" autoComplete="organization" maxLength={160} /></label>
            <label>Phone<input type="tel" name="Phone" placeholder="+49 …" autoComplete="tel" maxLength={40} /></label>
            <label>Topic *
              <select required name="Topic" defaultValue="">
                <option value="" disabled>Select a topic</option>
                <option>Beta access to the Agent Platform</option>
                <option>AI automation project</option>
                <option>Strategy & consulting</option>
                <option>Partnership</option>
                <option>Other</option>
              </select>
            </label>
            <label>Project Budget
              <select name="Budget" defaultValue="">
                <option value="">Not sure yet</option>
                <option>Under €10.000</option>
                <option>€10.000 – €25.000</option>
                <option>€25.000 – €50.000</option>
                <option>Above €50.000</option>
              </select>
            </label>
            <ChipGroup legend="Which weekdays suit you best? *" options={CALL_DAYS} value={days} onChange={setDays} />
            <ChipGroup legend={`Preferred time slots *${timezone ? ` (${timezone})` : ""}`} options={CALL_SLOTS.map((s) => [s, s])} value={slots} onChange={setSlots} />
            <label className="full">Project Details<textarea name="Details" rows="5" placeholder="Tell us more about your project" maxLength={4000} /></label>
            <label className="full consent"><input type="checkbox" name="Consent" required /><span>I agree that NEXUM Intelligence stores my details to arrange the call (see <Link to="/legal/privacy-policy">privacy policy</Link>). *</span></label>
            {HONEYPOT_FIELDS.map((field) => (
              <input key={field} className="hp-field" name={field} tabIndex="-1" autoComplete="off" aria-hidden="true" />
            ))}
            {err && <p className="form-error full" role="alert">{err}</p>}
            <button className="primary-button glow-button" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Request call"} <ArrowRight size={18} /></button>
            <p className="muted">We will confirm a time within 24 business hours.</p>
          </form>
          )}
          <aside className="contact-card">
            <h2>Ready to Build Your AI Advantage?</h2>
            <p>Stop managing tasks. Start managing systems.</p>
            <a href="mailto:nexumintelligence@outlook.com"><Mail size={20} />nexumintelligence@outlook.com</a>
            <Link className="secondary-button" to="/use-case-demo">Try the live demo</Link>
          </aside>
        </section>
      </main>
    </Shell>
  );
}

function LegalPage({ type }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy policy" : "Cookie policy";
  const sections = isPrivacy
    ? [
        ["1. Information we collect", "When you visit this website, certain information may be collected automatically. If you choose to contact us, we may collect personal details such as your name, email address, or project information."],
        ["2. How we use your information", "Information is used to respond to inquiries, provide services, and improve the content and functionality of this website."],
        ["3. Cookies & analytics", "This website may use cookies or analytics tools to understand general usage and improve performance."],
        ["4. Sharing of information", "Your information is not sold, rented, or traded with third parties."],
        ["5. Data retention", "Personal information is stored only as long as necessary or as required by law."],
        ["6. Security", "Reasonable technical and organizational measures are in place to protect your information."],
        ["7. Your rights", "You may request a copy of your data, ask for corrections or deletion, and withdraw consent."],
        ["8. Contact", "If you have questions, contact nexumintelligence@outlook.com."],
      ]
    : [
        ["1. What are cookies?", "Cookies are small text files stored on your device when you visit a website."],
        ["2. How we use cookies", "This website may use cookies for essential functionality, analytics, and preferences."],
        ["3. Third-party cookies", "Some cookies may come from trusted third-party services such as analytics or embedded content."],
        ["4. Managing cookies", "You can control or disable cookies through your browser settings."],
        ["5. Consent", "By continuing to use this website, you consent to the use of cookies as outlined in this policy."],
        ["6. Updates", "This Cookie Policy may be updated occasionally."],
        ["7. Contact", "If you have questions, contact nexumintelligence@outlook.com."],
      ];

  return (
    <Shell>
      <main>
        <article className="article-page legal">
          <div className="article-meta">Dec 2025</div>
          <h1>{title}</h1>
          <p className="article-lede">
            {isPrivacy
              ? "Your privacy matters. This policy explains how we collect, use, and protect your information when you interact with this website."
              : "This website uses cookies to improve your browsing experience. This policy explains what cookies are, how they are used here, and how you can manage them."}
          </p>
          {sections.map(([heading, text]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p>{text}</p>
            </section>
          ))}
          <Link className="secondary-button" to={isPrivacy ? "/legal/cookie-policy" : "/legal/privacy-policy"}>
            {isPrivacy ? "Cookie policy ›" : "‹ Privacy policy"}
          </Link>
        </article>
      </main>
    </Shell>
  );
}

function NotFoundPage() {
  return (
    <Shell>
      <main>
        <section className="not-found">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you are looking for doesn't exist or has been moved.</p>
          <Link className="primary-button" to="/">Back Home</Link>
        </section>
      </main>
    </Shell>
  );
}

function SubHero({ label, title, text }) {
  return (
    <section className="subhero">
      <span className="pill"><Zap size={15} /> {label}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

function CTA() {
  const { t } = useI18n();
  return (
    <section className="cta">
      <h2>{t.cta.title}</h2>
      <p>{t.footer.tagline}</p>
      <BookCallButton className="primary-button" arrow />
    </section>
  );
}

function Routes() {
  const path = useLocationPath().split("#")[0] || "/";

  if (path === "/") return <HomePageV2 />;
  if (path === "/about") return <AboutPageV2 />;
  if (path === "/what-we-build") return <WhatWeBuildPage />;
  if (path === "/how-it-works") return <HowItWorksPage />;
  if (path === "/agent-platform") return <AgentPlatformPage />;
  if (path === "/potential-analysis") return <PotentialAnalysisPage />;
  if (path === "/potential-analysis/fragebogen") return <PotentialAnalysisPage />;
  if (path === "/platform") return <PlatformPage />;
  if (path === "/use-case-demo") return <UseCaseDemoPage />;
  if (path === "/blog") return <BlogPage />;
  if (path.startsWith("/blog/")) return <BlogPostPage />;
  if (path === "/contact") return <ContactPage />;
  if (path === "/legal/privacy-policy") return <LegalPage type="privacy" />;
  if (path === "/legal/cookie-policy") return <LegalPage type="cookie" />;
  return <NotFoundPage />;
}

export default function App() {
  return (
    <PerfProvider>
      <LanguageProvider>
        <Routes />
      </LanguageProvider>
    </PerfProvider>
  );
}
