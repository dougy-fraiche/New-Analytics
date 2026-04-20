import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TableBadge } from "./TableBadge";
import { cn } from "./ui/utils";

type FlaggedArticleSeverity = "High" | "Medium" | "Low";
type ApprovalType = "New" | "Update" | "Delete";
type ApprovalStatus = "Pending" | "Approved" | "Rejected";
type IntegrationStatus = "Connected" | "Error";

interface FlaggedArticleRow {
  id: string;
  title: string;
  issue: string;
  severity: FlaggedArticleSeverity;
  suggestedAction: string;
}

interface ApprovalQueueRow {
  id: string;
  title: string;
  type: ApprovalType;
  submittedBy: string;
  status: ApprovalStatus;
}

interface SuggestedArticleCard {
  title: string;
  description: string;
  estimatedImpact: string;
  confidence: number;
}

interface ThirdPartyIntegrationCard {
  name: string;
  logoPath: string;
  status: IntegrationStatus;
  lastSync: string;
  articlesImported: number;
}

const WIDGET_CARD_HOVER =
  "group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30";

const FLAGGED_ARTICLES: ReadonlyArray<FlaggedArticleRow> = [
  {
    id: "ART-101",
    title: "Account Billing FAQ",
    issue: "Low relevancy score (0.32) across 45 queries",
    severity: "High",
    suggestedAction: "Rewrite billing section to address common query patterns",
  },
  {
    id: "ART-078",
    title: "Troubleshooting Login Issues",
    issue: "High negative feedback rate (38%)",
    severity: "High",
    suggestedAction: "Add SSO-specific troubleshooting steps",
  },
  {
    id: "ART-215",
    title: "Payment Methods Accepted",
    issue: "Outdated content - references discontinued payment provider",
    severity: "Medium",
    suggestedAction: "Update payment provider list and add regional options",
  },
  {
    id: "ART-142",
    title: "Data Privacy and Security",
    issue: "Missing GDPR compliance information",
    severity: "Medium",
    suggestedAction: "Add GDPR data processing and retention details",
  },
  {
    id: "ART-309",
    title: "Product Warranty Information",
    issue: "Duplicate content with Return & Refund Policy article",
    severity: "Low",
    suggestedAction: "Consolidate warranty and refund articles or add cross-references",
  },
  {
    id: "ART-267",
    title: "Contact Support Options",
    issue: "Broken link to live chat portal",
    severity: "Low",
    suggestedAction: "Update live chat URL to new support portal domain",
  },
];

const APPROVAL_QUEUE: ReadonlyArray<ApprovalQueueRow> = [
  {
    id: "APR-041",
    title: "SSO Configuration Guide for Enterprise",
    type: "New",
    submittedBy: "Sarah Chen",
    status: "Pending",
  },
  {
    id: "APR-042",
    title: "Return & Refund Policy",
    type: "Update",
    submittedBy: "James Wilson",
    status: "Pending",
  },
  {
    id: "APR-039",
    title: "API Rate Limits and Quotas",
    type: "New",
    submittedBy: "Maria Lopez",
    status: "Approved",
  },
  {
    id: "APR-037",
    title: "Legacy Billing Portal Guide",
    type: "Delete",
    submittedBy: "David Park",
    status: "Rejected",
  },
];

const AI_SUGGESTED_ARTICLES: ReadonlyArray<SuggestedArticleCard> = [
  {
    title: "License Transfer Between Users",
    description: "28 failed queries in the past 7 days with no matching article",
    estimatedImpact: "Could resolve ~85% of license-related failed queries",
    confidence: 88,
  },
  {
    title: "SAML SSO Setup Guide",
    description: "High volume of negative feedback on existing login troubleshooting article",
    estimatedImpact: "Expected 40% reduction in SSO-related support tickets",
    confidence: 83,
  },
  {
    title: "Webhook Configuration and Debugging",
    description: "Growing query cluster with no dedicated knowledge base article",
    estimatedImpact: "Could reduce developer support queries by ~30%",
    confidence: 71,
  },
];

const THIRD_PARTY_INTEGRATIONS: ReadonlyArray<ThirdPartyIntegrationCard> = [
  {
    name: "Confluence",
    logoPath: "https://upload.wikimedia.org/wikipedia/commons/0/05/Atlassian_Confluence_2017_logo_%28cropped%29.svg",
    status: "Connected",
    lastSync: "2026-03-24 06:00",
    articlesImported: 187,
  },
  {
    name: "Zendesk Help Center",
    logoPath: "https://logosandtypes.com/wp-content/uploads/2020/08/zendesk.svg",
    status: "Connected",
    lastSync: "2026-03-24 04:30",
    articlesImported: 124,
  },
  {
    name: "SharePoint",
    logoPath: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Microsoft_Office_SharePoint_%282019%E2%80%932025%29.svg",
    status: "Error",
    lastSync: "2026-03-21 12:15",
    articlesImported: 31,
  },
];

const severityBadgeVariantByLevel: Record<
  FlaggedArticleSeverity,
  "secondary"
