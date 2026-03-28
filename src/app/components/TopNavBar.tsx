import {
  PanelLeft,
  Sun,
  Moon,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "./ui/button";
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

        {/* Global AI Assistant toggle (single thread — not used on Explore) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className={`size-8 ${aiAssistantOpen ? "bg-accent text-accent-foreground" : ""}`}
                disabled={aiAssistantDisabled}
                aria-pressed={aiAssistantOpen}
                onClick={() => onAiAssistantOpenChange?.(!aiAssistantOpen)}
              >
                <Sparkles className="h-4 w-4" />
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
