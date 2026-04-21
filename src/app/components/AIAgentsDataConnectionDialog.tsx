import { useEffect, useRef, useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type AIAgentsDataConnectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
};

type ConnectionTestState = "idle" | "testing" | "success";

const TEST_CONNECTION_DELAY_MS = 850;
const START_SYNC_DELAY_MS = 950;

const DEFAULT_BASE_URL = "https://odata-trial.cognigy.ai/v2.4";

const INITIAL_VALUES = {
  apiKey: "*****",
  baseUrl: DEFAULT_BASE_URL,
  projectId: "",
};

export function AIAgentsDataConnectionDialog({
  open,
  onOpenChange,
  onConnectionStatusChange,
}: AIAgentsDataConnectionDialogProps) {
  const [apiKey, setApiKey] = useState(INITIAL_VALUES.apiKey);
  const [baseUrl, setBaseUrl] = useState(INITIAL_VALUES.baseUrl);
  const [projectId, setProjectId] = useState(INITIAL_VALUES.projectId);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionTestState, setConnectionTestState] = useState<ConnectionTestState>("idle");
  const [syncing, setSyncing] = useState(false);
  const testTimerRef = useRef<number | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (testTimerRef.current !== null) {
      window.clearTimeout(testTimerRef.current);
      testTimerRef.current = null;
    }
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (open) return;
    clearTimers();
    setApiKey(INITIAL_VALUES.apiKey);
    setBaseUrl(INITIAL_VALUES.baseUrl);
    setProjectId(INITIAL_VALUES.projectId);
    setShowApiKey(false);
    setConnectionTestState("idle");
    setSyncing(false);
  }, [open]);

  const handleTestConnection = () => {
    if (connectionTestState === "testing") return;
    setConnectionTestState("testing");
    if (testTimerRef.current !== null) {
      window.clearTimeout(testTimerRef.current);
    }
    testTimerRef.current = window.setTimeout(() => {
      setConnectionTestState("success");
      onConnectionStatusChange?.(true);
      toast.success("Connection successful", {
        description: "Cognigy connection was verified locally.",
      });
      testTimerRef.current = null;
    }, TEST_CONNECTION_DELAY_MS);
  };

  const handleStartSync = () => {
    if (syncing) return;
    setSyncing(true);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      setSyncing(false);
      onConnectionStatusChange?.(true);
      onOpenChange(false);
      toast.success("Sync started", {
        description: "Cognigy data sync has been queued for this local session.",
      });
      syncTimerRef.current = null;
    }, START_SYNC_DELAY_MS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sync Cognigy Data</DialogTitle>
          <DialogDescription>
            Connect to Cognigy oData APIs to fetch real analytics data for your dashboards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-agents-api-key">
              API Key <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="ai-agents-api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="pr-10"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
                onClick={() => setShowApiKey((current) => !current)}
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-agents-base-url">Base URL</Label>
            <Input
              id="ai-agents-base-url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Default: {DEFAULT_BASE_URL}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-agents-project-id">Project ID</Label>
            <Input
              id="ai-agents-project-id"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              placeholder="Filter by specific project"
            />
            <p className="text-xs text-muted-foreground">Leave empty to sync all projects.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTestConnection}
              disabled={connectionTestState === "testing" || syncing}
            >
              {connectionTestState === "testing" ? <Loader2 className="size-4 animate-spin" /> : null}
              Test Connection
            </Button>
            {connectionTestState === "success" ? (
              <p className="inline-flex items-center gap-2 text-sm text-success">
                <Check className="size-4" />
                Connection successful
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={syncing}>
            Cancel
          </Button>
          <Button type="button" onClick={handleStartSync} disabled={syncing}>
            {syncing ? <Loader2 className="size-4 animate-spin" /> : null}
            Start Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
