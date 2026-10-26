import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Workspace RAG assistant",
  description:
    "POST /v1/user/chat resolves a user-selected answer model, runs a bounded tool loop over scoped workspace evidence, and streams a grounded answer.",
};

const systemChart = `
flowchart TD
  UI["Frontend<br/>chosen model and workspace scope"] --> API["POST /v1/user/chat"]
  API --> RES["Model resolver"]
  RES --> REDIS[("Redis<br/>hot metadata and block")]
  RES --> CACHE[("Qdrant<br/>ai_models_cache")]
  RES --> CAT["Model catalog"]
  API --> CTRL["OpenRouter<br/>control model"]
  API --> LOOP["Tool loop<br/>up to 3 rounds"]
  LOOP --> G["LangGraph retrieval"]
  G --> EMB["Embedding API"]
  G --> MF[("Qdrant<br/>media_files")]
  G --> BM["BM25 index"]
  LOOP --> SQL["SQL agent"]
  LOOP --> MAIL["Gmail connector"]
  LOOP --> ANS["Selected answer model"]
  ANS --> NAT["Native HTTP<br/>OpenAI-compatible"]
  ANS --> LL["LiteLLM"]
  ANS --> SSE["SSE stream"]
`;

const turnChart = `
flowchart TD
  A["Accept the chat request"] --> B["Resolve the selected model"]
  B --> C["One JSON prefix<br/>query, language, intent, tools"]
  C --> D{"Stop early?"}
  D -->|greeting or out of scope| E["Short stream"]
  D -->|two or more files| F["Document compare"]
  D -->|inventory already known| G["Direct structure answer"]
  D -->|continue| H["Tool loop"]
  H --> I["Pin location or scope"]
  I --> J["Hybrid retrieval"]
  H --> K["Database, Gmail, inventory"]
  J --> L["Choose sources"]
  K --> L
  L --> M{"Evidence enough?"}
  M -->|no| N["Refusal"]
  M -->|yes| O["Answer on the selected model"]
  O --> P["Faithfulness check when enabled"]
  P --> Q["Cited sources, memory, completed"]
`;

const swapChart = `
flowchart TD
  A["ai_model on the request"] --> B{"Blocked in Redis?"}
  B -->|yes| X["Model unavailable"]
  B -->|no| C{"Fresh Redis hot record?"}
  C -->|yes| USE["Selected runtime"]
  C -->|no| D{"Fresh Qdrant cache?"}
  D -->|yes| USE
  D -->|no| E["Fetch the model catalog"]
  E --> F["Write Qdrant and Redis"]
  F --> USE
  E -->|catalog down| G["Serve the stale cache if one exists"]
  G --> USE
  USE --> H{"API style"}
  H -->|OpenAI-compatible| N["Native HTTP"]
  H -->|Azure, Anthropic, Gemini, Ollama, Responses| L["LiteLLM"]
`;

const retrievalChart = `
flowchart TD
  A["Empty scope"] --> LOC["Search the current location"]
  B["Scope ids"] --> PIN["Union of those spaces, folders, or files"]
  LOC --> V["Vector search<br/>Qdrant media_files"]
  PIN --> V
  LOC --> K["BM25<br/>k1 = 1.5, b = 0.75"]
  PIN --> K
  V --> R["Reciprocal rank fusion<br/>k = 60"]
  K --> R
  K -->|empty| F["Keep the vector ranking"]
`;

const swapStages = [
  {
    step: "01",
    title: "Register",
    text: "A model is added on the root side with its provider, API style, base URL, model identifier, and credentials. Chat does not ship with one fixed answer model.",
  },
  {
    step: "02",
    title: "Select",
    text: "The frontend sends ai_model with the question, the workspace location, and any space, folder, or file ids.",
  },
  {
    step: "03",
    title: "Resolve",
    text: "The service checks a Redis block, then Redis hot metadata, then a fresh Qdrant cache record, then the model catalog.",
  },
  {
    step: "04",
    title: "Dispatch",
    text: "OpenAI-compatible endpoints are called directly. Azure, Anthropic, Gemini, Ollama, and the OpenAI Responses style go through LiteLLM.",
  },
];

const agentStages = [
  {
    step: "01",
    title: "Understand",
    text: "One structured call rewrites the question, picks the reply language, and proposes tools. A pure greeting skips that call.",
  },
  {
    step: "02",
    title: "Pin",
    text: "File ids from the request are merged with the conversation’s sticky file ids. A follow-up can stay on the same file.",
  },
  {
    step: "03",
    title: "Loop",
    text: "Round one runs the chosen tools together. Later rounds run only when the evidence still has a gap, and they stop at three rounds.",
  },
  {
    step: "04",
    title: "Ground",
    text: "Arbitration keeps the sources that answer the question. Sufficiency can refuse. The selected model then answers from that evidence.",
  },
];

