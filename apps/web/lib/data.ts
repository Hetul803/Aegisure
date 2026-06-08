import { BrainCircuit, GitBranch, GitPullRequestArrow, History, MessageSquareText, ScrollText, Settings, ShieldCheck, Wrench } from "lucide-react";

export const navItems = [
  { key: "dashboard", href: "/dashboard", label: "Risk Reports", icon: GitPullRequestArrow },
  { key: "repos", href: "/repos", label: "Repos", icon: GitBranch },
  { key: "memory", href: "/memory-export", label: "Memory Export", icon: BrainCircuit },
  { key: "attribution", href: "/attribution", label: "Attribution", icon: History },
  { key: "provenance", href: "/provenance", label: "Provenance", icon: ScrollText },
  { key: "policies", href: "/policies", label: "Policies", icon: ShieldCheck },
  { key: "audit", href: "/audit", label: "Audit", icon: MessageSquareText },
  { key: "settings", href: "/settings", label: "Settings", icon: Settings },
];

export const agentExports = ["Aegisure.md", "AGENTS.md", "CLAUDE.md", ".cursorrules", ".clinerules", ".github/copilot-instructions.md"];

export const heroActions = [
  { title: "Risk scanning", detail: "Secrets, auth, payment, deploy, dependency, test-removal, and destructive-command checks." },
  { title: "Cross-agent rule sync", detail: "One Constitution exports clean memory files for Codex, Claude Code, Cursor, Copilot, Cline, and Roo." },
  { title: "Attribution + provenance", detail: "Track which agent touched which files and what prompt produced the change." },
  { title: "Second opinion", detail: "Optional cross-model review when you want Claude to review Codex, or OpenAI to review Claude." },
  { title: "Policy as code", detail: "Set rules like “payments require review” and evaluate them against every PR." },
  { title: "Audit trail", detail: "Ask grounded questions over your own workspace records, not a general chatbot." },
];

export { Wrench };
