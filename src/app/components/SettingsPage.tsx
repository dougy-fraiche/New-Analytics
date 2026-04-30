import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

import {
  PageHeader,
  PageHeaderPrimaryRow,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";

export function SettingsPage() {
  const [displayName, setDisplayName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@acme.com");
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [actionAlerts, setActionAlerts] = useState(true);
  const [dashboardSharing, setDashboardSharing] = useState(false);
  const [copilotEnabled, setCopilotEnabled] = useState(true);
  const [autoArchiveDays, setAutoArchiveDays] = useState("90");
  const [dataRetention, setDataRetention] = useState("365");

  const handleSaveProfile = () => {
    toast.success("Profile updated", {
      description: "Your profile settings have been saved.",
    });
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences updated", {
      description: "Your notification settings have been saved.",
    });
  };

  const handleSaveGeneral = () => {
    toast.success("General settings updated", {
      description: "Your general settings have been saved.",
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
        <PageHeaderPrimaryRow
          title={<h1 className="text-3xl tracking-tight">Settings</h1>}
          description="Manage your account preferences and application configuration"
        />
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
      <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
      <HeaderAIInsightsRow
        dashboardId="settings"
        dashboardData={{
          id: "settings",
          title: "Settings",
          description: "Manage your account preferences and application configuration",
        }}
      />
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                  <SelectItem value="Europe/Berlin">Central European Time (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose how you want to be notified about activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for important updates
              </p>
            </div>
            <Switch
              aria-label="Toggle email notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of key metrics and actions
              </p>
            </div>
            <Switch
              aria-label="Toggle weekly digest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Action Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Be notified when deployed actions complete or fail
              </p>
            </div>
            <Switch
              aria-label="Toggle action alerts"
              checked={actionAlerts}
              onCheckedChange={setActionAlerts}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications}>Save Notifications</Button>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Application-wide preferences and defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Copilot</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-assisted analysis suggestions across dashboards
              </p>
            </div>
            <Switch
              aria-label="Toggle AI Copilot"
              checked={copilotEnabled}
              onCheckedChange={setCopilotEnabled}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dashboard Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow sharing dashboards with external collaborators
              </p>
            </div>
            <Switch
              aria-label="Toggle dashboard sharing"
              checked={dashboardSharing}
              onCheckedChange={setDashboardSharing}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auto-archive">Auto-archive Conversations After</Label>
              <Select value={autoArchiveDays} onValueChange={setAutoArchiveDays}>
                <SelectTrigger id="auto-archive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-retention">Data Retention</Label>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger id="data-retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Plan & Usage</CardTitle>
          <CardDescription>
            Your current subscription and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Current Plan</Label>
                <Badge>Enterprise</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Unlimited dashboards, actions, and team members
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage Plan
            </Button>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dashboards</p>
              <p className="text-2xl tabular-nums">24 <span className="text-sm text-muted-foreground">/ Unlimited</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Action history</p>
              <p className="text-2xl tabular-nums">156 <span className="text-sm text-muted-foreground">this month</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-2xl tabular-nums">12 <span className="text-sm text-muted-foreground">/ Unlimited</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
      </PageTransition>
        </div>
      </div>
    </div>
  );
}
