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
    kicker: "AI Readiness Test",
    title: "How ready is your business for autonomous AI?",
    intro: "Answer 6 quick questions and unlock your personal AI-readiness score, a breakdown across 6 dimensions and concrete next steps.",
    start: "Start the test",
    step: "Step", of: "of", next: "Next", back: "Back", toResult: "Almost there",
    dimensions: [
      { key: "strategy", label: "Strategy & Goals", question: "How clear are your goals for using AI or automation?",
        options: [ { label: "No concrete idea yet", points: 0 }, { label: "Vague interest, still exploring", points: 1 }, { label: "A few clear use cases in mind", points: 2 }, { label: "A documented strategy with priorities", points: 3 } ] },
      { key: "data", label: "Data Readiness", question: "How is your business data organised today?",
        options: [ { label: "Mostly on paper or in people's heads", points: 0 }, { label: "Scattered across spreadsheets & inboxes", points: 1 }, { label: "Central digital systems (CRM/ERP)", points: 2 }, { label: "Structured & accessible via APIs", points: 3 } ] },
      { key: "technology", label: "Technology & Infrastructure", question: "What best describes your current tools?",
        options: [ { label: "Mostly manual work", points: 0 }, { label: "Basic SaaS tools, not connected", points: 1 }, { label: "An integrated cloud stack", points: 2 }, { label: "Automated & API-connected systems", points: 3 } ] },
      { key: "team", label: "Team & Skills", question: "Does your team have AI or automation know-how?",
        options: [ { label: "None yet", points: 0 }, { label: "Curious, but no experience", points: 1 }, { label: "A few internal champions", points: 2 }, { label: "Dedicated roles / capability", points: 3 } ] },
      { key: "processes", label: "Processes & Automation", question: "How automated are your repetitive processes?",
        options: [ { label: "Everything is manual", points: 0 }, { label: "A few things are automated", points: 1 }, { label: "Many processes are automated", points: 2 }, { label: "Mostly automated end-to-end", points: 3 } ] },
      { key: "urgency", label: "Budget & Urgency", question: "How ready are you to invest in the next 3–6 months?",
        options: [ { label: "Just exploring, no budget", points: 0 }, { label: "A small test budget", points: 1 }, { label: "A committed budget", points: 2 }, { label: "Urgent priority with budget", points: 3 } ] },
    ],
    levels: [
      { min: 0, label: "AI Explorer", blurb: "You're at the very start of your AI journey — the biggest wins come from clarifying where to begin." },
      { min: 40, label: "AI Builder", blurb: "The foundations are forming. With a few connected workflows you can unlock real momentum." },
      { min: 65, label: "AI Ready", blurb: "You have strong foundations. You're ready to put autonomous agents on real processes." },
      { min: 85, label: "AI Accelerator", blurb: "You're primed to scale. Focus on rolling out agents across the business with clear ROI." },
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
      pill: "Your AI Readiness", dimensionsTitle: "Your readiness by dimension", recTitle: "Recommended next steps",
      ctaTitle: "Want the full picture?", ctaText: "Book a free 30-minute strategy call and we'll turn this score into a concrete roadmap.",
      cta: "Book my strategy call", restart: "Retake the test",
      thanks: "Result sent to our team — we'll be in touch shortly.",
    },
    recs: {
      "AI Explorer": ["Pick 1–2 concrete use cases where automation saves the most time.", "Start centralising your key business data.", "Book a discovery call to map quick wins."],
      "AI Builder": ["Connect your existing tools so data flows automatically.", "Pilot one automated workflow end-to-end.", "Upskill a small internal champion team."],
      "AI Ready": ["Deploy autonomous agents on a full process.", "Add monitoring & validation loops.", "Sequence automations by ROI."],
      "AI Accelerator": ["Scale agents across departments.", "Set up governance, security & KPIs.", "Target measurable ROI within a quarter."],
    },
  },
  de: {
    kicker: "KI-Readiness-Test",
    title: "Wie bereit ist dein Unternehmen für autonome KI?",
    intro: "Beantworte 6 kurze Fragen und erhalte deinen persönlichen KI-Readiness-Score, eine Auswertung über 6 Dimensionen und konkrete nächste Schritte.",
    start: "Test starten",
    step: "Schritt", of: "von", next: "Weiter", back: "Zurück", toResult: "Fast geschafft",
    dimensions: [
      { key: "strategy", label: "Strategie & Ziele", question: "Wie klar sind deine Ziele für den Einsatz von KI oder Automatisierung?",
        options: [ { label: "Noch keine konkrete Idee", points: 0 }, { label: "Vages Interesse, am Erkunden", points: 1 }, { label: "Ein paar klare Anwendungsfälle im Kopf", points: 2 }, { label: "Dokumentierte Strategie mit Prioritäten", points: 3 } ] },
      { key: "data", label: "Daten-Reife", question: "Wie sind deine Unternehmensdaten heute organisiert?",
        options: [ { label: "Meist auf Papier oder in den Köpfen", points: 0 }, { label: "Verstreut über Tabellen & Postfächer", points: 1 }, { label: "Zentrale digitale Systeme (CRM/ERP)", points: 2 }, { label: "Strukturiert & über APIs zugänglich", points: 3 } ] },
      { key: "technology", label: "Technik & Infrastruktur", question: "Was beschreibt deine aktuellen Tools am besten?",
        options: [ { label: "Überwiegend manuelle Arbeit", points: 0 }, { label: "Einfache SaaS-Tools, nicht verbunden", points: 1 }, { label: "Integrierter Cloud-Stack", points: 2 }, { label: "Automatisierte & API-verbundene Systeme", points: 3 } ] },
      { key: "team", label: "Team & Kompetenzen", question: "Hat dein Team KI- oder Automatisierungs-Know-how?",
        options: [ { label: "Bisher keins", points: 0 }, { label: "Neugierig, aber ohne Erfahrung", points: 1 }, { label: "Ein paar interne Vorreiter", points: 2 }, { label: "Eigene Rollen / Kompetenz", points: 3 } ] },
      { key: "processes", label: "Prozesse & Automatisierung", question: "Wie automatisiert sind deine wiederkehrenden Prozesse?",
        options: [ { label: "Alles ist manuell", points: 0 }, { label: "Ein paar Dinge sind automatisiert", points: 1 }, { label: "Viele Prozesse sind automatisiert", points: 2 }, { label: "Größtenteils Ende-zu-Ende automatisiert", points: 3 } ] },
      { key: "urgency", label: "Budget & Dringlichkeit", question: "Wie bereit bist du, in den nächsten 3–6 Monaten zu investieren?",
        options: [ { label: "Nur am Erkunden, kein Budget", points: 0 }, { label: "Kleines Testbudget", points: 1 }, { label: "Festes Budget", points: 2 }, { label: "Dringende Priorität mit Budget", points: 3 } ] },
    ],
    levels: [
      { min: 0, label: "KI-Einsteiger", blurb: "Du stehst noch ganz am Anfang — die größten Gewinne bringt jetzt Klarheit, wo du startest." },
      { min: 40, label: "KI-Aufbauer", blurb: "Die Grundlagen entstehen. Mit ein paar verbundenen Workflows holst du echten Schwung." },
      { min: 65, label: "KI-Bereit", blurb: "Du hast starke Grundlagen. Du bist bereit, autonome Agenten auf echte Prozesse zu setzen." },
      { min: 85, label: "KI-Beschleuniger", blurb: "Du bist bereit zu skalieren. Fokus: Agenten unternehmensweit ausrollen mit klarem ROI." },
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
      pill: "Deine KI-Readiness", dimensionsTitle: "Deine Readiness nach Dimension", recTitle: "Empfohlene nächste Schritte",
      ctaTitle: "Willst du das volle Bild?", ctaText: "Buche ein kostenloses 30-Minuten-Strategiegespräch und wir machen aus diesem Score eine konkrete Roadmap.",
      cta: "Strategiegespräch buchen", restart: "Test wiederholen",
      thanks: "Ergebnis an unser Team gesendet — wir melden uns in Kürze.",
    },
    recs: {
      "KI-Einsteiger": ["1–2 konkrete Anwendungsfälle wählen, die am meisten Zeit sparen.", "Zentrale Unternehmensdaten bündeln.", "Discovery-Call für Quick Wins buchen."],
      "KI-Aufbauer": ["Bestehende Tools verbinden, damit Daten automatisch fließen.", "Einen Workflow Ende-zu-Ende automatisieren.", "Kleines Vorreiter-Team weiterbilden."],
      "KI-Bereit": ["Autonome Agenten auf einen ganzen Prozess setzen.", "Monitoring & Validierungs-Schleifen ergänzen.", "Automatisierungen nach ROI priorisieren."],
      "KI-Beschleuniger": ["Agenten über Abteilungen skalieren.", "Governance, Security & KPIs aufsetzen.", "Messbaren ROI im Quartal anpeilen."],
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