const decisions = [
  {
    role: "Models",
    name: "The answer model and the control model are different",
    detail:
      "The user-selected model writes the answer. Query understanding, tool choice, source arbitration, and sufficiency use a configured OpenRouter model, default openai/gpt-4o-mini.",
  },
  {
    role: "Search",
    name: "Hybrid is the strategy named rag",
    detail:
      "If the client omits retrieval_mode, the turn searches with vectors and BM25, then fuses the rankings. A client can still force vector or bm25.",
  },
  {
    role: "Fusion",
    name: "Fuse ranks, not raw scores",
    detail:
      "Vector similarity and BM25 do not share a scale. Reciprocal rank fusion adds 1 / (k + rank) from each list. The configured k is 60.",
  },
  {
    role: "Scope",
    name: "The server applies the workspace boundary",
    detail:
      "No scope ids means the whole current location. Listed ids restrict the search to that union. SQL and Gmail use the same folder allow-list.",
  },
  {
    role: "Agents",
    name: "The loop is bounded",
    detail:
      "The tool loop stops when the evidence matches the intent, the planner finishes, or three rounds end. An open-ended agent is not the live path.",
  },
];

const facts = [
  ["Endpoint", "POST /v1/user/chat"],
  ["Answer model", "Request field ai_model"],
  ["Control model", "OpenRouter, default gpt-4o-mini"],
  ["Dispatch", "Native HTTP or LiteLLM"],
  ["Graph", "LangGraph pin, then retrieve"],
  ["Vectors", "Qdrant collection media_files"],
  ["Keywords", "BM25, k1 = 1.5, b = 0.75"],
  ["Fusion", "RRF, k = 60"],
  ["Embedding default", "llama-nemotron-embed-1b-v2, 1024-d"],
  ["Tool rounds", "3"],
  ["Hot cache", "Redis, then Qdrant ai_models_cache"],
  ["Stream", "Server-sent events"],
];

const tools = [
  "search_documents",
  "workspace_inventory",
  "query_database",
  "search_gmail",
  "knowledge_availability",
  "compare_documents",
  "query_workspace_metadata",
];

const limits = [
  "No retrieval accuracy, latency, or cost number is in this repository. The test suite covers fusion, retrieval mode, the tool loop, faithfulness, compare, and file pin.",
  "Hot swap is cache-based. A request can still see the previous model record until refresh_after.",
  "Unsupported API styles, custom auth, and a missing key fail before the provider call. Any model the user picks is too broad.",
  "The answer model is swappable. The planner stays on OPENROUTER_MODEL unless that environment value changes.",
  "nvidia/llama-nemotron-embed-1b-v2 is the configured embedding default. The deployed endpoint can override it.",
  "Hybrid search falls back to the vector list when BM25 is empty. That is a design argument for recall, not a measured gain.",
  "master_agent, space_agent, and folder_agent are registered on the graph. The compiled edges do not enter them.",
  "Multi-candidate clarification is off by default. Scope-widening clarification is on by default.",
];

const references = [
  {
    name: "Retrieval-augmented generation",
    href: "https://arxiv.org/abs/2005.11401",
    note: "Lewis et al., 2020. The pattern of retrieve, then generate. This service adds scope, tools, and a swappable answer model.",
  },
  {
    name: "Reciprocal rank fusion",
    href: "https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf",
    note: "Cormack, Clarke, and Buettcher, SIGIR 2009. The fusion formula. Configured k is 60.",
  },
  {
    name: "BM25 and beyond",
    href: "https://dl.acm.org/doi/10.1561/1500000019",
    note: "Robertson and Zaragoza. The keyword ranker. Configured k1 is 1.5 and b is 0.75.",
  },
  {
    name: "Llama Nemotron Embed 1B v2",
    href: "https://huggingface.co/nvidia/llama-nemotron-embed-1b-v2",
    note: "The embedding named in configuration. Dimension in config is 1024. The live model is the environment value.",
  },
  {
    name: "Qdrant documentation",
    href: "https://qdrant.tech/documentation/",
    note: "Vector storage for media_files and for the model cache collection.",
  },
  {
    name: "LangGraph",
    href: "https://langchain-ai.github.io/langgraph/",
    note: "The retrieval state graph: load metadata, pin the location or the scope, then search.",
  },
  {
    name: "LiteLLM",
    href: "https://docs.litellm.ai/",
    note: "Normalizes Azure, Anthropic, Gemini, Ollama, and OpenAI Responses streams to the same internal events.",
  },
  {
    name: "OpenRouter",
    href: "https://openrouter.ai/docs",
    note: "Hosts the control model used for structured JSON. It is not the user’s answer model.",
  },
];

const stack = [
  "FastAPI",
  "LangGraph",
  "Qdrant",
  "Redis",
  "BM25",
  "LiteLLM",
  "OpenRouter",
];

