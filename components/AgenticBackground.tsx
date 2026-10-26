"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  anchor: boolean;
  homeX: number;
  homeY: number;
};

type Signal = {
  from: number;
  to: number;
  progress: number;
  speed: number;
};

const ANCHOR_LAYOUT = [
  { x: 0.8, y: 0.16 },
  { x: 0.92, y: 0.27 },
  { x: 0.78, y: 0.38 },
  { x: 0.9, y: 0.49 },
];

export default function AgenticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let animationId = 0;
    let running = false;
    let linkDistance = 150;
    let nodes: Node[] = [];
    let signals: Signal[] = [];

    const pointer = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const random = (min: number, max: number) =>
      min + Math.random() * (max - min);

    function resize() {
      const rect = container!.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const narrow = width < 720;
      const cap = narrow ? 28 : 60;
      const floor = narrow ? 16 : 28;
      linkDistance = narrow ? 110 : 150;

      const count = Math.max(
        floor,
        Math.min(cap, Math.round((width * height) / 22000)),
      );

      nodes = Array.from({ length: count }, () => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.16, 0.16),
        vy: random(-0.16, 0.16),
        radius: random(1.1, 2.2),
        phase: random(0, Math.PI * 2),
        anchor: false,
        homeX: 0,
        homeY: 0,
      }));

      for (const spot of ANCHOR_LAYOUT) {
        const x = width * spot.x;
        const y = height * spot.y;
        nodes.push({
          x,
          y,
          vx: random(-0.08, 0.08),
          vy: random(-0.08, 0.08),
          radius: random(3.2, 4.2),
          phase: random(0, Math.PI * 2),
          anchor: true,
          homeX: x,
          homeY: y,
        });
      }

      signals = [];

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = Math.hypot(
            nodes[i].x - nodes[j].x,
            nodes[i].y - nodes[j].y,
          );

          if (distance < linkDistance && Math.random() > 0.93) {
            signals.push({
              from: i,
              to: j,
              progress: random(0, 1),
              speed: random(0.002, 0.005),
            });
          }
        }
      }

      const anchorStart = count;

      if (signals.length > 14) {
        signals = signals.slice(0, 14);
      }

      for (let i = 0; i < ANCHOR_LAYOUT.length; i++) {
        signals.push({
          from: anchorStart + i,
          to: anchorStart + ((i + 1) % ANCHOR_LAYOUT.length),
          progress: random(0, 1),
          speed: random(0.0022, 0.0045),
        });
      }
    }

    function drawEdges(maxOpacity: number) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          const anchorLink = a.anchor && b.anchor;
          const limit = anchorLink ? linkDistance * 2.2 : linkDistance;

          if (distance > limit) continue;

          const opacity =
            (1 - distance / limit) * (anchorLink ? maxOpacity * 1.4 : maxOpacity);
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = `rgba(197, 244, 103, ${opacity})`;
          ctx!.lineWidth = a.anchor || b.anchor ? 1 : 0.7;
          ctx!.stroke();
        }
      }
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      drawEdges(0.16);

      for (const node of nodes) {
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.anchor ? 4 : node.radius, 0, Math.PI * 2);
        ctx!.fillStyle = node.anchor
          ? "rgba(197, 244, 103, 0.9)"
          : "rgba(231, 235, 227, 0.55)";
        ctx!.fill();
      }
    }

    function draw() {
      if (!running) return;

      ctx!.clearRect(0, 0, width, height);

      for (const node of nodes) {
        if (node.anchor) {
          node.vx += (node.homeX - node.x) * 0.004;
          node.vy += (node.homeY - node.y) * 0.004;
          node.vx *= 0.96;
          node.vy *= 0.96;
        }

        node.x += node.vx;
        node.y += node.vy;

        if (!node.anchor) {
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
          node.y = Math.max(0, Math.min(height, node.y));
        }

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const reach = node.anchor ? 160 : 130;

          if (distance < reach && distance > 0) {
            const force = ((reach - distance) / reach) * (node.anchor ? 0.45 : 0.28);
            node.x += (dx / distance) * force;
            node.y += (dy / distance) * force;
          }
        }
      }

      drawEdges(0.34);

      for (const signal of signals) {
        const a = nodes[signal.from];
        const b = nodes[signal.to];
        if (!a || !b) continue;

        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const anchorLink = a.anchor && b.anchor;
        if (!anchorLink && distance > linkDistance * 1.35) continue;

        signal.progress += signal.speed;
        if (signal.progress > 1) signal.progress = 0;

        const x = a.x + (b.x - a.x) * signal.progress;
        const y = a.y + (b.y - a.y) * signal.progress;

        ctx!.beginPath();
        ctx!.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx!.fillStyle = "#c5f467";
        ctx!.shadowColor = "#c5f467";
        ctx!.shadowBlur = 10;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      for (const node of nodes) {
        const pulse = (Math.sin(frame * 0.025 + node.phase) + 1) / 2;

        if (node.anchor) {
          const radius = node.radius + pulse * 0.8;

          ctx!.beginPath();
          ctx!.arc(node.x, node.y, 16 + pulse * 6, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(197, 244, 103, ${0.18 + pulse * 0.28})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx!.fillStyle = "#c5f467";
          ctx!.shadowColor = "#c5f467";
          ctx!.shadowBlur = 16;
          ctx!.fill();
          ctx!.shadowBlur = 0;
          continue;
        }

        const radius = node.radius + pulse * 0.45;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(231, 235, 227, ${0.35 + pulse * 0.4})`;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius + 3 + pulse * 2, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(197, 244, 103, ${0.06 + pulse * 0.12})`;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      frame++;
      animationId = window.requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(animationId);
    }

    function start() {
      stop();

      if (reducedMotion.matches || document.hidden) {
        drawStatic();
        return;
      }

      running = true;
      animationId = window.requestAnimationFrame(draw);
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    }

    function handleVisibility() {
      if (document.hidden) {
        stop();
        return;
      }

      start();
    }

    resize();
    start();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      start();
    });

    resizeObserver.observe(container);
    window.addEventListener("pointermove", handlePointerMove);
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", start);

    return () => {
      stop();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", start);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="agentic-background"
    >
      <canvas ref={canvasRef} className="agentic-canvas" />
      <div className="agentic-vignette absolute inset-0" />
    </div>
  );
}
