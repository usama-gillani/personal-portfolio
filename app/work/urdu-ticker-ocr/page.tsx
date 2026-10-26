import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Urdu ticker and flasher OCR",
  description:
    "Two FastAPI services detect Urdu news lines, read them with UTRNet, and optionally correct numerals. Detection and both recognizers run on Triton.",
};

const systemChart = `
flowchart LR
  V[News channel videos] --> F[Frame extraction script]
  F --> A[Annotation]
  A --> T[YOLO training]
  T --> Y["YOLO inference<br/>serving location: CONFIRM"]
  Y -.->|unconfirmed| D
  Y --> B["Backend: storage"]
  B --> FE[Frontend dashboard]
  B --> D
  D["document-ocr :2006<br/>POST /ocr/"] --> DET["Triton det_onnx<br/>PP-OCRv6_medium_det"]
  DET --> C[Perspective line crops]
  C --> U["urdu-ocr :3008<br/>POST /urdu_ocr/"]
  U --> UR["Triton urdu_rec_onnx<br/>UTRNet"]
  UR --> NC{"NUMBER_CORRECTION_ENABLED"}
  NC -->|yes| EN["Triton rec_onnx<br/>en_PP-OCRv5_mobile_rec"]
  NC -->|no| OUT[Final text]
  EN --> OUT
  OUT --> B
`;

const digitChart = `
flowchart TD
  L[Line crop] --> R[UTRNet text and CTC positions]
  R --> G{Numeric span in the text?}
  G -->|no| K[Keep the text]
  G -->|yes| C[Crop by CTC x-position]
  C --> P[Paddle English recognizer]
  P --> E{Non-empty result?}
  E -->|no| K
  E -->|yes| S[Replace that span by character index]
  K --> F[Final text]
  S --> W[Wrap numbers in LRI/PDI]
  W --> F
`;

const stages = [
  {
    step: "01",
    title: "Upload",
    text: "A client sends an image to document-ocr at POST /ocr/.",
  },
  {
    step: "02",
    title: "Detect",
    text: "Triton det_onnx runs PP-OCRv6 medium, a Differentiable Binarization detector, and returns quads.",
  },
  {
    step: "03",
    title: "Crop",
    text: "Each quad is perspective-warped into a line. Every crop goes to Urdu OCR.",
  },
  {
    step: "04",
    title: "Read",
    text: "urdu-ocr flips the line left-to-right and runs UTRNet on Triton urdu_rec_onnx.",
  },
  {
    step: "05",
    title: "Correct",
    text: "When number correction is on, numeric spans are re-read by the English recognizer on rec_onnx.",
  },
  {
    step: "06",
    title: "Return",
    text: "Corrected spans are spliced by character index. Numbers are wrapped in LRI/PDI so digits stay left-to-right.",
  },
];

const models = [
  {
    role: "Text detection",
    name: "PP-OCRv6 medium",
    detail: "DB family. Triton model det_onnx. Side limit 960, thresh 0.2, box thresh 0.45, unclip 1.4.",
  },
  {
    role: "Urdu recognition",
    name: "UTRNet",
    detail:
      "HRNet, DBiLSTM, and CTC. Grayscale input, 32×400. Vocabulary is UrduGlyphs.txt. Triton model urdu_rec_onnx.",
  },
  {
    role: "Numerals",
    name: "en_PP-OCRv5_mobile_rec",
    detail: "English recognizer on Triton rec_onnx. Used only for flagged digit crops, and only when correction is enabled.",
  },
];

const failures = [
  ["Detection is down or slow", "/ocr/ returns 500, and /ready returns 503"],
  ["One Urdu crop fails", "That crop is skipped"],
  ["Every crop on the page fails", "/ocr/ returns 500"],
  ["The number model is down", "Urdu text still returns, HTTP 200"],
  ["Three failures in a row", "The circuit breaker fails fast for 30 seconds"],
];

const facts = [
  ["Services", "Two FastAPI apps, one image"],
  ["Ports", "2006 and 3008"],
  ["Connect timeout", "2 seconds"],
  ["Recognizer timeout", "5 seconds"],
  ["Retries", "1, never on timeout"],
  ["Breaker", "3 failures, 30 second cooldown"],
];

const stack = [
  "FastAPI",
  "Python",
  "UTRNet",
  "PaddleX",
  "Triton",
  "Docker",
  "Kubernetes",
  "Prometheus",
];

