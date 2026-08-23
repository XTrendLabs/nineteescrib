import type { SkeletonShape } from "@propertyos/ui/components/skeleton-block";

/**
 * One shape-config array per detail tab. Adding a new tab or reshaping an
 * existing one is just editing this map — no bespoke skeleton JSX needed.
 */
export const PROPERTY_TAB_SKELETONS: Record<string, SkeletonShape[]> = {
  overview: [
    { type: "hero" },
    { type: "cards", count: 4, columns: 4 },
    { type: "form", fields: 8, columns: 2 },
    { type: "list", count: 1 },
  ],
  rooms: [{ type: "list", count: 3 }],
  policies: [{ type: "form", fields: 8, columns: 2 }],
  "booking-links": [{ type: "list", count: 3 }],
  taxes: [{ type: "form", fields: 6, columns: 2 }],
};

export const PROPERTY_DIRECTORY_SKELETON: SkeletonShape[] = [
  { type: "cards", count: 6, columns: 3 },
];
