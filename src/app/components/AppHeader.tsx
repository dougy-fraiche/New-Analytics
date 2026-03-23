import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import React from "react";

interface AppHeaderProps {
  onSearchClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onActionsSlotRef?: (el: HTMLDivElement | null) => void;
}

export function AppHeader({ breadcrumbs, onActionsSlotRef }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center gap-2 bg-background px-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <>
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
        </>
      )}

      {/* Right-aligned slot for page-level actions (portaled by child pages) */}
      <div ref={onActionsSlotRef} className="ml-auto flex items-center gap-2" />
    </header>
  );
}