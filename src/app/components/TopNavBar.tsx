import {
  Bell,
  ChevronDown,
  CircleHelp,
  Search,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { recommendedActionsData } from "../data/recommended-actions";
import {
  ACTION_STATUS_LABELS,
  recommendedActionActivityById,
} from "../data/action-activity";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { currentUserProfile, getInitials } from "../data/user-profile";
import { ROUTES } from "../routes";

interface TopNavBarProps {
  onSearchClick?: () => void;
}

interface AppCategory {
  label: string;
  items: Array<{ name: string; active?: boolean }>;
}

const APP_CATEGORIES: AppCategory[] = [
  {
    label: "General",
    items: [{ name: "Admin" }],
  },
  {
    label: "Omnichannel Routing",
    items: [
      { name: "ACD" },
      { name: "Agent" },
      { name: "Supervisor" },
      { name: "Studio" },
    ],
  },
  {
    label: "Workforce Engagement",
    items: [
      { name: "Workforce Management" },
      { name: "QM Analytics" },
      { name: "inView PM" },
      { name: "Coaching" },
      { name: "Interactions" },
      { name: "My Zone" },
    ],
  },
  {
    label: "Data & Analytics",
    items: [
      { name: "Analytics", active: true },
      { name: "Dashboard" },
      { name: "Reporting" },
      { name: "Self-Service Analytics" },
    ],
  },
  {
    label: "Automation",
    items: [{ name: "Workforce Intelligence" }],
  },
  {
    label: "Partner",
    items: [
      { name: "Adapters" },
      { name: "Partner Hub" },
    ],
  },
];

export function TopNavBar({
  onSearchClick,
}: TopNavBarProps) {
  const navigate = useNavigate();

  const topRecommendedAction = recommendedActionsData[0];
  const topRecommendedActionTitle =
    topRecommendedAction?.title ?? "Deploy Account Verification AI Agent";
  const topRecommendedActionPriority = topRecommendedAction?.priority ?? "High";
  const topRecommendedActionActivity = topRecommendedAction
    ? recommendedActionActivityById[topRecommendedAction.id]
    : undefined;
  const statusUpdateAction = recommendedActionsData.find((action) => action.id === 3);
  const statusUpdateActionActivity = statusUpdateAction
    ? recommendedActionActivityById[statusUpdateAction.id]
    : undefined;

  const notificationCount = 5;

  return (
    <header
      data-slot="top-nav"
      className="z-40 flex h-14 w-full items-center justify-between bg-transparent p-2"
    >
      <div className="flex min-w-0 items-center gap-1">
        <div className="size-10 shrink-0 p-1">
          <img
            src="/app-icon.svg"
            alt="Agentic Analytics"
            width={32}
            height={32}
            className="block size-full object-contain"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 min-w-0 gap-1.5 rounded-md px-2 text-[color:var(--lyra-neutral-n800)] hover:bg-[color:var(--lyra-neutral-n100)]"
              aria-label="Switch application"
            >
              <span className="truncate text-base font-medium leading-tight">
                Agentic Analytics
              </span>
              <ChevronDown className="size-4 shrink-0 text-[color:var(--lyra-neutral-n500)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-56 max-h-[70vh] overflow-y-auto"
          >
            {APP_CATEGORIES.map((category, catIdx) => (
              <div key={category.label}>
                {catIdx > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel className="text-xs uppercase tracking-wider">
                  {category.label}
                </DropdownMenuLabel>
                {category.items.map((app) => (
                  <DropdownMenuItem
                    key={app.name}
                    className={app.active ? "bg-accent text-accent-foreground" : ""}
                  >
                    <span className="truncate">{app.name}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="text-[color:var(--lyra-neutral-n600)] hover:bg-[color:var(--lyra-neutral-n100)]"
              onClick={onSearchClick}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="text-[color:var(--lyra-neutral-n600)] hover:bg-[color:var(--lyra-neutral-n100)]"
            >
              <CircleHelp className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Help</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="relative text-[color:var(--lyra-neutral-n600)] hover:bg-[color:var(--lyra-neutral-n100)]"
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 ? (
                    <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[#d13030] px-1 text-[10px] font-semibold leading-4 text-white">
                      {notificationCount}
                    </span>
                  ) : null}
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-foreground">New recommended action available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {topRecommendedActionTitle} - {topRecommendedActionPriority} Priority
                    </p>
                    {topRecommendedActionActivity ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {topRecommendedActionActivity.owner} · {ACTION_STATUS_LABELS[topRecommendedActionActivity.status]}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {topRecommendedActionActivity?.relativeTimeLabel ?? "2 minutes ago"}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-foreground">Dashboard saved successfully</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Custom Support Analytics Dashboard saved to Q1 Analytics
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-foreground">Action status update</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {statusUpdateAction?.title ?? "Retrain Escalation Classifier"}
                    </p>
                    {statusUpdateActionActivity ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {statusUpdateActionActivity.owner} · {ACTION_STATUS_LABELS[statusUpdateActionActivity.status]}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {statusUpdateActionActivity?.relativeTimeLabel ?? "3 hours ago"}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              aria-label="User menu"
              className="gap-2 rounded-full px-1.5 text-[color:var(--lyra-neutral-n700)] hover:bg-[color:var(--lyra-neutral-n100)]"
            >
              <Avatar className="size-10 rounded-full">
                <AvatarFallback
                  delayMs={0}
                  className="rounded-full bg-[color:var(--lyra-neutral-n500)] text-white text-xs"
                >
                  {getInitials(currentUserProfile.displayName)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4" />
              <span className="sr-only">Open user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm" style={{ fontWeight: 500 }}>{currentUserProfile.displayName}</p>
                <p className="text-xs text-muted-foreground">{currentUserProfile.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
