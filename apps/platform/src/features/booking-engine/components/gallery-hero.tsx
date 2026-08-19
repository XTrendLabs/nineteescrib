import { GalleryBlock } from "@/features/properties/components/gallery-block";
import type { PropertyDetail } from "@/features/properties/lib/mock-data";

export function GalleryHero({ property }: { property: PropertyDetail }) {
  const images = property.propertyGallery.slice(0, 5);
  const [cover, ...rest] = images;

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:grid-rows-2">
      {cover && (
        <div className="relative sm:col-span-2 sm:row-span-2">
          <GalleryBlock
            colorIndex={cover.colorIndex}
            className="h-64 w-full sm:h-full"
          />
          <span className="absolute right-3 bottom-3 border bg-background/90 px-2 py-1 text-xs">
            ★ {property.propertyGallery.length} Photos
          </span>
        </div>
      )}
      {rest.slice(0, 4).map((image) => (
        <GalleryBlock
          key={image.id}
          colorIndex={image.colorIndex}
          className="h-32 w-full"
        />
      ))}
    </div>
  );
}
