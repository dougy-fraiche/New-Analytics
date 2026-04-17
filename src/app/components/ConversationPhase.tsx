import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type MutableRefObject,
  type RefObject,
} from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Bookmark,
  Folder,
  FolderPlus,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { showDeletedObjectToast } from "../lib/object-deletion-toast";

import { ConversationDashboardArea } from "./ConversationDashboardArea";
import { useConversations, type Message, type DashboardData } from "../contexts/ConversationContext";
import { useProjects } from "../contexts/ProjectContext";
import { useHeaderActionsSlot } from "../contexts/HeaderActionsSlotContext";
import { generateAIResponse } from "../data/explore-data";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { useDashboardChat } from "../contexts/DashboardChatContext";
import {
  EXPLORE_THREAD_USER_TURN_EVENT,
  getExploreConversationAssistantKey,
} from "../lib/ai-assistant-global";
import { conversationMessageToGlobalChat } from "../lib/conversation-message-to-global-chat";
import { exploreAssistantPartialToGlobalPatch } from "../lib/explore-to-global-ai-patch";
import { buildAnomalyPrimaryFindingModel } from "../lib/anomaly-primary-finding";
import { runPhasedExploreAssistantReply } from "../lib/run-phased-explore-assistant-reply";
import {
  useAiAssistantExploreBridge,
  type ExploreWidgetPromptMeta,
} from "../contexts/AiAssistantExploreBridgeContext";
import {
  getSavedFolderDashboardPath,
  getSavedStandaloneDashboardPath,
  validateSavedFolderName,
  validateSavedFolderDashboardName,
  validateSavedStandaloneDashboardName,
} from "../lib/saved-slugs";

// ── Types ─────────────────────────────────────────────────────────────

