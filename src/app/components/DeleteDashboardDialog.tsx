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

interface DeleteDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  dashboardName?: string;
  count?: number;
}

export function DeleteDashboardDialog({
  open,
  onOpenChange,
  onConfirm,
  dashboardName,
  count,
}: DeleteDashboardDialogProps) {
  const isBulk = count !== undefined && count > 1;
  const title = isBulk
    ? `Delete ${count} dashboards?`
    : "Delete dashboard?";
  const description = isBulk
    ? `This will permanently delete ${count} selected dashboards. You can undo this action briefly after deletion.`
    : `This will permanently delete "${dashboardName ?? "this dashboard"}". You can undo this action briefly after deletion.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
