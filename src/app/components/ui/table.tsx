"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { cn } from "./utils";

/** 56px at 16px root — default width for table columns that only contain a kebab/overflow control. */
export const tableOverflowMenuColumnClassName =
  "w-[3.5rem] min-w-[3.5rem] max-w-[3.5rem] box-border px-1 text-right align-middle";

type SortDirection = "asc" | "desc";

interface TableContextValue {
  sortColumn: number | null;
  sortDirection: SortDirection;
  setSortColumn: (column: number) => void;
  columnWidths: Record<number, number>;
  setColumnWidth: (column: number, width: number) => void;
  columnCount: number;
  setColumnCount: (count: number) => void;
}

const TableContext = React.createContext<TableContextValue | null>(null);

function useTableContext() {
  const ctx = React.useContext(TableContext);
  if (!ctx) return null;
  return ctx;
}

function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join(" ");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

function parseSortableValue(value: string): string | number {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "high") return 3;
  if (lower === "medium") return 2;
  if (lower === "low") return 1;
  const numeric = Number(trimmed.replace(/[,%$]/g, ""));
  if (!Number.isNaN(numeric) && trimmed !== "") return numeric;
  const date = Date.parse(trimmed);
  if (!Number.isNaN(date)) return date;
  return trimmed.toLowerCase();
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  const [sortColumn, setSortColumnState] = React.useState<number | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");
  const [columnWidths, setColumnWidths] = React.useState<Record<number, number>>({});
  const [columnCount, setColumnCount] = React.useState(0);

  const setSortColumn = React.useCallback((column: number) => {
    setSortColumnState((prev) => {
      if (prev === column) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("asc");
      return column;
    });
  }, []);

  const setColumnWidth = React.useCallback((column: number, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [column]: width }));
  }, []);

  const contextValue = React.useMemo<TableContextValue>(
    () => ({
      sortColumn,
      sortDirection,
      setSortColumn,
      columnWidths,
      setColumnWidth,
      columnCount,
      setColumnCount,
    }),
    [sortColumn, sortDirection, setSortColumn, columnWidths, setColumnWidth, columnCount],
  );

  return (
    <TableContext.Provider value={contextValue}>
      <div
        data-slot="table-container"
        className="relative w-full overflow-x-hidden rounded-xl border bg-card"
      >
        <table
          data-slot="table"
          className={cn("w-full table-fixed caption-bottom text-sm", className)}
          {...props}
        >
          {columnCount > 0 ? (
            <colgroup>
              {Array.from({ length: columnCount }).map((_, index) => (
                <col
                  key={index}
                  style={
                    columnWidths[index] ? { width: `${columnWidths[index]}px` } : undefined
                  }
                />
              ))}
            </colgroup>
          ) : null}
          {props.children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const ctx = useTableContext();
  const rowChildren = React.Children.toArray(props.children);
  const firstRow = rowChildren[0];
  const columnCount = React.isValidElement<{ children?: React.ReactNode }>(firstRow)
    ? React.Children.toArray(firstRow.props.children).length
    : 0;

  React.useEffect(() => {
    if (ctx && columnCount > 0) {
      ctx.setColumnCount(columnCount);
    }
  }, [ctx, columnCount]);

  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:bg-muted/30", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const ctx = useTableContext();
  const rows = React.Children.toArray(props.children);

  const sortedRows = React.useMemo(() => {
    if (!ctx || ctx.sortColumn === null) return rows;

    return [...rows].sort((a, b) => {
      if (!React.isValidElement<{ children?: React.ReactNode }>(a)) return 0;
      if (!React.isValidElement<{ children?: React.ReactNode }>(b)) return 0;

      const aCells = React.Children.toArray(a.props.children);
      const bCells = React.Children.toArray(b.props.children);
      const aCell = aCells[ctx.sortColumn];
      const bCell = bCells[ctx.sortColumn];

      const aValue = parseSortableValue(getNodeText(aCell));
      const bValue = parseSortableValue(getNodeText(bCell));

      if (aValue === bValue) return 0;
      if (ctx.sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue > bValue ? -1 : 1;
    });
  }, [rows, ctx]);

  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    >
      {sortedRows}
    </tbody>
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const ctx = useTableContext();
  const ref = React.useRef<HTMLTableCellElement>(null);
  const [columnIndex, setColumnIndex] = React.useState(-1);
  const headerContent = props.children;
  const isSortableTextColumn =
    (typeof headerContent === "string" || typeof headerContent === "number") &&
    String(headerContent).trim().length > 0;

  React.useEffect(() => {
    const element = ref.current;
    if (!element || !element.parentElement) return;
    setColumnIndex(Array.from(element.parentElement.children).indexOf(element));
  }, [props.children]);

  const onResizeStart = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (!ctx || !ref.current || !isSortableTextColumn) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    if (columnIndex < 0) return;
    const startWidth = ref.current.getBoundingClientRect().width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      ctx.setColumnWidth(columnIndex, Math.max(80, startWidth + delta));
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onSort = () => {
    if (!ctx || columnIndex < 0 || !isSortableTextColumn) return;
    ctx.setSortColumn(columnIndex);
  };

  const isSorted = isSortableTextColumn && ctx?.sortColumn === columnIndex;

  return (
    <th
      ref={ref}
      data-slot="table-head"
      className={cn(
        "text-foreground group/th relative h-10 overflow-hidden text-ellipsis pr-2 pl-4 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    >
      <span
        role={isSortableTextColumn ? "button" : undefined}
        tabIndex={isSortableTextColumn ? 0 : -1}
        onClick={isSortableTextColumn ? onSort : undefined}
        onKeyDown={(event) => {
          if (!isSortableTextColumn) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSort();
          }
        }}
        className={cn(
          "inline-flex items-center gap-1",
          isSortableTextColumn ? "cursor-pointer hover:text-foreground/80" : "",
        )}
      >
        <span>{props.children}</span>
        {isSortableTextColumn ? (
          <ChevronsUpDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground",
              isSorted ? "opacity-100" : "opacity-60",
            )}
          />
        ) : null}
      </span>
      <span
        role="separator"
        aria-label="Resize column"
        onMouseDown={isSortableTextColumn ? onResizeStart : undefined}
        className={cn(
          "absolute right-0 top-0 h-full w-2 opacity-0 transition-opacity",
          isSortableTextColumn ? "cursor-col-resize group-hover/th:opacity-100" : "pointer-events-none",
        )}
      />
    </th>
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "overflow-hidden text-ellipsis py-2 pr-2 pl-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
