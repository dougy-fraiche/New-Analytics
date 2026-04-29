import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

interface AppHeaderProps {
  onSearchClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onActionsSlotRef?: (el: HTMLDivElement | null) => void;
}

export function AppHeader({ breadcrumbs, onActionsSlotRef }: AppHeaderProps) {
  const jumpableBreadcrumbs = (breadcrumbs ?? []).slice(0, -1).filter((crumb) => Boolean(crumb.href));

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center gap-2 bg-background px-4">
      {jumpableBreadcrumbs.length > 0 && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              {jumpableBreadcrumbs.flatMap((crumb, index) => {
                const isLast = index === jumpableBreadcrumbs.length - 1;
                return [
                  <BreadcrumbItem key={`item-${crumb.label}-${crumb.href}-${index}`}>
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href!}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>,
                  !isLast ? <BreadcrumbSeparator key={`sep-${crumb.label}-${crumb.href}-${index}`} /> : null,
                ];
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
