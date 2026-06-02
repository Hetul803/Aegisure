import Link from "next/link";
import { GitBranch, Plus } from "lucide-react";
import { AppShell, Badge, Button, Card, EmptyState, PageHeader } from "../../components/ui";
import { backendGet, type ReposResponse } from "../../lib/api";

export default async function ReposPage() {
  const data = await backendGet<ReposResponse>("/repos", { repos: [] });
  return (
    <AppShell current="repos">
      <PageHeader eyebrow="Repositories" title="Connected repos and current agent risk." action={<Button href="/onboarding"><Plus className="h-4 w-4" /> Add repo</Button>}>
        Start with one repository. Aegisure will attach risk reports, policies, and attribution to each connected repo.
      </PageHeader>
      <div className="p-4 md:p-6 lg:p-10">
        {data.repos.length === 0 ? (
          <EmptyState title="No live repositories connected yet." detail="Install the GitHub App on a repository, then open a pull request to populate this page." action={<Button href="/onboarding"><GitBranch className="h-4 w-4" /> Connect GitHub</Button>} />
        ) : (
          <div className="grid gap-4">
            {data.repos.map((repo) => (
              <Card key={repo.full_name || repo.name} className="smooth-pop flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <Link href="/repos/aegisure/constitution" className="text-lg font-medium hover:underline">{repo.full_name || repo.name}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{repo.open_prs || 0} open pull requests · Constitution ready once generated</p>
                </div>
                <Badge tone={(repo.risk || 0) > 90 ? "bad" : (repo.risk || 0) > 50 ? "warn" : "good"}>{repo.status || "Connected"} · {repo.risk || 0}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
