import { Button } from "@propertyos/ui/components/button";
import { PlusIcon, StarIcon, XIcon } from "lucide-react";

import type { PropertyDetail } from "../../lib/mock-data";
import { GalleryBlock } from "../gallery-block";

function AddTile() {
  return (
    <button
      type="button"
      className="flex h-24 w-24 flex-col items-center justify-center gap-1 border border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
    >
      <PlusIcon className="size-4" />
      <span className="text-[10px]">Add</span>
    </button>
  );
}

export function GalleryTab({ property }: { property: PropertyDetail }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Property Photos</p>
        <Button size="sm">
          <PlusIcon />
          Upload Photos
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {property.propertyGallery.map((image) => (
          <div key={image.id} className="relative h-24 w-24">
            <GalleryBlock colorIndex={image.colorIndex} className="h-24 w-24" />
            {image.isCover && (
              <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-background px-1 py-0.5 text-[10px]">
                <StarIcon className="size-2.5 fill-current" />
                Cover
              </span>
            )}
            <button
              type="button"
              className="absolute top-1 right-1 flex size-4 items-center justify-center bg-background text-[10px]"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}
        <AddTile />
      </div>

      <div className="flex flex-col gap-6">
        <p className="font-medium text-sm">Room Type Photos</p>
        {property.roomTypeGalleries.map((group) => (
          <div key={group.roomTypeId} className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              {group.roomTypeName}
            </p>
            <div className="flex flex-wrap gap-3">
              {group.images.map((image) => (
                <GalleryBlock
                  key={image.id}
                  colorIndex={image.colorIndex}
                  className="h-20 w-20"
                />
              ))}
              <AddTile />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
