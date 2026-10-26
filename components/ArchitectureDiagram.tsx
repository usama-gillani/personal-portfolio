"use client";

import { useEffect, useId, useState } from "react";
import type { Mermaid } from "mermaid";

type ArchitectureDiagramProps = {
  chart: string;
  title: string;
  caption: string;
  wide?: boolean;
};

const themeVariables = {
  darkMode: true,
  background: "transparent",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "14px",
  primaryColor: "#121513",
  primaryTextColor: "#e7ebe3",
  primaryBorderColor: "#c5f467",
  secondaryColor: "#121513",
  secondaryTextColor: "#e7ebe3",
  secondaryBorderColor: "#c5f467",
  tertiaryColor: "#070908",
  tertiaryTextColor: "#e7ebe3",
  tertiaryBorderColor: "#c5f467",
  lineColor: "#c5f467",
  textColor: "#e7ebe3",
  mainBkg: "#121513",
  nodeBkg: "#121513",
  nodeBorder: "#c5f467",
  nodeTextColor: "#e7ebe3",
  clusterBkg: "#070908",
  clusterBorder: "#c5f467",
  titleColor: "#c5f467",
  edgeLabelBackground: "#121513",
  actorTextColor: "#e7ebe3",
  signalColor: "#c5f467",
  signalTextColor: "#e7ebe3",
};

let mermaidPromise: Promise<Mermaid> | null = null;
let renderQueue: Promise<unknown> = Promise.resolve();

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables,
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          padding: 18,
          nodeSpacing: 48,
          rankSpacing: 56,
          diagramPadding: 12,
          useMaxWidth: false,
        },
      });
      return mod.default;
    });
  }
  return mermaidPromise;
}

function lockSvgSize(svg: string) {
  const width = svg.match(/\swidth="([\d.]+)"/)?.[1];
  const height = svg.match(/\sheight="([\d.]+)"/)?.[1];
  if (!width || !height || width.endsWith("%")) return svg;
  return svg.replace(
    "<svg ",
    `<svg style="width:${width}px;height:${height}px;max-width:none" `,
  );
}

function renderChart(id: string, chart: string) {
  const run = renderQueue.then(async () => {
    const mermaid = await loadMermaid();
    await mermaid.parse(chart);
    return mermaid.render(id, chart);
  });
  renderQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export default function ArchitectureDiagram({
  chart,
  title,
  caption,
  wide = false,
}: ArchitectureDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    renderChart(`diagram-${reactId}`, chart)
      .then((result) => {
        if (!cancelled) setSvg(lockSvgSize(result.svg));
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Diagram failed to render.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  return (
    <figure className="border border-white/10 bg-surface/80">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
        <figcaption className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
          {title}
        </figcaption>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
          {wide ? "Scroll sideways" : "From the service"}
        </span>
      </div>

      <div className="overflow-x-auto px-2 py-4 sm:px-4 sm:py-6">
        {svg ? (
          <div
            className={`diagram-canvas ${wide ? "diagram-canvas-wide" : "diagram-canvas-stack"}`}
            aria-label={title}
            role="img"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : error ? (
          <p className="px-3 py-8 text-sm text-ink/60" role="alert">
            {error}
          </p>
        ) : (
          <p className="px-3 py-10 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Drawing diagram
          </p>
        )}
      </div>

      <p className="border-t border-white/10 px-4 py-3 text-sm leading-6 text-ink/55 sm:px-5">
        {caption}
      </p>
    </figure>
  );
}
