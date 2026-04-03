"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";
import { usePortalContainer } from "../../contexts/PortalContainerContext";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  container: containerProp,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  const fallback = usePortalContainer();
  const container = containerProp ?? fallback;
  return <SheetPrimitive.Portal data-slot="sheet-portal" container={container} {...props} />;
}

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    /** When true, overlay fills the portal root (e.g. AI panel) instead of the viewport. */
    isContained?: boolean;
    /** When false, overlay stays transparent (no dimmed scrim); still captures outside clicks where Radix expects an overlay. */
    showScrim?: boolean;
  }
>(({ className, isContained, showScrim = true, ...props }, ref) => (
  <SheetPrimitive.Overlay
    data-slot="sheet-overlay"
    ref={ref}
    className={cn(
      showScrim &&
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      isContained
        ? cn(
            "absolute inset-0 z-40",
            showScrim ? "bg-black/40" : "bg-transparent",
          )
        : "fixed inset-0 z-50 bg-black/50",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    /** Mount the sheet portal into this element instead of the app portal container. */
    portalContainer?: HTMLElement | null;
    /** `contained`: absolute inset-4 inside portal root (pair with portalContainer). Scrim off by default; set true to dim behind panel. */
    variant?: "default" | "contained";
    /** Hide the default top-right close control (use a custom header close instead). */
    hideCloseButton?: boolean;
    /** Dimmed backdrop behind sheet. Default: on for full-screen sheets, off for `contained`. */
    showOverlayScrim?: boolean;
  }
>(
  (
    {
      className,
      children,
      side = "right",
      portalContainer,
      variant = "default",
      hideCloseButton = false,
      showOverlayScrim,
      ...props
    },
    ref,
  ) => {
    const isContained = variant === "contained";
    const overlayScrim = showOverlayScrim ?? !isContained;

    return (
      <SheetPortal container={portalContainer ?? undefined}>
        <SheetOverlay isContained={isContained} showScrim={overlayScrim} />
        <SheetPrimitive.Content
          ref={ref}
          data-slot="sheet-content"
          className={cn(
            "flex flex-col shadow-lg",
            isContained ? "bg-neutral-0" : "bg-background",
            !isContained &&
              "data-[state=open]:animate-in data-[state=closed]:animate-out transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
            isContained
              ? cn(
                  "absolute inset-4 z-50 gap-0 min-h-0 max-h-[calc(100%-2rem)] w-auto overflow-hidden rounded-lg border p-0",
                  side === "right" &&
                    "data-[state=open]:animate-sheet-contained-in-right data-[state=closed]:animate-sheet-contained-out-right",
                  side === "left" &&
                    cn(
                      "data-[state=open]:animate-in data-[state=closed]:animate-out transition ease-in-out data-[state=closed]:duration-150 data-[state=open]:duration-200",
                      "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                    ),
                  side === "top" &&
                    cn(
                      "data-[state=open]:animate-in data-[state=closed]:animate-out transition ease-in-out data-[state=closed]:duration-150 data-[state=open]:duration-200",
                      "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
                    ),
                  side === "bottom" &&
                    cn(
                      "data-[state=open]:animate-in data-[state=closed]:animate-out transition ease-in-out data-[state=closed]:duration-150 data-[state=open]:duration-200",
                      "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    ),
                )
              : cn(
                  "fixed z-50 gap-4",
                  side === "right" &&
                    "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
                  side === "left" &&
                    "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
                  side === "top" &&
                    "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
                  side === "bottom" &&
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
                ),
            className,
          )}
          {...props}
        >
          {children}
          {!hideCloseButton ? (
            <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          ) : null}
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