interface ConversationPhaseProps {
  query: string;
  onQueryChange: (value: string) => void;
  voice: {
    isListening: boolean;
    isSupported: boolean;
    interimText: string;
    toggle: () => void;
    stop: () => void;
  };
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  currentConversationId: string | null;
  conversationName: string;
  setConversationName: (name: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isThinking: boolean;
  setIsThinking: (v: boolean) => void;
  /** Floating input slide-down animation */
  isInputAnimating: boolean;
  setIsInputAnimating: (v: boolean) => void;
  inputAnimStartTop: number;
  inputAnimStartLeft: number;
  inputAnimStartWidth: number;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Shared with ExplorePage hero send — single generation counter for phased assistant runs. */
  assistantPhaseGenRef: MutableRefObject<number>;
}

// ── Component ─────────────────────────────────────────────────────────

export function ConversationPhase({
  query,
  onQueryChange,
  voice,
  chatInputRef,
  currentConversationId,
  conversationName,
  setConversationName,
  messages,
  setMessages,
  isThinking,
  setIsThinking,
  isInputAnimating,
  setIsInputAnimating,
  inputAnimStartTop,
  inputAnimStartLeft,
  inputAnimStartWidth,
  containerRef,
  assistantPhaseGenRef,
}: ConversationPhaseProps) {
  // ── External hooks ────────────────────────────────────────────────
  const {
    conversations,
    addMessageToConversation,
    patchMessageInConversation,
    renameConversation,
    deleteConversation,
    restoreConversation,
  } = useConversations();
  const {
    projects,
    standaloneDashboards,
    addDashboardToProject,
    addProject,
    addStandaloneDashboard,
  } = useProjects();
  const navigate = useNavigate();
  const headerActionsSlot = useHeaderActionsSlot();
  const dashboardChat = useDashboardChat();
  const { appendMessage, patchMessage } = dashboardChat;
  const { setExploreBridge } = useAiAssistantExploreBridge();

  // ── Local state ───────────────────────────────────────────────────
  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("__root__");
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [justCreatedFolderId, setJustCreatedFolderId] = useState<string | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<Record<string, { name: string; path: string }>>({});

  // Rename / delete dialogs
  const [renameConvDialogOpen, setRenameConvDialogOpen] = useState(false);
  const [renameConvName, setRenameConvName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ── Derive latest dashboard from messages ─────────────────────────
  const latestDashboard = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].dashboardData) return messages[i].dashboardData!;
    }
    return null;
  }, [messages]);

  const anomalyPrimaryFindingModel = useMemo(() => {
    if (latestDashboard) return null;
    return buildAnomalyPrimaryFindingModel(messages, { isThinking });
  }, [isThinking, latestDashboard, messages]);

  const hasCompletedAssistantMessage = useMemo(
    () => messages.some((message) => message.role === "assistant" && message.content.trim().length > 0),
    [messages],
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useKeyboardShortcut({
    id: "conversation:save-dashboard",
    key: "S",
    meta: true,
    shift: true,
    handler: (e: KeyboardEvent) => {
      e.preventDefault();
      if (latestDashboard && !savedDashboards[latestDashboard.id]) {
        handleSaveDashboardFromArea(latestDashboard);
      }
    },
    priority: 20,
  });

  // ── Message handlers ──────────────────────────────────────────────
  const conversationIdRef = useRef(currentConversationId);
  conversationIdRef.current = currentConversationId;

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const handleCancelExploreInFlight = useCallback(() => {
    assistantPhaseGenRef.current += 1;
    setIsThinking(false);
    const convId = currentConversationId;
    if (!convId) return;
    const conversationAssistantKey = getExploreConversationAssistantKey(convId);
    const prev = messagesRef.current;
    const last = prev[prev.length - 1];
    if (last?.role !== "assistant") return;
    const partial: Partial<Message> = {
      content: last.content.trim() ? last.content : "Stopped.",
      isTypingContent: false,
      toolSteps: undefined,
    };
    patchMessageInConversation(convId, last.id, partial);
    const g = exploreAssistantPartialToGlobalPatch(partial);
    if (Object.keys(g).length > 0) {
      patchMessage(conversationAssistantKey, last.id, g);
    }
    setMessages((p) => p.map((m) => (m.id === last.id ? { ...m, ...partial } : m)));
  }, [
    assistantPhaseGenRef,
    currentConversationId,
    patchMessage,
    patchMessageInConversation,
    setIsThinking,
    setMessages,
  ]);

  const handleUserMessage = useCallback(
    (
      message: string,
      meta?: ExploreWidgetPromptMeta,
    ) => {
      if (!message.trim() || !currentConversationId) return;

      voice.stop();
      window.dispatchEvent(new Event(EXPLORE_THREAD_USER_TURN_EVENT));

      const targetConversationId = currentConversationId;
      const conversationAssistantKey =
        getExploreConversationAssistantKey(targetConversationId);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
        ...meta,
      };
      addMessageToConversation(targetConversationId, userMessage);
      appendMessage(conversationAssistantKey, conversationMessageToGlobalChat(userMessage));
      setMessages((prev) => [...prev, userMessage]);
      onQueryChange("");
      setIsThinking(true);

      const gen = ++assistantPhaseGenRef.current;
      const assistantId = crypto.randomUUID();
      const aiResponse = generateAIResponse(message);
      const stub: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      addMessageToConversation(targetConversationId, stub);
      appendMessage(conversationAssistantKey, conversationMessageToGlobalChat(stub));
      setMessages((prev) => [...prev, stub]);

      void runPhasedExploreAssistantReply({
        conversationId: targetConversationId,
        assistantId,
        final: aiResponse,
        isCancelled: () =>
          gen !== assistantPhaseGenRef.current ||
          conversationIdRef.current !== targetConversationId,
        patchMessageInConversation,
        patchGlobalMessage: (messageId, partial) =>
          patchMessage(conversationAssistantKey, messageId, partial),
        syncLocalMessages: (updater) => setMessages(updater),
      }).finally(() => {
        if (gen === assistantPhaseGenRef.current) {
          setIsThinking(false);
        }
      });
    },
    [
      assistantPhaseGenRef,
      currentConversationId,
      addMessageToConversation,
      appendMessage,
      patchMessage,
      patchMessageInConversation,
      setMessages,
      onQueryChange,
      setIsThinking,
      voice.stop,
    ],
  );

  useEffect(() => {
    setExploreBridge({
      isThinking,
      onSend: handleUserMessage,
      onCancelInFlight: handleCancelExploreInFlight,
    });
    return () =>
      setExploreBridge({ isThinking: false, onSend: null, onCancelInFlight: null });
  }, [isThinking, handleUserMessage, handleCancelExploreInFlight, setExploreBridge]);

  const handleWidgetPrompt = useCallback(
    (
      widgetTitle: string,
      message: string,
      chartType?: string,
      widgetAnchorId?: string,
      selectedKpiLabel?: string | null,
      widgetSourcePath?: string,
    ) => {
      const kpi = selectedKpiLabel?.trim();
      handleUserMessage(message, {
        widgetRef: widgetTitle,
        widgetIconType: chartType,
        widgetAnchorId,
        widgetSourcePath,
        ...(kpi ? { widgetKpiLabel: kpi } : {}),
      });
    },
    [handleUserMessage],
  );

  // ── Dashboard save handlers ───────────────────────────────────────
  const handleSaveDashboard = () => {
    if (!latestDashboard || !dashboardName.trim()) return;

    const trimmedName = dashboardName.trim();
    let savedPath: string;
    const desc = dashboardDescription.trim() || undefined;
    if (selectedProjectId === "__root__") {
      const validationError = validateSavedStandaloneDashboardName(
        trimmedName,
        projects,
        standaloneDashboards,
      );
      if (validationError) {
        toast.error(validationError);
        return;
      }
      const newDb = addStandaloneDashboard(trimmedName, undefined, desc);
      savedPath = getSavedStandaloneDashboardPath(newDb);
    } else {
      const validationError = validateSavedFolderDashboardName(
        selectedProjectId,
        trimmedName,
        projects,
      );
      if (validationError) {
        toast.error(validationError);
        return;
      }
      const targetProject = projects.find((project) => project.id === selectedProjectId);
      if (!targetProject) {
        toast.error("Destination folder not found.");
        return;
      }
      const newDb = addDashboardToProject(selectedProjectId, trimmedName, undefined, desc);
      savedPath = getSavedFolderDashboardPath(targetProject, newDb);
    }

    setSavedDashboards((prev) => ({
      ...prev,
      [latestDashboard.id]: { name: trimmedName, path: savedPath },
    }));

    setSaveDialogOpen(false);
    setDashboardName("");
    setDashboardDescription("");
    setSelectedProjectId("__root__");
    setIsCreatingFolder(false);
    setNewFolderName("");
    setLocationPopoverOpen(false);
    toast.success("Dashboard saved successfully!");
    // Saved dashboards should no longer appear as active conversations.
    if (currentConversationId) {
      dashboardChat.clearMessages(
        getExploreConversationAssistantKey(currentConversationId),
      );
      deleteConversation(currentConversationId);
    }
    // Move from conversation draft view to the persisted dashboard destination.
    navigate(savedPath);
  };

  const handleCreateFolderAndSelect = () => {
    if (!newFolderName.trim()) return;
    const trimmedFolderName = newFolderName.trim();
    const validationError = validateSavedFolderName(
      trimmedFolderName,
      projects,
      standaloneDashboards,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const newProject = addProject(trimmedFolderName);
    setSelectedProjectId(newProject.id);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setJustCreatedFolderId(newProject.id);
    setTimeout(() => setJustCreatedFolderId(null), 1500);
    toast.success(`Folder "${newProject.name}" created`);
  };

  const handleSaveDashboardFromArea = (dashboard: DashboardData) => {
    setDashboardName(dashboard.title);
    setDashboardDescription(dashboard.description || "");
    setSelectedProjectId("__root__");
    setIsCreatingFolder(false);
    setNewFolderName("");
    setLocationPopoverOpen(false);
    setSaveDialogOpen(true);
  };

  // ── Rename / delete handlers ──────────────────────────────────────
  const handleRenameTitle = (newTitle: string) => {
    if (!newTitle.trim()) return;
    if (currentConversationId) {
      renameConversation(currentConversationId, newTitle);
      setConversationName(newTitle);
    }
    toast.success("Conversation renamed", {
      description: `Renamed to "${newTitle}".`,
    });
  };

  const handleDeleteConversation = () => {
    if (currentConversationId) {
      const snapshot = conversations.find((c) => c.id === currentConversationId);
      const conversationAssistantKey =
        getExploreConversationAssistantKey(currentConversationId);
      const assistantSnapshot = dashboardChat.getMessages(conversationAssistantKey);
      dashboardChat.clearMessages(conversationAssistantKey);
      deleteConversation(currentConversationId);
      setDeleteConfirmOpen(false);
      showDeletedObjectToast({
        objectType: "Conversation",
        objectName: snapshot?.name,
        onUndo: snapshot
          ? () => {
              restoreConversation(snapshot);
              if (assistantSnapshot.length > 0) {
                dashboardChat.setMessages(conversationAssistantKey, assistantSnapshot);
              }
            }
          : undefined,
      });
      navigate("/");
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── Main content area (left): Dashboard / empty state ─── */}
      <div key="conversation" className="h-full min-h-0">
        <ConversationDashboardArea
          isThinking={isThinking && !latestDashboard}
          dashboardData={latestDashboard}
          anomalyPrimaryFinding={anomalyPrimaryFindingModel}
          conversationTitle={conversationName}
          hasCompletedAssistantMessage={hasCompletedAssistantMessage}
          onWidgetPrompt={handleWidgetPrompt}
          onSave={handleSaveDashboardFromArea}
          isSaved={latestDashboard ? !!savedDashboards[latestDashboard.id] : false}
          onRename={() => {
            setRenameConvName(conversationName);
            setRenameConvDialogOpen(true);
          }}
          onDelete={() => setDeleteConfirmOpen(true)}
        />
      </div>

      {/* ─── Save Dashboard Dialog ─────────────────────────── */}
      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          setSaveDialogOpen(open);
          if (!open) {
            setIsCreatingFolder(false);
            setNewFolderName("");
            setLocationPopoverOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Dashboard</DialogTitle>
            <DialogDescription>Choose a location to save this dashboard to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Dashboard name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Add a description for this dashboard..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Popover
                open={locationPopoverOpen}
                onOpenChange={(open) => {
                  setLocationPopoverOpen(open);
                  if (!open) {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={locationPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {selectedProjectId === "__root__" ? (
                        <>
                          <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {projects.find((p) => p.id === selectedProjectId)?.name ??
                            "Select a location"}
                        </>
                      )}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none cursor-pointer"
                      onClick={() => {
                        setSelectedProjectId("__root__");
                        setLocationPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${selectedProjectId === "__root__" ? "opacity-100" : "opacity-0"}`}
                      />
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Saved</span>
                    </button>
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setLocationPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 ${selectedProjectId === project.id ? "opacity-100" : "opacity-0"}`}
                        />
                        <Folder
                          className={`h-3.5 w-3.5 shrink-0 ${justCreatedFolderId === project.id ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))}
                  </div>
                  <Separator />
                  <div className="p-1">
                    {isCreatingFolder ? (
                      <div className="flex items-center gap-1.5 px-1 py-1">
                        <FolderPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          className="h-7 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" && newFolderName.trim()) {
                              handleCreateFolderAndSelect();
                            }
                            if (e.key === "Escape") {
                              setIsCreatingFolder(false);
                              setNewFolderName("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={!newFolderName.trim()}
                          onClick={handleCreateFolderAndSelect}
                        >
                          Create
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground outline-none cursor-pointer"
                        onClick={() => setIsCreatingFolder(true)}
                      >
                        <FolderPlus className="h-3.5 w-3.5 shrink-0" />
                        <span>New Folder</span>
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!dashboardName.trim()} onClick={handleSaveDashboard}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Rename Conversation Dialog ────────────────────── */}
      <Dialog open={renameConvDialogOpen} onOpenChange={setRenameConvDialogOpen}>
        <DialogContent className="sm:max-w-[25rem]">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label className="sr-only" htmlFor="conv-rename-name">Name</Label>
            <Input
              id="conv-rename-name"
              value={renameConvName}
              onChange={(e) => setRenameConvName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameConvName.trim()) {
                  handleRenameTitle(renameConvName.trim());
                  setRenameConvDialogOpen(false);
                }
              }}
              placeholder="Conversation name"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameConvDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!renameConvName.trim()}
              onClick={() => {
                if (renameConvName.trim()) {
                  handleRenameTitle(renameConvName.trim());
                }
                setRenameConvDialogOpen(false);
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Conversation Confirmation ──────────────── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &ldquo;{conversationName}&rdquo; and all of its messages. You can
              undo this action from the notification toast.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
