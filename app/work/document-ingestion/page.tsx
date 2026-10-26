import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Document ingestion",
  description:
    "Five file types enter one pipeline. Text PDF pages stay with Docling, scans go to a layout API, and every path becomes sections, chunks, and dense BGE-M3 vectors.",
};

const systemChart = `
flowchart TD
  job["Job source"] --> router["Extension and PDF page router"]
  router --> word["python-docx"]
  router --> tab["csv reader"]
  router --> docling["Docling 2.123<br/>in process, OCR off"]
  router --> lay["Layout HTTP API"]
  word --> tree["Elements and parent tree"]
  tab --> tree
  docling --> tree
  lay --> crops["Region crops"]
  crops --> ocr["OCR default<br/>local/glm-ocr"]
  crops --> llm["LLM default<br/>gpt-4o-mini"]
  crops --> vlm["VLM default<br/>qwen3-vl-32b-instruct"]
  ocr --> tree
  llm --> tree
  vlm --> tree
  tree --> sec["Sections and chunks<br/>400 token budget"]
  sec --> emb["Dense bge-m3"]
  emb --> out["Persisted result and callback"]
`;

const flowChart = `
flowchart LR
  file["File"] --> route{"Type"}
  route -->|Word| ooxml["OOXML walk"]
  route -->|CSV or TSV| grid["Native table"]
  route -->|PDF| pages{"Page class"}
  pages -->|text| docling["Docling"]
  pages -->|scan| layout["Layout API"]
  ooxml --> elements["Typed elements"]
  grid --> elements
  docling --> elements
  layout --> elements
  elements --> sections["One section each"]
  sections --> chunks["Section chunks"]
  chunks --> vectors["bge-m3 vectors"]
  vectors --> callback["Callback"]
`;

const routeChart = `
flowchart TD
  pdf["PDF"] --> analyze["PyMuPDF text and image areas"]
  analyze --> ok{"Analysis succeeded?"}
  ok -->|no| full["Whole file to Docling"]
  ok -->|yes| kind{"Document type"}
  kind -->|SCANNED| all["Every page to layout"]
  kind -->|other| page{"This page"}
  page -->|image area at least 80 percent| lay["Page to layout"]
  page -->|untyped picture at least 40 percent| lay
  page -->|otherwise| text["Page to Docling"]
`;

const splitChart = `
flowchart TD
  el["Element"] --> sec["Section plus breadcrumb"]
  sec --> skip{"Heading, header, or footer?"}
  skip -->|yes| none["No chunk"]
  skip -->|no| budget["Body budget after the breadcrumb"]
  budget --> kind{"Section type"}
  kind -->|table| rows["Rows, header repeated"]
  kind -->|image, list, formula, code| windows["Token windows"]
  kind -->|prose| sem["Semantic split, percentile 70"]
  sem --> over{"Still over budget?"}
  over -->|yes| windows
  over -->|no| merge["Merge neighbors that fit"]
  rows --> chunk["Chunk text is breadcrumb plus body"]
  windows --> chunk
  merge --> chunk
`;

const stages = [
  {
    step: "01",
    title: "Fetch",
    text: "The job downloads the source into a temp file. Ingestion starts from that path.",
  },
  {
    step: "02",
    title: "Route",
    text: "The suffix picks Word, CSV, or PDF. A PDF is then split page by page.",
  },
  {
    step: "03",
    title: "Read",
    text: "Each reader emits the same block types: title, heading, prose, table, image, and the rest.",
  },
  {
    step: "04",
    title: "Tree",
    text: "Parents are assigned from reading order. A missed PDF page is rendered and sent through layout.",
  },
  {
    step: "05",
    title: "Split",
    text: "One element becomes one section. Chunks are cut inside that section, under a 400-token budget.",
  },
  {
    step: "06",
    title: "Embed",
    text: "Chunk vectors are dense BGE-M3. A document summary runs after the vectors exist.",
  },
];

