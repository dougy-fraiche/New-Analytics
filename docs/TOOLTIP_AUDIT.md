# Tooltip audit: icon buttons

Audit of icon buttons across the app to ensure shadcn tooltips are applied consistently. Reference: purple pill-shaped tooltip with white text and top arrow (e.g. "Collapse sidebar").

## Already using shadcn Tooltip

| Location | Element | Label |
|----------|---------|--------|
| **TopNavBar** | Sidebar toggle (PanelLeft) | "Expand sidebar" / "Collapse sidebar" |
| **TopNavBar** | Search | "Search" |
| **TopNavBar** | Theme toggle | "Light mode" / "Dark mode" |
| **DashboardPage** | Pin | "Pin" / "Unpin" |
| **ObservabilityCategoryPage** | Pin | "Pin" / "Unpin" |
| **RecommendedActionsPage** | View details (per row) | "View details" |
| **DashboardChatPanel** | New thread (SquarePen) | "New thread" |
| **DashboardChatPanel** | Voice/Send in chat input | "Voice input" / "Send" / "Stop recording" |
| **ArtifactPanel** | Close (X) | "Close" |
| **ChatInputBar** | Voice/Send | "Voice input" / "Send" / "Stop recording" |
| **AppSidebar** | Nav items (via SidebarMenuButton `tooltip` prop) | "Explore", "Recommended", "Deployed", "Switch application" |

## Icon buttons missing tooltips (need implementation)

### Top navigation
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **TopNavBar.tsx** | Help (DropdownMenuTrigger) | none | "Help" |
| **TopNavBar.tsx** | Notifications (DropdownMenuTrigger) | none | "Notifications" |

### Dashboard / observability headers
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **DashboardPage.tsx** | Dashboard "More" (MoreVertical) | none | "Dashboard options" |
| **ObservabilityCategoryPage.tsx** | Category "More" (MoreVertical) | none | "Dashboard options" |

### AI summary (DashboardAISummary)
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **DashboardAISummary.tsx** | Refresh summary | title= | "Refresh summary" |
| **DashboardAISummary.tsx** | Summary options (MoreVertical) | title= | "Summary options" |

### Chat panel (DashboardChatPanel)
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **DashboardChatPanel.tsx** | Dismiss recommended action | title= | "Dismiss" |
| **DashboardChatPanel.tsx** | Delete thread | title= | "Delete thread" |
| **DashboardChatPanel.tsx** | Thread options (MoreVertical) | title= | "Thread options" |
| **DashboardChatPanel.tsx** | Attach (Plus in chat input) | none | "Attach" |

### Widgets
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **WidgetOverflowMenu.tsx** | Widget options (MoreVertical) | title= | "Widget options" |
| **WidgetAIPromptButton.tsx** | Ask AI (Sparkles) | title= | "Ask AI about this widget" |

### Chat input
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **ChatInputBar.tsx** | Attach (Plus) | none | "Attach" |

### Conversation / dashboard area
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **ConversationDashboardArea.tsx** | Dashboard More (MoreVertical) | none | "Dashboard options" |

### Saved / Favorites / Conversations pages
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **SavedFoldersPage.tsx** | Dashboard row More (MoreHorizontal) | none | "More options" |
| **SavedFoldersPage.tsx** | Folder card More (MoreHorizontal) | none | "More options" |
| **SavedFoldersPage.tsx** | Table row More (MoreHorizontal) | none | "More options" |
| **FavoritesPage.tsx** | Row More (MoreHorizontal) | none | "More options" |
| **AllConversationsPage.tsx** | Row More (MoreHorizontal) | none | "More options" |

### App launcher
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **AppLauncherSheet.tsx** | Applications (Grip) | aria-label only | "Applications" |

### Actions history
| File | Element | Current | Suggested tooltip |
|------|---------|---------|-------------------|
| **ActionsHistoryPage.tsx** | More options (disabled) | none | "More options" (for consistency) |

## Implementation notes

- Use existing `Tooltip`, `TooltipTrigger`, `TooltipContent` from `./ui/tooltip`.
- For dropdown triggers: wrap `DropdownMenuTrigger asChild` with `Tooltip` and `TooltipTrigger asChild` so the same icon button is both trigger and tooltip target.
- Replace native `title` with `TooltipContent` for consistent styling and delay.
- Tooltip styling (pill, purple bg, white text, arrow) is applied in `src/app/components/ui/tooltip.tsx` via `TooltipContent` (e.g. `bg-primary text-primary-foreground`, rounded pill).