> = {
  High: "secondary",
  Medium: "secondary",
  Low: "secondary",
};

const severityBadgeClassByLevel: Record<FlaggedArticleSeverity, string | undefined> = {
  High: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Medium: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Low: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
};

const approvalTypeBadgeVariantByType: Record<
  ApprovalType,
  "default" | "secondary" | "destructive"
> = {
  New: "default",
  Update: "secondary",
  Delete: "destructive",
};

const approvalTypeBadgeClassByType: Record<ApprovalType, string | undefined> = {
  New: undefined,
  Update: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Delete: undefined,
};

const approvalStatusBadgeVariantByType: Record<
  ApprovalStatus,
  "secondary" | "destructive"
> = {
  Pending: "secondary",
  Approved: "secondary",
  Rejected: "destructive",
};

const approvalStatusBadgeClassByType: Record<ApprovalStatus, string | undefined> = {
  Pending: undefined,
  Approved: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Rejected: undefined,
};

const integrationStatusBadgeVariantByType: Record<
  IntegrationStatus,
  "secondary" | "destructive"
> = {
  Connected: "secondary",
  Error: "destructive",
};

const integrationStatusBadgeClassByType: Record<IntegrationStatus, string | undefined> = {
  Connected: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Error: undefined,
};

export function KnowledgePerformanceImproveKnowledgeTab() {
  return (
    <div className="space-y-4">
      <Card className={WIDGET_CARD_HOVER}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium tracking-tight">Flagged Articles</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead className="w-[232px]">Title</TableHead>
                <TableHead className="w-[420px]">Issue</TableHead>
                <TableHead className="w-[96px]">Severity</TableHead>
                <TableHead>Suggested Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FLAGGED_ARTICLES.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-mono">{article.id}</TableCell>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.issue}</TableCell>
                  <TableCell>
                    <TableBadge
                      variant={severityBadgeVariantByLevel[article.severity]}
                      className={severityBadgeClassByLevel[article.severity]}
                    >
                      {article.severity}
                    </TableBadge>
                  </TableCell>
                  <TableCell>{article.suggestedAction}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={WIDGET_CARD_HOVER}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium tracking-tight">Approval Queue</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead className="w-[560px]">Title</TableHead>
                <TableHead className="w-[170px]">Type</TableHead>
                <TableHead className="w-[260px]">Submitted By</TableHead>
                <TableHead className="w-[220px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {APPROVAL_QUEUE.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono">{row.id}</TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>
                    <TableBadge
                      variant={approvalTypeBadgeVariantByType[row.type]}
                      className={approvalTypeBadgeClassByType[row.type]}
                    >
                      {row.type}
                    </TableBadge>
                  </TableCell>
                  <TableCell>{row.submittedBy}</TableCell>
                  <TableCell>
                    <TableBadge
                      variant={approvalStatusBadgeVariantByType[row.status]}
                      className={cn("gap-1.5", approvalStatusBadgeClassByType[row.status])}
                    >
                      {row.status === "Pending" ? <Clock3 className="size-3.5" aria-hidden /> : null}
                      {row.status === "Approved" ? <CheckCircle2 className="size-3.5" aria-hidden /> : null}
                      {row.status === "Rejected" ? <XCircle className="size-3.5" aria-hidden /> : null}
                      {row.status}
                    </TableBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={WIDGET_CARD_HOVER}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium tracking-tight">AI-Suggested Articles</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {AI_SUGGESTED_ARTICLES.map((article) => (
              <Card key={article.title} className={`h-full ${WIDGET_CARD_HOVER}`}>
                <CardHeader className="pb-4">
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <div className="space-y-0">
                    <p className="text-sm font-medium">Estimated Impact</p>
                    <p className="text-sm">{article.estimatedImpact}</p>
                  </div>
                </CardContent>
                <CardFooter className="border-t mt-auto flex-col items-stretch gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Confidence</p>
                    <p className="text-sm text-muted-foreground">{article.confidence}%</p>
                  </div>
                  <Progress
                    value={article.confidence}
                    aria-label={`${article.title} confidence ${article.confidence}%`}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={WIDGET_CARD_HOVER}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium tracking-tight">Third-Party Integrations</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {THIRD_PARTY_INTEGRATIONS.map((integration) => {
              return (
                <Card key={integration.name} className={`h-full ${WIDGET_CARD_HOVER}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 leading-normal">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-visible">
                          <img
                            src={integration.logoPath}
                            alt={`${integration.name} logo`}
                            className="h-full w-full object-contain object-center"
                          />
                        </span>
                        <span>{integration.name}</span>
                      </CardTitle>
                      <Badge
                        variant={integrationStatusBadgeVariantByType[integration.status]}
                        className={integrationStatusBadgeClassByType[integration.status]}
                      >
                        {integration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span className="font-medium text-foreground">{integration.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Articles Imported</span>
                      <span className="font-medium text-foreground">
                        {integration.articlesImported.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
