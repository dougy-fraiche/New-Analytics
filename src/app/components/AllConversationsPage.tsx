import { useState } from "react";
import { Link } from "react-router";
import { MoreHorizontal, Pencil, Trash2, Archive, Search, ArchiveRestore, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableOverflowMenuColumnClassName,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useConversations } from "../contexts/ConversationContext";
import { toast } from "sonner";
import { BulkActionBar } from "./BulkActionBar";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import { PageContent, PageHeader, pageHeaderTabsFooterClassName } from "./PageChrome";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
// @tanstack/react-virtual is installed and ready for virtualization
// when conversation lists grow beyond ~50 items. Import useVirtualizer
// from "@tanstack/react-virtual" and wrap the TableBody accordingly.

export function AllConversationsPage() {
  const { conversations, renameConversation, archiveConversation, unarchiveConversation, deleteConversation, restoreConversation } = useConversations();
  const [renameDialog, setRenameDialog] = useState<{ conversationId: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");

  const activeConversations = conversations.filter(c => !c.archived);
  const archivedConversations = conversations.filter(c => c.archived);
  const currentList = tab === "active" ? activeConversations : archivedConversations;

  const filteredConversations = currentList.filter((c) => {
    if (!searchQuery) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (selectedIds.size === filteredConversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map((c) => c.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Clear selection when switching tabs
  const handleTabChange = (value: string) => {
    setTab(value as "active" | "archived");
    clearSelection();
    setSearchQuery("");
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    const snapshots = currentList.filter((c) => ids.includes(c.id));
    ids.forEach((id) => deleteConversation(id));
    clearSelection();
    toast.success(`Deleted ${ids.length} draft${ids.length > 1 ? "s" : ""}`, {
      action: {
        label: "Undo",
        onClick: () => {
          snapshots.forEach((s) => restoreConversation(s));
          toast.success("Drafts restored");
        },
      },
    });
  };

  const handleBulkArchive = () => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => archiveConversation(id));
    clearSelection();
    toast.success(`Archived ${ids.length} draft${ids.length > 1 ? "s" : ""}`);
  };

  const handleBulkUnarchive = () => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => unarchiveConversation(id));
    clearSelection();
    toast.success(`Restored ${ids.length} draft${ids.length > 1 ? "s" : ""}`);
  };

  const allChecked = filteredConversations.length > 0 && selectedIds.size === filteredConversations.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < filteredConversations.length;

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="flex flex-col flex-1 min-h-0">
      <PageHeader className={pageHeaderTabsFooterClassName}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl tracking-tight">Draft Insights</h1>
            <Badge variant="secondary" className="shrink-0 text-xs font-normal">
              {activeConversations.length}{" "}
              {activeConversations.length === 1 ? "draft" : "drafts"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Browse and manage your drafts
          </p>
          {currentList.length > 0 && (
            <div className="mt-4 flex w-full flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drafts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSearchQuery("")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </div>
        <TabsList variant="line" className="mt-4">
          <TabsTrigger value="active">Active ({activeConversations.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedConversations.length})</TabsTrigger>
        </TabsList>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <PageContent className="p-8">
        <PageTransition className="space-y-6">
      <HeaderAIInsightsRow
        dashboardId="draft-insights"
        dashboardData={{
          id: "draft-insights",
          title: "Draft Insights",
          description: "Browse and manage your drafts",
        }}
      />
      {currentList.length === 0 ? (
        tab === "active" ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>No drafts yet</EmptyTitle>
              <EmptyDescription>
                Start a draft from the Explore page to get started
              </EmptyDescription>
            </EmptyHeader>
            <Link to="/">
              <Button variant="outline" size="sm">
                Go to Explore
              </Button>
            </Link>
          </Empty>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Archive />
              </EmptyMedia>
              <EmptyTitle>No archived drafts</EmptyTitle>
              <EmptyDescription>
                Archived drafts will appear here
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <>
        {filteredConversations.length > 0 ? (
        <div className="space-y-3">
            <BulkActionBar
              selectedCount={selectedIds.size}
              totalCount={filteredConversations.length}
              onClearSelection={clearSelection}
            >
              {tab === "active" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleBulkArchive}
                  >
                    <Archive className="h-3.5 w-3.5 mr-1.5" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleBulkUnarchive}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </>
              )}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className={tableOverflowMenuColumnClassName}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                    <TableRow
                      key={conversation.id}
                      data-state={selectedIds.has(conversation.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(conversation.id)}
                          onCheckedChange={() => toggleSelected(conversation.id)}
                          aria-label={`Select ${conversation.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/conversation/${conversation.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <span className="font-medium truncate">{conversation.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {conversation.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className={tableOverflowMenuColumnClassName}>
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
                            {tab === "active" ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setRenameDialog({
                                      conversationId: conversation.id,
                                      name: conversation.name,
                                    })
                                  }
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  archiveConversation(conversation.id);
                                  toast.success("Draft archived", {
                                    description: `"${conversation.name}" has been archived.`,
                                    action: {
                                      label: "Undo",
                                      onClick: () => {
                                        unarchiveConversation(conversation.id);
                                        toast.success("Draft restored");
                                      },
                                    },
                                  });
                                }}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const snapshot = { ...conversation };
                                    deleteConversation(conversation.id);
                                    toast.success("Draft deleted", {
                                      description: `"${conversation.name}" has been deleted.`,
                                      action: {
                                        label: "Undo",
                                        onClick: () => {
                                          restoreConversation(snapshot);
                                          toast.success("Draft restored");
                                        },
                                      },
                                    });
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  unarchiveConversation(conversation.id);
                                  toast.success("Draft restored", {
                                    description: `"${conversation.name}" has been restored.`,
                                  });
                                }}>
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const snapshot = { ...conversation };
                                    deleteConversation(conversation.id);
                                    toast.success("Draft deleted", {
                                      description: `"${conversation.name}" has been permanently deleted.`,
                                      action: {
                                        label: "Undo",
                                        onClick: () => {
                                          restoreConversation(snapshot);
                                          toast.success("Draft restored");
                                        },
                                      },
                                    });
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete permanently
                                </DropdownMenuItem>
                              </>
                            )}
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
                <Search />
              </EmptyMedia>
              <EmptyTitle>No drafts match your search</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search query
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        </>
      )}

      {/* Rename Conversation Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename draft</DialogTitle>
            <DialogDescription>Enter a new name for your draft.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-conv">Draft name</Label>
              <Input
                id="rename-conv"
                value={renameDialog?.name || ""}
                onChange={(e) =>
                  setRenameDialog(
                    renameDialog ? { ...renameDialog, name: e.target.value } : null
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameDialog && renameDialog.name.trim()) {
                    renameConversation(renameDialog.conversationId, renameDialog.name);
                    setRenameDialog(null);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renameDialog && renameDialog.name.trim()) {
                  renameConversation(renameDialog.conversationId, renameDialog.name);
                  setRenameDialog(null);
                }
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </PageTransition>
        </PageContent>
      </div>
    </Tabs>
  );
}