const readers = [
  ["PDF, text pages", "Docling, OCR off, TableFormer on, mode fast", "Blocks in reading order, with boxes"],
  [".docx", "python-docx style walk", "The same block types, from Word styles"],
  [".doc", "Docling converts to .docx through LibreOffice", "Then the same style walk. Docling’s tree is not used"],
  [".csv and .tsv", "Python csv", "One HTML table. The first row is the header"],
];

const models = [
  {
    role: "Text PDF",
    name: "Docling and TableFormer",
    detail:
      "Pinned at docling 2.123.0. Layout and table structure run in process. OCR is off. One conversion at a time, because Docling already uses the CPU.",
  },
  {
    role: "Scans and pictures",
    name: "External layout API",
    detail:
      "Returns boxes and labels such as doc_title, paragraph_title, table, chart, and seal. The checkpoint name is not in this repository.",
  },
  {
    role: "Text crops",
    name: "GLM-OCR",
    detail:
      "Default id local/glm-ocr. Used on text regions only. This service does not run the layout pipeline from the GLM-OCR model card.",
  },
  {
    role: "Tables and pictures",
    name: "gpt-4o-mini and Qwen3-VL",
    detail:
      "Defaults. Tables, algorithms, and formulas go to the LLM. Images, charts, and seals go to the VLM. Environment variables can replace both.",
  },
  {
    role: "Retrieval vectors",
    name: "BGE-M3",
    detail:
      "Dense vectors only, through an OpenAI-compatible proxy. The same tokenizer, BAAI/bge-m3, counts the chunk budget. Sparse and multi-vector heads are unused. Input is cut at 500 tokens.",
  },
];

const decisions = [
  ["Docling OCR off", "Born-digital text stays in the file. A scan must be routed, or its words are lost."],
  ["Area rules, not a trained router", "PyMuPDF measures text area, image area, and words sitting on pictures."],
  ["80 percent and 40 percent", "A full-page scan goes to layout. So does a scan pasted into a typed page."],
  ["Rule tree", "Heading levels come from a Word style, a Docling item, or a layout label. Bold text is not promoted."],
  ["400-token chunks", "The budget is a retrieval choice. BGE-M3 can take far longer inputs."],
  ["Percentile 70", "LangChain’s semantic splitter default is 95. This cut is lower, so prose breaks more often."],
];

const limits = [
  "No retrieval, OCR, or latency number is published with this pipeline.",
  "The layout detector is an HTTP dependency. This repository stores the URL, not the checkpoint.",
  "If page analysis throws, the whole PDF goes to Docling with OCR off. A scan can come back empty.",
  "CSV and TSV become one table. There is no second header row and no vision pass.",
  "A layout heading is title or heading. The outline depth is not a learned parser.",
  "Paper scores for TableFormer, DocLayNet, GLM-OCR, and BGE-M3 are theirs. They are not this deployment’s results.",
];

const facts = [
  ["File types", ".doc, .docx, .pdf, .csv, .tsv"],
  ["Docling", "2.123.0, OCR off, table mode fast"],
  ["Docling slots", "1 conversion at a time"],
  ["Scan rule", "Image area at least 80 percent"],
  ["Pasted scan", "Untyped picture at least 40 percent"],
  ["Chunk budget", "400 tokens, breadcrumb included"],
  ["Semantic cut", "Percentile 70"],
  ["Embedding cut", "500 tokens"],
  ["Vectors", "Dense bge-m3 only"],
];

const stack = [
  "Docling",
  "PyMuPDF",
  "python-docx",
  "GLM-OCR",
  "BGE-M3",
  "Layout API",
];

