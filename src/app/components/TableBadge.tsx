import type { ComponentProps } from "react";

import { Badge } from "./ui/badge";

type TableBadgeProps = Omit<ComponentProps<typeof Badge>, "size">;

export function TableBadge(props: TableBadgeProps) {
  return <Badge size="default" {...props} />;
}
