import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Media records assistant",
  description:
    "A FastAPI service copies media records from the product backend into Qdrant, answers scoped questions with tool calling, and renders HTML reports from selected records.",
};

const systemChart = `
flowchart TD
  BE["Product backend<br/>PostgreSQL"] --> API[FastAPI]
  API --> ING["Async ingest"]
  API --> CHAT["POST /api/v1/chat"]
  API --> REP["POST /api/v1/ai-reporting/generate"]
  ING --> EMB["BGE-M3 and SPLADE"]
  EMB --> QD[("Qdrant<br/>one collection per environment")]
  CHAT --> QD
  CHAT --> LLM["Gemma 4<br/>tools and answers"]
  REP --> QD
  REP --> HTML["HTML report<br/>Chart.js"]
`;

const ingestChart = `
flowchart TD
  A["POST /api/v1/unified/ingest/async"] --> B["Return pending and job id"]
  B --> C["Background task"]
  C --> D["Build searchable text"]
  D --> E{"Under 2000 characters?"}
  E -->|yes| F[One chunk]
  E -->|no| G["Split at 3000<br/>overlap 400"]
  G --> H["Gemma 4 context prefix"]
  F --> I["BGE-M3 and SPLADE in parallel"]
  H --> I
  I --> J["Upsert UUID5<br/>record id plus chunk index"]
  J --> K["Callback if configured"]
`;

const searchChart = `
flowchart TD
  Q[Query] --> D[BGE-M3]
  Q --> S[SPLADE]
  D --> QD[Dense search]
  S --> QS["Sparse search<br/>text_sparse"]
  QD --> RRF["Reciprocal rank fusion<br/>k = 60"]
  QS --> RRF
  RRF --> NR["Nemotron reranker<br/>top 50"]
  NR --> OUT["POST /api/v1/search"]
`;

const chatChart = `
flowchart TD
  A["POST /api/v1/chat"] --> B{Guardrail}
  B -->|block| X[Refusal]
  B -->|pass| C{Audio only?}
  C -->|yes| STT["Speech-to-text<br/>becomes the prompt"]
  C -->|no| D{Document uploaded?}
  STT --> D
  D -->|yes| OCR["Document OCR<br/>then Gemma answers the file"]
  D -->|no| E{Explicit scope?}
  E -->|yes| SC["Dense search inside scope"]
  E -->|no| T["Gemma tool loop<br/>up to 5 iterations"]
  SC --> ANS["Answer, sources, chat summary"]
  T --> ANS
  OCR --> ANS
`;

const reportChart = `
flowchart TD
  A["Selected record ids<br/>and permissions"] --> B[Validate the prompt]
  B --> C["Fetch those ids from Qdrant"]
  C --> D[Merge chunks per record]
  D --> E[Keep the requested source subtype]
  E --> F["Gemma 4 record summaries"]
  F --> G["Sentiment, volume, entities"]
  G --> H["HTML report and Chart.js"]
`;

const ingestStages = [
  {
    step: "01",
    title: "Accept",
    text: "The backend posts unified JSON. The route is API-key protected and returns immediately with status pending, a job id, and the predicted id of chunk 0.",
  },
  {
    step: "02",
    title: "Chunk",
    text: "Text under 2,000 characters stays one chunk. Longer text is split at 3,000 characters with 400 overlap. Limits are characters, using Python len.",
  },
  {
    step: "03",
    title: "Situate",
    text: "For a long record, Gemma 4 writes a one-to-two-sentence context from the start of the document. That context is prepended before embedding.",
  },
  {
    step: "04",
    title: "Embed",
    text: "BGE-M3 writes a 1,024-dimensional cosine vector. A separate SPLADE service writes the sparse vector text_sparse. The two calls run together.",
  },
  {
    step: "05",
    title: "Store",
    text: "Each chunk is a Qdrant point. The id is a UUID5 of record id and chunk index, so sending the same record again upserts those points.",
  },
];