const references = [
  {
    name: "Docling technical report",
    href: "https://arxiv.org/abs/2408.09869",
    note: "Auer, Livathinos, et al. The converter used on text PDF pages. This pipeline disables its OCR.",
  },
  {
    name: "Docling source",
    href: "https://github.com/docling-project/docling",
    note: "The library pinned at 2.123.0. Legacy .doc uses its LibreOffice conversion, then a separate OOXML walk.",
  },
  {
    name: "DocLayNet",
    href: "https://arxiv.org/abs/2206.01062",
    note: "Pfitzmann et al., KDD 2022. The layout dataset behind Docling’s detector. Not a dataset labeled here.",
  },
  {
    name: "TableFormer",
    href: "https://arxiv.org/abs/2203.01017",
    note: "Nassar et al., CVPR 2022. Table structure inside Docling. Config selects fast or accurate. The paper’s TEDS numbers are not this service’s.",
  },
  {
    name: "BGE-M3",
    href: "https://arxiv.org/abs/2402.03216",
    note: "Chen et al. Dense, sparse, and multi-vector retrieval. This service stores the dense vector only.",
  },
  {
    name: "BGE-M3 model card",
    href: "https://huggingface.co/BAAI/bge-m3",
    note: "Tokenizer id BAAI/bge-m3. Embedding model id bge-m3. Context can reach 8,192 tokens. Chunks are still capped at 400.",
  },
  {
    name: "GLM-OCR",
    href: "https://github.com/zai-org/GLM-OCR",
    note: "Zhipu’s 0.9B OCR model. Default crop reader. Its own layout pipeline is not the one this service calls.",
  },
  {
    name: "Semantic chunker",
    href: "https://python.langchain.com/docs/how_to/semantic-chunker/",
    note: "LangChain SemanticChunker. Splits where embedding distance crosses a percentile. Configured at 70.",
  },
  {
    name: "PyMuPDF",
    href: "https://pymupdf.readthedocs.io/",
    note: "Page areas for the router, and the subset PDF sent to Docling when a file is mixed.",
  },
  {
    name: "python-docx",
    href: "https://python-docx.readthedocs.io/",
    note: "The OOXML walk for .doc and .docx. Heading level comes from the style, not from the look of the line.",
  },
];

