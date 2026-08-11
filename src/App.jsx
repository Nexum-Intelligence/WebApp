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
import nexumModelMesh from "./assets/nexum-model-mesh.json";
import agentsDemoUrl from "./assets/spielwieseagentsdemo.html?url";
import previewInfoUrl from "./assets/preview-info-input.html?url";
import previewModuleUrl from "./assets/preview-choose-module.html?url";
import previewValidateUrl from "./assets/preview-validate.html?url";
import previewContactUrl from "./assets/preview-contact.html?url";
import { LanguageProvider, useI18n, LANGS } from "./i18n.jsx";
import { SUITES, PACKAGES, COMPANY_SECTIONS, COLLECTIONS, CONNECTORS, PHASES, packageByKey, collectionByKey, allModules, moduleCategory } from "./modules.js";

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

function ParticleSphere() {
  const canvasRef = useRef(null);
  const { lite } = usePerf();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let disposed = false;
    const pointer = {
      active: false,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      strength: 0,
    };
    const modelTriangles = Array.isArray(nexumModelMesh?.triangles) ? nexumModelMesh.triangles : [];

    const pointCount = 7000;
    const points = Array.from({ length: pointCount }, (_, index) => {
      const offset = 2 / pointCount;
      const y = index * offset - 1 + offset / 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = index * Math.PI * (3 - Math.sqrt(5));
      return {
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius,
        pulse: (index % 17) / 17,
      };
    });

    function syncPointerFromClient(clientX, clientY) {
      const bounds = canvas.getBoundingClientRect();
      const nextX = clientX - bounds.left;
      const nextY = clientY - bounds.top;
      const inside = nextX >= 0 && nextX <= bounds.width && nextY >= 0 && nextY <= bounds.height;
      pointer.targetX = Math.min(Math.max(nextX, 0), bounds.width);
      pointer.targetY = Math.min(Math.max(nextY, 0), bounds.height);
      pointer.active = inside;
      if (reducedMotion.matches) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
        pointer.strength = inside ? 1 : 0;
        draw(window.performance?.now?.() ?? 0);
      }
    }

    function updatePointer(event) {
      syncPointerFromClient(event.clientX, event.clientY);
    }

    function releasePointer() {
      pointer.active = false;
      if (reducedMotion.matches) {
        pointer.strength = 0;
        draw(window.performance?.now?.() ?? 0);
      }
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pointer.active) {
        pointer.x = width / 2;
        pointer.y = height / 2;
        pointer.targetX = pointer.x;
        pointer.targetY = pointer.y;
      }
    }

    function projectModelPoint(point, centerX, centerY, modelScale, floatY, sinY, cosY, sinX, cosX) {
      const x1 = point[0] * cosY - point[2] * sinY;
      const z1 = point[0] * sinY + point[2] * cosY;
      const y1 = point[1] * cosX - z1 * sinX;
      const z2 = point[1] * sinX + z1 * cosX;
      const perspective = 1.22 / (1.68 - z2 * 0.54);
      return {
        x: centerX + x1 * modelScale * perspective,
        y: centerY + floatY + y1 * modelScale * perspective,
        z: z2,
      };
    }

    function drawModelMesh(time, centerX, centerY, sphereRadius, sinY, cosY, sinX, cosX) {
      if (!modelTriangles.length) return;

      const modelScale = sphereRadius * 1.68;
      const floatY = reducedMotion.matches ? 0 : Math.sin(time * 0.0012) * sphereRadius * 0.012;
      context.save();
      context.globalCompositeOperation = "lighter";

      const halo = context.createRadialGradient(centerX, centerY + floatY, sphereRadius * 0.08, centerX, centerY + floatY, sphereRadius * 0.68);
      halo.addColorStop(0, "rgba(42, 104, 255, 0.3)");
      halo.addColorStop(0.46, "rgba(95, 86, 255, 0.16)");
      halo.addColorStop(1, "rgba(5, 6, 11, 0)");
      context.fillStyle = halo;
      context.beginPath();
      context.ellipse(centerX, centerY + floatY, sphereRadius * 0.78, sphereRadius * 0.54, -0.08, 0, Math.PI * 2);
      context.fill();

      const projectedTriangles = modelTriangles.map((triangle) => {
        const a = projectModelPoint(triangle[0], centerX, centerY, modelScale, floatY, sinY, cosY, sinX, cosX);
        const b = projectModelPoint(triangle[1], centerX, centerY, modelScale, floatY, sinY, cosY, sinX, cosX);
        const c = projectModelPoint(triangle[2], centerX, centerY, modelScale, floatY, sinY, cosY, sinX, cosX);
        return {
          depth: (a.z + b.z + c.z) / 3,
          points: [a, b, c],
        };
      }).sort((a, b) => a.depth - b.depth);

      context.lineWidth = Math.max(0.55, sphereRadius * 0.0024);
      context.shadowBlur = sphereRadius * 0.075;
      context.shadowColor = "rgba(86, 116, 255, 0.82)";

      for (const triangle of projectedTriangles) {
        const [a, b, c] = triangle.points;
        const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        const front = area > 0;
        const depth = Math.max(0, Math.min(1, (triangle.depth + 0.48) / 0.96));
        const blue = Math.round(180 + depth * 48);
        const violet = Math.round(120 + depth * 86);
        const alpha = front ? 0.34 + depth * 0.36 : 0.08 + depth * 0.12;
        context.fillStyle = `rgba(${Math.round(44 + depth * 34)}, ${blue}, ${violet}, ${alpha})`;
        context.strokeStyle = `rgba(216, 228, 255, ${front ? 0.26 + depth * 0.3 : 0.08})`;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.lineTo(c.x, c.y);
        context.closePath();
        context.fill();
        if (front && depth > 0.18) {
          context.stroke();
        }
      }

      context.restore();
    }

    function draw(time = 0) {
      context.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const sphereRadius = Math.min(width, height) * 0.49;
      pointer.x += (pointer.targetX - pointer.x) * 0.26;
      pointer.y += (pointer.targetY - pointer.y) * 0.26;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.18;
      const cursorX = (pointer.x - cx) / sphereRadius;
      const cursorY = (pointer.y - cy) / sphereRadius;
      const baseRotateY = reducedMotion.matches ? 0.75 : time * 0.00018;
      const baseRotateX = reducedMotion.matches ? -0.28 : -0.28 + Math.sin(time * 0.00024) * 0.08;
      const rotateY = baseRotateY + cursorX * pointer.strength * 0.52;
      const rotateX = baseRotateX - cursorY * pointer.strength * 0.38;
      const sinY = Math.sin(rotateY);
      const cosY = Math.cos(rotateY);
      const sinX = Math.sin(rotateX);
      const cosX = Math.cos(rotateX);

      drawModelMesh(time, cx, cy, sphereRadius, sinY, cosY, sinX, cosX);

      context.save();
      context.globalCompositeOperation = "lighter";

      for (const point of points) {
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y1 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        const perspective = 1.18 / (1.72 - z2 * 0.48);
        let x = cx + x1 * sphereRadius * perspective;
        let y = cy + y1 * sphereRadius * perspective;
        const depth = (z2 + 1) / 2;
        let interactionImpact = 0;
        if (pointer.strength > 0.01) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          const influence = Math.max(0, 1 - distance / (sphereRadius * 0.42));
          if (influence > 0 && depth > 0.08) {
            interactionImpact = influence * influence * pointer.strength;
            const force = interactionImpact * (52 + depth * 64) * 0.9;
            const swirl = interactionImpact * (6 + depth * 14);
            x += (dx / distance) * force;
            y += (dy / distance) * force;
            x += (-dy / distance) * swirl;
            y += (dx / distance) * swirl;
          }
        }
        const shimmer = reducedMotion.matches ? 0 : Math.sin(time * 0.002 + point.pulse * 6.28) * 0.08;
        const alpha = Math.max(0.05, (0.18 + depth * 0.56 + shimmer) * (1 - interactionImpact * 0.58));
        const size = (0.42 + depth * 0.72) * (1 - interactionImpact * 0.1);

        context.fillStyle = `rgba(245, 247, 255, ${alpha})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();

      if (!reducedMotion.matches && !lite) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }

    resize();
    draw(0);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", updatePointer);
    window.addEventListener("pointerdown", updatePointer);
    window.addEventListener("mousemove", updatePointer);
    window.addEventListener("blur", releasePointer);
    canvas.addEventListener("pointermove", updatePointer);
    canvas.addEventListener("pointerenter", updatePointer);
    canvas.addEventListener("pointerdown", updatePointer);
    canvas.addEventListener("pointerleave", releasePointer);
    if (!reducedMotion.matches && !lite) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", updatePointer);
      window.removeEventListener("mousemove", updatePointer);
      window.removeEventListener("blur", releasePointer);
      canvas.removeEventListener("pointermove", updatePointer);
      canvas.removeEventListener("pointerenter", updatePointer);
      canvas.removeEventListener("pointerdown", updatePointer);
      canvas.removeEventListener("pointerleave", releasePointer);
    };
  }, [lite]);

  return (
    <div className="particle-sphere" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="hero reference-hero">
      <div className="hero-copy">
        <Link className="hero-badge hero-platform-chip" to="/potential-analysis">
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
          <a className="primary-button glow-button" href="https://cal.com/" target="_blank" rel="noreferrer">
            {t.btn.bookCall}
          </a>
        </div>
      </div>
      <ParticleSphere />
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
        <Link className="header-cta glow-button" to="/platform">{t.btn.platform}</Link>
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
    <section id="build" className={`build-showcase ${standalone ? "page-section" : ""}`}>
      <div className="build-title">
        <h2 className="build-heading">
          <span>NEXUM Intelligence Builds</span>
          <span>AI Systems That Don&apos;t</span>
          <span>Just Assist - They Operate.</span>
        </h2>
        <span className="asterisk" aria-hidden="true">*</span>
      </div>
      <div className="build-layout">
        <article className="build-visual-card">
          <span className="outline-pill">{t.build.label.toUpperCase()}</span>
          <h3>{t.build.title}</h3>
          <img src={whatWeBuildDashboard} alt="AI operations dashboard visual" />
        </article>
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

function WorkPhasesSection() {
  const { t } = useI18n();
  const workImages = [scenePresenter, sceneAiWindow, abstractSystem, abstractDashboard, sceneConsulting];
  return (
    <section id="works" className="work-steps-section">
      <span className="outline-pill">{t.works.pill}</span>
      <h2>{t.works.title}</h2>
      <div className="work-actions">
        <Link className="secondary-button" to="/agent-platform">{t.btn.getToKnowAgents}</Link>
      </div>
      <div className="work-step-panel">
        {t.works.phases.map((phase, index) => (
          <article className="work-step" key={phase.num} tabIndex={0}>
            <div>
              <span>{phase.num}</span>
              <h3>{phase.title}</h3>
              <p>{phase.text}</p>
            </div>
            <img src={workImages[index] || sceneConsulting} alt={`${phase.title} visual`} />
          </article>
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
      <main>
        <HeroSection />
        <TrustImpactSection />
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
              <a className="primary-button glow-button" href="https://cal.com/" target="_blank" rel="noreferrer">{dict.result.cta} <ArrowRight size={18} /></a>
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
  done: { label: "Completed", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  error: { label: "Error", tone: "red" },
};

function usePlatformUser() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("nexum_user") || "null"); } catch { return null; }
  });
  const save = (u) => {
    setUser(u);
    try {
      if (u) window.localStorage.setItem("nexum_user", JSON.stringify(u));
      else window.localStorage.removeItem("nexum_user");
    } catch (e) {}
  };
  return [user, save];
}

function PlatformSignIn({ onSignIn }) {
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setErr("Please enter your name and work email."); return; }
    onSignIn({ ...form });
  };
  return (
    <div className="plat-auth">
      <div className="plat-auth-card">
        <span className="outline-pill"><LayoutDashboard size={14} /> NEXUM Platform</span>
        <h1>Sign in to your platform</h1>
        <p>Access your suites and run your NEXUM agent modules.</p>
        <form onSubmit={submit}>
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Work email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
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

function CollectionView({ collection, user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // "new" | id | null
  const [values, setValues] = useState({});
  const [err, setErr] = useState("");
  const Ico = PLAT_ICONS[collection.icon] || Sparkles;

  useEffect(() => {
    let ok = true; setLoading(true); setEditing(null);
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=${collection.key}`)
      .then((r) => r.json())
      .then((d) => { if (ok) setRows(Array.isArray(d.records) ? d.records : []); })
      .catch(() => {})
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
        const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, kind: collection.key, data: values }) });
        const d = await res.json().catch(() => ({}));
        if (d.record) setRows((r) => [d.record, ...r.filter((x) => x.id !== optimistic.id)]);
      } catch (e2) {}
    } else {
      const id = editing;
      setRows((r) => r.map((x) => (x.id === id ? { ...x, data: values } : x))); setEditing(null);
      try {
        await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, email: user.email, data: values }) });
      } catch (e2) {}
    }
  };

  const remove = async (row) => {
    setRows((r) => r.filter((x) => x.id !== row.id));
    try { await fetch(`/api/records?id=${encodeURIComponent(row.id)}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" }); } catch (e) {}
  };

  const summary = collection.summary(rows.map((r) => r.data || {}));

  return (
    <div className="plat-view">
      <div className="plat-view-head">
        <h1><Ico size={22} /> {collection.name}</h1>
        <p>{collection.intro}</p>
      </div>

      <div className="plat-kpis plat-kpis-3">
        {summary.map((k) => (
          <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span></div>
        ))}
      </div>

      <div className="plat-card">
        <div className="plat-table-top">
          <h3>{collection.name}</h3>
          {editing == null && <button className="plat-start" onClick={startAdd}>Add {collection.singular} <ArrowRight size={15} /></button>}
        </div>

        {editing != null && (
          <form onSubmit={save} className="plat-form plat-record-form">
            {collection.fields.map((f) => <PlatField key={f.key} f={f} value={values[f.key]} onChange={set} />)}
            {err && <p className="plat-err plat-full">{err}</p>}
            <div className="plat-modal-actions plat-full">
              <button type="button" className="plat-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="primary-button glow-button">{editing === "new" ? "Add" : "Save"} <Check size={16} /></button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="plat-empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="plat-empty">No {collection.name.toLowerCase()} yet. Add your first {collection.singular}.</p>
        ) : (
          <div className="plat-table-wrap">
            <table className="plat-table">
              <thead>
                <tr>{collection.columns.map((c) => <th key={c[0]}>{c[1]}</th>)}<th aria-label="actions" /></tr>
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

function ProductsView({ user }) {
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
      <div className="plat-view-head"><h1><Sparkles size={22} /> Products (POS)</h1><p>Your products with their ingredients/goods, costs and margin. Costs come from Inventory.</p></div>

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
              <label>Name<span className="plat-req"> *</span><input value={form.name} onChange={(e) => setF("name", e.target.value)} /></label>
              <label>Category<input value={form.category} onChange={(e) => setF("category", e.target.value)} /></label>
              <label>Selling price (€)<input type="number" value={form.price} onChange={(e) => setF("price", e.target.value)} /></label>
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
              <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Cost</th><th>Margin</th><th /></tr></thead>
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

function PosView({ user }) {
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

  const record = async () => {
    if (!product || q <= 0) return;
    const data = { productId: pid, productName: (product.data || {}).name, qty: q, unitPrice, unitCost, revenue, cost: lineCost, profit, date: new Date().toISOString() };
    const opt = { id: `local-${Date.now()}`, kind: "sales", data };
    setSales((s) => [opt, ...s]); setMsg(`Sale recorded — profit ${money(profit)}.`); window.setTimeout(() => setMsg(""), 5000); setQty("1");
    try {
      const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, kind: "sales", data }) });
      const d = await res.json().catch(() => ({})); if (d.record) setSales((s) => [d.record, ...s.filter((x) => x.id !== opt.id)]);
      // book income + decrement stock
      await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, kind: "transactions", data: { date: new Date().toISOString().slice(0, 10), type: "Income", category: "Sales", amount: revenue, description: `${q}× ${(product.data || {}).name}` } }) });
      for (const line of ((product.data || {}).recipe || [])) {
        const it = inventory.find((i) => i.id === line.itemId); if (!it) continue;
        const newStock = (Number((it.data || {}).stock) || 0) - (Number(line.qty) || 0) * q;
        await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: it.id, email: user.email, data: { ...(it.data || {}), stock: newStock } }) });
      }
    } catch (e) {}
  };

  const sRows = sales.map((s) => s.data || {});
  const totRev = sRows.reduce((a, r) => a + (Number(r.revenue) || 0), 0);
  const totCogs = sRows.reduce((a, r) => a + (Number(r.cost) || 0), 0);
  const totProfit = totRev - totCogs;

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Sparkles size={22} /> Sales (POS)</h1><p>Record a sale — revenue, cost of goods and profit are calculated, income is booked and stock is reduced.</p></div>

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
          <button className="plat-start" onClick={record} disabled={!product || q <= 0}>Record sale <ArrowRight size={15} /></button>
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

function SubscriptionView({ pkg, setPackage }) {
  const currentIdx = PACKAGES.findIndex((p) => p.key === pkg.key);
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Subscription</h1><p>Your current plan and upgrades. A higher plan unlocks more agent suites.</p></div>
      <div className="plat-card plat-plan-current">
        <div><span className="outline-pill"><ShieldCheck size={14} /> Current plan</span><h2>{pkg.name}</h2><p className="plat-plan-target">{pkg.target}</p></div>
        <div className="plat-plan-current-price"><b>{pkg.priceOnce}</b><span>once</span><b>{pkg.priceYear}</b></div>
      </div>
      <div className="plat-plan-grid">
        {PACKAGES.map((p, i) => {
          const isCurrent = p.key === pkg.key;
          const label = isCurrent ? "Current plan" : i > currentIdx ? "Upgrade" : "Switch";
          return (
            <div className={`plat-plan-card ${isCurrent ? "is-current" : ""}`} key={p.key}>
              <h3>{p.name}</h3>
              <div className="plat-plan-price">{p.priceOnce}<span> once</span></div>
              <div className="plat-plan-year">{p.priceYear}</div>
              <p className="plat-plan-target">{p.target}</p>
              <ul className="plat-plan-suites">
                {p.suites.filter((s) => s !== "foundation").map((sk) => { const s = SUITES.find((x) => x.key === sk); return <li key={sk}><Check size={13} /> {s ? s.name : sk}</li>; })}
              </ul>
              <button className={`plat-start ${isCurrent ? "is-locked" : ""}`} disabled={isCurrent} onClick={() => setPackage(p.key)}>{label}{!isCurrent && <ArrowRight size={15} />}</button>
            </div>
          );
        })}
      </div>
      <p className="plat-empty">Selecting a plan unlocks its suites immediately. Secure checkout &amp; billing would run here.</p>
    </div>
  );
}

function ConnectorsView({ user }) {
  const [saved, setSaved] = useState([]);
  const [openKey, setOpenKey] = useState(null);
  const [cfg, setCfg] = useState({});

  useEffect(() => {
    let ok = true;
    fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=connectors`)
      .then((r) => r.json()).then((d) => { if (ok) setSaved(Array.isArray(d.records) ? d.records : []); }).catch(() => {});
    return () => { ok = false; };
  }, []);

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
      <div className="plat-view-head"><h1><Workflow size={22} /> Connectors</h1><p>Connect your tools so the agents import data automatically. You configure a source here; the sync runs on our side and fills your Operations tables.</p></div>
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
                    <label key={f.key}>{f.label}<input value={cfg[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder || ""} /></label>
                  ))}
                  <div className="plat-connector-actions"><button className="plat-ghost" onClick={() => setOpenKey(null)}>Cancel</button><button className="plat-start" onClick={() => save(c)}>Save <Check size={15} /></button></div>
                </div>
              ) : (
                <div className="plat-connector-actions">
                  <button className="plat-start" onClick={() => open(c)}>{rec ? "Edit" : "Connect"} <ArrowRight size={15} /></button>
                  {rec && <button className="plat-ghost" onClick={() => disconnect(c)}>Disconnect</button>}
                </div>
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

function DailyTasksView({ user, onGenerate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState("");
  const [gen, setGen] = useState(false);

  const load = () => fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=tasks`)
    .then((r) => r.json()).then((d) => setTasks(Array.isArray(d.records) ? d.records : [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

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
  const generate = async () => { setGen(true); await onGenerate(); setGen(false); window.setTimeout(load, 1500); };

  const open = tasks.filter((t) => !(t.data || {}).done);
  const done = tasks.filter((t) => (t.data || {}).done);

  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Daily Tasks</h1><p>Your Decision agent generates a focused set of tasks each day to grow and scale — from your live data. Check them off as you go.</p></div>

      <div className="plat-card plat-cta-card">
        <div><h3>Today's plan</h3><p>Let the agent read your data and generate today's highest-impact actions.</p></div>
        <button className="plat-start" onClick={generate} disabled={gen}>{gen ? "Generating…" : "Generate today's tasks"} <ArrowRight size={15} /></button>
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

function OverviewView({ user, pkg, runs, company, goto }) {
  const modulesAvailable = allModules().filter((m) => pkg.suites.includes(m.suiteKey)).length;
  const totalCompanyFields = COMPANY_SECTIONS.reduce((n, s) => n + s.fields.length, 0);
  const filledCompanyFields = COMPANY_SECTIONS.reduce(
    (n, s) => n + s.fields.filter((f) => (company[s.key] || {})[f.key]).length, 0);
  const completeness = totalCompanyFields ? Math.round((filledCompanyFields / totalCompanyFields) * 100) : 0;
  const startedModules = new Set(runs.map((r) => r.module_key)).size;
  const done = runs.filter((r) => r.status === "done" || r.status === "completed").length;
  const kpis = [
    { label: "Company profile", value: `${completeness}%`, hint: "complete" },
    { label: "Modules available", value: modulesAvailable, hint: `in ${pkg.name}` },
    { label: "Modules started", value: startedModules, hint: `${runs.length} runs total` },
    { label: "Deliverables ready", value: done, hint: "completed by agents" },
  ];
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Overview</h1><p>Your business at a glance. Your agent team, live status, company data and deliverables.</p></div>
      <div className="plat-card plat-agents-card">
        <div className="plat-agents-title"><span className="plat-live-badge"><span className="plat-live-dot" /> Agents</span><span>Live view of what your agent team is doing — click an agent to open it.</span></div>
        <AgentConstellation runs={runs} goto={goto} pkg={pkg} />
      </div>
      <div className="plat-kpis">
        {kpis.map((k) => (
          <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span><span className="plat-kpi-hint">{k.hint}</span></div>
        ))}
      </div>

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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let ok = true;
    Promise.all([
      fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=transactions`).then((r) => r.json()),
      fetch(`/api/records?email=${encodeURIComponent(user.email)}&kind=sales`).then((r) => r.json()),
    ]).then(([t, s]) => { if (ok) { setTx(t.records || []); setSales(s.records || []); } }).catch(() => {}).finally(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, []);
  const income = tx.filter((r) => (r.data || {}).type === "Income").reduce((a, r) => a + (Number((r.data || {}).amount) || 0), 0);
  const expense = tx.filter((r) => (r.data || {}).type === "Expense").reduce((a, r) => a + (Number((r.data || {}).amount) || 0), 0);
  const cogs = sales.reduce((a, r) => a + (Number((r.data || {}).cost) || 0), 0);
  const profit = income - expense - cogs;
  const kpis = [
    { label: "Revenue", value: money(income) }, { label: "Expenses", value: money(expense) },
    { label: "Cost of goods", value: money(cogs) }, { label: "Profit", value: money(profit) },
  ];
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1><Cpu size={22} /> Finance</h1><p>Your live financial picture — calculated from Income &amp; Expenses and POS sales, not entered by hand.</p></div>
      <div className="plat-kpis">{kpis.map((k) => <div className="plat-kpi" key={k.label}><span className="plat-kpi-val">{k.value}</span><span className="plat-kpi-label">{k.label}</span></div>)}</div>
      <div className="plat-card">
        <h3>Revenue · Expenses · Profit</h3>
        <MiniBars items={[
          { label: "Revenue", value: income, color: "#4ade80" },
          { label: "Expenses", value: expense, color: "#f87171" },
          { label: "Cost of goods", value: cogs, color: "#fbbf24" },
          { label: "Profit", value: profit, color: "#818cf8" },
        ]} />
        {!loading && tx.length === 0 && sales.length === 0 && <p className="plat-empty">No financial data yet — add entries under Income &amp; Expenses or record sales in POS, and this fills automatically.</p>}
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

