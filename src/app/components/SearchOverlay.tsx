import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import {
  Folder,
  FileText,
  MessageSquare,
  Compass,
  Clock,
  X,
  Activity,
  Bot,
  Sparkles,
  Settings,
  Bookmark,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useProjects } from "../contexts/ProjectContext";
import { useConversations } from "../contexts/ConversationContext";
import { ootbCategories } from "../data/ootb-dashboards";
import { ROUTES } from "../routes";

const RECENT_SEARCHES_KEY = "search-recent";
const MAX_RECENT = 5;

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "navigation" | "dashboards" | "conversations" | "folders">("all");
  const { projects, standaloneDashboards } = useProjects();
  const { conversations } = useConversations();
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const activeConversations = conversations.filter(c => !c.archived);

  // Cmd+K to toggle search — via central shortcut registry
  useKeyboardShortcut({
    id: "global:search-toggle",
    key: "k",
    meta: true,
    allowInInputs: true, // Cmd+K should work even when typing
    handler: (e: KeyboardEvent) => {
      e.preventDefault();
      onOpenChange(!open);
    },
    priority: 50, // high priority — search toggle always wins
  });

  // Reset filter and search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
      setTypeFilter("all");
    }
  }, [open]);

  const addRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const handleSelect = (path: string, label?: string) => {
    if (label) addRecentSearch(label);
    onOpenChange(false);
    navigate(path);
  };

  const show = (type: "navigation" | "dashboards" | "conversations" | "folders") =>
    typeFilter === "all" || typeFilter === type;

  const filterButtons: Array<{ value: typeof typeFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "navigation", label: "Pages" },
    { value: "dashboards", label: "Dashboards" },
    { value: "conversations", label: "Drafts" },
    { value: "folders", label: "Folders" },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search dashboards, drafts, pages..."
        value={search}
        onValueChange={setSearch}
      />

      {/* Type filter pills */}
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={typeFilter === btn.value ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs px-2.5 rounded-full"
            onClick={() => setTypeFilter(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Searches (only when no search query and filter is "all") */}
        {!search && typeFilter === "all" && recentSearches.length > 0 && (
          <>
            <CommandGroup heading={
              <span className="flex items-center justify-between w-full">
                <span>Recent Searches</span>
                <button
                  onClick={(e) => { e.stopPropagation(); clearRecentSearches(); }}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              </span>
            }>
              {recentSearches.map((recent, i) => (
                <CommandItem
                  key={`recent-${i}`}
                  value={`recent-${recent}`}
                  onSelect={() => setSearch(recent)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{recent}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Navigation */}
        {show("navigation") && (
          <>
            <CommandGroup heading="Navigation">
              <CommandItem value="Explore" onSelect={() => handleSelect(ROUTES.EXPLORE, "Explore")}>
                <Compass className="mr-2 h-4 w-4" />
                <span>Explore</span>
                <span className="ml-auto text-xs text-muted-foreground">E</span>
              </CommandItem>
              <CommandItem value="Observability" onSelect={() => handleSelect(ROUTES.OBSERVABILITY, "Observability")}>
                <Activity className="mr-2 h-4 w-4" />
                <span>Observability</span>
              </CommandItem>
              <CommandItem
                value="Automation Opportunities"
                onSelect={() => handleSelect(ROUTES.AUTOMATION_OPPORTUNITIES, "Automation Opportunities")}
              >
                <Bot className="mr-2 h-4 w-4" />
                <span>Automation Opportunities</span>
              </CommandItem>
              <CommandItem value="Saved" onSelect={() => handleSelect(ROUTES.SAVED, "Saved")}>
                <Bookmark className="mr-2 h-4 w-4" />
                <span>Saved</span>
              </CommandItem>
              <CommandItem value="Recommended Actions" onSelect={() => handleSelect(ROUTES.RECOMMENDED_ACTIONS, "Recommended Actions")}>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Recommended Actions</span>
              </CommandItem>
              <CommandItem value="Draft Insights" onSelect={() => handleSelect(ROUTES.CONVERSATIONS, "Draft Insights")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Draft Insights</span>
              </CommandItem>
              <CommandItem value="Settings" onSelect={() => handleSelect(ROUTES.SETTINGS, "Settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        {/* Observability Dashboards */}
        {show("dashboards") && ootbCategories.map((category) => (
          <CommandGroup key={category.id} heading={category.name}>
            {category.dashboards.length === 0 ? (
              <CommandItem
                value={category.name}
                onSelect={() => handleSelect(ROUTES.DASHBOARD(category.id), category.name)}
              >
                <category.icon className="mr-2 h-4 w-4" />
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">OOTB</Badge>
              </CommandItem>
            ) : (
              category.dashboards.map((dashboard) => {
                const Icon = dashboard.icon;
                return (
                  <CommandItem
                    key={dashboard.id}
                    value={`${category.name} ${dashboard.name}`}
                    onSelect={() => handleSelect(ROUTES.DASHBOARD(dashboard.id), dashboard.name)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{dashboard.name}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">OOTB</Badge>
                  </CommandItem>
                );
              })
            )}
          </CommandGroup>
        ))}

        {show("dashboards") && <CommandSeparator />}

        {/* Saved Folders (live from context) */}
        {show("folders") && projects.length > 0 && (
          <>
            <CommandGroup heading="Saved Folders">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => handleSelect(ROUTES.SAVED_FOLDER(project.id), project.name)}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <span>{project.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {project.dashboards.length} {project.dashboards.length === 1 ? 'dashboard' : 'dashboards'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Saved Dashboards (live from context) */}
        {show("dashboards") && (projects.some(p => p.dashboards.length > 0) || standaloneDashboards.length > 0) && (
          <>
            <CommandGroup heading="Saved Dashboards">
              {projects.flatMap((project) =>
                project.dashboards.map((dashboard) => (
                  <CommandItem
                    key={`${project.id}-${dashboard.id}`}
                    value={`${project.name} ${dashboard.name}`}
                    onSelect={() => handleSelect(ROUTES.PROJECT_DASHBOARD(project.id, dashboard.id), dashboard.name)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{dashboard.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{project.name}</span>
                  </CommandItem>
                ))
              )}
              {standaloneDashboards.map((dashboard) => (
                <CommandItem
                  key={`standalone-${dashboard.id}`}
                  value={`Saved ${dashboard.name}`}
                  onSelect={() => handleSelect(ROUTES.SAVED_DASHBOARD(dashboard.id), dashboard.name)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{dashboard.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Saved</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Recent Conversations (live from context) */}
        {show("conversations") && activeConversations.length > 0 && (
          <CommandGroup heading="Drafts">
            {activeConversations.slice(0, 8).map((conversation) => (
              <CommandItem
                key={conversation.id}
                value={conversation.name}
                onSelect={() => handleSelect(ROUTES.CONVERSATION(conversation.id), conversation.name)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>{conversation.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}