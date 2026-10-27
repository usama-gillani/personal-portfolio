import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import { ArrowUpRight, Dot } from "@/components/icons";

export const metadata: Metadata = {
  title: "Database onboarding",
  description:
    "POST /connection checks a Postgres database, then walks selected tables, metric definitions, and guarded SELECT queries. The finished connector and agent are a separate case.",
};

const phaseChart = `
flowchart TD
  body["POST /connection"] --> parse["Validate the URL and the body"]
  parse --> connect["Connect and confirm the database name"]
  connect --> tables{"Selected tables sent?"}
  tables -->|no| connection["Phase: connection"]
  connection --> schemas["List schemas and tables"]
  tables -->|yes| relations["Read relations"]
  relations --> missing{"A selected table is missing?"}
  missing -->|yes| fail["422 table not found"]
  missing -->|no| catalog["Read columns and constraints"]
  catalog --> definitions{"Definitions sent?"}
  definitions -->|no| selection["Phase: selection"]
  definitions -->|yes| check["Check metric definitions"]
  check --> queries{"Metrics or questions sent?"}
  queries -->|no| defined["Phase: definitions"]
  queries -->|yes| run["Phase: queries"]
`;

const queryChart = `
flowchart TD
  sql["Metric or question SQL"] --> qualify["Qualify a unique table name"]
  qualify --> select{"One SELECT, no write?"}
  select -->|no| note["Record a query note"]
  select -->|yes| tx["Read-only transaction, 8 second timeout"]
  tx --> explain["EXPLAIN the plan"]
  explain --> scope{"Every table was selected?"}
  scope -->|no| reject["Roll back and record the outside tables"]
  scope -->|yes| rows["Run the SELECT, keep 50 rows"]
`;

const stages = [
  {
    step: "01",
    title: "Connection",
    text: "A name and a Postgres URL are enough. Localhost is rejected. The response is the schema and table list.",
  },
  {
    step: "02",
    title: "Selection",
    text: "Chosen tables are checked. A missing table stops the request. Otherwise the response has relation notes, columns, and constraints.",
  },
  {
    step: "03",
    title: "Definitions",
    text: "Metric names, synonyms, and descriptions are checked against the selected tables and columns. No SQL runs in this phase.",
  },
  {
    step: "04",
    title: "Queries",
    text: "Each metric runs as the user's SELECT. A question with no SQL is drafted first, then the same guard runs it.",
  },
];

const decisions = [
  {
    role: "Gate",
    name: "One connection check",
    detail:
      "The body decides the phase. Definitions require selected tables. Metrics and questions require both selected tables and definitions. A metric name must already be defined.",
  },
  {
    role: "Scope",
    name: "Selected tables only",
    detail:
      "Before a query runs, EXPLAIN lists the tables in the plan. A table outside the selection rejects that query. An unqualified name is prefixed when it exists in exactly one selected schema.",
  },
  {
    role: "Next",
    name: "SQL agent and database connector",
    detail:
      "This page is the first Postgres check. The connector, the saved session, and the assistant tools live in the live database agent case.",
  },
];

const facts = [
  ["Status", "Work in progress"],
  ["Endpoint", "POST /connection"],
  ["Database", "PostgreSQL only"],
  ["Connect timeout", "8 seconds"],
  ["Statement timeout", "8 seconds"],
  ["Rows kept", "50"],
];

const limits = [
  "This route drafts one SELECT. It does not plan, retry, or call tools. Those steps are in the live database agent.",
  "This route does not keep a session. Each request opens a client, checks the database, and closes it.",
  "Index, statistics, and semantics queries are in the module and are not called by this route.",
  "A failed metric or question is a note on the response. It does not fail the whole request.",
  "No accuracy or latency number is published for drafted SQL.",
];

const stack = [
  "TypeScript",
  "Express",
  "PostgreSQL",
  "Zod",
  "OpenRouter",
];

export default function DatabaseOnboardingPage() {
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
            <Dot /> Case 07 / Work in progress
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Onboard a database{" "}
            <span className="text-ink/35">before an agent queries it.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg sm:leading-8">
            One route checks a Postgres connection, then walks selected tables,
            metric definitions, and guarded SELECT queries. The connector and
            the assistant that query a saved database are a separate case.
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
              "Built",
              "Connection checks, schema listing, relation notes, definition checks, and guarded SELECT execution.",
            ],
            [
              "Separate case",
              "The live database agent keeps a saved session and queries it with two assistant tools.",
            ],
            [
              "Not on this route",
              "Index, statistics, and semantics queries exist in the module and are not called yet.",
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
            <Dot /> 01 / Phases
          </p>
          <h2
            id="architecture-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            The body decides how far the check goes.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            POST /connection always starts by validating the URL and confirming
            the connected database name. Later fields open the next phase.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              wide
              title="Onboarding phases"
              caption="A missing selected table returns 422. Definitions, metrics, and questions are optional and must arrive in that order."
              chart={phaseChart}
            />
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
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
        ariaLabelledBy="query-title"
        className="px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto max-w-328">
          <p className="section-kicker">
            <Dot /> 02 / Query guard
          </p>
          <h2
            id="query-title"
            className="mt-6 max-w-3xl text-3xl font-medium tracking-[-0.06em] sm:text-5xl"
          >
            A question can run only inside the selected tables.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
            The stance model drafts one SELECT when a question has no SQL. The
            draft and a user-written metric query pass through the same guard.
          </p>

          <div className="mt-10">
            <ArchitectureDiagram
              title="Guarded SELECT"
              caption="The transaction is read only. The statement timeout is 8 seconds. At most 50 rows are returned. A rejected query becomes a note and does not fail the request."
              chart={queryChart}
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
              Connect first. Agent later.
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
            One endpoint, four phases.
          </h2>

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
        className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-24 lg:px-14"
      >
        <div className="mx-auto grid max-w-328 gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="section-kicker">
              <Dot /> 05 / Still open
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
              href="/work/live-database-agent"
              className="inline-flex w-fit items-center gap-2 text-sm text-ink/70 transition-colors hover:text-lime"
            >
              Live database agent <ArrowUpRight />
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Database onboarding · WIP
          </p>
        </div>
      </footer>
    </main>
  );
}
