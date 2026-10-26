const agents = [
  {
    name: "Planner",
    role: "Breaks a task into steps",
  },
  {
    name: "Retriever",
    role: "Pulls documents and context",
  },
  {
    name: "Toolsmith",
    role: "Calls APIs and tools",
  },
  {
    name: "Critic",
    role: "Checks the result before it ships",
  },
];

const statuses = ["idle", "planning", "tool call", "review"];

export default function AgentRoster() {
  return (
    <aside className="relative z-10 lg:mb-2">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink/45">
        The focus
      </p>
      <p className="mt-3 text-xl font-medium leading-snug tracking-tight sm:text-2xl">
        Less artificial hype.
        <span className="mt-1 block text-ink/45">More real intelligence.</span>
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-2.5">
        {agents.map((agent, index) => (
          <li
            key={agent.name}
            className="agent-card"
            style={{ ["--status-shift" as string]: `${index * -2}s` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium tracking-tight sm:text-base">
                {agent.name}
              </p>
              <span
                className="agent-live"
                style={{ animationDelay: `${index * 0.35}s` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-xs leading-5 text-ink/55">{agent.role}</p>
            <p
              className="agent-status mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-lime"
              aria-hidden="true"
            >
              {statuses.map((status, step) => (
                <span
                  key={status}
                  style={{ ["--step" as string]: `${step * 2}s` }}
                >
                  {status}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
