import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Social and web content assistant",
  description:
    "A FastAPI service answers natural-language questions from six crawled platform tables. It builds SQL from a parser, deduplicates with rapidfuzz, and asks gpt-oss-120b to stay inside those texts.",
};

const systemChart = `
flowchart TD
  U[Client] --> API["FastAPI :8888<br/>POST /user-query"]
  API --> P[Parser microservice]
  P --> SQL[Platform SQL builder]
  SQL --> DB[("PostgreSQL<br/>betasight")]
  DB --> D["rapidfuzz<br/>Indel ratio 80"]
  D --> L["gpt-oss-120b<br/>OpenRouter or Groq"]
  L --> O[JSON answer in English]
`;

const pipelineChart = `
flowchart TD
  A[Prompt] --> B{Blank?}
  B -->|yes| E400[HTTP 400]
  B -->|no| P[Parser filters]
  P --> Q["SQL with created_at<br/>limit 100 per table"]
  Q --> R{Any rows?}
  R -->|none| F[Retry without the date filter]
  R -->|some| G[Flatten text]
  F --> G
  G --> H["Dedupe<br/>keep at most 100"]
  H --> M["gpt-oss-120b<br/>temperature 0.1"]
`;

const stages = [
  {
    step: "01",
    title: "Ask",
    text: "A client posts a natural-language prompt to POST /user-query. A blank prompt returns 400.",
  },
  {
    step: "02",
    title: "Parse",
    text: "An external parser returns dates, Urdu and English phrases, sentiment, and platform. This service does not contain that parser.",
  },
  {
    step: "03",
    title: "Retrieve",
    text: "Those fields become one SQL query per platform table. A miss on the date window is retried once without created_at.",
  },
  {
    step: "04",
    title: "Deduplicate",
    text: "Rows from every table are flattened, then rapidfuzz drops near-duplicate text at fuzz.ratio 80.",
  },
  {
    step: "05",
    title: "Answer",
    text: "gpt-oss-120b writes one English JSON answer from the remaining strings, at temperature 0.1.",
  },
];

const platforms = [
  ["YouTube", "title, description", "video_sentiment"],
  ["TikTok", "video_description", "video_sentiment"],
  ["X / Twitter", "text", "post_sentiment"],
  ["Web", "raw_content", "article_sentiment"],
  ["Instagram", "description", "post_sentiment"],
  ["Facebook", "post_text", "post_sentiment"],
];

const decisions = [
  {
    role: "Retrieval",
    name: "SQL ILIKE, not embeddings",
    detail:
      "Each search phrase is matched with ILIKE on that platform’s text columns. Sentiment is an equality check unless the parser says all. Platform all, or an unknown platform, queries every supported table. A leading wildcard will not use an ordinary B-tree index.",
  },
  {
    role: "Recovery",
    name: "One date fallback",
    detail:
      "The first query includes created_at when the parser supplies a window. If every table is empty, the same search runs again without that predicate. The model is not told that the time filter was dropped.",
  },
  {
    role: "Cleaning",
    name: "Indel similarity at 80",
    detail:
      "fuzz.ratio is normalized Indel similarity on a 0–100 scale. Indel distance counts insertions and deletions. Input is capped at 300 strings, each truncated to 4,000 characters, and output stops at 100. This catches reposts. It does not detect paraphrases.",
  },
  {
    role: "Synthesis",
    name: "openai/gpt-oss-120b",
    detail:
      "OpenRouter and Groq are both configured with that model id. The prompt forbids outside information and requires a JSON object with an English answer. The service does not load or fine-tune the weights.",
  },
];

const facts = [
  ["Service", "One FastAPI app"],
  ["Port", "8888"],
  ["Endpoint", "POST /user-query"],
  ["Database", "PostgreSQL betasight"],
  ["Rows kept", "100 per table, then 100 after dedupe"],
  ["Temperature", "0.1"],
  ["Workers", "2 uvicorn workers"],
  ["Health", "GET /health"],
];

const limits = [
  "No accuracy, latency, or adoption number is published with this service.",
  "Retrieval is keyword, sentiment, and time filtering. It is not vector search.",
  "Returned text has no row id, URL, timestamp, or platform label, so a sentence in the answer cannot be traced to a source row.",
  "DISTINCT ON is applied to the selected text and has no ORDER BY, so ties are not ranked by recency.",
  "The date fallback can mix older posts into a question about today.",
  "SQL values are escaped by doubling quotes and then interpolated. They are not bound parameters.",
  "The prompt tells the model to stay inside the retrieved text. There is no checker after the response.",
  "The parser, the crawlers, and the model weights sit outside this service.",
];

