import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import portrait from "@/public/usama.jpg";
import AgentRoster from "@/components/AgentRoster";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowDown, ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: {
    absolute: "Usama Gillani — Agentic AI Engineer",
  },
  description:
    "Syed Muhammad Usama Altaf Gillani — AI engineering, LLM applications, intelligent systems, and backend development.",
  openGraph: {
    title: "Usama Gillani — Agentic AI Engineer",
    description: "Building intelligence, not just interfaces.",
    type: "website",
  },
};

const expertise = [
  {
    number: "01",
    title: "LLM applications",
    description:
      "Building AI-powered applications that connect language models to useful workflows, structured data, and real-world tasks.",
    tags: ["LLMs", "Prompt engineering", "RAG"],
    mark: "Aa",
    agent: "Planner",
  },
  {
    number: "02",
    title: "AI assistants",
    description:
      "Designing assistant workflows that combine retrieval, tools, APIs, and context to help people get things done.",
    tags: ["AI agents", "Tool calling", "Workflows"],
    mark: "✳",
    agent: "Critic",
  },
  {
    number: "03",
    title: "Document intelligence",
    description:
      "Exploring practical pipelines for extracting information from documents and turning unstructured content into useful answers.",
    tags: ["PDF processing", "OCR", "Information extraction"],
    mark: "▤",
    agent: "Retriever",
  },
  {
    number: "04",
    title: "Backend engineering",
    description:
      "Connecting AI capabilities to reliable application logic, APIs, data flows, and maintainable software.",
    tags: ["Python", "FastAPI", "TypeScript"],
    mark: "</>",
    agent: "Toolsmith",
  },
];

const principles = [
  {
    number: "01",
    title: "Start with the problem.",
    description:
      "Understand the user, the workflow, and the actual job to be done before reaching for a model.",
  },
  {
    number: "02",
    title: "Make intelligence useful.",
    description:
      "Connect models to the right context, tools, and data instead of treating an LLM response as the whole product.",
  },
  {
    number: "03",
    title: "Build for the real world.",
    description:
      "Care about latency, failure modes, evaluation, maintainability, and the details that make systems dependable.",
  },
];

const cases: {
  id: string;
  title: string;
  description: string;
  href?: string;
}[] = [
  {
    id: "CASE 01",
    title: "Urdu ticker and flasher OCR",
    description:
      "Two FastAPI services detect Urdu broadcast lines, read them with UTRNet, and optionally correct numerals. All three models run on Triton.",
    href: "/work/urdu-ticker-ocr",
  },
  {
    id: "CASE 02",
    title: "Grounded news assistant",
    description:
      "A FastAPI service turns a natural-language question into SQL over stored OCR tickers, drops near-duplicate lines, and asks gpt-oss-120b to answer only from those lines.",
    href: "/work/grounded-news-assistant",
  },
  {
    id: "CASE 03",
    title: "Social and web content assistant",
    description:
      "A FastAPI service searches six crawled platform tables with parser filters, drops near-duplicate text, and asks gpt-oss-120b to answer only from those rows.",
    href: "/work/social-web-assistant",
  },
  {
    id: "CASE 04",
    title: "Media records assistant",
    description:
      "A FastAPI service copies media records into Qdrant, answers scoped questions with tool calling, and renders HTML reports from the records a user selected.",
    href: "/work/media-records-assistant",
  },
  {
    id: "CASE 05",
    title: "Workspace RAG assistant",
    description:
      "POST /v1/user/chat answers inside a workspace scope. The user picks the answer model. A bounded tool loop retrieves files, SQL, and mail before that model speaks.",
    href: "/work/workspace-rag-assistant",
  },
  {
    id: "CASE 06",
    title: "Document ingestion",
    description:
      "Five file types enter one pipeline. Text PDF pages stay with Docling, scans go to a layout API, and every path becomes sections, chunks, and dense BGE-M3 vectors.",
    href: "/work/document-ingestion",
  },
];

const loop = ["Context", "Plan", "Tool", "Observe", "Answer"];

const mailCompose =
  "https://mail.google.com/mail/?view=cm&fs=1&to=usamagillani91@gmail.com";
const whatsappChat = "https://wa.me/923459042425";

const floats = [
  ["agent-float-planner", "Planner"],
  ["agent-float-retriever", "Retriever"],
  ["agent-float-toolsmith", "Toolsmith"],
  ["agent-float-critic", "Critic"],
];

