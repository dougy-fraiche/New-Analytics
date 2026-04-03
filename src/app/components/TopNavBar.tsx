import {
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

interface TopNavBarProps {
  onSearchClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onActionsSlotRef?: (el: HTMLDivElement | null) => void;
  aiAssistantOpen?: boolean;
  onAiAssistantOpenChange?: (open: boolean) => void;
  /** When true (e.g. Explore routes), hide toggle / show disabled control */
  aiAssistantDisabled?: boolean;
}

export function TopNavBar({
  onSearchClick,
  breadcrumbs = [],
  onActionsSlotRef,
  aiAssistantOpen = false,
  onAiAssistantOpenChange,
  aiAssistantDisabled = false,
}: TopNavBarProps) {
  const unreadNotifications = 3;
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const hasBreadcrumbs = breadcrumbs.length > 0;

  return (
    <header className="flex h-16 w-full items-center border-b border-border bg-background shrink-0 z-50 px-4">
      {/* Sidebar toggle */}
      <div className="flex items-center h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={toggleSidebar}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
              <span className="sr-only">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Breadcrumbs */}
      {hasBreadcrumbs && (
        <div className="flex items-center px-3">
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
      )}

      {/* Page-level actions slot (portaled into by child pages) + global actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Page-level actions slot */}
        <div ref={onActionsSlotRef} className="flex items-center gap-1" />

        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
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
              <span className="inline-flex">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 relative">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 500 }}>New recommended action available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Deploy Account Verification AI Agent - High Priority
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 500 }}>Dashboard saved successfully</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Custom Support Analytics Dashboard saved to Q1 Analytics
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 500 }}>Escalation rate alert</p>
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
                className={[
                  "h-8 gap-2",
                  "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary",
                  aiAssistantOpen ? "bg-primary/10 border-primary/60" : "",
                ].join(" ")}
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
