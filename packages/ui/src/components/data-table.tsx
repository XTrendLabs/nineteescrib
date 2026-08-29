import { cn } from "@propertyos/ui/lib/utils";

/**
 * Scroll container for a wide table.
 *
 * A table wide enough to need scrolling will otherwise stretch its parent:
 * flex and grid children default to `min-width: auto`, so the table's
 * intrinsic width wins and the whole page scrolls sideways instead of just the
 * table. `min-w-0` removes that floor and `max-w-content` caps the box against
 * the viewport minus the sidebar, which `SidebarInset` reports through
 * `--sidebar-gutter` for whichever state the sidebar is in.
 *
 * `--content-inset` covers the padding between the viewport edge and the
 * table -- 4rem by default, matching a page inside the standard layout.
 * Override it where the surroundings differ:
 *
 *     <DataTableContainer className="[--content-inset:4rem]">
 */
function DataTableContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-container"
      className={cn(
        "w-full min-w-0 max-w-content overflow-x-auto border",
        className,
      )}
      {...props}
    />
  );
}

/** The table itself. `minWidth` keeps columns readable before scrolling. */
function DataTable({
  className,
  minWidth,
  style,
  ...props
}: React.ComponentProps<"table"> & { minWidth?: number }) {
  return (
    <table
      data-slot="data-table"
      className={cn("w-full border-collapse text-left text-xs", className)}
      style={{ minWidth, ...style }}
      {...props}
    />
  );
}

export { DataTable, DataTableContainer };
