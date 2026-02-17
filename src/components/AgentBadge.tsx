"use client";

import { AgentType } from "@/lib/types";

const agentConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  consumer: {
    label: "Consumer Agent",
    color: "bg-blue-600",
    icon: "🛟",
  },
  ops: {
    label: "Ops Agent",
    color: "bg-emerald-600",
    icon: "📦",
  },
  router: {
    label: "Router",
    color: "bg-neutral-500",
    icon: "🔀",
  },
};

export default function AgentBadge({ agent }: { agent: AgentType }) {
  if (!agent) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
        <span className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" />
        Waiting…
      </span>
    );
  }

  const config = agentConfig[agent];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${config.color} px-3 py-1 text-xs font-medium text-white`}
    >
      <span>{config.icon}</span>
      Connected to: {config.label}
    </span>
  );
}