export default function WorkspaceRagAssistantPage() {
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
            <Dot /> Case 05 / Agentic retrieval
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            The user picks the model.{" "}
            <span className="text-ink/35">The endpoint picks the evidence.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            POST /v1/user/chat answers a workspace question from the current
            location, or from the spaces, folders, and files the client named.
            I built the hot-swappable model path and the agentic path on this
            endpoint.
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
              "Model resolution, provider dispatch, the tool loop, scoped retrieval, source choice, and the grounded answer stream.",
            ],
            [
              "Root side",
              "Models are registered with provider parameters. This service reads that registration on the next resolve. It does not hard-code the answer model.",
            ],
            [
              "External",
              "The embedding API, Qdrant, Redis, OpenRouter, LiteLLM providers, and optional SQL and Gmail connectors.",
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
            Two model roles, one evidence path.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            The control model classifies the turn and chooses tools. Retrieval
            stays inside the workspace scope. The selected model is called
            after the sources are chosen.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="Service architecture"
              caption="Redis and Qdrant cache the selected model. LangGraph searches media_files. LiteLLM is used when the provider is not called natively."
              chart={systemChart}
            />
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="swap-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 02 / Hot-swappable model
          </p>
          <h2
            id="swap-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Adding a model does not require a chat redeploy.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            The request carries ai_model. Resolution fails closed when the
            model is blocked, suspended, or missing credentials. A catalog
            outage can still serve the last cached record.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Model resolution"
              caption="Lookup order is block, Redis hot record, fresh Qdrant cache, then the catalog. A successful refresh writes Qdrant and Redis together."
              chart={swapChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {swapStages.map((stage) => (
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
        ariaLabelledBy="agent-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 03 / Agentic turn
          </p>
          <h2
            id="agent-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Tools run first. The answer model sees what they returned.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            A greeting, a hard out-of-scope question, a two-file compare, or a
            deterministic inventory answer can finish before retrieval. The
            main path is the tool loop.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="Turn pipeline"
              caption="Early exits skip search. Otherwise the loop gathers documents, database rows, mail, and inventory, then arbitration decides what enters the prompt."
              chart={turnChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {agentStages.map((stage) => (
              <li key={stage.step} className="border border-white/10 bg-void p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                  {stage.step}
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">{stage.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{stage.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 border border-white/10 p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
              Tools
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {tools.map((tool) => (
                <li
                  key={tool}
                  className="border border-white/10 px-3 py-1.5 font-mono text-[11px] text-ink/70"
                >
                  {tool}
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/60">
              Intent defaults put a dropped tool back. A file-list question
              stays on workspace inventory. A policy question still searches
              documents. A weak router result is merged with those defaults.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="retrieval-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 04 / Retrieval
          </p>
          <h2
            id="retrieval-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Scope is a filter. Hybrid rank comes after it.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            The LangGraph path is load user metadata, pin the location or the
            scope, then search. Dense search uses an OpenAI-compatible
            embedding endpoint. The configured default is
            nvidia/llama-nemotron-embed-1b-v2 at 1024 dimensions.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Hybrid retrieval"
              caption="The agent strategy rag maps to hybrid. Vector and BM25 lists are fused with reciprocal rank fusion. An empty BM25 list keeps the vector ranking."
              chart={retrievalChart}
            />
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
              <Dot /> 05 / Decisions
            </p>
            <h2
              id="decisions-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Replace the model. Keep the evidence rules.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/60 sm:text-base">
              I designed both flows. The embedding and the answer models are
              hosted. None of them was trained for this product.
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

      <Reveal
        as="section"
        ariaLabelledBy="facts-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 06 / Service
          </p>
          <h2
            id="facts-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            What the chat endpoint actually calls.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            After the answer, cited document chunks are emitted as sources.
            The turn can store a memory fact and return an updated session
            summary. A report request also emits an HTML document.
          </p>

          <dl className="mt-10 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="border-b border-white/10 p-5 sm:border-l sm:first:border-l-0 lg:[&:nth-child(3n+1)]:border-l-0"
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
              <Dot /> 07 / Limits
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
            <Dot /> 08 / References
          </p>
          <h2
            id="references-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Papers and docs behind the choices.
          </h2>
          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {references.map((item) => (
              <li key={item.href} className="grid gap-2 py-5 sm:grid-cols-[16rem_1fr] sm:gap-8">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-lime underline decoration-lime/30 underline-offset-4 hover:decoration-lime"
                >
                  {item.name}
                  <ArrowUpRight className="size-3.5" />
                </a>
                <p className="text-sm leading-6 text-ink/60">{item.note}</p>
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
              href="/work/media-records-assistant"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Previous: media records <ArrowUpRight />
            </Link>
            <Link
              href="/work/document-ingestion"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Next: document ingestion <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Workspace RAG assistant
          </p>
        </div>
      </footer>
    </main>
  );
}
