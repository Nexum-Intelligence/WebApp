// Archived 2026-10-08: hero of the NEXUM landing page with the particle sphere and the
// rotating NEXUM 3D logo (canvas). Self-contained: copy this file, hero-sphere.css and
// nexum-model-mesh.json into src/ and render <ParticleSphere /> (or <HeroSection />).
// Full page state: git tag archive/landing-2026-10-08.
import React, { useEffect, useRef } from "react";
import nexumModelMesh from "./nexum-model-mesh.json";

// The original used the app's perf context (lite mode); without it the sphere always animates.
const usePerf = () => ({ lite: false });

export function ParticleSphere() {
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

// Original hero markup (uses the app's Link, i18n and badge asset — adapt when reusing):
/*
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
*/
