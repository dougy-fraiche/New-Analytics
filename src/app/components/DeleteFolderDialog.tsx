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

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  folderName?: string;
  dashboardCount?: number;
  count?: number;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  onConfirm,
  folderName,
  dashboardCount,
  count,
}: DeleteFolderDialogProps) {
  const isBulk = count !== undefined && count > 1;

  const title = isBulk
    ? `Delete ${count} folders?`
    : "Delete folder?";

  let description: string;
  if (isBulk) {
    description = `This will permanently delete ${count} selected folders and all their dashboards. You can undo this action briefly after deletion.`;
  } else {
    const hasContents = dashboardCount !== undefined && dashboardCount > 0;
    description = hasContents
      ? `This will permanently delete "${folderName ?? "this folder"}" and its ${dashboardCount} dashboard${dashboardCount === 1 ? "" : "s"}. You can undo this action briefly after deletion.`
      : `This will permanently delete "${folderName ?? "this folder"}". You can undo this action briefly after deletion.`;
  }

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
