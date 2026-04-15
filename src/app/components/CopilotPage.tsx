import { Bot } from "lucide-react";
import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { ootbCategories } from "../data/ootb-dashboards";
import { PageTransition } from "./PageTransition";
import { cn } from "./ui/utils";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";

export function CopilotPage() {
  const aiAgentsCategory = ootbCategories.find((c) => c.id === "ai-agents");
  const copilotDashboard = aiAgentsCategory?.dashboards.find((d) => d.id === "ai-agents-copilot");

  if (!copilotDashboard) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Copilot dashboard not found</p>
        </div>
      </div>
    );
  }

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId={copilotDashboard.id}>
      <div className="flex flex-col h-full min-h-0">
        <PageHeader>
          <section>
            <section className="flex items-center gap-2">
              <h1 className="text-3xl tracking-tight">Copilot</h1>
            </section>
            <p className="text-muted-foreground mt-1">{copilotDashboard.description}</p>
          </section>
        </PageHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
            <PageTransition className={pageMainColumnClassName}>
              <Empty className="min-h-[24rem]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bot />
                  </EmptyMedia>
                  <EmptyTitle>Copilot coming soon</EmptyTitle>
                  <EmptyDescription>
                    We&apos;re actively building this page.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </PageTransition>
          </div>
        </div>
      </div>
    </WidgetAIProvider>
  );
}
