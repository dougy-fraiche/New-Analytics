import { createContext, useContext } from "react";

export interface PageBreadcrumb {
  label: string;
  href?: string;
}

export const PageBreadcrumbsContext = createContext<PageBreadcrumb[]>([]);

export function usePageBreadcrumbs() {
  return useContext(PageBreadcrumbsContext);
}

