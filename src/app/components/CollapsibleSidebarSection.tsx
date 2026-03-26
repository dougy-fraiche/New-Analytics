import { type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
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
}: CollapsibleSidebarSectionProps) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <SidebarGroup className={className}>
      <Collapsible open={open} onOpenChange={onToggle}>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive} tooltip={tooltip || label}>
                <Link to={path}>
                  <Icon />
                  <span>{label}</span>
                  <CollapsibleTrigger asChild>
                    <button
                      className={`ml-auto flex h-5 w-5 items-center justify-center rounded-sm text-sidebar-foreground transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-hidden group-data-[collapsible=icon]:hidden ${
                        open
                          ? "opacity-100"
                          : "opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggle(!open);
                      }}
                      aria-label={`Toggle ${label}`}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                </Link>
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
