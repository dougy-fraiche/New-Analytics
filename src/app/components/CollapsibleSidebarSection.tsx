import { type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent } from "./ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "./ui/sidebar";

interface CollapsibleSidebarSectionProps {
  /** The lucide icon component to display */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Display label */
  label: string;
  /** Route path for the section header link */
  path: string;
  /** Whether the section is expanded */
  open: boolean;
  /** Toggle handler */
  onToggle: (open: boolean) => void;
  /** Tooltip text (defaults to label) */
  tooltip?: string;
  /** Child items rendered inside SidebarMenuSub */
  children: ReactNode;
  /** Optional className override for the SidebarGroup wrapper */
  className?: string;
  /** When set, overrides pathname === path for header highlight (e.g. nested routes) */
  headerIsActive?: boolean;
  /** Optional control on the right of the row (e.g. `SidebarMenuAction`); hidden when sidebar is icon-collapsed */
  itemAction?: ReactNode;
}

export function CollapsibleSidebarSection({
  icon: Icon,
  label,
  path,
  open,
  onToggle,
  tooltip,
  children,
  className = "py-0",
  headerIsActive: headerIsActiveProp,
  itemAction,
}: CollapsibleSidebarSectionProps) {
  const location = useLocation();
  const isActive =
    headerIsActiveProp !== undefined ? headerIsActiveProp : location.pathname === path;

  const chevronToggleLabel = open ? "Collapse" : "Expand";

  return (
    <SidebarGroup className={className}>
      <Collapsible open={open} onOpenChange={onToggle}>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive} tooltip={tooltip || label}>
                <div className="group/section-row relative flex w-full min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center has-[button:focus-visible]:[&_[data-section-icon]>svg]:opacity-0">
                  <Link
                    to={path}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-hidden ring-sidebar-ring focus-visible:ring-2 group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:flex-1 group-data-[collapsible=icon]:justify-center"
                  >
                    <span
                      data-section-icon
                      className="relative inline-flex size-4 shrink-0 items-center justify-center"
                    >
                      <Icon
                        className="size-4 shrink-0 opacity-100 group-hover/section-row:opacity-0 group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:group-hover/section-row:opacity-100"
                        aria-hidden
                      />
                    </span>
                    <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
                  </Link>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-label={chevronToggleLabel}
                        className="absolute left-2 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-sm text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-0 opacity-0 pointer-events-none group-hover/section-row:pointer-events-auto group-hover/section-row:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 group-data-[collapsible=icon]:hidden"
                        onMouseDown={(e) => {
                          if (e.button === 0) e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggle(!open);
                        }}
                      >
                        <ChevronRight
                          className={`size-4 shrink-0 ${open ? "rotate-90" : ""}`}
                          aria-hidden
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6} align="center">
                      {chevronToggleLabel}
                    </TooltipContent>
                  </Tooltip>
                  {itemAction ? (
                    <div className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 group-data-[collapsible=icon]:hidden">
                      {itemAction}
                    </div>
                  ) : null}
                </div>
              </SidebarMenuButton>
              <CollapsibleContent>
                <SidebarMenuSub>{children}</SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </Collapsible>
    </SidebarGroup>
  );
}
