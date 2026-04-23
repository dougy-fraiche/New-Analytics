import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PageHeader, pageMainColumnClassName, pageRootListScrollGutterClassName } from "./PageChrome";
import { PageTransition } from "./PageTransition";
import { cn } from "./ui/utils";

type CognigyState = "initial" | "configured" | "verifying" | "verified";

type AutomationSettingsDraft = {
  companyName: string;
  companyDescription: string;
  analyzePeriod: string;
  callCost: string;
  perUnit: string;
  chatCost: string;
  targetContainment: string;
  cognigyApiKey: string;
  cognigySiteUrl: string;
  cognigyState: CognigyState;
};

const MASKED_API_KEY = "..........................................";
const VERIFICATION_DELAY_MS = 1400;

const INITIAL_DRAFT: AutomationSettingsDraft = {
  companyName: "ABS Bank",
  companyDescription:
    "ABS Bank is a modern financial institution providing secure, reliable banking services to individuals and businesses. It focuses on delivering seamless digital experiences, efficient operations, and trusted customer support.",
  analyzePeriod: "last-30-days",
  callCost: "2",
  perUnit: "minutes",
  chatCost: "2",
  targetContainment: "100%",
  cognigyApiKey: "",
  cognigySiteUrl: "",
  cognigyState: "initial",
};