const chatStages = [
  {
    step: "01",
    title: "Guard",
    text: "Regex guardrails block out-of-scope topics, utility tasks, and questions about another user’s records. A named circle the caller does not belong to is refused before search.",
  },
  {
    step: "02",
    title: "Attach",
    text: "Audio with an empty prompt is transcribed and becomes the prompt. An uploaded document is OCR’d and answered from that text, without searching the media index.",
  },
  {
    step: "03",
    title: "Retrieve",
    text: "Department, circle, and channel permissions become Qdrant filters. An explicit scope is prefetched and answered directly. Otherwise Gemma 4 calls tools.",
  },
  {
    step: "04",
    title: "Cite",
    text: "The model marks the records it used. That tag is stripped from the answer. Source ids are grouped into upload, live, and web content.",
  },
];

const reportStages = [
  {
    step: "01",
    title: "Select",
    text: "The request names a prompt, a date range, and record ids by source. Missing web, TV, or radio permission removes that source before retrieval.",
  },
  {
    step: "02",
    title: "Fetch",
    text: "The date range checks the prompt and is printed on the report. Retrieval loads the selected ids. It does not scan the whole date range.",
  },
  {
    step: "03",
    title: "Summarize",
    text: "Chunks are merged back to one row per record. Gemma 4 writes a short summary when the source text is long. Short text keeps a local fallback.",
  },
  {
    step: "04",
    title: "Render",
    text: "Counts, sentiment, volume, and entities become HTML. Chart.js 4.4.0 draws the charts in the browser. The executive paragraph is assembled from those counts.",
  },
];

const decisions = [
  {
    role: "Storage",
    name: "PostgreSQL stays the system of record",
    detail:
      "This service has no database client for PostgreSQL. The backend owns the records and pushes a copy into Qdrant so semantic search can run.",
  },
  {
    role: "Ingest",
    name: "Return before the GPU work finishes",
    detail:
      "Async ingest uses a FastAPI background task. The environment variable selects dev, staging, or production. The URL does not.",
  },
  {
    role: "Index",
    name: "Dense and sparse vectors on one point",
    detail:
      "BGE-M3 covers topic match. SPLADE covers names, tags, and exact wording. POST /api/v1/search fuses both with reciprocal rank fusion, k = 60, then reranks.",
  },
  {
    role: "Access",
    name: "Filters live on the server",
    detail:
      "Chat tools do not trust the model to stay inside the caller’s departments, circles, or channel permissions. Those constraints are Qdrant filters.",
  },
  {
    role: "Reports",
    name: "Aggregate selected records",
    detail:
      "A report row is a record, not a chunk. Sentiment labels already stored on the payload are mapped by meaning. Product detections are listed without a sentiment column.",
  },
];

const facts = [
  ["Service", "One FastAPI app"],
  ["Ingest", "POST /api/v1/unified/ingest/async"],
  ["Chat", "POST /api/v1/chat"],
  ["Report", "POST /api/v1/ai-reporting/generate"],
  ["Dense model", "BGE-M3, 1024-d, cosine"],
  ["Sparse model", "SPLADE, vector text_sparse"],
  ["Generator", "Gemma 4 31B Instruct, NVFP4"],
  ["Reranker", "Llama Nemotron Rerank 1B v2"],
  ["HNSW", "m = 16, ef_construct = 100"],
  ["Sources", "upload, live, webcontent"],
];

const tools = [
  "search_vector_db",
  "search_by_time_range",
  "get_latest_updates",
  "get_record_details",
  "get_similar_records",
  "search_by_metadata",
  "get_statistics",
  "summarize_records",
  "list_departments",
  "list_circles",
];

