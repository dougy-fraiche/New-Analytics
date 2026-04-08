import {
  Bell,
  Search,
  Sparkles,
  ChevronsUpDown,
  Settings,
  BarChart2,
  LayoutDashboard,
  FileBarChart,
  BotMessageSquare,
  BrainCircuit,
  Cable,
  CloudCog,
  PhoneForwarded,
  Headset,
  Eye,
  Clapperboard,
  CalendarClock,
  ClipboardCheck,
  Target,
  GraduationCap,
  MessageSquare,
  Diamond,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

interface AppItem {
  name: string;
  icon: LucideIcon;
  active?: boolean;
}

interface AppCategory {
  label: string;
  items: AppItem[];
}

const APP_CATEGORIES: AppCategory[] = [
  {
    label: "General",
    items: [{ name: "Admin", icon: Settings }],
  },
  {
    label: "Omnichannel Routing",
    items: [
      { name: "ACD", icon: PhoneForwarded },
      { name: "Agent", icon: Headset },
      { name: "Supervisor", icon: Eye },
      { name: "Studio", icon: Clapperboard },
    ],
  },
  {
    label: "Workforce Engagement",
    items: [
      { name: "Workforce Management", icon: CalendarClock },
      { name: "QM Analytics", icon: ClipboardCheck },
      { name: "inView PM", icon: Target },
      { name: "Coaching", icon: GraduationCap },
      { name: "Interactions", icon: MessageSquare },
      { name: "My Zone", icon: Diamond },
    ],
  },
  {
    label: "Data & Analytics",
    items: [
      { name: "Analytics", icon: BarChart2, active: true },
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "Reporting", icon: FileBarChart },
      { name: "Self-Service Analytics", icon: BotMessageSquare },
    ],
  },
  {
    label: "Automation",
    items: [{ name: "Workforce Intelligence", icon: BrainCircuit }],
  },
  {
    label: "Partner",
    items: [
      { name: "Adapters", icon: Cable },
      { name: "Partner Hub", icon: CloudCog },
    ],
  },
];

interface TopNavBarProps {
  onSearchClick?: () => void;
  onActionsSlotRef?: (el: HTMLDivElement | null) => void;
  aiAssistantOpen?: boolean;
  onAiAssistantOpenChange?: (open: boolean) => void;
  /** When true (e.g. Explore routes), hide toggle / show disabled control */
  aiAssistantDisabled?: boolean;
}

export function TopNavBar({
  onSearchClick,
  onActionsSlotRef,
  aiAssistantOpen = false,
  onAiAssistantOpenChange,
  aiAssistantDisabled = false,
}: TopNavBarProps) {
  return (
    <header className="relative z-50 flex h-16 w-full shrink-0 items-center border-b border-[#005E8D] bg-[#007AB8] pl-3 pr-4 text-white">
      {/* App switcher dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 max-w-[220px] justify-start gap-2 px-2 text-white hover:bg-black/20 hover:text-white data-[state=open]:bg-black/25 data-[state=open]:text-white"
          >
            <img
              src="/app-icon.svg"
              alt="New Analytics"
              className="size-7 shrink-0 object-contain"
            />
            <span className="truncate text-sm leading-tight">New Analytics</span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-white/80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          className="w-56 max-h-[70vh] overflow-y-auto"
        >
          {APP_CATEGORIES.map((category, catIdx) => (
            <DropdownMenuGroup key={category.label}>
              {catIdx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs uppercase tracking-wider">
                {category.label}
              </DropdownMenuLabel>
              {category.items.map((app) => {
                return (
                  <DropdownMenuItem
                    key={app.name}
                    className={app.active ? "bg-accent text-accent-foreground" : ""}
                  >
                    <span className="truncate">{app.name}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <img src="/cxone-on-blue-gradient.svg" alt="CXone" className="h-5 w-auto" />
      </div>

      {/* Page-level actions slot (portaled into by child pages) + global actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Page-level actions slot */}
        <div ref={onActionsSlotRef} className="flex items-center gap-1 text-white" />

        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white hover:bg-black/20 hover:text-white data-[state=open]:bg-black/25 data-[state=open]:text-white"
              onClick={onSearchClick}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white hover:bg-black/20 hover:text-white data-[state=open]:bg-black/25 data-[state=open]:text-white"
                >
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
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
                      Deploy Account Verification AI Agent - High Priority
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
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
                    <p className="text-sm font-normal text-foreground">Escalation rate alert</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Escalation rate increased by 8% in the last 7 days
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
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

        {/* Global AI Assistant toggle (single thread — not used on Explore) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                disabled={aiAssistantDisabled}
                aria-pressed={aiAssistantOpen}
                onClick={() => onAiAssistantOpenChange?.(!aiAssistantOpen)}
              >
                <Sparkles className="h-4 w-4" />
                <span>Ask AI</span>
                <span className="sr-only">
                  {aiAssistantDisabled ? "AI assistant — not available on Explore" : aiAssistantOpen ? "Close AI assistant" : "Open AI assistant"}
                </span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {aiAssistantDisabled
              ? "AI assistant is available on dashboard pages — use Explore chat here"
              : aiAssistantOpen
                ? "AI assistant open"
                : "AI assistant closed"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

interface PageHeaderBreadcrumbRowProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeaderBreadcrumbRow({
  breadcrumbs = [],
}: PageHeaderBreadcrumbRowProps) {
  if (breadcrumbs.length === 0) return null;

  return (
    <div className="shrink-0 bg-background px-4 py-4">
      <div className="min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.flatMap((crumb, index) => {
              const items = [];
              items.push(
                <BreadcrumbItem key={`item-${index}`}>
                  {index < breadcrumbs.length - 1 ? (
                    crumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              );
              if (index < breadcrumbs.length - 1) {
                items.push(<BreadcrumbSeparator key={`sep-${index}`} />);
              }
              return items;
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
