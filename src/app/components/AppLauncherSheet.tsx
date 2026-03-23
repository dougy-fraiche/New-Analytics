import { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Grip,
  Settings,
  PhoneForwarded,
  Headset,
  Eye,
  Clapperboard,
  CalendarClock,
  ClipboardCheck,
  Target,
  GraduationCap,
  MessageSquare,
  Diamond,
  BarChart2,
  LayoutDashboard,
  FileBarChart,
  BotMessageSquare,
  BrainCircuit,
  Cable,
  CloudCog,
  type LucideIcon,
} from "lucide-react";

interface AppItem {
  name: string;
  icon: LucideIcon;
  active?: boolean;
}

interface AppCategory {
  label: string;
  items: AppItem[];
}

const APP_CATEGORIES: AppCategory[] = [
  {
    label: "General",
    items: [{ name: "Admin", icon: Settings }],
  },
  {
    label: "Omnichannel Routing",
    items: [
      { name: "ACD", icon: PhoneForwarded },
      { name: "Agent", icon: Headset },
      { name: "Supervisor", icon: Eye },
      { name: "Studio", icon: Clapperboard },
    ],
  },
  {
    label: "Workforce Engagement",
    items: [
      { name: "Workforce Management", icon: CalendarClock },
      { name: "QM Analytics", icon: ClipboardCheck },
      { name: "inView PM", icon: Target },
      { name: "Coaching", icon: GraduationCap },
      { name: "Interactions", icon: MessageSquare },
      { name: "My Zone", icon: Diamond },
    ],
  },
  {
    label: "Data & Analytics",
    items: [
      { name: "Analytics", icon: BarChart2, active: true },
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "Reporting", icon: FileBarChart },
      { name: "Self-Service Analytics", icon: BotMessageSquare },
    ],
  },
  {
    label: "Automation",
    items: [{ name: "Workforce Intelligence", icon: BrainCircuit }],
  },
  {
    label: "Partner",
    items: [
      { name: "Adapters", icon: Cable },
      { name: "Partner Hub", icon: CloudCog },
    ],
  },
];

export function AppLauncherSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Applications"
              >
                <Grip className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Applications</TooltipContent>
      </Tooltip>
      <SheetContent side="left" className="w-64 p-0 gap-0 [&>button]:hidden overflow-hidden">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Grip className="size-5 text-muted-foreground shrink-0" />
            <SheetTitle className="text-lg">Applications</SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Switch between platform applications
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="py-1">
            {APP_CATEGORIES.map((category, catIdx) => (
              <div key={category.label}>
                {catIdx > 0 && <Separator />}
                <div className="px-2 py-1">
                  <p className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                    {category.label}
                  </p>
                  {category.items.map((app) => {
                    const Icon = app.icon;
                    return (
                      <Button
                        key={app.name}
                        variant="ghost"
                        className={`w-full justify-start gap-2.5 h-10 px-3 ${
                          app.active
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }`}
                        onClick={() => {
                          if (!app.active) setOpen(false);
                        }}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{app.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}