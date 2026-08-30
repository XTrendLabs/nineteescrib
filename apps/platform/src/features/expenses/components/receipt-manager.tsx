import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import {
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { useDeleteReceipt } from "../api/use-delete-receipt";
import {
  type ExpenseReceipt,
  type HeldReceipt,
  isPdfReceipt,
  MAX_RECEIPT_BYTES,
  RECEIPT_ACCEPT,
} from "../lib/expense";

function isAcceptedType(type: string) {
  return RECEIPT_ACCEPT.split(",").includes(type);
}

/** A short, readable size for the file list. */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Receipt attachments for an expense.
 *
 * Two modes, because a receipt can be chosen before the expense it belongs to
 * exists. While creating, files are held locally and handed to the caller to
 * upload once the expense has an id -- nothing reaches storage for an expense
 * that is never created. While editing, uploads go straight to the server.
 */
export function ReceiptManager({
  expenseId,
  receipts,
  heldFiles,
  onHeldFilesChange,
  onUploaded,
  disabled = false,
}: {
  /** Undefined while creating, when there is nothing to attach to yet. */
  expenseId?: string;
  receipts: ExpenseReceipt[];
  heldFiles: HeldReceipt[];
  onHeldFilesChange: (files: HeldReceipt[]) => void;
  /** Called after a direct upload, so the caller can refetch. */
  onUploaded?: () => void;
  disabled?: boolean;
}) {
  const feedback = useFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteReceipt = useDeleteReceipt();
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  function rejectionFor(file: File) {
    if (!isAcceptedType(file.type)) {
      return `${file.name} is not an image or PDF`;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      return `${file.name} is larger than 10MB`;
    }
    return undefined;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    // Reset immediately so re-picking the same file still fires a change.
    e.target.value = "";
    if (picked.length === 0) return;

    const rejections = picked.map(rejectionFor).filter(Boolean) as string[];
    const accepted = picked.filter((f) => !rejectionFor(f));

    if (rejections.length > 0) {
      feedback.error(
        rejections.length === picked.length
          ? "Couldn't attach receipt"
          : "Some files were skipped",
        rejections.join(". "),
      );
    }
    if (accepted.length === 0) return;

    // Creating: hold the files until there is an expense to attach them to.
    if (!expenseId) {
      onHeldFilesChange([
        ...heldFiles,
        ...accepted.map((file) => ({ id: crypto.randomUUID(), file })),
      ]);
      return;
    }

    setUploading(true);
    const failed: string[] = [];
    for (const file of accepted) {
      try {
        await uploadReceiptFile(expenseId, file);
      } catch {
        failed.push(file.name);
      }
    }
    setUploading(false);
    onUploaded?.();

    if (failed.length > 0) {
      feedback.error(
        "Upload failed",
        `Couldn't upload ${failed.join(", ")}. Please try again.`,
      );
    }
  }

  function handleDelete(receiptId: string) {
    if (!expenseId || deletingIds.includes(receiptId)) return;
    setDeletingIds((current) => [...current, receiptId]);

    deleteReceipt.mutate(
      { param: { id: expenseId, receiptId } },
      {
        onSuccess: () => onUploaded?.(),
        onError: () => {
          feedback.error(
            "Couldn't delete receipt",
            "Something went wrong. Please try again.",
          );
        },
        onSettled: () => {
          setDeletingIds((current) => current.filter((i) => i !== receiptId));
        },
      },
    );
  }

  const isBusy = disabled || uploading;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-1.5 border border-dashed py-4 text-center text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
      >
        {uploading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <UploadIcon className="size-4" />
        )}
        <p className="text-[11px]">
          {uploading ? "Uploading…" : "Click to upload"}
        </p>
        <p className="text-[10px]">Images or PDF, up to 10MB</p>
      </button>

      {(receipts.length > 0 || heldFiles.length > 0) && (
        <ul className="flex flex-col gap-1">
          {receipts.map((receipt) => (
            <li
              key={receipt.id}
              className="flex items-center gap-2 border px-2 py-1.5 text-xs"
            >
              {isPdfReceipt(receipt) ? (
                <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <a
                href={receipt.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate hover:underline"
              >
                {receipt.fileName}
              </a>
              {deletingIds.includes(receipt.id) ? (
                <Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDelete(receipt.id)}
                  className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground disabled:pointer-events-none"
                >
                  <XIcon className="size-3.5" />
                  <span className="sr-only">Remove {receipt.fileName}</span>
                </button>
              )}
            </li>
          ))}

          {heldFiles.map((held) => (
            <li
              key={held.id}
              className="flex items-center gap-2 border border-dashed px-2 py-1.5 text-muted-foreground text-xs"
            >
              {held.file.type === "application/pdf" ? (
                <FileTextIcon className="size-3.5 shrink-0" />
              ) : (
                <ImageIcon className="size-3.5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">{held.file.name}</span>
              <span className="shrink-0 text-[10px]">
                {formatBytes(held.file.size)} · attaches on save
              </span>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onHeldFilesChange(heldFiles.filter((h) => h.id !== held.id))
                }
                className="shrink-0 cursor-pointer hover:text-foreground disabled:pointer-events-none"
              >
                <XIcon className="size-3.5" />
                <span className="sr-only">Remove {held.file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={RECEIPT_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

/**
 * Posts one receipt file.
 *
 * The generated client's mutation hook cannot be called per file inside a
 * loop, so the upload goes through the same endpoint directly. Kept here, and
 * exported, so the create flow can reuse it once the expense has an id.
 */
export async function uploadReceiptFile(expenseId: string, file: File) {
  const { honoClient } = await import("@/shared/lib/api-client");

  // The route reads the body with `parseBody`, so the generated client has no
  // form shape to check against -- the same cast the room image upload makes.
  const response = await honoClient.api.platform.expenses[":id"].receipts.$post(
    { param: { id: expenseId }, form: { file } } as unknown as {
      param: { id: string };
    },
  );

  if (!response.ok) {
    throw new Error("Receipt upload failed");
  }

  return response.json();
}
