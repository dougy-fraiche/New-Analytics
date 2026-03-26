import {
  PanelLeft,
  Sun,
  Moon,
  Bell,
  HelpCircle,
  Search,
  MessageSquarePlus,
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
import { useTheme } from "next-themes";
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
}

export function TopNavBar({ onSearchClick, breadcrumbs = [], onActionsSlotRef }: TopNavBarProps) {
  const unreadNotifications = 3;
  const { theme, setTheme } = useTheme();
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
              <PanelLeft className="size-4" />
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
      <div className="ml-auto flex items-center gap-0.5">
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

        {/* Dark Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-[transform,opacity] dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-[transform,opacity] dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
        </Tooltip>

        {/* Help Button */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Help</span>
                  </Button>
                </DropdownMenuTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">Help</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Search className="mr-2 h-4 w-4" />
              <span>Search Help Articles</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              <span>Contact Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Documentation</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>What's New</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Bell */}
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
      </div>
    </header>
  );
}
