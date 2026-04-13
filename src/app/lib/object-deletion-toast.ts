import { toast } from "sonner";

interface ObjectDeletionToastOptions {
  title: string;
  description?: string;
  onUndo?: () => void;
  undoLabel?: string;
  restoredTitle?: string;
  restoredDescription?: string;
}

interface DeletedObjectToastOptions {
  objectType: string;
  objectName?: string;
  description?: string;
  onUndo?: () => void;
  restoredTitle?: string;
  restoredDescription?: string;
}

export function showObjectDeletionToast({
  title,
  description,
  onUndo,
  undoLabel = "Undo",
  restoredTitle,
  restoredDescription,
}: ObjectDeletionToastOptions) {
  toast.success(title, {
    ...(description ? { description } : {}),
    ...(onUndo
      ? {
          action: {
            label: undoLabel,
            onClick: () => {
              onUndo();
              if (restoredTitle || restoredDescription) {
                toast.success(restoredTitle ?? "Restored", {
                  ...(restoredDescription ? { description: restoredDescription } : {}),
                });
              }
            },
          },
        }
      : {}),
  });
}

export function showDeletedObjectToast({
  objectType,
  objectName,
  description,
  onUndo,
  restoredTitle,
  restoredDescription,
}: DeletedObjectToastOptions) {
  showObjectDeletionToast({
    title: `${objectType} deleted`,
    description: description ?? (objectName ? `"${objectName}" has been deleted.` : undefined),
    onUndo,
    restoredTitle: onUndo ? (restoredTitle ?? `${objectType} restored`) : undefined,
    restoredDescription,
  });
}
