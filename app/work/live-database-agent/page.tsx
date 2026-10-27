import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Live database agent",
  description:
    "A connector inspects a live database and saves the selected tables. The assistant loads that catalog, then runs a read-only SELECT inside it.",
};

const systemChart = `
flowchart TD
  user[Database screen] --> analyze["Connector POST /v1/analyze"]
  analyze --> catalog[Schemas and tables]
  catalog --> pick[User selects tables]
  pick --> notes{Foreign-key notes?}
  notes -->|yes| pick
  notes -->|no| semantics[Definitions, relationships, metrics]
  semantics --> save[Save for AI on this folder]
  save --> session[Live session until disconnect]
  session --> chat[Question in the assistant]
  chat --> context[get_live_db_context]
  context --> query[query_live_database]
  query --> run["Connector POST /v1/query"]
  run --> rows[Columns and capped rows]
`;

const guardChart = `
flowchart TD
  sql[SELECT or a known question shape] --> scan[Drop comments and quoted text]
  scan --> write{Write or a second statement?}
  write -->|yes| note[Return ok false]
  write -->|no| allow[Keep only selected tables]
  allow --> outside{A table is outside the selection?}
  outside -->|yes| note
  outside -->|no| cap[Cap rows and set a timeout]
  cap --> engine[Run on the live engine]
`;

const stages = [
  {
    step: "01",
    title: "Catalog",
    text: "A connection with no selection returns schemas and tables. The connector does not store that call.",
  },
  {
    step: "02",
    title: "Relations",
    text: "Selected tables are checked against foreign keys. Orphan, incoming, and broken links come back as notes. The user adds the missing tables and asks again.",
  },
  {
    step: "03",
    title: "Semantics",
    text: "An empty note list becomes definitions, relationships, join paths, and metrics. A model may rewrite the wording. If that call fails, the structural catalog stays.",
  },
  {
    step: "04",
    title: "Session",
    text: "Save for AI stores the selection on a folder. The chat names that session. The password is not returned to the model.",
  },
  {
    step: "05",
    title: "Answer",
    text: "get_live_db_context loads the catalog. query_live_database sends one read-only SELECT to the connector. A failed query is a note, not an invented number.",
  },
];

const decisions = [
  {
    role: "Connector",
    name: "A separate query service",
    detail:
      "Analyze and query are their own process. PostgreSQL, CockroachDB, MySQL, MariaDB, SQL Server, Oracle, and SQLite each have a driver. The assistant posts the connection. The connector does not keep a session.",
  },
  {
    role: "Agent",
    name: "Two tools, in that order",
    detail:
      "The assistant uses TanStack AI tools. The context tool returns tables, meanings, relationships, and a SELECT for each metric. The query tool runs that statement, or one SELECT the model wrote against the same allowlist.",
  },
  {
    role: "Playbook",
    name: "One ticker table is narrower",
    detail:
      "When the saved selection matches the ticker table, only that table stays in scope. Eight question shapes are built on the server, and Urdu spellings are added to the English word. Every other database uses the selected tables and the metric SQL.",
  },
];

const facts = [
  ["Analyze", "POST /v1/analyze"],
  ["Query", "POST /v1/query"],
  ["Engines", "Seven families"],
  ["Tools", "Context, then query"],
  ["Rows", "Capped"],
  ["Session", "Saved until disconnect"],
];

const limits = [
  "The connector does not remember a connection. The assistant sends it again on each query.",
  "Sample values used to write column meanings are not stored in the semantic catalog.",
  "A query outside the selected tables is rejected. The model is told not to invent a number when ok is false.",
  "The ticker playbook is one table. It is not the general connector.",
  "No accuracy or latency number is published for answers over a live database.",
];

const stack = [
  "TypeScript",
  "Express",
  "TanStack AI",
  "PostgreSQL",
  "MySQL",
  "SQL Server",
  "Oracle",
  "SQLite",
];

export default function LiveDatabaseAgentPage() {
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
            <Dot /> Case 08 / Live databases
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Save the tables.{" "}
            <span className="text-ink/35">Then let the agent query them.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            A connector inspects a live database, and the user saves the
            selected tables on a folder. The assistant loads that catalog and
            runs a read-only query inside it.
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
              "Connector",
              "Catalog, foreign-key notes, a semantic catalog, and one read-only query endpoint.",
            ],
            [
              "Session",
              "Save for AI keeps the selection on a folder until disconnect. The model never receives the password.",
            ],
            [
              "Agent",
              "get_live_db_context, then query_live_database. A failed query returns a note.",
            ],
          ].map(([label, text]) => (
            <div
              key={label}
              className="border-t border-white/10 p-5 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0 sm:p-6"
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
            <Dot /> 01 / Path
          </p>
          <h2
            id="architecture-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            The connector inspects. The agent reads.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Relation notes have to be cleared before the semantic catalog is
            built. The assistant does not connect until that session exists.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="Live database path"
              caption="POST /v1/analyze is stateless. Save for AI stores the selection. The two assistant tools run only against that session."
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

      <Reveal
        as="section"
        ariaLabelledBy="guard-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 02 / Query guard
          </p>
          <h2
            id="guard-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            One statement. Selected tables only.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            Comments and quoted text are removed before write keywords are
            scanned, so a searched word is not treated as SQL. SQL Server uses
            TOP. Oracle uses FETCH FIRST. The other engines use LIMIT.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Read-only query"
              caption="A second statement, a write, or a table outside the selection returns ok false. The row cap and statement timeout are applied before the engine runs."
              chart={guardChart}
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
              <Dot /> 03 / Decisions
            </p>
            <h2
              id="decisions-title"
              className="mt-6 text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
            >
              Scope is saved before the model speaks.
            </h2>
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
            <Dot /> 04 / Service
          </p>
          <h2
            id="facts-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            Two endpoints. Two tools.
          </h2>

          <dl className="mt-10 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="border-b border-white/10 p-5 sm:border-l sm:first:border-l-0 lg:nth-[3n+1]:border-l-0"
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
        className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
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
              href="/work/database-onboarding"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Earlier Postgres check <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Live database agent
          </p>
        </div>
      </footer>
    </main>
  );
}