export default function UrduTickerOcrPage() {
  return (
    <main id="top" className="relative z-10 min-h-screen">
      <SiteHeader />

      <Reveal className="px-5 pb-8 pt-12 sm:px-8 sm:pt-16 lg:px-14 lg:pt-20">
        <div className="mx-auto max-w-328">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50 transition-colors hover:text-lime"
          >
            <span aria-hidden="true">←</span> Selected work
          </Link>

          <p className="section-kicker mt-8">
            <Dot /> Case 01 / Document intelligence
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Reading Urdu news graphics{" "}
            <span className="text-ink/35">as a service.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            News frames mix cursive Urdu, right-to-left layout, and numerals.
            This system finds each text line, reads it with an Urdu model, and
            sends only the numeric spans to a second recognizer.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {stack.map((item) => (
              <li
                key={item}
                className="border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-328 border border-white/10 sm:grid-cols-3">
          {[
            ["Owned here", "Detection, Urdu recognition, digit correction, and the Triton clients."],
            ["Team", "The backend stores results. The dashboard displays them."],
            ["Contract", "POST /ocr/ accepts an image. POST /urdu_ocr/ reads one line."],
          ].map(([label, text]) => (
            <div key={label} className="border-t border-white/10 p-5 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">{label}</p>
              <p className="mt-3 text-sm leading-6 text-ink/65">{text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="architecture-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 01 / Architecture
          </p>
          <h2
            id="architecture-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            From a broadcast frame to corrected text.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Video collection, annotation, and YOLO sit upstream. This service
            starts when an image reaches document-ocr. Both processes ship as
            one image, ticker-flasher-ocr, and neither loads model weights.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="System architecture"
              caption="The dotted arrow from YOLO into document-ocr is unconfirmed. Confirmed traffic starts at POST /ocr/. Final text is written back to backend storage."
              chart={systemChart}
            />
          </div>

          <ol className="mt-8 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage) => (
              <li key={stage.step} className="bg-void p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                  {stage.step}
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">{stage.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <Reveal as="section" ariaLabelledBy="models-title" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto grid max-w-328 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 02 / Models
            </p>
            <h2
              id="models-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Three models, one Triton server.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/60 sm:text-base">
              The previous detector was EasyOCR CRAFT, with axis-aligned crops.
              PP-OCRv6 returns quads, and the service perspective-crops them.
              That change also removed a forced leading Urdu full stop.
            </p>
          </div>

          <div className="border-y border-white/10">
            {models.map((model) => (
              <article key={model.role} className="border-t border-white/10 py-6 first:border-t-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  {model.role}
                </p>
                <p className="mt-2 text-xl font-medium tracking-tight">{model.name}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{model.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="digits-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 03 / Digit correction
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2
              id="digits-title"
              className="text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Re-read the numbers. Leave the Urdu alone.
            </h2>
            <p className="text-sm leading-7 text-ink/60 sm:text-base">
              UTRNet is the Urdu reader. A regex flags spans in Western, Persian,
              and Arabic-Indic digits. Those spans are cropped from CTC character
              positions, read by the English model, and written back by index.
              The image is flipped before recognition. LRI/PDI is applied only on
              the final document-ocr response.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <ArchitectureDiagram
              title="Digit correction"
              caption="The gate is the regex, not a confidence cutoff. Any non-empty cleaned English result replaces the span. If the English model is down, the Urdu line is still returned."
              chart={digitChart}
            />
            <div className="border border-white/10">
              {[
                ["Flag", "Digits 0-9, ۰-۹, and ٠-٩, plus separators . , ، / % - :"],
                ["Crop", "Horizontal range from CTC timesteps. Non-numeric neighbors stop the box."],
                ["Edge clean", "One outer character can drop when it is much less confident than the digits inside."],
                ["Replace", "Character index in the decoded string, walked from the end so earlier indexes stay valid."],
                ["Direction", "Unicode LRI/PDI keeps digit order left-to-right inside right-to-left Urdu."],
                ["Deploy", "On in the Kubernetes spec. Off unless NUMBER_CORRECTION_ENABLED is set."],
              ].map(([label, text]) => (
                <div key={label} className="border-t border-white/10 p-5 first:border-t-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" ariaLabelledBy="engineering-title" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 04 / Engineering
          </p>
          <h2
            id="engineering-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Shared serving, and failures that stay local.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Timeouts stop a hung call. Retries cover connect and parse failures
            only, so a slow model is not called twice. The breaker stops a down
            model from stalling every request. Rollback is the previous image tag.
          </p>

          <dl className="mt-10 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="border-b border-white/10 p-5 sm:border-l sm:first:border-l-0 lg:[&:nth-child(3n+1)]:border-l-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">{label}</dt>
                <dd className="mt-2 text-lg font-medium tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 border border-white/10">
            <div className="grid grid-cols-[1.1fr_1fr] border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
              <span>Situation</span>
              <span>Caller sees</span>
            </div>
            {failures.map(([situation, result]) => (
              <div
                key={situation}
                className="grid gap-2 border-t border-white/10 px-5 py-4 first:border-t-0 sm:grid-cols-[1.1fr_1fr] sm:items-center sm:gap-8"
              >
                <p className="text-sm text-ink/80">{situation}</p>
                <p className="font-mono text-xs leading-5 text-lime/90">{result}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-ink/45">
            The document pipeline allows 2 jobs, then HTTP 503 after 30 seconds.
            Urdu OCR allows 4, then 503 after 60 seconds. /health is process
            liveness. /ready checks Triton.
          </p>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="limits-title"
        className="border-t border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto grid max-w-328 gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 05 / Limits
            </p>
            <h2
              id="limits-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              What this page does not claim.
            </h2>
          </div>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {[
              "No accuracy or latency benchmark is published with this service.",
              "The number gate is a regex, then a replace of any non-empty English read.",
              "English-only lines currently go through UTRNet. A later English branch is only a stub.",
              "YOLO serving location is still marked CONFIRM on the diagram. Dataset size and detection metrics live outside this service.",
            ].map((item) => (
              <li key={item} className="py-5 text-sm leading-7 text-ink/65 sm:text-base">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-328 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/#work"
            className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
          >
            Back to selected work <ArrowUpRight />
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Urdu ticker and flasher OCR
          </p>
        </div>
      </footer>
    </main>
  );
}
