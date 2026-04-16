export const PAGINATED_TABLE_PAGE_SIZE = 10;
export const PAGINATED_TABLE_MIN_PAGES = 3;
export const PAGINATED_TABLE_MAX_PAGES = 7;

export type ExpandRowsArgs<T> = {
  baseRow: T;
  index: number;
  baseIndex: number;
  cycle: number;
  baseLength: number;
};

export function expandRowsForPagination<T>(
  baseRows: T[],
  mutateRow: (args: ExpandRowsArgs<T>) => T,
  options?: {
    pageSize?: number;
    minPages?: number;
    maxPages?: number;
  },
): T[] {
  if (baseRows.length === 0) return [];

  const pageSize = options?.pageSize ?? PAGINATED_TABLE_PAGE_SIZE;
  const minPages = options?.minPages ?? PAGINATED_TABLE_MIN_PAGES;
  const maxPages = options?.maxPages ?? PAGINATED_TABLE_MAX_PAGES;
  const randomPageCount = Math.floor(Math.random() * (maxPages - minPages + 1)) + minPages;
  const rowCount = randomPageCount * pageSize;

  return Array.from({ length: rowCount }, (_, index) => {
    const baseIndex = index % baseRows.length;
    const cycle = Math.floor(index / baseRows.length);
    return mutateRow({
      baseRow: baseRows[baseIndex],
      index,
      baseIndex,
      cycle,
      baseLength: baseRows.length,
    });
  });
}

export function mutateContactId(baseContact: string, duplicateOrdinal: number): string {
  if (duplicateOrdinal <= 0) return baseContact;

  const match = /^([A-Za-z-]+)(\d+)$/.exec(baseContact);
  if (!match) return `${baseContact}-${duplicateOrdinal.toString().padStart(2, "0")}`;

  const [, prefix, digits] = match;
  const next = (Number(digits) + duplicateOrdinal * 97) % 100000;
  return `${prefix}${next.toString().padStart(digits.length, "0")}`;
}

export function shiftMinuteSecondDuration(duration: string, minuteDelta: number, secondDelta = 0): string {
  const match = /^(\d+)m\s+(\d+)s$/.exec(duration.trim());
  if (!match) return duration;

  const minutePart = Number(match[1]);
  const secondPart = Number(match[2]);
  const totalSeconds = Math.max(15, minutePart * 60 + secondPart + minuteDelta * 60 + secondDelta);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