export default function DocumentIngestionPage() {
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
            <Dot /> Case 06 / Document intelligence
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Five file types.{" "}
            <span className="text-ink/35">One retrieval schema.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            A typed PDF already has text. A scan is a picture. Word declares
            headings in styles. A CSV is already a grid. This pipeline picks
            the reader, then emits sections, chunks, and dense embeddings.
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
            ["Owned here", "File-type routing, PDF page routing, layout expansion, the section tree, and the section-wise split."],
            ["Around it", "Job leases, retries, and the callback live beside this path. They are not the ingestion design."],
            ["Output", "A document header, one section per element, and chunks whose vectors are dense BGE-M3."],
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
            Local readers. Remote crops.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Docling runs in process on CPU. Pictures and scanned pages leave
            the process: a layout call, then a crop goes to OCR, an LLM, or a
            VLM. Embeddings use the same OpenAI-compatible proxy and a
            different model name. The model ids below are code defaults.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="Service architecture"
              caption="Word, CSV, and Docling stay on the box. The layout API, crop models, and BGE-M3 are network calls. Production can override the three crop model ids."
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

      <Reveal as="section" ariaLabelledBy="flow-title" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 02 / Workflow
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <h2
              id="flow-title"
              className="text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Route first. Then one element list.
            </h2>
            <p className="text-sm leading-7 text-ink/60 sm:text-base">
              The backend flag named docling does not change the reader. The
              suffix does. A long section calls the embedding API while it is
              being split, before the embedding stage writes the stored vectors.
            </p>
          </div>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="Ingestion workflow"
              caption="CSV never sees a model. Word uses styles. Only PDF pages are classified. Every branch joins again at the typed element list."
              chart={flowChart}
            />
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        ariaLabelledBy="routing-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 03 / Readers
          </p>
          <h2
            id="routing-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            A geometry check decides the PDF reader.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            PyMuPDF measures areas. It is not a neural page classifier. A mixed
            file is cut into a subset PDF so Docling sees only the text pages,
            and those page numbers are mapped back.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <ArchitectureDiagram
              title="PDF page routing"
              caption="A failed analysis sends the whole file to Docling. Because OCR is off, a scan on that path can lose its text. That failure is logged."
              chart={routeChart}
            />
            <div className="border border-white/10">
              <div className="grid grid-cols-[0.8fr_1.1fr_0.9fr] border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40 sm:px-5">
                <span>Input</span>
                <span>Reader</span>
                <span>Emits</span>
              </div>
              {readers.map(([input, reader, emits]) => (
                <div
                  key={input}
                  className="grid gap-2 border-t border-white/10 px-4 py-4 first:border-t-0 sm:grid-cols-[0.8fr_1.1fr_0.9fr] sm:gap-4 sm:px-5"
                >
                  <p className="text-sm text-ink/80">{input}</p>
                  <p className="text-sm leading-6 text-ink/60">{reader}</p>
                  <p className="font-mono text-xs leading-5 text-lime/90">{emits}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" ariaLabelledBy="models-title" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto grid max-w-328 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 04 / Models
            </p>
            <h2
              id="models-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Two layout systems. Neither was trained here.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/60 sm:text-base">
              Docling lays out a text PDF with its own detector and TableFormer.
              The external API lays out pixels on a scan or a picture. A box
              covering about 85 percent of the parent picture is dropped, so
              Docling’s image is not stored twice.
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
        ariaLabelledBy="split-title"
        className="border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 05 / Sections
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2
              id="split-title"
              className="text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              One element, one section. Chunks stay inside it.
            </h2>
            <p className="text-sm leading-7 text-ink/60 sm:text-base">
              The section id is the element id. The breadcrumb keeps at most
              three heading ancestors, and it counts against the budget. A
              chunk points back at its section, so a hit can return the whole
              text behind it. Headings, headers, and footers produce no chunk.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <ArchitectureDiagram
              title="Section split"
              caption="Tables repeat the header row on every chunk. Prose uses embedding distance, then token windows for anything still over the budget. Neighbors merge while they fit."
              chart={splitChart}
            />
            <div className="border border-white/10">
              {[
                ["Parent", "Nearest open shallower heading. Headers and footers stay unparented."],
                ["Caption", "Attaches to the neighboring table or image, and is also chunked on its own."],
                ["List", "A nested bullet hangs off the shallower bullet. Lists use token windows, not the semantic splitter."],
                ["Table text", "HTML is kept. The section text is tab-separated rows, so column boundaries survive."],
                ["Regions", "Layout boxes use containment. A page that splits into real content is not OCR’d again as one image."],
                ["Fallback", "A PDF page with no elements is rendered and run through the same layout path."],
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

      <Reveal as="section" ariaLabelledBy="decisions-title" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 06 / Decisions
          </p>
          <h2
            id="decisions-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Each choice has a failure next to it.
          </h2>

          <dl className="mt-10 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="border-b border-white/10 p-5 sm:border-l sm:first:border-l-0 lg:[&:nth-child(3n+1)]:border-l-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">{label}</dt>
                <dd className="mt-2 text-lg font-medium tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 border border-white/10">
            <div className="grid grid-cols-[0.8fr_1.2fr] border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
              <span>Choice</span>
              <span>Why it is this way</span>
            </div>
            {decisions.map(([choice, why]) => (
              <div
                key={choice}
                className="grid gap-2 border-t border-white/10 px-5 py-4 first:border-t-0 sm:grid-cols-[0.8fr_1.2fr] sm:items-center sm:gap-8"
              >
                <p className="text-sm text-ink/80">{choice}</p>
                <p className="text-sm leading-6 text-ink/60">{why}</p>
              </div>
            ))}
          </div>
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
              href="/work/workspace-rag-assistant"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Previous: workspace RAG <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Document ingestion
          </p>
        </div>
      </footer>
    </main>
  );
}
