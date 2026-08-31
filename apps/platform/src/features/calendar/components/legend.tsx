export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t px-3 py-2 text-muted-foreground text-xs">
      <span className="flex items-center gap-1.5">
        <span className="size-3 shrink-0 bg-foreground" />
        Direct
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 shrink-0 bg-neutral-600 dark:bg-neutral-400" />
        OTA (Airbnb / Booking.com)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 shrink-0 border border-success/50 bg-success/15" />
        Checked Out
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 shrink-0 border-2 border-neutral-400 border-dashed bg-neutral-100 dark:bg-neutral-800" />
        Checkout Hold
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="size-3 shrink-0 border border-neutral-400 bg-[repeating-linear-gradient(45deg,currentcolor_0,currentcolor_2px,transparent_2px,transparent_5px)] text-neutral-400 dark:border-neutral-600 dark:text-neutral-600"
          aria-hidden
        />
        Blocked (Maintenance / Owner Stay)
      </span>
    </div>
  );
}