const references = [
  {
    label: "gpt-oss model card",
    href: "https://openai.com/index/gpt-oss-model-card/",
    note: "The hosted model. The card describes a Mixture-of-Experts transformer, about 116.8 billion parameters, about 5.1 billion active per token.",
  },
  {
    label: "arXiv:2508.10925",
    href: "https://arxiv.org/abs/2508.10925",
    note: "The same model card as a paper. Useful for the architecture, not for this service’s training.",
  },
  {
    label: "RapidFuzz ratio",
    href: "https://rapidfuzz.github.io/RapidFuzz/Usage/fuzz.html",
    note: "Defines fuzz.ratio as normalized Indel similarity.",
  },
  {
    label: "PostgreSQL pattern matching",
    href: "https://www.postgresql.org/docs/current/functions-matching.html",
    note: "ILIKE, the match used on every search column.",
  },
  {
    label: "Lewis et al., RAG",
    href: "https://arxiv.org/abs/2005.11401",
    note: "The retrieve-then-generate idea. This retriever is lexical SQL, not a dense index.",
  },
];

const stack = [
  "FastAPI",
  "PostgreSQL",
  "rapidfuzz",
  "gpt-oss-120b",
  "OpenRouter",
  "Groq",
];

export default function SocialWebAssistantPage() {
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
            <Dot /> Case 03 / AI assistants
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Questions across{" "}
            <span className="text-ink/35">six content tables.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            Crawlers already store posts and articles from YouTube, TikTok, X,
            the web, Instagram, and Facebook. This service is the step after
            that: a person asks in natural language, and the answer is written
            only from the rows that match.
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
            [
              "Owned here",
              "The orchestration service: parser client, SQL builder, deduplication, grounded model call, and the container.",
            ],
            [
              "Already stored",
              "PostgreSQL betasight holds the crawled rows. This service only reads them.",
            ],
            [
              "External",
              "A parser extracts the filters. OpenRouter or Groq hosts gpt-oss-120b.",
            ],
          ].map(([label, text]) => (
            <div
              key={label}
              className="border-t border-white/10 p-5 first:border-t-0 sm:border-t-0 sm:border-l sm:p-6 sm:first:border-l-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                {label}
              </p>
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
            The model never queries the tables itself.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            One synchronous FastAPI process coordinates the parser, PostgreSQL,
            and the model host. A worker stays busy until the model returns.
            Docker runs two workers so the docs page can still answer during a
            long query.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Service architecture"
              caption="Confirmed path: POST /user-query, an external parser, SQL against the betasight tables, rapidfuzz, then gpt-oss-120b. The crawlers and the parser’s own model are outside this service."
              chart={systemChart}
            />
          </div>

          <div className="mt-6">
            <ArchitectureDiagram
              title="Request pipeline"
              caption="A dated query that returns nothing is retried once without created_at. Search text and sentiment stay in place. Process time and table names are logged, not returned."
              chart={pipelineChart}
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

      <Reveal
        as="section"
        ariaLabelledBy="platforms-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 02 / Retrieval
          </p>
          <h2
            id="platforms-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            One filter shape. Six tables.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Every table is filtered on created_at. YouTube returns the first
            non-empty title or description. Twitter is an alias of X, and
            website is an alias of web, so those pairs share a table.
          </p>

          <div className="mt-10 overflow-x-auto border border-white/10">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  <th className="border-b border-white/10 px-4 py-3 font-medium sm:px-5">
                    Platform
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium sm:px-5">
                    Search columns
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium sm:px-5">
                    Sentiment
                  </th>
                </tr>
              </thead>
              <tbody>
                {platforms.map(([platform, columns, sentiment]) => (
                  <tr key={platform} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-4 font-medium tracking-tight sm:px-5">
                      {platform}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-ink/70 sm:px-5">
                      {columns}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-ink/70 sm:px-5">
                      {sentiment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="decisions-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto grid max-w-328 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 03 / Decisions
            </p>
            <h2
              id="decisions-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Bound the evidence, then write.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/60 sm:text-base">
              The parser already names platform, phrases, sentiment, and a time
              window. SQL can apply those directly. Semantic search would
              matter when the user’s wording never appears in the post.
            </p>
          </div>

          <div className="border-y border-white/10">
            {decisions.map((item) => (
              <article
                key={item.role}
                className="border-t border-white/10 py-6 first:border-t-0"
              >
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

      <Reveal
        as="section"
        ariaLabelledBy="facts-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 04 / Service
          </p>
          <h2
            id="facts-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            One endpoint, two model hosts.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            LLM_PROVIDER selects Groq or OpenRouter. Both use the model id
            openai/gpt-oss-120b. A model or JSON failure still returns HTTP 200,
            with a fixed fallback answer and the exception text.
          </p>

          <dl className="mt-10 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="border-b border-white/10 p-5 sm:border-l sm:first:border-l-0 lg:[&:nth-child(4n+1)]:border-l-0"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  {label}
                </dt>
                <dd className="mt-2 text-lg font-medium tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="limits-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
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
            {limits.map((item) => (
              <li key={item} className="py-5 text-sm leading-7 text-ink/65 sm:text-base">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="references-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 06 / References
          </p>
          <h2
            id="references-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            The papers behind the pieces that are called, not trained.
          </h2>
          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {references.map((item) => (
              <li key={item.href} className="py-5">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base font-medium tracking-tight transition-colors hover:text-lime"
                >
                  {item.label}
                  <ArrowUpRight className="size-4" />
                </a>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">{item.note}</p>
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
              href="/work/grounded-news-assistant"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Related: ticker archive <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Social and web content assistant
          </p>
        </div>
      </footer>
    </main>
  );
}
