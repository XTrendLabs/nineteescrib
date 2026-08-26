import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import { Building2Icon, Loader2Icon, UploadIcon } from "lucide-react";
import { useRef } from "react";

import { api } from "@/shared/lib/api-client";
import { useUploadCoverImage } from "../api/use-upload-cover-image";
import type { Property } from "../lib/property";

export function CoverImageUploader({ property }: { property: Property }) {
  const feedback = useFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadCoverImage = useUploadCoverImage();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    uploadCoverImage.mutate(
      { param: { id: property.id }, form: { file } } as {
        param: { id: string };
      },
      {
        onSuccess: () => {
          api.api.platform.properties[":slug"].$get.invalidate({
            param: { slug: property.slug },
          });
        },
        onError: () => {
          feedback.error(
            "Upload failed",
            "Couldn't upload the cover image. Please try again.",
          );
        },
      },
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploadCoverImage.isPending}
      className="group relative flex h-56 w-full items-center justify-center overflow-hidden bg-muted disabled:pointer-events-none"
    >
      {property.coverImage ? (
        <img
          src={property.coverImage}
          alt={property.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <Building2Icon className="size-10 text-muted-foreground" />
      )}

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all",
          uploadCoverImage.isPending
            ? "bg-black/40 opacity-100"
            : "group-hover:bg-black/40 group-hover:opacity-100",
        )}
      >
        {uploadCoverImage.isPending ? (
          <div className="flex flex-col items-center gap-1 text-white">
            <Loader2Icon className="size-6 animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-white">
            <UploadIcon className="size-5" />
            <span className="text-xs">
              {property.coverImage ? "Replace photo" : "Upload photo"}
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
}
