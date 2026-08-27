import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { ImageIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { api } from "@/shared/lib/api-client";
import { useDeleteRoomImage } from "../api/use-delete-room-image";
import { useUploadRoomImage } from "../api/use-upload-room-image";
import type { RoomImage } from "../lib/room";

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "uploading" | "error";
};

export function RoomImageManager({
  propertyId,
  roomId,
  images,
}: {
  propertyId: string;
  roomId: string;
  images: RoomImage[];
}) {
  const feedback = useFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadRoomImage();
  const deleteImage = useDeleteRoomImage();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const cancelledRef = useRef(new Set<string>());
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // Release any previews still outstanding when the manager unmounts.
  useEffect(() => {
    return () => {
      for (const item of pendingRef.current)
        URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  function invalidate() {
    api.api.platform.rooms.$get.invalidate({ query: { propertyId } });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const batch: PendingUpload[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "queued",
    }));

    setPending((current) => [...current, ...batch]);

    const failed: string[] = [];

    for (const item of batch) {
      if (cancelledRef.current.has(item.id)) {
        cancelledRef.current.delete(item.id);
        continue;
      }

      setPending((current) =>
        current.map((p) =>
          p.id === item.id ? { ...p, status: "uploading" } : p,
        ),
      );

      try {
        await uploadImage.mutateAsync({
          param: { id: roomId },
          form: { file: item.file },
        } as {
          param: { id: string };
        });
        // Drop the placeholder only once the server copy can replace it.
        await invalidate();
        URL.revokeObjectURL(item.previewUrl);
        setPending((current) => current.filter((p) => p.id !== item.id));
      } catch {
        failed.push(item.file.name);
        setPending((current) =>
          current.map((p) =>
            p.id === item.id ? { ...p, status: "error" } : p,
          ),
        );
      }
    }

    if (failed.length > 0) {
      feedback.error(
        failed.length === batch.length
          ? "Upload failed"
          : "Some uploads failed",
        `Couldn't upload ${failed.join(", ")}. Please try again.`,
      );
    }
  }

  function handleCancelPending(id: string) {
    cancelledRef.current.add(id);
    setPending((current) => {
      const target = current.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((p) => p.id !== id);
    });
  }

  function handleDelete(imageId: string) {
    if (deletingIds.includes(imageId)) return;
    setDeletingIds((current) => [...current, imageId]);

    deleteImage.mutate(
      { param: { id: roomId, imageId } },
      {
        // Await the refetch so the spinner holds until the tile is really gone.
        onSuccess: () => invalidate(),
        onError: () => {
          feedback.error(
            "Couldn't delete image",
            "Something went wrong. Please try again.",
          );
        },
        onSettled: () => {
          setDeletingIds((current) => current.filter((id) => id !== imageId));
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square overflow-hidden border bg-muted"
          >
            <img
              src={image.url}
              alt={`Room ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1 left-1 bg-black/60 px-1 text-[10px] text-white">
              Image {index + 1}
            </span>
            {deletingIds.includes(image.id) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/60">
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-[10px] text-muted-foreground">
                  Deleting…
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              disabled={deletingIds.includes(image.id)}
              className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center bg-black/60 text-white opacity-0 transition-opacity disabled:pointer-events-none group-hover:opacity-100"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}

        {pending.map((item, index) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden border bg-muted"
          >
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              {item.status === "error" ? (
                <span className="bg-destructive px-1 text-[10px] text-destructive-foreground">
                  Failed
                </span>
              ) : (
                <>
                  <Loader2Icon className="size-4 animate-spin text-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {item.status === "uploading" ? "Uploading…" : "Queued"}
                  </span>
                </>
              )}
            </div>
            <span className="absolute bottom-1 left-1 bg-black/60 px-1 text-[10px] text-white">
              Image {images.length + index + 1}
            </span>
            <button
              type="button"
              onClick={() => handleCancelPending(item.id)}
              className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border border-dashed text-muted-foreground text-xs hover:bg-muted"
        >
          {images.length === 0 && pending.length === 0 ? (
            <ImageIcon className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          Add
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
