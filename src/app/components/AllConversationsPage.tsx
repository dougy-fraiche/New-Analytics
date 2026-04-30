import { useState } from "react";
import { Link } from "react-router";
import { MoreHorizontal, Pencil, Trash2, Search, MessageSquare, RotateCcw } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useConversations } from "../contexts/ConversationContext";
import { useDashboardChat } from "../contexts/DashboardChatContext";
import { getExploreConversationAssistantKey } from "../lib/ai-assistant-global";
import { BulkActionBar } from "./BulkActionBar";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { showDeletedObjectToast, showObjectDeletionToast } from "../lib/object-deletion-toast";
import { ROUTES } from "../routes";
import {
  responsiveFilterActionButtonClassName,
  responsiveFilterRowClassName,
  responsiveFilterSearchWrapClassName,
} from "./HeaderFilters";
// @tanstack/react-virtual is installed and ready for virtualization
// when conversation lists grow beyond ~50 items. Import useVirtualizer
// from "@tanstack/react-virtual" and wrap the TableBody accordingly.

export function AllConversationsPage() {
  const { conversations, renameConversation, deleteConversation, restoreConversation } = useConversations();
  const dashboardChat = useDashboardChat();
  const [renameDialog, setRenameDialog] = useState<{ conversationId: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const activeConversations = conversations.filter(c => !c.archived);
  const currentList = activeConversations;

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

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    const snapshots = currentList.filter((c) => ids.includes(c.id));
    const assistantSnapshots = new Map(
      ids.map((id) => [
        id,
        dashboardChat.getMessages(getExploreConversationAssistantKey(id)),
      ]),
    );
    ids.forEach((id) => {
      deleteConversation(id);
      dashboardChat.clearMessages(getExploreConversationAssistantKey(id));
    });
    clearSelection();
    showObjectDeletionToast({
      title: `Deleted ${ids.length} conversation${ids.length > 1 ? "s" : ""}`,
      onUndo: () => {
        snapshots.forEach((s) => {
          restoreConversation(s);
          const assistantSnapshot = assistantSnapshots.get(s.id);
          if (assistantSnapshot && assistantSnapshot.length > 0) {
            dashboardChat.setMessages(
              getExploreConversationAssistantKey(s.id),
              assistantSnapshot,
            );
          }
        });
      },
      restoredTitle: "Conversations restored",
    });
  };

  const allChecked = filteredConversations.length > 0 && selectedIds.size === filteredConversations.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < filteredConversations.length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
        <section>
          <section className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl tracking-tight">Conversations</h1>
            <Badge variant="secondary" className="shrink-0 text-xs font-normal">
              {activeConversations.length}{" "}
              {activeConversations.length === 1 ? "conversation" : "conversations"}
            </Badge>
          </section>
          <p className="text-muted-foreground mt-2">
            Browse and manage your conversations
          </p>
          {currentList.length > 0 && (
            <div className={responsiveFilterRowClassName}>
              <div className={responsiveFilterSearchWrapClassName}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search conversations"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={responsiveFilterActionButtonClassName}
                  onClick={() => setSearchQuery("")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </section>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
        <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
      <HeaderAIInsightsRow
        dashboardId="conversation-insights"
        dashboardData={{
          id: "conversation-insights",
          title: "Conversations",
          description: "Browse and manage your conversations",
        }}
      />
      {currentList.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>No conversations yet</EmptyTitle>
            <EmptyDescription>
              Start a conversation from the Explore page to get started
            </EmptyDescription>
          </EmptyHeader>
          <Link to="/">
            <Button variant="outline" size="sm">
              Go to Explore
            </Button>
          </Link>
        </Empty>
      ) : (
        <>
        {filteredConversations.length > 0 ? (
        <div className="space-y-3">
            <BulkActionBar
              selectedCount={selectedIds.size}
              totalCount={filteredConversations.length}
              onClearSelection={clearSelection}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
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
                          to={ROUTES.CONVERSATION(conversation.id)}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <span className="font-normal truncate">{conversation.name}</span>
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
                            </TooltipTrigger>
                            <TooltipContent side="left">More options</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
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
                            <DropdownMenuItem
                              onClick={() => {
                                const snapshot = { ...conversation };
                                const assistantKey = getExploreConversationAssistantKey(
                                  conversation.id,
                                );
                                const assistantSnapshot = dashboardChat.getMessages(assistantKey);
                                deleteConversation(conversation.id);
                                dashboardChat.clearMessages(assistantKey);
                                showDeletedObjectToast({
                                  objectType: "Conversation",
                                  objectName: conversation.name,
                                  onUndo: () => {
                                    restoreConversation(snapshot);
                                    if (assistantSnapshot.length > 0) {
                                      dashboardChat.setMessages(
                                        assistantKey,
                                        assistantSnapshot,
                                      );
                                    }
                                  },
                                });
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
                <Search />
              </EmptyMedia>
              <EmptyTitle>No conversations match your search</EmptyTitle>
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
        <DialogContent className="sm:max-w-[25rem]">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label className="sr-only" htmlFor="rename-conv">Conversation name</Label>
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
        </div>
      </div>
    </div>
  );
}
