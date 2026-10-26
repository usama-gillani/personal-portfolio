import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Grounded news assistant",
  description:
    "A FastAPI service answers natural-language questions from stored OCR tickers. It filters with SQL, deduplicates with rapidfuzz, and asks gpt-oss-120b to stay inside those lines.",
};

const systemChart = `
flowchart TD
  U[User question] --> API["FastAPI :8888<br/>POST /user-query"]
  API --> P[Parser service]
  P --> SQL["SQL filter<br/>date, channel, keyword"]
  SQL --> DB[("PostgreSQL<br/>polls_ticker_extraction_model")]
  DB --> D["rapidfuzz<br/>ratio 80"]
  D --> L["gpt-oss-120b<br/>OpenRouter or Groq"]
  L --> O[JSON answer in English]
`;

const stages = [
  {
    step: "01",
    title: "Ask",
    text: "A client posts a natural-language prompt to POST /user-query. An empty prompt returns 400.",
  },
  {
    step: "02",
    title: "Parse",
    text: "A separate parser returns dates, times, channel, and Urdu keywords. This service does not contain that parser.",
  },
  {
    step: "03",
    title: "Retrieve",
    text: "Those fields become a SQL filter on ocrResult, channelName, and dateTime in the OCR table.",
  },
  {
    step: "04",
    title: "Deduplicate",
    text: "rapidfuzz drops near-duplicate OCR lines. The match is fuzz.ratio at a threshold of 80.",
  },
  {
    step: "05",
    title: "Answer",
    text: "gpt-oss-120b writes one English JSON answer from the remaining lines, at temperature 0.1.",
  },
];

const decisions = [
  {
    role: "Retrieval",
    name: "SQL keyword filter",
    detail:
      "The question is turned into channel, time, and ILIKE keyword conditions. This is not an embedding search. A paraphrase that never appears in the OCR can miss.",
  },
  {
    role: "Cleaning",
    name: "rapidfuzz ratio 80",
    detail:
      "Broadcast OCR repeats the same line. Exact DISTINCT ON (ocrResult) runs in SQL. Fuzzy matching then removes lines that differ only by spacing or small OCR noise.",
  },
  {
    role: "Synthesis",
    name: "openai/gpt-oss-120b",
    detail:
      "The same model id is configured for OpenRouter and Groq. The prompt forbids outside information and requires a JSON object with an English answer.",
  },
];

const facts = [
  ["Service", "One FastAPI app"],
  ["Port", "8888"],
  ["Endpoint", "POST /user-query"],
  ["Table", "polls_ticker_extraction_model"],
  ["Dedup", "rapidfuzz ratio 80"],
  ["Temperature", "0.1"],
];

const limits = [
  "No accuracy, latency, or adoption number is published with this service.",
  "Retrieval is keyword and time filtering. It is not vector search.",
  "Tickers and flashers are both read from polls_ticker_extraction_model.",
  "If the parser names no channel, the query defaults to Geo News, ARY News, and Express News.",
  "The prompt tells the model to stay inside the retrieved lines. There is no checker after the response.",
  "The parser is a separate service. The ticker OCR models live in the previous case study.",
];

const stack = [
  "FastAPI",
  "PostgreSQL",
  "rapidfuzz",
  "gpt-oss-120b",
  "OpenRouter",
  "Groq",
];

export default function GroundedNewsAssistantPage() {
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
            <Dot /> Case 02 / AI assistants
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Questions over the{" "}
            <span className="text-ink/35">ticker archive.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            Ticker detection stores what the channels showed. This service is
            the step after that: a person asks in natural language, and the
            answer is written only from the OCR lines that match.
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
            ["Owned here", "The query service: parser client, SQL, deduplication, and the grounded model call."],
            ["Upstream", "Urdu ticker and flasher OCR writes the text this service reads."],
            ["External", "A parser extracts the fields. OpenRouter or Groq hosts gpt-oss-120b."],
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
            The model never searches the news itself.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Retrieval happens before the model call. The language model only
            sees the lines that SQL returned and fuzzy matching kept.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Query architecture"
              caption="Confirmed path: POST /user-query, an external parser, SQL against polls_ticker_extraction_model, rapidfuzz, then gpt-oss-120b. The parser’s own model is outside this service."
              chart={systemChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage) => (
              <li key={stage.step} className="border border-white/10 bg-void p-5 sm:p-6">
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

      <Reveal as="section" ariaLabelledBy="decisions-title" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto grid max-w-328 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 02 / Decisions
            </p>
            <h2
              id="decisions-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Filter first. Then write.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/60 sm:text-base">
              Channel, time, and keyword are known fields on the OCR rows.
              SQL can filter those exactly. Semantic search would matter when
              the user’s wording never appears in the ticker.
            </p>
          </div>

          <div className="border-y border-white/10">
            {decisions.map((item) => (
              <article key={item.role} className="border-t border-white/10 py-6 first:border-t-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  {item.role}
                </p>
                <p className="mt-2 text-xl font-medium tracking-tight">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" ariaLabelledBy="facts-title" className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 03 / Service
          </p>
          <h2
            id="facts-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            One endpoint, two model providers.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            LLM_PROVIDER selects Groq or OpenRouter. Both are configured with
            the same model id. The health check is GET /health.
          </p>

          <dl className="mt-10 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="border-b border-white/10 p-5 sm:border-l sm:first:border-l-0 lg:[&:nth-child(3n+1)]:border-l-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">{label}</dt>
                <dd className="mt-2 text-lg font-medium tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="limits-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto grid max-w-328 gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 04 / Limits
            </p>
            <h2
              id="limits-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              What this page does not claim.
            </h2>
          </div>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {limits.map((item) => (
              <li key={item} className="py-5 text-sm leading-7 text-ink/65 sm:text-base">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-328 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href="/#work"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Back to selected work <ArrowUpRight />
            </Link>
            <Link
              href="/work/urdu-ticker-ocr"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Upstream: ticker OCR <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Grounded news assistant
          </p>
        </div>
      </footer>
    </main>
  );
}