function ModuleView({ module, unlocked, companyFlat, runs, onRun, gotoUpgrade, user }) {
  const flatKey = JSON.stringify(companyFlat || {});
  const [values, setValues] = useState(() => prefillFromCompany(module.fields, companyFlat));
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [resultText, setResultText] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [savedResult, setSavedResult] = useState(false);

  const moduleRuns = runs.filter((r) => r.module_key === module.key);
  const isLive = module.type === "live";
  const latest = moduleRuns[0];

  useEffect(() => { setValues(prefillFromCompany(module.fields, companyFlat)); setErr(""); }, [module.key, flatKey]);
  useEffect(() => {
    const r = latest ? latest.result : null;
    setResultText(r ? (typeof r === "string" ? r : JSON.stringify(r, null, 2)) : "");
    setSavedResult(false);
  }, [latest ? latest.id : "none"]);

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const generate = async (e) => {
    if (e) e.preventDefault();
    if (!isLive) {
      const missing = module.fields.filter((f) => f.required && !values[f.key]);
      if (missing.length) { setErr("Please fill in the required fields."); return; }
    }
    setErr(""); setSending(true);
    await onRun(module, values);
    setSending(false);
  };

  const saveResult = async () => {
    if (!latest || !user) return;
    setSavingResult(true);
    try { await fetch("/api/module-run", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: latest.id, email: user.email, result: resultText }) }); setSavedResult(true); } catch (e) {}
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
          <div className="plat-card">
            <div className="plat-result-head"><h3>{isLive ? "Live result" : "Result"}</h3>{st && <span className={`plat-status tone-${st.tone}`}>{st.label}</span>}</div>
            {latest ? (
              <>
                <textarea className="plat-result-edit" rows="9" value={resultText} onChange={(e) => { setResultText(e.target.value); setSavedResult(false); }} placeholder="The agent's result appears here — you can edit it and save." />
                <div className="plat-modal-actions">
                  {latest.created_at && <span className="plat-live-updated">Updated {new Date(latest.created_at).toLocaleString()}</span>}
                  {savedResult && <span className="plat-saved"><Check size={14} /> Saved</span>}
                  <button className="plat-ghost" onClick={saveResult} disabled={savingResult}>{savingResult ? "Saving…" : "Save changes"}</button>
                </div>
              </>
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
                  <button type="submit" className="primary-button glow-button" disabled={sending}>{sending ? "Working…" : (isLive ? "Update now" : (latest ? "Regenerate" : "Generate"))} <ArrowRight size={18} /></button>
                </div>
              </form>
            </details>
          </div>
        </>
      )}
    </div>
  );
}

