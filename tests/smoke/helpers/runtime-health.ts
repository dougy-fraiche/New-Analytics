import { expect, type Page } from "@playwright/test";

type RuntimeMessage = {
  type: string;
  text: string;
  location: string;
};

const KNOWN_HISTORICAL_RUNTIME_PATTERNS: RegExp[] = [
  /Function components cannot be given refs/i,
  /Check the render method of `SlotClone`/i,
];

function formatLocation(url?: string, lineNumber?: number, columnNumber?: number): string {
  if (!url) return "unknown";
  const line = lineNumber ?? 0;
  const column = columnNumber ?? 0;
  return `${url}:${line}:${column}`;
}

export function attachRuntimeHealthCapture(page: Page) {
  const issues: RuntimeMessage[] = [];
  const ignoredIssues: RuntimeMessage[] = [];

  page.on("console", (message) => {
    const type = message.type();
    if (type !== "warning" && type !== "error") return;
    const location = message.location();

    const runtimeMessage: RuntimeMessage = {
      type,
      text: message.text(),
      location: formatLocation(location.url, location.lineNumber, location.columnNumber),
    };

    const isKnownHistoricalIssue = KNOWN_HISTORICAL_RUNTIME_PATTERNS.some((pattern) =>
      pattern.test(runtimeMessage.text),
    );

    if (isKnownHistoricalIssue) {
      ignoredIssues.push(runtimeMessage);
      return;
    }

    issues.push(runtimeMessage);
  });

  page.on("pageerror", (error) => {
    issues.push({
      type: "pageerror",
      text: error.message,
      location: "runtime",
    });
  });

  return {
    async assertNoRuntimeIssues() {
      expect(
        issues,
        issues
          .map((issue) => `[${issue.type}] ${issue.location}\n${issue.text}`)
          .join("\n\n"),
      ).toHaveLength(0);
    },
    ignoredIssueCount() {
      return ignoredIssues.length;
    },
  };
}