export default function Home() {
  return (
    <main id="top" className="relative z-10 min-h-screen">
      <SiteHeader />

      <section
        aria-labelledby="hero-title"
        className="relative mx-auto max-w-360 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:px-14 lg:pb-28 lg:pt-24"
      >
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
          {floats.map(([position, name]) => (
            <span key={name} className={`agent-float ${position}`}>
              <span className="agent-live" />
              {name}
            </span>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-ink/55">
          <Dot />
          Agentic AI engineer · Thoughtful by design
        </div>

        <div className="relative z-10 mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[1fr_320px] lg:items-end lg:gap-16">
          <div>
            <p className="mb-5 font-mono text-sm text-ink/45">
              Independent thinking. Intelligent systems.
            </p>

            <h1
              id="hero-title"
              className="hero-title max-w-5xl text-[clamp(3.4rem,8.6vw,8.4rem)] font-medium leading-[0.91] tracking-[-0.085em]"
            >
              <span className="hero-line" style={{ animationDelay: "40ms" }}>
                Building
              </span>
              <span className="hero-line" style={{ animationDelay: "140ms" }}>
                <span className="relative inline-block">
                  intelligence
                  <span aria-hidden="true" className="hero-underline" />
                </span>
              </span>
              <span className="hero-line" style={{ animationDelay: "240ms" }}>
                not just
              </span>
              <span className="hero-line" style={{ animationDelay: "340ms" }}>
                interfaces<span className="text-lime">.</span>
              </span>
            </h1>

            <div className="mt-9 flex max-w-xl flex-col gap-6 sm:mt-12 sm:flex-row sm:items-start">
              <p className="max-w-md text-base leading-7 text-ink/65 sm:text-lg sm:leading-8">
                I&apos;m Syed Muhammad Usama Altaf Gillani. I work at the
                intersection of AI, software engineering, and ideas that make
                technology genuinely useful.
              </p>

              <a
                href="#work"
                className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full border border-white/20 px-5 py-3 text-sm font-medium transition-colors hover:border-lime hover:bg-lime hover:text-void focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
              >
                Explore my work
                <ArrowDown className="transition-transform group-hover:translate-y-1" />
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["AI systems", "LLMs", "Python", "APIs"].map((item) => (
                <span key={item} className="tag">
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-6 font-mono text-xs leading-6 text-ink/45">
              GOOD SOFTWARE SHOULD
              <br />
              MAKE COMPLEXITY FEEL SIMPLE.
            </p>
          </div>

          <AgentRoster />
        </div>

        <div className="relative z-10 mt-14 sm:mt-16">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/55 sm:text-xs" aria-label="Agent loop">
            {loop.map((step, index) => (
              <li key={step} className="inline-flex items-center gap-3">
                {index > 0 ? <span aria-hidden="true">→</span> : null}
                {step}
              </li>
            ))}
          </ol>
          <div className="pipeline-track mt-4" aria-hidden="true">
            <span className="pipeline-packet" />
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45 sm:text-xs">
            Curious by default. Practical by design.
          </span>
          <a
            href="#about"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
          >
            Scroll to explore <ArrowDown />
          </a>
        </div>
      </section>

      <Reveal
        as="section"
        id="about"
        ariaLabelledBy="about-title"
        className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-28"
      >
        <div className="operator-frame mx-auto max-w-328">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-24">
            <div>
              <p className="section-kicker text-lime">
                <Dot /> 01 / A little about me
              </p>
              <h2
                id="about-title"
                className="mt-7 max-w-md text-4xl font-medium leading-[1.05] tracking-[-0.065em] sm:text-5xl lg:text-6xl"
              >
                I care about what happens{" "}
                <span className="text-lime">after the demo.</span>
              </h2>
              <figure className="portrait">
                <div
                  className="portrait-crop"
                  style={{
                    position: "relative",
                    aspectRatio: "4 / 5",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={portrait}
                    alt="Portrait of Usama Gillani"
                    fill
                    sizes="(min-width: 1024px) 280px, 80vw"
                    className="object-cover object-[center_40%]"
                  />
                </div>
                <figcaption>Usama Gillani</figcaption>
              </figure>
            </div>

            <div className="max-w-2xl lg:pt-10">
              <p className="text-xl leading-9 text-ink/85 sm:text-2xl sm:leading-10">
                AI is exciting. Making it work reliably inside an actual product
                is the interesting part.
              </p>

              <p className="mt-6 text-base leading-8 text-ink/60">
                My interests sit around language models, AI assistants,
                document-processing pipelines, and the backend systems that bring
                these pieces together. I enjoy breaking down complex problems,
                experimenting with possible solutions, and thinking through how
                an idea becomes a useful engineering system.
              </p>

              <p className="mt-5 text-base leading-8 text-ink/60">
                I value clear thinking, maintainable code, and honest engineering:
                understanding what a system can do, where it can fail, and how to
                make it better.
                <span className="caret" aria-hidden="true" />
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {[
                  "Problem solving",
                  "Systems thinking",
                  "Continuous learning",
                ].map((item) => (
                  <span
                    key={item}
                    className="border border-white/15 px-4 py-2 text-xs text-ink/75"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        id="expertise"
        ariaLabelledBy="expertise-title"
        className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-28"
      >
        <div className="mx-auto max-w-328">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="section-kicker">
                <Dot /> 02 / What I work on
              </p>
              <h2
                id="expertise-title"
                className="mt-6 text-4xl font-medium tracking-[-0.07em] sm:text-6xl"
              >
                Areas of <span className="text-ink/35">focus.</span>
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-7 text-ink/55 sm:text-base">
              The tools and problem spaces I&apos;m interested in bringing
              together to build useful, intelligent software.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-2">
            {expertise.map((item) => (
              <article
                key={item.number}
                className="glass-card group flex min-h-75 flex-col p-6 sm:min-h-85 sm:p-8 lg:p-10"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs text-ink/40">
                    / {item.number}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                    {item.agent}
                  </span>
                </div>

                <span
                  aria-hidden="true"
                  className="glass-mark mt-8 grid size-12 place-items-center border border-white/10 text-xl"
                >
                  {item.mark}
                </span>

                <h3 className="mt-6 text-2xl font-medium tracking-[-0.045em] sm:text-3xl">
                  {item.title}
                </h3>

                <p className="mt-4 max-w-lg text-sm leading-7 text-ink/60 sm:text-base">
                  {item.description}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-7">
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        id="work"
        ariaLabelledBy="work-title"
        className="scroll-mt-24 border-y border-white/10 bg-surface/40 px-5 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-28"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 03 / Selected work
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <h2
              id="work-title"
              className="max-w-3xl text-4xl font-medium leading-[1.03] tracking-[-0.07em] sm:text-6xl lg:text-7xl"
            >
              Good ideas deserve{" "}
              <span className="text-ink/35">good execution.</span>
            </h2>

            <p className="max-w-lg text-sm leading-7 text-ink/60 sm:text-base">
              A space for the projects, experiments, and engineering decisions
              that show how I think and build. Each case study should earn its
              place here.
            </p>
          </div>

          <div className="mt-12 border-y border-white/10 sm:mt-16">
            {cases.map((item) => {
              const row = (
                <>
                  <span className="font-mono text-xs text-ink/40">{item.id}</span>
                  <div>
                    <p className="text-xl font-medium tracking-tight transition-colors group-hover:text-lime sm:text-2xl">
                      {item.title}
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">
                      {item.description}
                    </p>
                  </div>
                  {item.href ? (
                    <span className="inline-flex w-fit items-center gap-2 bg-lime px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-void">
                      Read <ArrowUpRight className="size-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-2 border border-lime/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-lime">
                      <Dot className="size-1.5" /> queued
                    </span>
                  )}
                </>
              );
              const className = `queue-row${item.href ? " group" : ""} grid gap-6 border-t border-white/10 py-8 first:border-t-0 sm:grid-cols-[90px_1fr_auto] sm:items-center sm:gap-8 sm:py-10`;

              return item.href ? (
                <Link key={item.id} href={item.href} className={className}>
                  {row}
                </Link>
              ) : (
                <article key={item.id} className={className}>
                  {row}
                </article>
              );
            })}
          </div>

        </div>
      </Reveal>

      <Reveal
        as="section"
        id="approach"
        ariaLabelledBy="approach-title"
        className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-28"
      >
        <div className="mx-auto grid max-w-328 gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="section-kicker">
              <Dot /> 04 / The philosophy
            </p>
            <h2
              id="approach-title"
              className="mt-6 text-4xl font-medium leading-[1.05] tracking-[-0.07em] sm:text-6xl"
            >
              Think clearly.
              <br />
              <span className="text-ink/35">Build intentionally.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-ink/60">
              The model matters. The system around it matters just as much.
              Here&apos;s the mindset I bring to engineering problems.
            </p>
          </div>

          <div className="relative pl-5">
            <div className="approach-rail" aria-hidden="true">
              <span />
            </div>
            {principles.map((item) => (
              <article
                key={item.number}
                className="grid gap-4 border-t border-white/10 py-7 sm:grid-cols-[60px_1fr] sm:gap-7 sm:py-9"
              >
                <span className="font-mono text-xs text-lime/80">
                  {item.number}
                </span>
                <div>
                  <h3 className="text-xl font-medium tracking-tight sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-ink/60 sm:text-base">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
            <div className="border-t border-white/10" />
          </div>
        </div>
      </Reveal>

      <section
        id="contact"
        aria-labelledby="contact-title"
        className="contact-panel scroll-mt-24 bg-lime px-5 py-16 text-void sm:px-8 sm:py-24 lg:px-14 lg:py-28"
      >
        <div className="mx-auto max-w-328">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-void/60">
            05 / Your move
          </p>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2
                id="contact-title"
                className="max-w-4xl text-5xl font-medium leading-[0.95] tracking-[-0.08em] sm:text-7xl lg:text-[100px]"
              >
                Have a good
                <br />
                problem to solve?
              </h2>
              <p className="mt-7 max-w-lg text-base leading-7 text-void/70 sm:text-lg sm:leading-8">
                I&apos;m interested in thoughtful ideas, challenging engineering
                problems, and conversations about building useful AI.
              </p>

              <dl className="mt-8 grid max-w-xl gap-3 text-sm sm:text-base">
                <div className="grid gap-1 sm:grid-cols-[7.5rem_1fr] sm:items-baseline">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-void/55">
                    Personal
                  </dt>
                  <dd>
                    <a
                      href={mailCompose}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-void/25 underline-offset-4 transition-colors hover:decoration-void"
                    >
                      usamagillani91@gmail.com
                    </a>
                  </dd>
                </div>
                <div className="grid gap-1 sm:grid-cols-[7.5rem_1fr] sm:items-baseline">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-void/55">
                    University
                  </dt>
                  <dd>
                    <a
                      href="mailto:sgillani.msai24seecs@seecs.edu.pk"
                      className="underline decoration-void/25 underline-offset-4 transition-colors hover:decoration-void"
                    >
                      sgillani.msai24seecs@seecs.edu.pk
                    </a>
                  </dd>
                </div>
                <div className="grid gap-1 sm:grid-cols-[7.5rem_1fr] sm:items-baseline">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-void/55">
                    Phone
                  </dt>
                  <dd>
                    <a
                      href="tel:+923459042425"
                      className="underline decoration-void/25 underline-offset-4 transition-colors hover:decoration-void"
                    >
                      +92 345 9042425
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex w-fit flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-void/55">
                Start a conversation
              </p>
              <a
                href={whatsappChat}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-between gap-5 border border-void bg-void px-6 py-5 text-sm font-medium text-ink transition-colors hover:bg-transparent hover:text-void focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-void sm:px-8"
              >
                WhatsApp
                <ArrowUpRight className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </a>
              <a
                href={mailCompose}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-between gap-5 border border-void px-6 py-5 text-sm font-medium text-void transition-colors hover:bg-void hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-void sm:px-8"
              >
                Write an email
                <ArrowUpRight className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <div className="mt-16 border-t border-void/20 pt-5 sm:mt-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-void/55 sm:text-xs">
              Good technology. Clear thinking. Better questions.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-void px-5 py-8 text-ink sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-328 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="#top"
            className="inline-flex w-fit items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
          >
            <span className="grid size-9 place-items-center bg-lime font-mono text-xs font-bold text-void">
              UG.
            </span>
            <span className="text-sm text-ink/80">
              Syed Muhammad Usama Altaf Gillani
            </span>
          </a>

          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
            <Dot className="size-1.5" />
            system idle · ready
          </p>

          <p className="text-xs text-ink/45">
            Designed with intention. Built with curiosity.
          </p>

          <a
            href="#top"
            className="inline-flex w-fit items-center gap-2 text-xs text-ink/65 transition-colors hover:text-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
          >
            Back to top <ArrowUpRight />
          </a>
        </div>
      </footer>
    </main>
  );
}