const limits = [
  "No recall, latency, cost, or collection-size number is published with this service.",
  "The backend trigger that calls async ingest, and whether each call is one record or a batch, lives outside this repository.",
  "Chat retrieval embeds the query with BGE-M3 only. The tool passes rerank=True, and the department-or-circle search does not forward that flag, so the live chat path is dense retrieval plus permission filters.",
  "Sparse search and the Nemotron reranker run on POST /api/v1/search.",
  "Delete computes a different UUID5 from the chunk ids written by ingest, and it targets one production point. It does not remove every chunk of a record.",
  "department_ids and circle_ids are filtered. The collection-creation code indexes record_id, organization_id, user_id, and the time fields.",
  "The chunk-context comment says sliding window. The call uses the first 100,000 characters of the document plus the current chunk.",
  "EMBEDDING_MAX_LENGTH is 512 and is not passed into the embedding request. Chunks are 3,000 characters.",
  "Guardrails are lexical rules. They are not a separate safety model.",
  "Speech-to-text and document OCR run on chat uploads. Ingest stores transcript and OCR text that already arrived on the record.",
];

const references = [
  {
    name: "BGE-M3 model card",
    href: "https://huggingface.co/BAAI/bge-m3",
    note: "Dense encoder used for chunks and queries.",
  },
  {
    name: "BGE M3-Embedding paper",
    href: "https://arxiv.org/abs/2402.03216",
    note: "The model family. This service requests the dense vector.",
  },
  {
    name: "SPLADE paper",
    href: "https://arxiv.org/abs/2107.05720",
    note: "Sparse lexical vectors stored as text_sparse.",
  },
  {
    name: "Reciprocal rank fusion",
    href: "https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf",
    note: "Cormack, Clarke, and Buettcher, SIGIR 2009. k = 60.",
  },
  {
    name: "Gemma 4 31B Instruct",
    href: "https://huggingface.co/google/gemma-4-31B-it",
    note: "Instruction model. The deployed checkpoint is the NVFP4 quantization.",
  },
  {
    name: "Gemma 4 31B NVFP4",
    href: "https://huggingface.co/nvidia/Gemma-4-31B-IT-NVFP4",
    note: "The checkpoint named in service configuration.",
  },
  {
    name: "Llama Nemotron Rerank 1B v2",
    href: "https://huggingface.co/nvidia/llama-nemotron-rerank-1b-v2",
    note: "Cross-encoder used after fusion on the search endpoint.",
  },
  {
    name: "Qdrant hybrid queries",
    href: "https://qdrant.tech/documentation/search/hybrid-queries/",
    note: "How a dense vector and a named sparse vector share a collection.",
  },
  {
    name: "Contextual retrieval",
    href: "https://www.anthropic.com/engineering/contextual-retrieval",
    note: "The idea of prefixing a chunk with its place in the document. The prefix here is written by Gemma 4.",
  },
  {
    name: "Chart.js",
    href: "https://www.chartjs.org/docs/latest/",
    note: "Version 4.4.0 is loaded by the generated HTML report.",
  },
];

const stack = [
  "FastAPI",
  "Qdrant",
  "BGE-M3",
  "SPLADE",
  "Gemma 4",
  "Nemotron rerank",
  "Chart.js",
];

