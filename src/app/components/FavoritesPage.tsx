import { useState } from "react";
import { Link } from "react-router";
import { Pin, LayoutDashboard, PinOff, Search, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useProjects } from "../contexts/ProjectContext";
import { findCategoryForDashboard } from "../data/ootb-dashboards";
import { toast } from "sonner";
import { BulkActionBar } from "./BulkActionBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import { PageTransition } from "./PageTransition";

export function FavoritesPage() {
  const { favorites, toggleFavorite, removeFavorites, restoreFavorites } = useProjects();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFavorites = favorites.filter((f) => {
    if (!searchQuery) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredFavorites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFavorites.map((f) => f.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkUnpin = () => {
    const ids = Array.from(selectedIds);
    const snapshot = favorites.filter((f) => ids.includes(f.id));
    removeFavorites(ids);
    clearSelection();
    toast.success(`Unpinned ${ids.length} dashboard${ids.length !== 1 ? "s" : ""}`, {
      action: {
        label: "Undo",
        onClick: () => {
          restoreFavorites(snapshot);
          toast.success("Pinned items restored");
        },
      },
    });
  };

  const allChecked = filteredFavorites.length > 0 && selectedIds.size === filteredFavorites.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < filteredFavorites.length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="shrink-0 sticky top-0 z-10 bg-background px-8 pt-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight">Pinned</h1>
            <p className="text-muted-foreground mt-2">
              Dashboards you&rsquo;ve pinned for quick access
            </p>
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto">
        <PageTransition className="space-y-6 p-8">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {favorites.length} {favorites.length === 1 ? "pin" : "pinned"}
        </Badge>
      </div>

      {/* Favorites Table */}
      {favorites.length > 0 ? (
        <>
        {/* Search */}
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pinned..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </Button>
            )}
        </div>

        {filteredFavorites.length > 0 ? (
        <div className="space-y-3">
            <BulkActionBar
              selectedCount={selectedIds.size}
              totalCount={filteredFavorites.length}
              onClearSelection={clearSelection}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleBulkUnpin}
              >
                <PinOff className="h-3.5 w-3.5 mr-1.5" />
                Unpin
              </Button>
            </BulkActionBar>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allChecked ? true : someChecked ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Dashboard Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFavorites.map((fav) => (
                    <TableRow
                      key={fav.id}
                      data-state={selectedIds.has(fav.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(fav.id)}
                          onCheckedChange={() => toggleSelected(fav.id)}
                          aria-label={`Select ${fav.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to={fav.path}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{fav.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fav.path.startsWith("/project/")
                          ? "Custom Folder"
                          : (findCategoryForDashboard(fav.id)?.name ?? "Observability")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                  </Button>
                                </DropdownMenuTrigger>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">More options</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const snapshot = { ...fav };
                                toggleFavorite(fav);
                                toast.success("Unpinned", {
                                  description: `"${fav.name}" has been unpinned.`,
                                  action: {
                                    label: "Undo",
                                    onClick: () => {
                                      toggleFavorite(snapshot);
                                      toast.success("Pinned again");
                                    },
                                  },
                                });
                              }}
                            >
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
        </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Pin />
              </EmptyMedia>
              <EmptyTitle>No pinned items match your search</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search query
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Pin />
            </EmptyMedia>
            <EmptyTitle>No pinned items yet</EmptyTitle>
            <EmptyDescription>
              Pin dashboards from Observability or Saved to add them here for quick access.
            </EmptyDescription>
          </EmptyHeader>
          <Link to="/observability">
            <Button variant="outline" size="sm">
              Browse Dashboards
            </Button>
          </Link>
        </Empty>
      )}
        </PageTransition>
      </div>
    </div>
  );
}