function Field({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

export function AutomationOpportunitiesSettingsPage() {
  const [draft, setDraft] = useState<AutomationSettingsDraft>(INITIAL_DRAFT);
  const [savedDraft, setSavedDraft] = useState<AutomationSettingsDraft>(INITIAL_DRAFT);
  const verificationTimerRef = useRef<number | null>(null);

  const clearVerificationTimer = useCallback(() => {
    if (verificationTimerRef.current === null) return;
    window.clearTimeout(verificationTimerRef.current);
    verificationTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (draft.cognigyState !== "verifying") return;
    clearVerificationTimer();
    verificationTimerRef.current = window.setTimeout(() => {
      setDraft((current) =>
        current.cognigyState === "verifying"
          ? { ...current, cognigyState: "verified" }
          : current,
      );
      verificationTimerRef.current = null;
    }, VERIFICATION_DELAY_MS);

    return clearVerificationTimer;
  }, [clearVerificationTimer, draft.cognigyState]);

  useEffect(() => clearVerificationTimer, [clearVerificationTimer]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedDraft),
    [draft, savedDraft],
  );

  const handleApiKeyChange = useCallback(
    (nextApiKey: string) => {
      clearVerificationTimer();
      setDraft((current) => {
        if (!nextApiKey.trim()) {
          return {
            ...current,
            chatCost: "2",
            cognigyApiKey: "",
            cognigySiteUrl: "",
            cognigyState: "initial",
          };
        }

        return {
          ...current,
          chatCost: "evaluate_charges",
          cognigyApiKey: nextApiKey,
          cognigyState: current.cognigySiteUrl.trim() ? "verifying" : "configured",
        };
      });
    },
    [clearVerificationTimer],
  );

  const handleSiteUrlChange = useCallback(
    (nextSiteUrl: string) => {
      clearVerificationTimer();
      setDraft((current) => {
        if (!current.cognigyApiKey.trim()) {
          return { ...current, cognigySiteUrl: nextSiteUrl, cognigyState: "initial" };
        }
        if (!nextSiteUrl.trim()) {
          return { ...current, cognigySiteUrl: nextSiteUrl, cognigyState: "configured" };
        }
        return { ...current, cognigySiteUrl: nextSiteUrl, cognigyState: "verifying" };
      });
    },
    [clearVerificationTimer],
  );

  const handleClearApiKey = useCallback(() => {
    clearVerificationTimer();
    setDraft((current) => ({
      ...current,
      chatCost: "2",
      cognigyApiKey: "",
      cognigySiteUrl: "",
      cognigyState: "initial",
    }));
  }, [clearVerificationTimer]);

  const handleCancel = useCallback(() => {
    clearVerificationTimer();
    setDraft(savedDraft);
    toast.message("Changes discarded", {
      description: "Unsaved settings were reverted.",
    });
  }, [clearVerificationTimer, savedDraft]);

  const handleSave = useCallback(() => {
    setSavedDraft(draft);
    toast.success("Settings saved", {
      description: "Automation settings were updated for this session.",
    });
  }, [draft]);

  const apiKeyValue = draft.cognigyState === "verified" ? MASKED_API_KEY : draft.cognigyApiKey;
  const apiKeyPlaceholder =
    draft.cognigyState === "initial"
      ? "Enter Cognigy API Key. E.g: c4413fa830745ad47f0...."
      : "";
  const siteUrlPlaceholder =
    draft.cognigyState === "initial" || draft.cognigyState === "configured"
      ? "Placeholder"
      : "https://trial.cognigy.ai";

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <PageHeader>
        <section className="flex items-start justify-between gap-3">
          <h1 className="text-3xl tracking-tight">Settings</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={!hasUnsavedChanges}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges}>
              Save
            </Button>
          </div>
        </section>
      </PageHeader>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
          <PageTransition className={cn(pageMainColumnClassName, "space-y-3")}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium leading-7">Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Field className="w-full max-w-[440px]">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={draft.companyName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, companyName: event.target.value }))
                    }
                  />
                </Field>

                <Field className="w-full max-w-[800px]">
                  <Label htmlFor="company-description">Company Description</Label>
                  <Textarea
                    id="company-description"
                    value={draft.companyDescription}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, companyDescription: event.target.value }))
                    }
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium leading-7">Automation Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <Field className="w-full max-w-[324px]">
                  <Label htmlFor="analyze-period">Analyze period</Label>
                  <Select
                    value={draft.analyzePeriod}
                    onValueChange={(next) =>
                      setDraft((current) => ({ ...current, analyzePeriod: next }))
                    }
                  >
                    <SelectTrigger id="analyze-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Analyzes interactions from the past 30 days.
                  </p>
                </Field>

                <section className="space-y-4">
                  <h2 className="text-base font-medium leading-6">Automation Opportunities</h2>
                  <div className="flex flex-wrap items-start gap-3">
                    <Field className="w-[240px]">
                      <Label htmlFor="call-cost">Call cost (USD)</Label>
                      <div className="relative">
                        <Input
                          id="call-cost"
                          className="pr-9"
                          value={draft.callCost}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, callCost: event.target.value }))
                          }
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                      </div>
                    </Field>

                    <Field className="w-[240px]">
                      <Label htmlFor="per-unit">PER</Label>
                      <Select
                        value={draft.perUnit}
                        onValueChange={(next) => setDraft((current) => ({ ...current, perUnit: next }))}
                      >
                        <SelectTrigger id="per-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field className="w-[240px]">
                    <Label htmlFor="chat-cost">Chat Cost (USD)</Label>
                    <div className="relative">
                      <Input
                        id="chat-cost"
                        className="pr-9"
                        value={draft.chatCost}
                        readOnly
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                    </div>
                  </Field>

                  <Field className="w-[240px]">
                    <Label htmlFor="target-containment">Target containment</Label>
                    <div className="relative">
                      <Input
                        id="target-containment"
                        className="pr-9"
                        value={draft.targetContainment}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            targetContainment: event.target.value,
                          }))
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </Field>
                </section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium leading-7">Cognigy AI Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Field className="w-full max-w-[400px]">
                    <Label htmlFor="cognigy-api-key">API key</Label>
                    <Input
                      id="cognigy-api-key"
                      value={apiKeyValue}
                      placeholder={apiKeyPlaceholder}
                      readOnly={draft.cognigyState === "verified"}
                      onChange={(event) => handleApiKeyChange(event.target.value)}
                    />
                  </Field>

                  <Field className="w-full max-w-[400px]">
                    <Label htmlFor="cognigy-site-url">Site URL</Label>
                    <Input
                      id="cognigy-site-url"
                      value={draft.cognigySiteUrl}
                      placeholder={siteUrlPlaceholder}
                      onChange={(event) => handleSiteUrlChange(event.target.value)}
                    />
                  </Field>

                  {draft.cognigyState === "verifying" ? (
                    <div className="flex h-8 items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Verifying</span>
                    </div>
                  ) : null}

                  {draft.cognigyState === "verified" ? (
                    <div className="flex h-8 items-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearApiKey}
                  disabled={draft.cognigyState === "initial"}
                >
                  {draft.cognigyState === "initial" ? "Edit API Key" : "Clear API Key"}
                </Button>
              </CardContent>
            </Card>
          </PageTransition>
        </div>
      </div>
    </div>
  );
}