function DeliverablesView({ runs, goto }) {
  const ready = runs.filter((r) => r.status === "done" || r.status === "completed");
  const inProgress = runs.filter((r) => r.status === "queued" || r.status === "running");
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Deliverables</h1><p>Results your agents produced. Completed runs appear here as deliverables you can open.</p></div>
      {ready.length === 0 && inProgress.length === 0 && (
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
        <div className="plat-deliverable-grid">
          {ready.map((r) => (
            <button className="plat-deliverable" key={r.id} onClick={() => goto(`module:${r.module_key}`)}>
              <span className="plat-status tone-green">Completed</span>
              <h3>{r.module_name}</h3>
              <span className="plat-deliverable-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityView({ runs }) {
  return (
    <div className="plat-view">
      <div className="plat-view-head"><h1>Activity</h1><p>Every module run and its current status.</p></div>
      <div className="plat-card">
        {runs.length === 0 ? <p className="plat-empty">No activity yet.</p> : (
          <div className="plat-run-list">
            {runs.map((r) => {
              const st = RUN_STATUS[r.status] || RUN_STATUS.queued;
              return (
                <div className="plat-run" key={r.id}>
                  <div><b>{r.module_name}</b><span>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</span></div>
                  <span className={`plat-status tone-${st.tone}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentChat({ user, view }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open || loaded) return;
    fetch(`/api/agent-chat?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json()).then((d) => { if (Array.isArray(d.messages)) setMessages(d.messages); })
      .catch(() => {}).finally(() => setLoaded(true));
  }, [open]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim(); if (!text || sending) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setInput(""); setSending(true);
    let reply = null;
    try {
      const res = await fetch("/api/agent-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, message: text, context: { view } }) });
      const d = await res.json().catch(() => ({}));
      reply = d.reply;
    } catch (e) {}
    if (!reply) reply = "Got it — noted. (Once the agent backend is connected I can pull your live data, update records and document actions here.)";
    setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
    setSending(false);
  };

  return (
    <>
      <button className={`plat-chat-fab ${open ? "is-open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Chat with your agent">
        {open ? <X size={22} /> : <Bot size={26} />}
      </button>
      {open && (
        <div className="plat-chat">
          <div className="plat-chat-head"><span className="plat-chat-title"><Bot size={18} /> NEXUM Agent</span><button onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button></div>
          <div className="plat-chat-body" ref={bodyRef}>
            {messages.length === 0 && <div className="plat-chat-hint">Ask me anything about your business — I can pull from your data, help you update records, document decisions or answer questions.</div>}
            {messages.map((m) => <div key={m.id} className={`plat-chat-msg ${m.role}`}>{m.content}</div>)}
            {sending && <div className="plat-chat-msg assistant plat-chat-typing">…</div>}
          </div>
          <form className="plat-chat-input" onSubmit={send}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your agent…" />
            <button type="submit" disabled={sending} aria-label="Send"><ArrowRight size={18} /></button>
          </form>
        </div>
      )}
    </>
  );
}

function PlatformPage() {
  const { lang } = useI18n();
  const [user, setUser] = usePlatformUser();
  const [pkgKey, setPkgKey] = useState(() => {
    try { return window.localStorage.getItem("nexum_pkg") || "enterprise-plus"; } catch { return "enterprise-plus"; }
  });
  const [view, setView] = useState("overview");
  const [runs, setRuns] = useState([]);
  const [company, setCompany] = useState({});
  const [toast, setToast] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const pkg = packageByKey(pkgKey);

  useEffect(() => {
    if (!user) return;
    let ok = true;
    try { const l = JSON.parse(window.localStorage.getItem(`nexum_company_${user.email}`) || "null"); if (l) setCompany(l); } catch (e) {}
    fetch(`/api/module-run?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json()).then((d) => { if (ok && Array.isArray(d.runs)) setRuns(d.runs); }).catch(() => {});
    fetch(`/api/company?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json()).then((d) => { if (ok && d && d.data && Object.keys(d.data).length) setCompany(d.data); }).catch(() => {});
    return () => { ok = false; };
  }, [user]);

  const setPackage = (k) => { setPkgKey(k); try { window.localStorage.setItem("nexum_pkg", k); } catch (e) {} };

  const persistCompany = (next) => {
    setCompany(next);
    try { window.localStorage.setItem(`nexum_company_${user.email}`, JSON.stringify(next)); } catch (e) {}
    fetch("/api/company", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, name: user.name, company: user.company, data: next }) }).catch(() => {});
  };
  const saveCompanySection = (sectionKey, values) => persistCompany({ ...company, [sectionKey]: values });
  const saveCompanyAll = (next) => persistCompany(next);

  const companyFlat = Object.assign({}, ...Object.values(company || {}));

  const runModule = async (module, values) => {
    const payload = {
      email: user.email, name: user.name, company: user.company,
      packageKey: pkg.key, suiteKey: module.suiteKey, moduleKey: module.key, moduleName: module.name,
      inputs: { ...values, _company: companyFlat }, lang, source: "platform",
    };
    let run = null;
    try {
      const res = await fetch("/api/module-run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      run = data.run;
    } catch (e) {}
    if (!run) run = { id: `local-${Date.now()}`, created_at: new Date().toISOString(), module_key: module.key, module_name: module.name, suite_key: module.suiteKey, status: "queued" };
    setRuns((r) => [run, ...r.filter((x) => x.id !== run.id)]);
    setToast(`“${module.name}” started — your agent is now working on it.`);
    window.setTimeout(() => setToast(""), 6000);
  };

  const runResearch = async (inputs) => {
    await runModule({ key: "company-research", name: "Company Research", suiteKey: "strategy", deliverables: [], fields: [] }, inputs);
  };

  const runTasks = async () => {
    await runModule({ key: "daily-tasks", name: "Daily Tasks", suiteKey: "intelligence", deliverables: [], fields: [] }, {});
  };

  const goto = (v) => { setView(v); setNavOpen(false); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); };

  if (!user) {
    return (<Shell><main><section className="platform-page"><PlatformSignIn onSignIn={setUser} /></section></main></Shell>);
  }

  const firstName = (user.name || "").split(" ")[0] || user.name;

  let content = null;
  if (view === "overview") content = <OverviewView user={user} pkg={pkg} runs={runs} company={company} goto={goto} />;
  else if (view === "deliverables") content = <DeliverablesView runs={runs} goto={goto} />;
  else if (view === "activity") content = <ActivityView runs={runs} />;
  else if (view === "connectors") content = <ConnectorsView user={user} />;
  else if (view === "subscription") content = <SubscriptionView pkg={pkg} setPackage={setPackage} />;
  else if (view === "products") content = <ProductsView user={user} />;
  else if (view === "pos") content = <PosView user={user} />;
  else if (view === "finance") content = <FinanceDashboardView user={user} />;
  else if (view === "profile") content = <ProfileView company={company} onSaveAll={saveCompanyAll} onResearch={runResearch} />;
  else if (view === "phases") content = <PhasesView pkg={pkg} goto={goto} />;
  else if (view === "tasks") content = <DailyTasksView user={user} onGenerate={runTasks} />;
  else if (view.startsWith("collection:")) {
    const col = collectionByKey(view.slice(11));
    content = col ? <CollectionView collection={col} user={user} /> : null;
  } else if (view.startsWith("company:")) {
    const section = COMPANY_SECTIONS.find((s) => s.key === view.slice(8));
    content = section ? <CompanySectionView section={section} data={company[section.key]} onSave={saveCompanySection} onResearch={runResearch} user={user} /> : null;
  } else if (view.startsWith("module:")) {
    const mod = allModules().find((m) => m.key === view.slice(7));
    if (mod) content = <ModuleView module={mod} unlocked={pkg.suites.includes(mod.suiteKey)} companyFlat={companyFlat} runs={runs} onRun={runModule} gotoUpgrade={() => goto("overview")} user={user} />;
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
        <div className="platform-shell">
          <button className="plat-nav-toggle" onClick={() => setNavOpen((o) => !o)}><Menu size={18} /> Menu</button>
          <aside className={`plat-sidebar ${navOpen ? "is-open" : ""}`}>
            <div className="plat-brand"><LayoutDashboard size={18} /> NEXUM Platform</div>
            <nav>
              {navItem("overview", "Overview", LayoutDashboard)}
              {navItem("phases", "Phases", Sparkles)}
              {navItem("tasks", "Daily Tasks", Check)}

              <div className="plat-nav-group">Operations</div>
              {navItem("collection:customers", "Customers (CRM)", Globe)}
              {navItem("products", "Products (POS)", Sparkles)}
              {navItem("collection:inventory", "Inventory", LayoutDashboard)}
              {navItem("pos", "Sales (POS)", ShieldCheck)}
              {navItem("finance", "Finance", Cpu)}
              {navItem("collection:transactions", "Income & Expenses", Workflow)}
              {navItem("collection:campaigns", "Marketing (CRM)", Zap)}

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
              <div className="plat-user"><span>{firstName}</span><button className="plat-ghost plat-signout" onClick={() => setUser(null)}>Sign out</button></div>
            </div>
          </aside>

          <div className="plat-main">
            {toast && <div className="plat-toast"><Check size={16} /> {toast}</div>}
            {content}
          </div>
        </div>
      </main>
      <AgentChat user={user} view={view} />
    </Shell>
  );
}

function PotentialAnalysisPage() {
  const { t } = useI18n();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
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
              <div className="signin-provider-list">
                <button type="button" onClick={() => setLoginOpen(true)}><img src={googleLogo} alt="" /> {t.platform.google}</button>
                <button type="button" onClick={() => setLoginOpen(true)}><img src={microsoftLogo} alt="" /> {t.platform.microsoft}</button>
              </div>
              <form className="signin-inline-form" onSubmit={(event) => { event.preventDefault(); setLoginOpen(true); }}>
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
      {loginOpen && <SignInModal onClose={() => setLoginOpen(false)} onSignIn={signIn} />}
    </Shell>
  );
}

function UseCaseDemoPage() {
  return (
    <Shell>
      <main>
        <SubHero
          label="Use Case Demonstration"
          title="Discover a Live Example of Autonomous AI Agents in Action"
          text="A focused demonstration area for showing how NEXUM agents can create a USP, evaluate positioning and turn strategy into execution-ready assets."
        />
        <section className="section use-case-section">
          <article className="use-case-card">
            <span className="outline-pill">COMING SOON</span>
            <h2>Autonomous USP Builder</h2>
            <p>
              This page is prepared for a live example where analysis, creation and execution
              agents work together to generate a business USP, supporting positioning,
              campaign direction and implementation tasks.
            </p>
            <Link className="primary-button" to="/agent-platform">
              View the Agent Platform <ArrowRight size={18} />
            </Link>
          </article>
        </section>
      </main>
    </Shell>
  );
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

function ContactPage() {
  const [sent, setSent] = useState(false);

  function submit(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <Shell>
      <main>
        <SubHero label="Let’s Talk" title="We're Here To Help" text="Our team is ready to support you with expert advice & solutions." />
        <div className="contact-hero-actions">
          <Link className="primary-button glow-button contact-platform-button" to="/potential-analysis">
            AGENT PLATFORM <ArrowRight size={18} />
          </Link>
        </div>
        <section className="contact-section">
          <form className="contact-form" onSubmit={submit}>
            <label>Name *<input required name="Name" placeholder="David Johnson" autoComplete="name" /></label>
            <label>Email *<input required type="email" name="Email" placeholder="example@mail.com" autoComplete="email" /></label>
            <label>Company Name *<input required name="Company" placeholder="Ex. StaticMania" autoComplete="organization" /></label>
            <label>Select Service *
              <select required name="Service" defaultValue="">
                <option value="" disabled>Select Your Service</option>
                <option>Analytics & Reporting</option>
                <option>Brand Strategy</option>
                <option>Event Planning</option>
                <option>Advertising Campaigns</option>
                <option>Consulting Services</option>
              </select>
            </label>
            <label>Project Budget *
              <select required name="Budget" defaultValue="">
                <option value="" disabled>Select Your Range</option>
                <option>Under $10.000</option>
                <option>$10.000 - $25.000</option>
                <option>$25.000 - $50.000</option>
                <option>Above $50.000</option>
                <option>Custom Budget</option>
              </select>
            </label>
            <label className="full">Project Details<textarea name="Name" rows="6" placeholder="Tell us more about your project" /></label>
            {["website", "company", "message", "subject", "title", "description", "feedback", "notes", "details", "remarks", "comments"].map((field) => (
              <input key={field} className="hp-field" name={field} tabIndex="-1" autoComplete="off" />
            ))}
            <button className="primary-button" type="submit">Submit <ArrowRight size={18} /></button>
            <p className="muted">We will contact you within 24 business hours.</p>
            {sent && <div className="success">Thanks. Your request was captured locally in this clone.</div>}
          </form>
          <aside className="contact-card">
            <h2>Ready to Build Your AI Advantage?</h2>
            <p>Stop managing tasks. Start managing systems.</p>
            <div><MapPin size={20} />58499 Alexys Highway Suite 678, NR, Nevada, UK</div>
            <a href="tel:+1234567890"><Phone size={20} />+1 234 567 890</a>
            <a href="mailto:customer@agencyjoy.com"><Mail size={20} />info@nexum-intelligence.com</a>
            <a href="mailto:client@agencyjoy.com"><Mail size={20} />client@nexum-intelligence.com</a>
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
        ["8. Contact", "If you have questions, contact info@nexum-intelligence.com."],
      ]
    : [
        ["1. What are cookies?", "Cookies are small text files stored on your device when you visit a website."],
        ["2. How we use cookies", "This website may use cookies for essential functionality, analytics, and preferences."],
        ["3. Third-party cookies", "Some cookies may come from trusted third-party services such as analytics or embedded content."],
        ["4. Managing cookies", "You can control or disable cookies through your browser settings."],
        ["5. Consent", "By continuing to use this website, you consent to the use of cookies as outlined in this policy."],
        ["6. Updates", "This Cookie Policy may be updated occasionally."],
        ["7. Contact", "If you have questions, contact info@nexum-intelligence.com."],
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
      <a className="primary-button" href="https://cal.com/" target="_blank" rel="noreferrer">{t.btn.bookCall} <ArrowRight size={18} /></a>
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