export default function MediaRecordsAssistantPage() {
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
            <Dot /> Case 04 / Retrieval systems
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            One index for search,{" "}
            <span className="text-ink/35">chat, and reports.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            Media records stay in the product database. This service copies
            them into Qdrant, answers questions inside the caller’s
            permissions, and turns a selected set of records into an HTML
            report.
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
              "The full AI service: async ingest, hybrid search, the chat endpoint, and HTML report generation.",
            ],
            [
              "Upstream",
              "The product backend stores the records in PostgreSQL and pushes the unified JSON into this API.",
            ],
            [
              "External",
              "BGE-M3, SPLADE, Gemma 4, the reranker, speech-to-text, and document OCR are hosted services.",
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
            Three endpoints, one vector collection.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Ingest writes. Chat and reporting read. Dev, staging, and
            production each have their own collection, chosen by the
            ENVIRONMENT setting.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Service architecture"
              caption="The product backend keeps PostgreSQL. This API embeds records into Qdrant, then uses that index for chat and for report generation."
              chart={systemChart}
            />
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="ingest-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 02 / Ingest
          </p>
          <h2
            id="ingest-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Copy the record, then embed it in the background.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Searchable text is built from the title, description, body, tags,
            departments, circles, transcript, OCR, summary, translation,
            emotion, detections, and speakers. Source types are upload, live,
            and web content.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Async ingest"
              caption="POST /api/v1/unified/ingest/async returns pending, then chunks, embeds, and upserts. A callback URL receives the job result when one is set."
              chart={ingestChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ingestStages.map((stage) => (
              <li key={stage.step} className="border border-white/10 bg-void p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                  {stage.step}
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">{stage.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{stage.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <ArchitectureDiagram
              title="Hybrid search"
              caption="POST /api/v1/search runs dense and sparse retrieval, fuses them with reciprocal rank fusion, and reranks with Llama Nemotron Rerank 1B v2. Chat uses a separate dense path, described below."
              chart={searchChart}
            />
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="chat-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 03 / Assistant
          </p>
          <h2
            id="chat-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            The model retrieves. The server decides what it can see.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            POST /api/v1/chat accepts JSON or multipart. The caller sends the
            user, department, circles, and TV, radio, and web permissions.
            Gemma 4 is the instruction model, through an OpenAI-compatible API.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Chat control flow"
              caption="Guardrails, greeting, speech-to-text, and document OCR run before the tool loop. An explicit scope is answered from a prefetch and skips the tools."
              chart={chatChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {chatStages.map((stage) => (
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
              The default semantic threshold in the search tool is 0.12. If
              that returns nothing, the search retries at 0.05. Relative dates
              such as yesterday are resolved from the current Pakistan time
              placed in the tool context. Date-specific questions skip the
              undated prefetch.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="report-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 04 / Reporting
          </p>
          <h2
            id="report-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            A report is a scoped read, then a computed page.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            POST /api/v1/ai-reporting/generate returns html_file or, when
            generation is skipped, prompt_response. The preview route only
            echoes the parsed scope. Empty selection, a date outside the
            configured range, or a source with no rows returns an explanation
            and no HTML.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Report generation"
              caption="Selected record ids are fetched under the same permission filters as chat. Sentiment and entity counts are computed in the service. Gemma 4 writes the longer record summaries."
              chart={reportChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {reportStages.map((stage) => (
              <li key={stage.step} className="border border-white/10 bg-void p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                  {stage.step}
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">{stage.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">{stage.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="border border-white/10 p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                On the page
              </p>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                Uploaded video, audio, documents, and images. Web articles, X,
                and YouTube. Live TV and radio. Sentiment doughnuts, volume
                bars and lines, and tables for persons, organizations,
                locations, and events. The user’s prompt is printed as the
                report objective, with a watermark.
              </p>
            </article>
            <article className="border border-white/10 p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                Entities
              </p>
              <p className="mt-3 text-sm leading-6 text-ink/65">
                Events come from explicit NER already stored on the record, and
                they must pass a confidence check. Scenes stay separate from
                events. Logos and channel names feed organizations. Detected
                objects are listed as products, without a sentiment column.
              </p>
            </article>
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
              Store once. Read under permission.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/60 sm:text-base">
              I designed this flow. The models are used as hosted checkpoints.
              None of them was trained for this product.
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
            What the running service actually calls.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            HNSW is configured with m = 16 and ef_construct = 100. Payload
            indexes created in code cover record id, organization id, user id,
            and the time fields.
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
            Papers and model cards behind the choices.
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
              href="/work/workspace-rag-assistant"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Next: workspace RAG <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Media records assistant
          </p>
        </div>
      </footer>
    </main>
  );
}
